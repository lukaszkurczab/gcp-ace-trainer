"""Private, bounded Maestro stages on the existing iPhone 17; no resets."""
import argparse
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import time

DEVICE = "7F315654-3175-4F3C-BB24-B0263F59360C"
CODE = re.compile(r"\b[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}\b")
IDS = ("main-tab-bar", "settings-account-entry", "account-sign-in-submit", "account-recovery-code", "account-recovery-code-submit", "recovery-operation-panel", "recovery-operation-resume", "recovery-operation-terminal", "account-adoption-sign-out", "account-entry-choice", "account-sign-out-pending")
IDS += ("account-sign-out", "account-sync-retry", "account-recovery-pending", "account-recovery-sign-in-again", "account-feedback-remoteFailure", "account-feedback-backendUnavailable", "account-feedback-localCleanupFailure", "account-entry-continue")
FLOWS = {
    "guest-continuity": """
- assertVisible: { id: main-tab-bar }
- tapOn: { id: main-tab-bar-progress }
- extendedWaitUntil: { visible: { id: "patternly:progress:root" }, timeout: 15000 }
- tapOn: { id: main-tab-bar-settings }
- assertVisible: { id: settings-account-entry }
- assertVisible: "Guest"
- assertNotVisible: { id: settings-sign-out }
- assertNotVisible: { id: recovery-operation-panel }
""",
    "verify-completed-recovery": """
- assertVisible: { id: account-sync-failed }
- assertVisible: { id: account-sign-out }
- assertNotVisible: { id: recovery-operation-panel }
""",
    "exit-recovery": """
- assertVisible: { id: account-sign-out }
- tapOn: { id: account-sign-out }
- extendedWaitUntil: { visible: { id: account-sign-in-submit }, timeout: 15000 }
- tapOn: { id: account-sign-in-guest }
- extendedWaitUntil: { visible: { id: main-tab-bar }, timeout: 15000 }
- assertNotVisible: { id: recovery-operation-panel }
""",
    "verify-probe-terminal": """
- assertVisible: { id: recovery-operation-terminal }
- assertVisible: ".*This recovery request expired or is no longer valid[.].*"
- assertNotVisible: { id: recovery-operation-mismatch }
""",
    "clear-probe-terminal": """
- assertVisible: { id: recovery-operation-terminal }
- tapOn: { id: recovery-operation-resume }
- extendedWaitUntil: { visible: { id: account-sign-in-submit }, timeout: 15000 }
""",
    "navigate": """
- assertVisible: { id: main-tab-bar }
- tapOn: { id: main-tab-bar-settings }
- extendedWaitUntil: { visible: { id: settings-account-entry }, timeout: 15000 }
- tapOn: { id: settings-account-entry }
- extendedWaitUntil: { visible: { id: account-sign-in-submit }, timeout: 15000 }
- assertNotVisible: { id: recovery-operation-panel }
- tapOn: { text: "^Forgot password[?]$" }
- tapOn: { id: account-recovery-code-option }
- assertVisible: { id: account-recovery-code }
""",
    "code-entry": """
- assertVisible: { id: account-sign-in-submit }
- assertNotVisible: { id: recovery-operation-panel }
- tapOn: { text: "^Forgot password[?]$" }
- tapOn: { id: account-recovery-code-option }
- assertVisible: { id: account-recovery-code }
""",
    "probe": """
- assertVisible: { id: account-recovery-code }
- tapOn: { id: account-recovery-code }
- eraseText: { charactersToErase: 64 }
- inputText: ZZZZ-ZZZZ-ZZZZ-ZZZZ
- hideKeyboard
- tapOn: { id: account-recovery-code-submit }
- extendedWaitUntil: { visible: { id: recovery-operation-terminal }, timeout: 15000 }
- assertVisible: ".*This recovery request expired or is no longer valid[.].*"
- assertNotVisible: { id: recovery-operation-mismatch }
""",
    "fill-owned": """
- assertVisible: { id: account-recovery-code }
- tapOn: { id: account-recovery-code }
- eraseText: { charactersToErase: 64 }
- inputText: ${MAESTRO_PATTERNLY_RECOVERY_CODE}
- hideKeyboard
- assertVisible: { id: account-recovery-code-submit }
""",
    "submit": """
- assertVisible: { id: account-recovery-code-submit }
- tapOn: { id: account-recovery-code-submit }
""",
    "resume": """
- assertVisible: { id: recovery-operation-resume }
- tapOn: { id: recovery-operation-resume }
- extendedWaitUntil: { visible: { id: account-adoption-sign-out }, timeout: 30000 }
- assertVisible: { id: account-entry-choice }
""",
    "exit": """
- scrollUntilVisible: { element: { id: account-adoption-sign-out }, direction: DOWN, timeout: 10000 }
- tapOn: { id: account-adoption-sign-out }
- extendedWaitUntil: { visible: { id: account-sign-in-submit }, timeout: 30000 }
- tapOn: { id: account-sign-in-guest }
- extendedWaitUntil: { visible: { id: main-tab-bar }, timeout: 30000 }
""",
}
FLOWS["prepare-owned"] = FLOWS["clear-probe-terminal"] + FLOWS["code-entry"] + FLOWS["fill-owned"]


def read_config(root):
    file = root / "config.private.json"
    st = file.lstat()
    if not stat.S_ISREG(st.st_mode) or st.st_uid != os.getuid() or st.st_nlink != 1 or stat.S_IMODE(st.st_mode) != 0o600 or st.st_size > 4096:
        raise RuntimeError()
    fd = os.open(file, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        opened = os.fstat(fd)
        if (opened.st_dev, opened.st_ino) != (st.st_dev, st.st_ino):
            raise RuntimeError()
        data = json.loads(os.read(fd, 4097))
    finally:
        os.close(fd)
    if CODE.fullmatch(data["code"]) is None:
        raise RuntimeError()
    return data


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["observe", *FLOWS])
    parser.add_argument("--private-root", type=Path, required=True)
    args = parser.parse_args()
    result = {"stage": args.stage, "status": "REFUSED", "existingIPhone17Only": True}
    try:
        root = args.private_root
        st = root.lstat()
        if not root.is_absolute() or not stat.S_ISDIR(st.st_mode) or st.st_uid != os.getuid() or stat.S_IMODE(st.st_mode) != 0o700:
            raise RuntimeError()
        run = root / ("ui-" + args.stage + "-" + str(time.time_ns()))
        run.mkdir(mode=0o700)
        env = dict(os.environ)
        env.pop("MAESTRO_PATTERNLY_RECOVERY_CODE", None)
        env.update({"JAVA_HOME": "/Library/Java/JavaVirtualMachines/temurin-23.jdk/Contents/Home", "MAESTRO_CLI_NO_ANALYTICS": "1", "MAESTRO_DISABLE_UPDATE_CHECK": "true", "MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED": "true", "MAESTRO_CLI_LOG_PATTERN_FILE": "[Maestro log message redacted]%n", "MAESTRO_CLI_LOG_PATTERN_CONSOLE": "[Maestro log message redacted]%n", "JAVA_OPTS": "-Duser.home=" + str(run)})
        maestro = "/Users/lukaszkurczab/.maestro/bin/maestro"
        if args.stage in ("fill-owned", "prepare-owned"):
            env["MAESTRO_PATTERNLY_RECOVERY_CODE"] = read_config(root)["code"]
        if args.stage == "observe":
            argv = [maestro, "--udid", DEVICE, "hierarchy", "--no-reinstall-driver"]
        else:
            flow = run / "flow.yaml"
            # Maestro may foreground its driver while connecting. Restore this
            # app without stopping it or clearing data between bounded stages.
            flow.write_text("appId: com.lkurczab.patternly\n---\n- launchApp: { stopApp: false, clearState: false }\n" + FLOWS[args.stage])
            argv = [maestro, "--udid", DEVICE, "test", "--no-reinstall-driver", "--test-output-dir", str(run / "output"), str(flow)]
        completed = subprocess.run(argv, env=env, capture_output=True, text=True, timeout=55)
        # Screenshots remain only inside this mode-700 directory. Public
        # evidence consists of fixed IDs and outcome, never captured content.
        text = completed.stdout + completed.stderr
        redacted = CODE.sub("[RECOVERY_CODE]", text)
        redacted = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[EMAIL]", redacted)
        (run / "output.private.log").write_text(redacted)
        result["status"] = "PASS" if completed.returncode == 0 else "FAIL"
        if args.stage == "observe" and completed.returncode == 0:
            result["visibleKnownIds"] = [identifier for identifier in IDS if identifier in completed.stdout]
    except subprocess.TimeoutExpired:
        result["status"] = "TIMEOUT"
    except Exception:
        pass
    print(json.dumps(result))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
