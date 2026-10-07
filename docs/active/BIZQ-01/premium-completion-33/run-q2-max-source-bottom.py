"""Capture the existing partial-answer review in light/dark max text, restoring OS UI state."""
from __future__ import annotations

from pathlib import Path
import json
import subprocess

packet = Path(__file__).resolve().parent
app = packet.parents[3]
device = "7F315654-3175-4F3C-BB24-B0263F59360C"
max_content_size = "accessibility-extra-extra-extra-large"


def ui(option: str, value: str | None = None) -> str:
    command = ["xcrun", "simctl", "ui", device, option]
    if value is not None:
        command.append(value)
    return subprocess.check_output(command, text=True).strip()


initial = {key: ui(key) for key in ("appearance", "content_size")}
if initial != {"appearance": "dark", "content_size": "large"}:
    raise SystemExit(f"Unexpected simulator UI baseline {initial!r}; no settings changed")

record: dict[str, object] = {
    "device": device,
    "initial": initial,
    "requestedContentSize": max_content_size,
    "runs": [],
    "scope": "Same answered repaired OOD Q2 only; no submit, Next, source tap, or persistence mutation",
}
run_failed = False

try:
    for theme in ("dark",):
        ui("appearance", theme)
        ui("content_size", max_content_size)
        observed = {key: ui(key) for key in initial}
        expected = {"appearance": theme, "content_size": max_content_size}
        if observed != expected:
            raise RuntimeError(f"Simulator UI readback mismatch for {theme}: {observed!r}")

        output = Path("/private/tmp/bizq33-resume-2026-10-07/q2-max-source-bottom") / theme
        output.mkdir(parents=True, exist_ok=False)
        flow = packet / "q2-max-source-bottom.yaml"
        command = [
            "maestro",
            "--device",
            device,
            "test",
            "--no-reinstall-driver",
            "--debug-output",
            str(output / "debug"),
            "--test-output-dir",
            str(output / "artifacts"),
            str(flow),
        ]
        log_path = output / "run.log"
        with log_path.open("w", encoding="utf-8") as log:
            result = subprocess.run(command, cwd=app, stdout=log, stderr=subprocess.STDOUT, check=False)
        cast_runs = record["runs"]
        assert isinstance(cast_runs, list)
        cast_runs.append({"theme": theme, "observed": observed, "flow": str(flow), "log": str(log_path), "exitCode": result.returncode})
        print(f"{theme}: Maestro exit {result.returncode}", flush=True)
        if result.returncode != 0:
            run_failed = True
            break
finally:
    for key, value in initial.items():
        ui(key, value)
    restored = {key: ui(key) for key in initial}
    record["restored"] = restored
    record["restoreVerified"] = restored == initial
    (packet / "Q2-MAX-SOURCE-BOTTOM-RUNS-2026-10-07.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(f"Restored simulator UI: {restored!r}", flush=True)

if record.get("restoreVerified") is not True:
    raise SystemExit("Simulator appearance/content-size restoration did not verify")
if run_failed:
    raise SystemExit("A Maestro flow failed; simulator UI state was restored")
