from datetime import date, datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))


def today_ist() -> date:
    return datetime.now(IST).date()


def compute_progress(
    planted_date: Optional[date],
    stages: Optional[List[Dict[str, Any]]],
    today: Optional[date] = None,
) -> Optional[Dict[str, Any]]:
    """
    Computes crop growth progress based on planted date and catalog stage distribution.
    Returns None if planted_date or stages data is not available.
    """
    if not planted_date or not stages:
        return None

    today = today or today_ist()
    total = sum(int(s.get("days", 0)) for s in stages)
    if total <= 0:
        return None

    days = max((today - planted_date).days, 0)

    cum = 0
    idx = len(stages) - 1
    for i, s in enumerate(stages):
        stage_days = int(s.get("days", 0))
        if days < cum + stage_days:
            idx = i
            break
        cum += stage_days

    return {
        "days_since_planted": days,
        "percent_complete": min(round(days * 100 / total), 100),
        "days_to_harvest": max(total - days, 0),
        "past_cycle": days >= total,
        "stage_key": stages[idx].get("key", "vegetative"),
        "stages": [
            {
                "key": s.get("key"),
                "days": s.get("days"),
                "state": "done" if i < idx else "current" if i == idx else "upcoming",
            }
            for i, s in enumerate(stages)
        ],
    }


def needs_care(
    tasks: List[Dict[str, Any]],
    unresolved_diagnoses: List[Dict[str, Any]],
    now: Optional[datetime] = None,
) -> bool:
    """
    A crop 'needs_care' if:
    1. Any high-priority task is overdue and not completed.
    2. Any plant pathology diagnosis is unresolved (resolved_at is None).
    """
    now = now or datetime.now(timezone.utc)

    # 1. Unresolved plant diagnosis checks
    if any(not d.get("resolved_at") for d in unresolved_diagnoses):
        return True

    # 2. Overdue high priority task checks
    for t in tasks:
        if str(t.get("priority", "")).lower() == "high" and not t.get("completed"):
            due_at = t.get("due_at")
            if due_at:
                try:
                    if isinstance(due_at, str):
                        dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
                    elif isinstance(due_at, datetime):
                        dt = due_at
                    else:
                        continue

                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)

                    if dt < now:
                        return True
                except Exception:
                    pass

    return False
