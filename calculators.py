"""
calculators.py
---------------
Pure functions for the platform's core financial math. Kept separate
from routes so they're easy to unit test and reuse across API endpoints.

None of this is personalized financial advice - it's transparent,
explainable arithmetic the user can see and learn from (per the
"active learning, not textbook" design goal).
"""


def sip_future_value(monthly_investment: float, annual_rate_pct: float, years: int):
    """Future value of a monthly SIP (Systematic Investment Plan) using
    the standard ordinary-annuity compound interest formula, plus a
    year-by-year breakdown for charting.

    FV = P * [ ((1+i)^n - 1) / i ] * (1+i)
    where i = monthly rate, n = number of months, P = monthly investment
    """
    i = (annual_rate_pct / 100) / 12
    breakdown = []
    invested_total = 0.0
    fv = 0.0
    for year in range(1, years + 1):
        for _month in range(12):
            fv = fv * (1 + i) + monthly_investment
            invested_total += monthly_investment
        breakdown.append({
            "year": year,
            "invested": round(invested_total, 2),
            "value": round(fv, 2),
            "gains": round(fv - invested_total, 2),
        })
    return {
        "final_value": round(fv, 2),
        "total_invested": round(invested_total, 2),
        "total_gains": round(fv - invested_total, 2),
        "yearly": breakdown,
    }


def lumpsum_future_value(principal: float, annual_rate_pct: float, years: int):
    """Future value of a one-time lump sum (e.g. Fixed Deposit),
    compounded annually, with a year-by-year breakdown."""
    breakdown = []
    value = principal
    for year in range(1, years + 1):
        value = value * (1 + annual_rate_pct / 100)
        breakdown.append({
            "year": year,
            "invested": round(principal, 2),
            "value": round(value, 2),
            "gains": round(value - principal, 2),
        })
    return {
        "final_value": round(value, 2),
        "total_invested": round(principal, 2),
        "total_gains": round(value - principal, 2),
        "yearly": breakdown,
    }


def life_gap_adjusted_projection(monthly_income: float, monthly_savings: float,
                                  annual_rate_pct: float, years: int,
                                  career_break_months: int = 0):
    """Life-Stage & Gap-Adjusted Wealth Engine.

    Projects savings growth month-by-month, but zeroes out contributions
    during a specified career-break window (e.g. maternity leave), so
    the projection honestly reflects real-world variable-income timelines
    instead of assuming uninterrupted contributions like a standard SIP
    calculator would.

    career_break_months is placed at the midpoint of the timeline for
    illustration purposes (a real product would let the user place it
    on a timeline).
    """
    total_months = years * 12
    break_start = max(0, (total_months // 2) - (career_break_months // 2))
    break_end = break_start + career_break_months
    i = (annual_rate_pct / 100) / 12

    fv = 0.0
    invested = 0.0
    months_paused = 0
    yearly = []
    for m in range(1, total_months + 1):
        on_break = break_start < m <= break_end
        contribution = 0.0 if on_break else monthly_savings
        if on_break:
            months_paused += 1
        fv = fv * (1 + i) + contribution
        invested += contribution
        if m % 12 == 0:
            yearly.append({
                "year": m // 12,
                "invested": round(invested, 2),
                "value": round(fv, 2),
            })

    # For comparison: what the value WOULD be with zero career break
    uninterrupted = sip_future_value(monthly_savings, annual_rate_pct, years)["final_value"]

    return {
        "final_value": round(fv, 2),
        "total_invested": round(invested, 2),
        "months_paused": months_paused,
        "uninterrupted_final_value": round(uninterrupted, 2),
        "gap_cost": round(uninterrupted - fv, 2),
        "yearly": yearly,
    }


def impulse_purchase_neutralizer(item_cost: float, hourly_wage: float,
                                  annual_rate_pct: float = 10.0, years: int = 5):
    """The Impulse Purchase Neutralizer: converts an impulse buy into
    (a) hours of work it costs, and (b) what that money would grow to
    if invested instead of spent, over a chosen horizon."""
    if hourly_wage <= 0:
        hours_of_work = None
    else:
        hours_of_work = round(item_cost / hourly_wage, 1)

    future_value = lumpsum_future_value(item_cost, annual_rate_pct, years)["final_value"]

    return {
        "item_cost": item_cost,
        "hours_of_work": hours_of_work,
        "future_value_if_invested": future_value,
        "opportunity_cost": round(future_value - item_cost, 2),
        "years": years,
        "annual_rate_pct": annual_rate_pct,
    }
