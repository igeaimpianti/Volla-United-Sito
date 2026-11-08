"""Update the matching archived fixture from Tuttocampo's latest-match widget."""
import json
import re
import unicodedata
from datetime import date
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

WIDGET = "https://www.tuttocampo.it/WidgetV2/Partita/94e9e03a-43ad-4573-ab6d-0829547ca206"
MONTHS = "gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre".split()


def normalized(value):
    plain = unicodedata.normalize("NFKD", value.upper()).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]", "", plain).replace("VOLLAUNITED2024", "VOLLAUNITED")


def widget_span(html, css_class):
    match = re.search(r'<span class="' + css_class + r'">\s*([^<]+)</span>', html)
    if not match:
        raise ValueError(f"Campo mancante nel widget: {css_class}")
    return unescape(match[1]).strip()


def sync(html, path):
    if widget_span(html, "match-state").lower() != "partita terminata":
        return
    day, month, time = re.search(r"(\d{1,2})\s+([a-z]+)\s+(\d{2}:\d{2})", widget_span(html, "date")).groups()
    teams = [normalized(unescape(team).strip()) for team in re.findall(
        r'<div class="(?:home|away)-team[^"]*">\s*<a[^>]*>\s*<div>\s*<span>([^<]+)</span>', html
    )]
    if len(teams) != 2 or "VOLLAUNITED" not in teams:
        raise ValueError("Squadre inattese nel widget")
    score = f'{int(widget_span(html, "home"))} - {int(widget_span(html, "away"))}'
    data = json.loads(path.read_text())
    fixtures = data["firstTeam"]["fullCalendar"]
    candidates = []
    for game in fixtures:
        names = [normalized(game[key]) for key in ("homeTeam", "awayTeam")]
        if any(a != b and (min(len(a), len(b)) < 6 or (a not in b and b not in a)) for a, b in zip(teams, names)):
            continue
        planned = date.fromisoformat(game["date"])
        actual = date(planned.year, MONTHS.index(month) + 1, int(day))
        if abs((planned - actual).days) <= 2:
            candidates.append((game, actual))
    if len(candidates) != 1:
        raise ValueError("Partita non identificata univocamente nel calendario")
    game, actual = candidates[0]
    updates = dict(date=actual.isoformat(), dateLabel=actual.strftime("%d/%m/%Y"), time=time, score=score)
    if any(game[key] != value for key, value in updates.items()):
        game.update(updates)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    with urlopen(Request(WIDGET, headers={"User-Agent": "Volla United Academy results sync"}), timeout=20) as response:
        sync(response.read().decode("utf-8"), Path("site-data.json"))
