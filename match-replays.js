'use strict';

const renderMatchReplays = (() => {
  const dateInRome = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Rome'});
  const previousRender = new WeakMap();
  const hasReplay = match => /^[A-Za-z0-9_-]{11}$/.test(match.youtubeId || '');

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function replayLink(match, className, text) {
    const link = element('a', className, text);
    link.href = 'https://www.youtube.com/watch?v=' + match.youtubeId;
    link.setAttribute('aria-label', text + ' – Guarda su YouTube');
    return link;
  }

  function matchTitle(match) {
    return match.homeTeam + ' – ' + match.awayTeam + ' ' + match.score.replace(/\s*[-–:]\s*/g, '–');
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

    if (hasReplay(match)) {
      const link = replayLink(match, 'match-replay-link', matchTitle(match));
      link.textContent = '';
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
    ).filter(match => !('replaysOnly' in list.dataset) || hasReplay(match)).sort((a, b) =>
      b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')
    ).slice(0, list.dataset.limit ? Number(list.dataset.limit) : undefined);

    const key = JSON.stringify(results);
    if (previousRender.get(list) === key) return;
    previousRender.set(list, key);
    list.replaceChildren(...(results.length
      ? results.map((match, index) => index === 0
        ? matchCard(match)
        : replayLink(match, 'match-replay-row', matchTitle(match)))
      : [element('p', 'match-replay-status', 'Nessun replay disponibile.')]));
  };
})();
