from datetime import date, timedelta, datetime, timezone
from app.services.crop_progress import compute_progress, needs_care

TOMATO_STAGES = [
    {"key": "vegetative", "days": 30},
    {"key": "flowering", "days": 25},
    {"key": "fruiting", "days": 40},
    {"key": "harvest", "days": 15},
]


def test_progress_none_when_no_date_or_stages():
    assert compute_progress(None, TOMATO_STAGES) is None
    assert compute_progress(date(2026, 1, 1), None) is None
    assert compute_progress(date(2026, 1, 1), []) is None


def test_progress_day_zero():
    today = date(2026, 3, 1)
    res = compute_progress(today, TOMATO_STAGES, today=today)
    assert res is not None
    assert res["days_since_planted"] == 0
    assert res["percent_complete"] == 0
    assert res["days_to_harvest"] == 110
    assert res["past_cycle"] is False
    assert res["stage_key"] == "vegetative"
    assert res["stages"][0]["state"] == "current"
    assert res["stages"][1]["state"] == "upcoming"


def test_progress_stage_boundary():
    # Day 30 is boundary between vegetative (30 days) and flowering (25 days)
    today = date(2026, 3, 31)
    planted = date(2026, 3, 1) # 30 days
    res = compute_progress(planted, TOMATO_STAGES, today=today)
    assert res is not None
    assert res["days_since_planted"] == 30
    assert res["stage_key"] == "flowering"
    assert res["stages"][0]["state"] == "done"
    assert res["stages"][1]["state"] == "current"


def test_progress_past_cycle():
    today = date(2026, 8, 1)
    planted = date(2026, 1, 1) # 212 days > 110
    res = compute_progress(planted, TOMATO_STAGES, today=today)
    assert res is not None
    assert res["past_cycle"] is True
    assert res["percent_complete"] == 100
    assert res["days_to_harvest"] == 0
    assert res["stage_key"] == "harvest"


def test_needs_care_with_unresolved_diagnosis():
    # Even if no overdue tasks, unresolved diagnosis triggers needs_care
    tasks = []
    diagnoses = [{"id": "d-1", "resolved_at": None}]
    assert needs_care(tasks, diagnoses) is True

    # When resolved, returns False
    diagnoses_resolved = [{"id": "d-1", "resolved_at": "2026-10-15T10:00:00Z"}]
    assert needs_care(tasks, diagnoses_resolved) is False


def test_needs_care_with_overdue_high_priority_task():
    now = datetime(2026, 10, 16, 12, 0, tzinfo=timezone.utc)
    overdue_task = {
        "priority": "high",
        "completed": False,
        "due_at": "2026-10-16T08:00:00+00:00",
    }
    assert needs_care([overdue_task], [], now=now) is True

    # If completed, does not need care
    overdue_task_completed = {
        "priority": "high",
        "completed": True,
        "due_at": "2026-10-16T08:00:00+00:00",
    }
    assert needs_care([overdue_task_completed], [], now=now) is False
