(async function () {
  const stage = document.getElementById('flashcard');
  const cardTag = document.getElementById('cardTag');
  const cardDifficulty = document.getElementById('cardDifficulty');
  const cardWine = document.getElementById('cardWine');
  const cardQuestion = document.getElementById('cardQuestion');
  const cardAnswer = document.getElementById('cardAnswer');
  const progressReadout = document.getElementById('progressReadout');
  const typeFilterRow = document.getElementById('typeFilterRow');
  const difficultyFilterRow = document.getElementById('difficultyFilterRow');
  const toggleOrderBtn = document.getElementById('toggleOrderBtn');
  const cardStage = document.querySelector('.card-stage');

  let deck = [];
  let filtered = [];
  let index = 0;
  const selectedTypes = new Set();
  const selectedDifficulties = new Set();
  // Toggle cycles between 'shuffle' and 'difficulty'. The button label always
  // shows the action that will run on the NEXT click. Default view (and what
  // "Order" snaps back to) is grouped by q: all Easy in wine-list order,
  // then Medium, then Hard.
  let nextAction = 'shuffle';

  function categoryLabel(cat) {
    const labels = {
      white: 'White', red: 'Red', rose: 'Rosé', sparkling: 'Sparkling', dessert: 'Dessert',
      charcuterie: 'Charcuterie', entrees: 'Entrées', plats: 'Plats Principaux',
      accompagnements: 'Accompagnements', desserts: 'Food Desserts'
    };
    return labels[cat] || cat;
  }

  function difficultyGroup(q) {
    if (q === 1) return 'easy';
    if (q === 4) return 'hard';
    return 'medium';
  }

  function difficultyLabel(q) {
    const g = difficultyGroup(q);
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  function byDifficulty(arr) {
    return arr.slice().sort((a, b) => a.q - b.q);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderCard() {
    if (filtered.length === 0) {
      cardWine.textContent = '';
      cardQuestion.textContent = 'No cards match these filters';
      cardTag.textContent = '';
      cardDifficulty.textContent = '';
      cardAnswer.textContent = '';
      progressReadout.textContent = '0 / 0';
      return;
    }
    const card = filtered[index];
    stage.classList.remove('flipped');

    cardTag.textContent = categoryLabel(card.category);
    cardTag.className = 'tag tag-' + card.category;
    cardDifficulty.textContent = difficultyLabel(card.q);
    cardDifficulty.className = 'difficulty-badge difficulty-' + difficultyGroup(card.q);
    cardWine.textContent = card.wine;
    cardQuestion.textContent = card.question;
    cardAnswer.textContent = card.answer;

    progressReadout.textContent = `${index + 1} / ${filtered.length}`;
  }

  function applyFilters() {
    let base = deck.slice();
    if (selectedTypes.size > 0) base = base.filter(c => selectedTypes.has(c.category));
    if (selectedDifficulties.size > 0) base = base.filter(c => selectedDifficulties.has(difficultyGroup(c.q)));

    filtered = byDifficulty(base);
    index = 0;
    nextAction = 'shuffle';
    toggleOrderBtn.textContent = 'Randomize';
    renderCard();
  }

  // Generic multi-select chip row: the "all" chip clears the set; any other
  // chip toggles membership and deactivates "all". Emptying the set out
  // (deselecting the last specific chip) falls back to "all" automatically.
  function wireMultiSelectRow(row, selectedSet) {
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      const value = btn.dataset.filter;

      if (value === 'all') {
        selectedSet.clear();
      } else {
        if (selectedSet.has(value)) {
          selectedSet.delete(value);
        } else {
          selectedSet.add(value);
        }
      }

      row.querySelectorAll('.filter-chip').forEach(b => {
        if (selectedSet.size === 0) {
          b.classList.toggle('active', b.dataset.filter === 'all');
        } else {
          b.classList.toggle('active', selectedSet.has(b.dataset.filter));
        }
      });

      applyFilters();
    });
  }

  function buildTypeFilters() {
    const order = ['sparkling', 'white', 'rose', 'red', 'dessert', 'charcuterie', 'entrees', 'plats', 'accompagnements', 'desserts'];
    const cats = Array.from(new Set(deck.map(c => c.category)))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));

    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filter = cat;
      btn.textContent = categoryLabel(cat);
      typeFilterRow.appendChild(btn);
    });

    wireMultiSelectRow(typeFilterRow, selectedTypes);
  }

  function buildDifficultyFilters() {
    ['easy', 'medium', 'hard'].forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filter = g;
      btn.textContent = g.charAt(0).toUpperCase() + g.slice(1);
      difficultyFilterRow.appendChild(btn);
    });

    wireMultiSelectRow(difficultyFilterRow, selectedDifficulties);
  }

  stage.addEventListener('click', () => stage.classList.toggle('flipped'));

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (filtered.length === 0) return;
    index = (index - 1 + filtered.length) % filtered.length;
    renderCard();
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (filtered.length === 0) return;
    index = (index + 1) % filtered.length;
    renderCard();
  });

  toggleOrderBtn.addEventListener('click', () => {
    if (nextAction === 'shuffle') {
      filtered = shuffle(filtered);
      nextAction = 'difficulty';
      toggleOrderBtn.textContent = 'Order';
    } else {
      filtered = byDifficulty(filtered);
      nextAction = 'shuffle';
      toggleOrderBtn.textContent = 'Randomize';
    }
    index = 0;
    renderCard();
  });

  try {
    const data = await window.DataSource.load();
    deck = data.cards || [];

    const params = new URLSearchParams(window.location.search);
    const quizWineId = params.get('wineId');

    if (quizWineId) {
      // "Quiz Me" mode: just the 4 questions for one wine, in order
      // (Easy → Medium → Medium → Hard), with the toggle available to
      // switch to shuffled order if wanted.
      filtered = byDifficulty(deck.filter(c => c.wineId === quizWineId));
      nextAction = 'shuffle';
      toggleOrderBtn.textContent = 'Randomize';
      document.querySelectorAll('.filter-block').forEach(el => el.style.display = 'none');
    } else {
      buildTypeFilters();
      buildDifficultyFilters();
      applyFilters();
    }

    index = 0;
    // Deferring to the next frame avoids a WebKit quirk where content set
    // inside the 3D-transformed flip card BEFORE the browser's first paint
    // can render stale or overlapping (missing badges, garbled text) until
    // something else forces a repaint. Every render after this one is fine
    // because by then the browser has already painted the card once.
    requestAnimationFrame(() => {
      renderCard();
      // In Quiz Me mode, bring the card and its Prev/Randomize/Next
      // buttons into view right away — don't make someone arriving from
      // "Quiz me on this wine" scroll past the page title to find them.
      if (quizWineId) cardStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } catch (err) {
    cardQuestion.textContent = 'Could not load the flashcard deck.';
    console.error(err);
  }
})();
