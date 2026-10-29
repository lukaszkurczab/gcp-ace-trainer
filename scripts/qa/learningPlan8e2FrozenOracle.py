#!/usr/bin/env python3
"""Print the bounded 8E.2 oracle from frozen facts; never read learner storage.

Run from the APP root: python3 scripts/qa/learningPlan8e2FrozenOracle.py
This is an independent arithmetic calculation, not a native acceptance runner.
"""

import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo


def calculate():
    app = Path(__file__).resolve().parents[2]
    handoff_path = app / ".agent/private/8e1-20261028/selected-native-handoff.json"
    content_path = app / "src/content/generated/canonical-content/aws-certified-solutions-architect-associate.json"
    handoff = json.loads(handoff_path.read_text())
    content = json.loads(content_path.read_text())
    params = handoff["parameters"]
    if (handoff["execution_scope_id"] != "8E1-20261028-NATIVE-AWS-01"
            or params["oracle_anchor_now"] != "2026-10-28T11:00:00.000Z"
            or params["goalType"] != "build_foundations"
            or params["targetDate"] != "2026-11-04"
            or params["targetMeaning"] != "deadline"
            or [case["id"] for case in handoff["cases"]] != ["N01", "N02", "N03"]):
        raise ValueError("scope_or_anchor_changed: explicitly review and re-freeze inputs")
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    if sha(content_path) != handoff["content_sha256"] or content["contentVersion"] != handoff["contentVersion"]:
        raise ValueError("content_identity_changed: resolve provenance before comparison")
    local = datetime.fromisoformat(params["oracle_anchor_now"].replace("Z", "+00:00")).astimezone(ZoneInfo(params["timezone"]))
    target = datetime.fromisoformat(params["targetDate"]).date()
    day_ids = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
    # Civil dates, inclusive deadline, wall-clock cutoff and per-week count.
    days, counts = [], {}
    date = local.date()
    while date <= target:
        week = (date - timedelta(days=date.weekday())).isoformat()
        clock_open = date != local.date() or local.strftime("%H:%M") <= params["sessionLocalTime"]
        if clock_open and day_ids[date.weekday()] in params["preferredDays"] and counts.get(week, 0) < params["weeklySessionTarget"]:
            days.append(date.isoformat())
            counts[week] = counts.get(week, 0) + 1
        date += timedelta(days=1)
    node = "aws_secure_architecture_foundations"
    scopes = {(q["nodeId"], q["mentalUnitId"]) for q in content["questions"] if q["nodeId"] == node}
    estimates = [e for e in content["planningPolicy"]["workEstimates"] if e["modeId"] == handoff["modeId"] and any(s["nodeId"] == node for s in e["scopeRefs"])]
    if len(estimates) != 1 or not scopes.issubset({(s["nodeId"], s["mentalUnitId"]) for s in estimates[0]["scopeRefs"]}):
        raise ValueError("authored_scope_rates_changed: no single common cost envelope")
    rate = estimates[0]
    length = handoff["requestedLength"]
    immediate = [length * rate[k] for k in ("minMinutesPerResponse", "typicalMinutesPerResponse", "maxMinutesPerResponse")]
    return {
        "task_id": "8E.2", "scope_id": handoff["execution_scope_id"],
        "case_ids": [case["id"] for case in handoff["cases"]],
        "method": "Python standard-library civil-date arithmetic and multiplication of authored content rates; no producer imports/outputs, no learner fixture fabricated",
        "sources": {str(p): sha(p) for p in (handoff_path, content_path, Path(__file__).resolve())},
        "anchor_utc": params["oracle_anchor_now"], "anchor_local": local.isoformat(),
        "target": {"date": params["targetDate"], "meaning": "deadline", "sessionBoundary": "inclusive", "completionBehavior": "attainability", "availability": "present", "deadline_instant": None, "note": "Date-only target has no invented deadline time; 18:00 is the session time."},
        "capacity": {"dates": days, "counts_by_week_start": counts,
            "nominal_minutes": len(days) * params["minutesPerStudyDay"],
            "known_future_nominal_minutes": sum(d != local.date().isoformat() for d in days) * params["minutesPerStudyDay"],
            "net_minutes": None,
            "conditional_formula": "420 + max(0, 60 - proven_same_civil_day_active_minutes); if today's partition unknown, today is unknown and future nominal capacity is 420",
            "missing": "Exact sessions/timing baseline; no-active-session does not prove zero completed foreground time today."},
        "cost": {"estimate_id": rate["estimateId"], "policy_version": content["planningPolicy"]["policyVersion"],
            "authored_rate_min_typical_max": [rate[k] for k in ("minMinutesPerResponse", "typicalMinutesPerResponse", "maxMinutesPerResponse")],
            "conditional_focus10_min_typical_max": immediate,
            "conditions": "Exactly 10 selected responses in the named Free node, practice is the selected phase, no qualifying observed calibration. Immediate-session cost excludes future review reserve.",
            "actual_next_session_cost": None, "full_goal_cost": None,
            "missing": "Fixture sessions/attempts/calibration, diagnosis status and canonical selected phase/request, completion/quality/coverage deficits and real review queue; Free practice selection is not proof of full-goal costability."},
        "due": {"required_entry_obligations": 0, "required_entry_cost_minutes": 0, "dueAt": None,
            "observed_entry_obligations": None,
            "condition": "Prove no existing created/review obligations in the reserved fixture before effects; dueAt:null is absence of an input, not a queue snapshot. No new training occurs in N01-N03. Forecast reserves never create dueAt."},
        "shortfall": {"actual_full_goal_minutes": None, "actual_full_goal_fit": "UNKNOWN",
            "conditional_next_focus10_fit": "Authored maximum 40 <= future nominal daily 60, provided the named practice request and empty review conditions hold; not a full-goal fit claim.",
            "rule": "Do not compare a 10-response estimate with full-goal capacity as proof of completion. Missing costs/quality/queue/capacity remain unknown, not zero shortfall."},
        "native_case_expected": handoff["cases"],
        "generator_actual": None, "native_actual": None,
        "operation_state": "not_executed",
    }


if __name__ == "__main__":
    print(json.dumps(calculate(), ensure_ascii=False, indent=2))
