"""
Matching engine — converts all schedules to UTC minutes and computes overlap.
"""

LEVEL_MAP = {
    "beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4
}
DIFFICULTY_MAP = {
    "easy": 1, "easy_med": 2, "medium": 3, "med_hard": 4, "hard": 5
}


def level_similarity(a: str, b: str) -> float:
    la, lb = LEVEL_MAP.get(a, 2), LEVEL_MAP.get(b, 2)
    diff = abs(la - lb)
    if diff == 0: return 1.0
    if diff == 1: return 0.6
    return 0.0


def difficulty_similarity(a: str, b: str) -> float:
    da, db = DIFFICULTY_MAP.get(a, 3), DIFFICULTY_MAP.get(b, 3)
    diff = abs(da - db)
    if diff == 0: return 1.0
    if diff == 1: return 0.7
    if diff == 2: return 0.3
    return 0.0


def topic_overlap(topics_a: list, topics_b: list) -> float:
    if not topics_a or not topics_b:
        return 0.0
    sa, sb = set(topics_a), set(topics_b)
    shared = sa & sb
    return len(shared) / max(len(sa), len(sb))


def schedule_overlap(a: dict, b: dict) -> tuple[float, str]:
    """
    Compares UTC start/end minutes.
    Returns (score 0.0-1.0, human readable overlap string)
    
    utc_start_min and utc_end_min are minutes from midnight UTC (0-1439)
    Sessions can wrap past midnight (e.g. 23:00–00:30 = 1380–1470 → handled via modular arithmetic)
    """
    days_a = set(a.get("practice_days") or [])
    days_b = set(b.get("practice_days") or [])
    shared_days = days_a & days_b
    if not shared_days:
        return 0.0, ""

    day_score = len(shared_days) / max(len(days_a), len(days_b))

    a_start = a.get("utc_start_min", 0)
    a_end   = a.get("utc_end_min",   60)
    b_start = b.get("utc_start_min", 0)
    b_end   = b.get("utc_end_min",   60)

    # Handle midnight wrap: if end < start, add 1440
    if a_end < a_start: a_end += 1440
    if b_end < b_start: b_end += 1440

    overlap_start = max(a_start, b_start)
    overlap_end   = min(a_end,   b_end)
    overlap_mins  = max(0, overlap_end - overlap_start)

    if overlap_mins < 30:
        return 0.0, ""

    shorter = min(a_end - a_start, b_end - b_start)
    time_score = min(overlap_mins / shorter, 1.0)

    final = 0.6 * time_score + 0.4 * day_score

    # Build human-readable overlap string
    h = (overlap_start % 1440) // 60
    m = (overlap_start % 1440) % 60
    overlap_label = f"{str(h).zfill(2)}:{str(m).zfill(2)} UTC · {overlap_mins}min overlap · {', '.join(sorted(shared_days))}"

    return round(final, 3), overlap_label


def same_language(a: str, b: str) -> bool:
    if a == "any" or b == "any":
        return True
    return a == b


def compute_matches(me: dict, them: dict) -> tuple[int, list, str]:
    """
    Returns (score 0-100, shared_topics list, overlap_time string)
    """
    # Hard filter: language mismatch (unless either is 'any')
    if not same_language(me.get("language","any"), them.get("language","any")):
        return 0, [], ""

    # Hard filter: platform
    me_platform = me.get("platform","both")
    th_platform = them.get("platform","both")
    if me_platform != "both" and th_platform != "both" and me_platform != th_platform:
        return 0, [], ""

    lvl   = level_similarity(me.get("level","intermediate"), them.get("level","intermediate"))
    diff  = difficulty_similarity(me.get("difficulty","medium"), them.get("difficulty","medium"))
    tops  = topic_overlap(me.get("topics",[]), them.get("topics",[]))
    sched, overlap_time = schedule_overlap(me, them)
    style = 1.0 if me.get("practice_style") == them.get("practice_style") else 0.4

    # No schedule overlap = drastically reduce score
    if sched == 0.0:
        return 0, [], ""

    raw = (
        0.30 * lvl   +
        0.20 * diff  +
        0.20 * tops  +
        0.20 * sched +
        0.10 * style
    )

    shared_topics = list(set(me.get("topics",[])) & set(them.get("topics",[])))
    score = round(raw * 100)
    return score, shared_topics, overlap_time
