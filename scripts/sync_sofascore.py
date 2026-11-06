import json,re,urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path

BASE="https://widgets.sofascore.com/it/embed/"
def read(path):
    with urllib.request.urlopen(BASE+path,timeout=30) as response:
        html=response.read().decode()
    match=re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',html,re.S)
    if not match: raise ValueError("Dati widget non disponibili")
    return json.loads(match[1])["props"]["pageProps"]
data=json.loads(Path("site-data.json").read_text())
table=read("tournament/126774/season/96361/standings/Promozione%20Campania%20-%20Girone%20B%2026%2F27")
standing=table["standingsProps"]["initialStandingsData"]["standings"][0]
assert standing["tournament"]["id"]==126774 and len(standing["rows"])==16
rows=[dict(position=r["position"],team=r["team"]["name"].upper(),points=r["points"],played=r["matches"],won=r["wins"],drawn=r["draws"],lost=r["losses"],isVolla="volla" in r["team"]["name"].lower()) for r in standing["rows"]]
fixtures=read("unique-tournament/21987/season/96361/editorFixtures")
events=[e for e in fixtures["events"] if e["tournament"]["id"]==126774]
assert events, "Nessuna partita Girone B: mantenere i dati precedenti"
matches=[]
for e in events:
    dt=datetime.fromtimestamp(e["startTimestamp"],ZoneInfo("Europe/Rome"))
    score="—"
    if e["status"]["type"] in ("finished","inprogress"):
        score=str(e["homeScore"].get("current","—"))+" - "+str(e["awayScore"].get("current","—"))
    matches.append(dict(date=dt.isoformat(),dateLabel=dt.strftime("%d/%m/%Y"),time=dt.strftime("%H:%M"),homeTeam=e["homeTeam"]["name"].upper(),awayTeam=e["awayTeam"]["name"].upper(),venue="GIORNATA "+str(e.get("roundInfo",{}).get("round",""))+" · "+e["status"]["description"].upper(),score=score))
data["firstTeam"].update(standings=rows,matches=matches,automaticSofascore=False,updatedAt=datetime.now(ZoneInfo("Europe/Rome")).strftime("%d/%m/%Y %H:%M"),automaticData=True)
Path("site-data.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
print("Aggiornati",len(rows),"squadre e",len(matches),"partite del Girone B")
