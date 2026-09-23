(async function () {
  const root = document.getElementById('teamQuizRoot');

  let wines = [];
  let winesById = {};
  let rounds = [];
  let roundIndex = 0;
  let score = 0;
  let missed = [];
  let roundMissedOnce = false;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Simple striped jersey shape in the club's real kit colors — no crest
  // or logo artwork, just the colors, so it stays clear of trademark use.
  function jerseySvg(colors) {
    const [c1, c2] = colors;
    return `
      <svg viewBox="0 0 160 160" width="90" height="90" role="img" aria-label="Team jersey">
        <defs>
          <clipPath id="jerseyClip">
            <path d="M 55 20 L 40 40 L 20 55 L 35 80 L 45 70 L 45 140 L 115 140 L 115 70 L 125 80 L 140 55 L 120 40 L 105 20 C 100 30 90 35 80 35 C 70 35 60 30 55 20 Z"/>
          </clipPath>
        </defs>
        <g clip-path="url(#jerseyClip)">
          <rect x="0" y="0" width="160" height="160" fill="${c1}"/>
          <rect x="20" y="0" width="16" height="160" fill="${c2}"/>
          <rect x="52" y="0" width="16" height="160" fill="${c2}"/>
          <rect x="84" y="0" width="16" height="160" fill="${c2}"/>
          <rect x="116" y="0" width="16" height="160" fill="${c2}"/>
        </g>
        <path d="M 55 20 L 40 40 L 20 55 L 35 80 L 45 70 L 45 140 L 115 140 L 115 70 L 125 80 L 140 55 L 120 40 L 105 20 C 100 30 90 35 80 35 C 70 35 60 30 55 20 Z"
              fill="none" stroke="#201712" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function categoryLabel(cat) {
    const labels = { white: 'White', red: 'Red', rose: 'Rosé', sparkling: 'Sparkling', dessert: 'Dessert' };
    return labels[cat] || cat;
  }

  function buildRounds() {
    const pairings = shuffle(window.TEAM_QUIZ_PAIRINGS);
    return pairings.map(pairing => {
      const correctWine = winesById[pairing.wineId];
      if (!correctWine) return null;

      // Dessert wines are excluded from this quiz entirely — as wrong
      // answers too, not just correct ones, so a Champagne round doesn't
      // suddenly offer a Sauternes as an option.
      // Dessert wines are excluded entirely (as wrong answers too), and so
      // is anything sharing the correct wine's category — otherwise a round
      // like Stade de Reims (which covers 4 different Champagnes) could
      // offer up another Champagne as a "wrong" answer, which is genuinely
      // ambiguous since it's also a correct match for that team.
      const others = wines.filter(w =>
        w.id !== pairing.wineId &&
        w.category !== 'dessert' &&
        w.category !== correctWine.category
      );
      const distractors = shuffle(others).slice(0, 2);
      const options = shuffle([correctWine, ...distractors]);

      return { pairing, correctWine, options };
    }).filter(Boolean);
  }

  function hideIntroCopy() {
    ['quizEyebrow', 'quizTitle', 'quizLede'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function showIntroCopy() {
    ['quizEyebrow', 'quizTitle', 'quizLede'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
  }

  function scrollToQuizTop() {
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderIntro() {
    root.innerHTML = `
      <div class="team-quiz-intro">
        <p>${rounds.length} clubs, ${rounds.length} regions. Match each one to the wine on our list from the same place.</p>
        <button id="teamQuizStartBtn" class="start-quiz-btn">Start →</button>
      </div>
    `;
    document.getElementById('teamQuizStartBtn').addEventListener('click', () => {
      roundIndex = 0;
      score = 0;
      missed = [];
      hideIntroCopy();
      renderRound();
    });
  }

  function optionsMarkup(options) {
    return options.map(w => `
      <button class="team-quiz-option" data-id="${w.id}">
        <span class="tag tag-${w.category}">${categoryLabel(w.category)}</span>
        <span class="team-quiz-option-producer">${w.producer}</span>
        <span class="team-quiz-option-name">${w.name}</span>
      </button>
    `).join('');
  }

  function renderRound() {
    roundMissedOnce = false;
    const round = rounds[roundIndex];
    const { pairing, correctWine, options } = round;

    root.innerHTML = `
      <div class="team-quiz-progress">Round ${roundIndex + 1} of ${rounds.length} · Score: ${score}</div>
      <div class="team-quiz-flip" id="teamQuizFlip">
        <div class="team-quiz-flip-inner" id="teamQuizFlipInner">
          <div class="team-quiz-face team-quiz-face-front" id="teamQuizFront">
            <div class="team-jersey">${jerseySvg(pairing.colors)}</div>
            <div class="team-name">${pairing.team}</div>
            <div class="team-meta">${pairing.city} · ${pairing.league}</div>
            <div class="team-quiz-options" id="teamQuizOptions">
              ${optionsMarkup(options)}
            </div>
          </div>
          <div class="team-quiz-face team-quiz-face-back" id="teamQuizBack"></div>
        </div>
      </div>
    `;

    sizeCardToContent();
    wireOptions(round);
    scrollToQuizTop();
  }

  // Measures the front face's real content height (which varies with wine
  // and team name length) and sizes the flip card to fit it exactly —
  // instead of guessing a fixed pixel height that cuts off content on some
  // screens and leaves empty space on others.
  function sizeCardToContent() {
    const flipInner = document.getElementById('teamQuizFlipInner');
    const front = document.getElementById('teamQuizFront');
    flipInner.classList.add('measuring');
    const naturalHeight = front.offsetHeight;
    flipInner.classList.remove('measuring');
    flipInner.style.height = (naturalHeight + 4) + 'px';
  }

  function wireOptions(round) {
    const { pairing, correctWine } = round;

    document.querySelectorAll('.team-quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosenId = btn.dataset.id;
        const correct = chosenId === correctWine.id;

        if (correct) {
          if (!roundMissedOnce) score += 1;
        } else if (!roundMissedOnce) {
          roundMissedOnce = true;
          missed.push({ pairing, correctWine });
        }

        showResult(round, correct);
      });
    });
  }

  function showResult(round, correct) {
    const { pairing } = round;
    const isLastRound = roundIndex + 1 >= rounds.length;
    const back = document.getElementById('teamQuizBack');

    back.innerHTML = correct ? `
      <div class="feedback-line feedback-correct">You're right!</div>
      <div class="feedback-fact">${pairing.funFact}</div>
      <button id="teamQuizContinueBtn" class="start-quiz-btn">
        ${isLastRound ? 'See Results →' : 'Next Question →'}
      </button>
    ` : `
      <div class="feedback-line feedback-incorrect">Not quite — give it another guess.</div>
      <button id="teamQuizContinueBtn" class="start-quiz-btn">Try Again →</button>
    `;

    document.getElementById('teamQuizFlip').classList.add('flipped');

    document.getElementById('teamQuizContinueBtn').addEventListener('click', () => {
      if (correct) {
        roundIndex += 1;
        if (roundIndex < rounds.length) {
          renderRound();
        } else {
          showIntroCopy();
          renderResults();
        }
      } else {
        // Flip back to the same question so they can pick again — no new
        // round, no page reflow, no scrolling.
        document.getElementById('teamQuizFlip').classList.remove('flipped');
      }
    });
  }

  function renderResults() {
    root.innerHTML = `
      <div class="team-quiz-results">
        <div class="quiz-score">${score} / ${rounds.length}</div>
        <div class="quiz-score-label">${score === rounds.length ? "Perfect — you know this list cold." : "Nice work."}</div>
        ${missed.length > 0 ? `
          <div class="team-quiz-review-label">Worth another look</div>
          <div class="team-quiz-review">
            ${missed.map(m => `
              <div class="team-quiz-review-row">
                <strong>${m.pairing.team}</strong> (${m.pairing.city}) → ${m.correctWine.name}
              </div>
            `).join('')}
          </div>
        ` : ''}
        <button id="teamQuizAgainBtn" class="start-quiz-btn">Play Again →</button>
      </div>
    `;
    document.getElementById('teamQuizAgainBtn').addEventListener('click', () => {
      rounds = buildRounds();
      renderIntro();
    });
  }

  try {
    const data = await window.DataSource.load();
    wines = data.wines || [];
    wines.forEach(w => { winesById[w.id] = w; });
    rounds = buildRounds();
    renderIntro();
  } catch (err) {
    root.innerHTML = '<p style="color:var(--paper-dim)">Could not load the wine list.</p>';
    console.error(err);
  }
})();
