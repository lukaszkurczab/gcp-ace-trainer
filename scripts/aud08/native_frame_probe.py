"""Run in Xcode LLDB: probe capture visibility without evaluating target code.

The caller launches the existing app with --wait-for-debugger and supplies the
installed module path and its independently read UUID. No recovery/storage
values, addresses, expression results, or debugger errors are emitted.
"""

import json
import re
from pathlib import Path


def run(debugger, module_path, expected_uuid, output_path):
    import lldb

    result = {"status": "UNAVAILABLE", "stage": "CONFIG", "targetExpressions": 0,
              "targetMemoryReads": 0, "evaluationExecution": "UNVERIFIED"}
    destination = Path(output_path)

    def checkpoint():
        destination.write_text(json.dumps(result, indent=2) + "\n")
        destination.chmod(0o600)

    process = None
    try:
        checkpoint()
        if not re.fullmatch(r"[0-9A-Fa-f-]{36}", expected_uuid):
            raise RuntimeError()
        module = Path(module_path)
        if module.name != "Patternly.debug.dylib" or not module.is_file():
            raise RuntimeError()
        target = debugger.GetSelectedTarget()
        process = target.GetProcess()
        if not process.IsValid() or process.GetState() != lldb.eStateStopped:
            raise RuntimeError()
        debugger.SetAsync(False)

        def command(value):
            response = lldb.SBCommandReturnObject()
            debugger.GetCommandInterpreter().HandleCommand(value, response)
            if not response.Succeeded():
                raise RuntimeError()

        def stopped_frame():
            if process.GetState() != lldb.eStateStopped:
                raise RuntimeError()
            for thread in process:
                if thread.GetStopReason() == lldb.eStopReasonBreakpoint:
                    frame = thread.GetFrameAtIndex(0)
                    if frame.GetModule().GetUUIDString().replace("-", "").lower() != expected_uuid.replace("-", "").lower():
                        raise RuntimeError()
                    return frame
            raise RuntimeError()

        def advance():
            if process.Continue().Fail():
                raise RuntimeError()
            return stopped_frame()

        result["stage"] = "MAIN"
        checkpoint()
        if '"' in str(module) or "\n" in str(module):
            raise RuntimeError()
        command('target modules add "' + str(module) + '"')
        command("breakpoint set --name main --shlib Patternly.debug.dylib --skip-prologue false")
        main = target.GetBreakpointAtIndex(target.GetNumBreakpoints() - 1)
        result["mainBreakpointLocations"] = main.GetNumLocations()
        checkpoint()
        if main.GetNumLocations() == 0:
            raise RuntimeError()
        frame = advance()
        if frame.GetFunctionName() != "main" or frame.GetPCAddress().GetFileAddress() != frame.GetSymbol().GetStartAddress().GetFileAddress():
            raise RuntimeError()
        result["mainOffsetZeroVerified"] = True
        checkpoint()
        main.SetEnabled(False)
        result["stage"] = "SOURCE_FRAME"
        checkpoint()
        command("breakpoint set --file ReactInstance.cpp --line 268 --shlib Patternly.debug.dylib")
        if target.GetBreakpointAtIndex(target.GetNumBreakpoints() - 1).GetNumLocations() == 0:
            raise RuntimeError()
        frame = advance()
        entry = frame.GetLineEntry()
        if entry.GetLine() != 268 or entry.GetFileSpec().GetFilename() != "ReactInstance.cpp" or "ReactInstance::loadScript" not in (frame.GetFunctionName() or ""):
            raise RuntimeError()
        result["sourceFrameVerified"] = True
        result["evaluationExecution"] = "STOPPED_BEFORE_CALL"
        checkpoint()
        result["stage"] = "CAPTURE_VISIBILITY"
        for name in ("buffer", "sourceURL"):
            value = frame.FindVariable(name)
            result[name + "Visible"] = value.IsValid()
        result["status"] = "AVAILABLE" if result["bufferVisible"] and result["sourceURLVisible"] else "CAPTURE_UNAVAILABLE"
    except Exception:
        # Raw errors can contain module paths and frame values.
        pass
    finally:
        if process is not None and process.IsValid():
            result["processKilled"] = not process.Kill().Fail()
        checkpoint()
    return result


def main():
    """Host entry: one bounded attempt on the existing iPhone 17 only."""
    import argparse
    import hashlib
    import subprocess
    import tempfile

    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    device = "7F315654-3175-4F3C-BB24-B0263F59360C"
    app = "com.lkurczab.patternly"
    app_root = Path(__file__).resolve().parents[2]
    root = Path(tempfile.mkdtemp(prefix="aud08-frame-probe-", dir="/private/tmp"))
    root.chmod(0o700)
    result = {"status": "UNAVAILABLE", "stage": "PREFLIGHT", "task": "AUD-08-B3"}
    launched = False

    def command(argv, timeout=10):
        return subprocess.run(argv, capture_output=True, text=True, check=True, timeout=timeout).stdout

    def source_pins():
        digests = {}
        evidence = app_root / "docs/active/AUD-08/evidence/B3"
        for name, repo in (("CONSUMER-SOURCE-PINS-v15.json", app_root), ("PRODUCER-SOURCE-PINS-v12c.json", app_root.parent / "patternly-backend")):
            raw = (evidence / name).read_bytes()
            pins = json.loads(raw)
            for relative, expected in pins["files"].items():
                path = Path(relative)
                if path.is_absolute() or ".." in path.parts or hashlib.sha256((repo / path).read_bytes()).hexdigest() != expected:
                    raise RuntimeError()
            digests[name] = hashlib.sha256(raw).hexdigest()
        return digests

    try:
        before = source_pins()
        heads = {repo: command(["git", "-C", str(app_root.parent / repo), "rev-parse", "HEAD"]).strip() for repo in ("patternly", "patternly-backend")}
        devices = json.loads(command(["xcrun", "simctl", "list", "devices", "booted", "--json"]))
        if not any(d.get("udid") == device and d.get("name") == "iPhone 17" and d.get("state") == "Booted" for group in devices["devices"].values() for d in group):
            raise RuntimeError()
        processes = command(["/bin/ps", "-axo", "comm="])
        if any(Path(line.strip()).name == "Patternly" for line in processes.splitlines()):
            result["stage"] = "APP_ALREADY_RUNNING"
            raise RuntimeError()
        module = Path(command(["xcrun", "simctl", "get_app_container", device, app, "app"]).strip()) / "Patternly.debug.dylib"
        uuid = re.search(r"UUID: ([0-9A-F-]{36}) \(arm64\)", command(["xcrun", "dwarfdump", "--uuid", str(module)])).group(1)
        output = root / "result.json"
        script = root / "commands.txt"
        source = Path(__file__).resolve()
        script.write_text('script probe_ns={"__name__":"aud08_frame_probe"}; exec(compile(open(' + repr(str(source)) + ').read(),' + repr(str(source)) + ',"exec"),probe_ns); probe_ns["run"](lldb.debugger,' + repr(str(module)) + ',' + repr(uuid) + ',' + repr(str(output)) + ')\nquit\n')
        script.chmod(0o600)
        launch = command(["xcrun", "simctl", "launch", "--wait-for-debugger", device, app], timeout=15)
        launched = True
        pid = re.search(r":\s*(\d+)\s*$", launch).group(1)
        result["stage"] = "DEBUGGER_ATTACH"
        with (root / "lldb.private.log").open("w") as log:
            (root / "lldb.private.log").chmod(0o600)
            try:
                subprocess.run(["xcrun", "lldb", "--batch", "--source", str(script), "-p", pid], stdout=log, stderr=log, timeout=55, check=True)
            except subprocess.TimeoutExpired:
                result["timedOut"] = True
        if output.exists():
            result.update(json.loads(output.read_text()))
        result.update({"sourcePinsBeforeAfterMatch": source_pins() == before, "heads": heads,
                       "probeSourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                       "existingIPhone17Only": True})
    except Exception:
        pass
    finally:
        if launched:
            subprocess.run(["xcrun", "simctl", "terminate", device, app], capture_output=True, timeout=10)
        try:
            result["postAppProcessAbsent"] = not any(Path(line.strip()).name == "Patternly" for line in command(["/bin/ps", "-axo", "comm="]).splitlines())
        except Exception:
            result["postAppProcessAbsent"] = False
        args.output.write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result))
    return 0 if result["status"] == "AVAILABLE" and result.get("postAppProcessAbsent") else 1


if __name__ == "__main__":
    raise SystemExit(main())
