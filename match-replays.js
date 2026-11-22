'use strict';

const renderMatchReplays = (() => {
  const dateInRome = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Rome'});
  const previousRender = new WeakMap();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function matchCard(match) {
    const card = element('article', 'match-replay-card');
    const result = element('div', 'match-replay-result');
    result.append(
      element('span', 'match-replay-team', match.homeTeam),
      element('strong', 'match-replay-score', match.score),
      element('span', 'match-replay-team', match.awayTeam)
    );
    card.append(element('p', 'match-replay-date', match.dateLabel || match.date), result);

    if (/^[A-Za-z0-9_-]{11}$/.test(match.youtubeId || '')) {
      const link = element('a', 'match-replay-link');
      link.href = 'https://www.youtube.com/watch?v=' + match.youtubeId;
      link.setAttribute('aria-label', 'Guarda ' + match.homeTeam + ' – ' + match.awayTeam + ' su YouTube');
      const thumbnail = element('img', 'match-replay-thumbnail');
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.addEventListener('error', () => thumbnail.remove(), {once: true});
      thumbnail.src = 'https://i.ytimg.com/vi/' + match.youtubeId + '/hqdefault.jpg';
      link.append(thumbnail, element('span', 'match-replay-play', '▶ Guarda su YouTube'));
      card.append(link);
    }
    return card;
  }

  return (rows, now = Date.now()) => {
    const list = document.getElementById('match-replays-list');
    const today = dateInRome.format(now);
    const results = rows.filter(match =>
      /VOLLA\s*UNITED/i.test(match.homeTeam) || /VOLLA\s*UNITED/i.test(match.awayTeam)
    ).filter(match =>
      match.date && match.date <= today && /^\s*\d+\s*[-–:]\s*\d+\s*$/.test(match.score)
    ).sort((a, b) =>
      b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')
    ).slice(0, list.dataset.limit ? Number(list.dataset.limit) : undefined);

    const key = JSON.stringify(results);
    if (previousRender.get(list) === key) return;
    previousRender.set(list, key);
    list.replaceChildren(...(results.length
      ? results.map(matchCard)
      : [element('p', 'match-replay-status', 'Nessun risultato confermato disponibile.')]));
  };
})();
