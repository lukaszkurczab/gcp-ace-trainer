"""One-shot native consume interruption watcher for the approved local fixture."""
import json
import os
from pathlib import Path
import signal
import stat
import subprocess
import sys
import time

DEVICE = "7F315654-3175-4F3C-BB24-B0263F59360C"
BUNDLE = "com.lkurczab.patternly"
HERE = Path(__file__).resolve().parent
MAX_WAIT = 52.0


class Refused(Exception):
    def __init__(self, stage):
        self.stage = stage


def private_json(path, max_size=16384):
    before = path.lstat()
    if (not stat.S_ISREG(before.st_mode) or before.st_uid != os.getuid()
            or before.st_nlink != 1 or stat.S_IMODE(before.st_mode) != 0o600
            or before.st_size > max_size):
        raise Refused("PRIVATE_FILE_REFUSED")
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        opened = os.fstat(fd)
        if (opened.st_dev, opened.st_ino, opened.st_size) != (before.st_dev, before.st_ino, before.st_size):
            raise Refused("PRIVATE_FILE_CHANGED")
        raw = os.read(fd, max_size + 1)
        after = os.fstat(fd)
        current = path.lstat()
        if ((after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns)
                != (opened.st_dev, opened.st_ino, opened.st_size, opened.st_mtime_ns)
                or (current.st_dev, current.st_ino) != (opened.st_dev, opened.st_ino)):
            raise Refused("PRIVATE_FILE_CHANGED")
    finally:
        os.close(fd)
    try:
        return json.loads(raw)
    except Exception:
        raise Refused("PRIVATE_JSON_REFUSED")


def check_root(root):
    st = root.lstat()
    if (not root.is_absolute() or not stat.S_ISDIR(st.st_mode) or st.st_uid != os.getuid()
            or stat.S_IMODE(st.st_mode) != 0o700):
        raise Refused("PRIVATE_ROOT_REFUSED")
    return st


def read_proxy(root):
    return private_json(root / "proxy-state.private.json")


def validate_registry(root):
    registry = private_json(root / "processes.private.json", 4096)
    if not isinstance(registry, dict) or set(registry) != {"backend", "proxy", "metro"}:
        raise Refused("PROCESS_REGISTRY_REFUSED")
    pids = {}
    for name, value in registry.items():
        if type(value) is not int or value <= 1:
            raise Refused("PROCESS_REGISTRY_REFUSED")
        try:
            os.kill(value, 0)
        except Exception:
            raise Refused("PROCESS_REGISTRY_NOT_ALIVE")
        pids[name] = value
    return pids


def process_pid():
    try:
        result = subprocess.run(
            ["xcrun", "simctl", "spawn", DEVICE, "launchctl", "list"],
            capture_output=True, text=True, timeout=1, check=True,
        )
    except Exception:
        raise Refused("APP_PROCESS_LOOKUP_FAILED")
    matches = [line.split() for line in result.stdout.splitlines() if BUNDLE in line]
    if len(matches) > 1:
        raise Refused("APP_PROCESS_AMBIGUOUS")
    if not matches:
        return None
    if not matches[0] or not matches[0][0].isdigit():
        raise Refused("APP_PROCESS_LOOKUP_FAILED")
    return int(matches[0][0])


def app_terminate():
    try:
        if process_pid() is None:
            return True
    except Refused:
        return False
    try:
        subprocess.run(["xcrun", "simctl", "terminate", DEVICE, BUNDLE],
                       capture_output=True, text=True, timeout=2, check=True)
    except Exception:
        return False
    deadline = time.monotonic() + 2
    while time.monotonic() < deadline:
        try:
            if process_pid() is None:
                return True
        except Refused:
            break
        time.sleep(0.1)
    return False


def write_evidence(root, record):
    path = root / "interruption.private.json"
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW
    try:
        fd = os.open(path, flags, 0o600)
    except Exception:
        raise Refused("EVIDENCE_WRITE_REFUSED")
    try:
        payload = (json.dumps(record, sort_keys=True) + "\n").encode()
        os.write(fd, payload)
        os.fsync(fd)
    finally:
        os.close(fd)
    return path


def emit(record):
    print(json.dumps(record, sort_keys=True))


def main():
    if len(sys.argv) != 3 or sys.argv[1] != "--private-root":
        emit({"status": "REFUSED", "stage": "ARGUMENTS_REFUSED"})
        return 2
    root = Path(sys.argv[2])
    child = None
    submitted = False
    pid_before = None
    latest = None
    outcome = {"status": "REFUSED", "stage": "NOT_STARTED"}
    try:
        check_root(root)
        validate_registry(root)
        initial = read_proxy(root)
        if (initial.get("safeProbePassed") is not True or initial.get("armed") is not True
                or initial.get("ownedConsumeCount") != 0 or initial.get("acknowledgementCount") != 0
                or initial.get("statusProofCount") != 0 or initial.get("holdTimeout") is True):
            raise Refused("PROXY_NOT_READY")
        pid_before = process_pid()
        if pid_before is None:
            raise Refused("APP_NOT_RUNNING")

        child = subprocess.Popen(
            [sys.executable, str(HERE / "nativeUiStage.py"), "submit", "--private-root", str(root)],
            cwd=str(HERE.parents[1]), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            text=True, start_new_session=True,
        )
        submitted = True
        deadline = time.monotonic() + MAX_WAIT
        latest = initial
        held = False
        child_ended_at = None
        while time.monotonic() < deadline:
            try:
                latest = read_proxy(root)
            except Refused as error:
                if error.stage != "PRIVATE_FILE_CHANGED":
                    raise
            count = latest.get("ownedConsumeCount")
            if latest.get("committedResponseHeld") is True and count == 1:
                held = True
                break
            if latest.get("stage") in {"OWNED_CONSUME_RESPONSE_UNVERIFIED", "UPSTREAM_UNAVAILABLE", "UPSTREAM_FAILED"} and count == 1:
                stopped = app_terminate()
                outcome = {"status": "REFUSED", "stage": "OWNED_EFFECT_UNCERTAIN",
                           "ownedConsumeCount": 1, "appTerminationRequested": True,
                           "appProcessAbsentAfter": stopped, "pidChanged": stopped}
                break
            if child.poll() is not None:
                if count == 0:
                    if child_ended_at is None:
                        child_ended_at = time.monotonic()
                    elif time.monotonic() - child_ended_at >= 2.0:
                        # Fence a request still being dispatched by the native client.
                        stopped = app_terminate()
                        try:
                            latest = read_proxy(root)
                        except Refused:
                            latest = {}
                        if latest.get("committedResponseHeld") is True and latest.get("ownedConsumeCount") == 1:
                            held = True
                        elif latest.get("ownedConsumeCount") == 1:
                            outcome = {"status": "REFUSED", "stage": "OWNED_EFFECT_UNCERTAIN",
                                       "ownedConsumeCount": 1, "appTerminationRequested": True,
                                       "appProcessAbsentAfter": stopped, "pidChanged": stopped}
                        else:
                            outcome = {"status": "REFUSED", "stage": "UI_STAGE_ENDED_BEFORE_CONSUME",
                                       "ownedConsumeCount": 0, "appTerminationRequested": True,
                                       "appProcessAbsentAfter": stopped, "pidChanged": stopped}
                        break
            time.sleep(0.1)

        if held:
            safe_held = (latest.get("safeProbePassed") is True and latest.get("armed") is True
                         and latest.get("ownedCommitUnknown") is False
                         and latest.get("acknowledgementCount") == 0
                         and latest.get("statusProofCount") == 0 and latest.get("holdTimeout") is False)
            stopped = app_terminate()
            outcome = {"status": "PASS" if safe_held and stopped else "REFUSED",
                       "stage": "COMMITTED_RESPONSE_HELD" if safe_held else "HELD_STATE_UNVERIFIED",
                       "ownedConsumeCount": 1, "committedResponseHeld": True,
                       "appTerminationRequested": True, "appProcessAbsentAfter": stopped,
                       "pidChanged": stopped}
        elif outcome["stage"] == "NOT_STARTED":
            # Deadline reached: inspect once, and stop the app if the effect may have been sent.
            latest = read_proxy(root)
            count = latest.get("ownedConsumeCount")
            if latest.get("committedResponseHeld") is True and count == 1:
                held = True
                safe_held = (latest.get("safeProbePassed") is True and latest.get("armed") is True
                             and latest.get("ownedCommitUnknown") is False
                             and latest.get("acknowledgementCount") == 0
                             and latest.get("statusProofCount") == 0 and latest.get("holdTimeout") is False)
                stopped = app_terminate()
                outcome = {"status": "PASS" if safe_held and stopped else "REFUSED",
                           "stage": "COMMITTED_RESPONSE_HELD" if safe_held else "HELD_STATE_UNVERIFIED",
                           "ownedConsumeCount": 1, "committedResponseHeld": True,
                           "appTerminationRequested": True, "appProcessAbsentAfter": stopped,
                           "pidChanged": stopped}
            elif count == 1 or latest.get("ownedCommitUnknown") is True:
                stopped = app_terminate()
                outcome = {"status": "REFUSED", "stage": "OWNED_EFFECT_UNCERTAIN",
                           "ownedConsumeCount": 1, "appTerminationRequested": True,
                           "appProcessAbsentAfter": stopped, "pidChanged": stopped}
            else:
                outcome = {"status": "REFUSED", "stage": "WATCH_TIMEOUT", "ownedConsumeCount": 0}

        if child.poll() is None:
            try:
                child.communicate(timeout=1)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(child.pid, signal.SIGTERM)
                except Exception:
                    pass
                try:
                    child.communicate(timeout=1)
                except subprocess.TimeoutExpired:
                    try:
                        os.killpg(child.pid, signal.SIGKILL)
                    except Exception:
                        pass
                    child.communicate(timeout=1)
        else:
            child.communicate(timeout=1)

    except Refused as error:
        outcome = {"status": "REFUSED", "stage": error.stage}
    except Exception:
        outcome = {"status": "REFUSED", "stage": "UNEXPECTED_FAILURE"}
    finally:
        if submitted and outcome.get("status") != "PASS":
            # Stop the native client even when the proxy state is temporarily unreadable.
            outcome["appTerminationRequested"] = True
            stopped = app_terminate()
            outcome["appProcessAbsentAfter"] = stopped
            outcome["pidChanged"] = stopped
        if child is not None and child.poll() is None:
            try:
                os.killpg(child.pid, signal.SIGTERM)
            except Exception:
                pass
            try:
                child.communicate(timeout=1)
            except Exception:
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except Exception:
                    pass
        if submitted:
            if outcome.get("status") == "PASS":
                # The app's transport timeout is independent of the proxy hold.
                # Bind interruption to a closed native client before status/ACK.
                close_deadline = time.monotonic() + 2.0
                while time.monotonic() < close_deadline:
                    try:
                        closed = read_proxy(root)
                        if closed.get("clientClosedBeforeDelivery") is True:
                            break
                    except Refused:
                        pass
                    time.sleep(0.1)
            try:
                latest = read_proxy(root)
            except Refused:
                latest = None
                if outcome.get("status") != "PASS":
                    outcome["stage"] = "PROXY_FINAL_READ_UNAVAILABLE"
                    outcome.pop("ownedConsumeCount", None)
            if latest is not None:
                count = latest.get("ownedConsumeCount")
                if count == 1:
                    outcome["ownedConsumeCount"] = 1
                    if latest.get("committedResponseHeld") is not True and outcome.get("status") == "PASS":
                        outcome["status"] = "REFUSED"
                        outcome["stage"] = "OWNED_EFFECT_UNCERTAIN"
                elif count == 0 and outcome.get("status") != "PASS":
                    outcome["ownedConsumeCount"] = 0
            if outcome.get("status") == "PASS":
                try:
                    app_absent = process_pid() is None
                except Refused:
                    app_absent = False
                fenced = (latest is not None
                          and latest.get("ownedConsumeCount") == 1
                          and latest.get("committedResponseHeld") is True
                          and latest.get("clientClosedBeforeDelivery") is True
                          and latest.get("ownedCommitUnknown") is False
                          and latest.get("statusProofCount") == 0
                          and latest.get("acknowledgementCount") == 0
                          and latest.get("holdTimeout") is False
                          and app_absent)
                outcome["clientClosedBeforeDelivery"] = latest.get("clientClosedBeforeDelivery") if latest else None
                outcome["statusProofCountBeforeColdStart"] = latest.get("statusProofCount") if latest else None
                outcome["acknowledgementCountBeforeColdStart"] = latest.get("acknowledgementCount") if latest else None
                if not fenced:
                    outcome["status"] = "REFUSED"
                    outcome["stage"] = "INTERRUPTION_FENCE_UNVERIFIED"
            record = dict(outcome)
            if pid_before is not None:
                record["appPidBefore"] = pid_before
            if latest is not None:
                record["proxyStage"] = latest.get("stage")
                record["proxyOwnedConsumeCount"] = latest.get("ownedConsumeCount")
            try:
                write_evidence(root, record)
                outcome["privateEvidenceWritten"] = True
            except Refused:
                outcome["privateEvidenceWritten"] = False
                outcome["status"] = "REFUSED"
                outcome["stage"] = "EVIDENCE_WRITE_REFUSED"
    emit(outcome)
    return 0 if outcome.get("status") == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
