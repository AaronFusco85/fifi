(async function () {
  const grid = document.getElementById('foodGrid');
  const filterRow = document.getElementById('foodFilterRow');
  const overlay = document.getElementById('foodDetailOverlay');
  const closeBtn = document.getElementById('foodDetailClose');

  let items = [];

  const categoryLabels = {
    charcuterie: 'Charcuterie',
    entrees: 'Entrées',
    plats: 'Plats Principaux',
    accompagnements: 'Accompagnements',
    desserts: 'Desserts'
  };
  function categoryLabel(cat) { return categoryLabels[cat] || cat; }

  function renderGrid(list) {
    grid.innerHTML = '';
    if (list.length === 0) {
      grid.innerHTML = '<p style="color:var(--paper-dim)">No items in this category yet.</p>';
      return;
    }
    list.forEach(item => {
      const imageMarkup = item.imageUrl
        ? `<img class="menu-item-photo" src="${item.imageUrl}" alt="" loading="lazy" onerror="this.closest('.menu-item').classList.add('no-photo')">`
        : '';
      const btn = document.createElement('button');
      btn.className = 'menu-item' + (item.imageUrl ? '' : ' no-photo');
      btn.innerHTML = `
        ${imageMarkup}
        <div class="menu-item-body">
          <span class="tag tag-${item.category}">${categoryLabel(item.category)}</span>
          <div class="wine-producer">${item.name}</div>
          <div class="prices">${item.price}</div>
        </div>
      `;
      btn.addEventListener('click', () => openDetail(item));
      grid.appendChild(btn);
    });
  }

  function toggleSection(sectionId, textId, value) {
    const section = document.getElementById(sectionId);
    const textEl = document.getElementById(textId);
    if (value && value.trim()) {
      section.hidden = false;
      textEl.textContent = value;
    } else {
      section.hidden = true;
    }
  }

  function openDetail(item) {
    document.getElementById('foodDetailTag').textContent = categoryLabel(item.category);
    document.getElementById('foodDetailTag').className = 'tag tag-' + item.category;
    document.getElementById('foodDetailName').textContent = item.name;
    document.getElementById('foodDetailPrice').textContent = item.price;

    const photo = document.getElementById('foodDetailPhoto');
    if (item.imageUrl) {
      photo.src = item.imageUrl;
      photo.style.display = '';
    } else {
      photo.style.display = 'none';
    }

    toggleSection('foodDetailDescSection', 'foodDetailDescription', item.description);
    toggleSection('foodDetailAllergiesSection', 'foodDetailAllergies', item.allergies);
    toggleSection('foodDetailSubsSection', 'foodDetailSubstitutions', item.substitutions);

    overlay.hidden = false;
  }

  closeBtn.addEventListener('click', () => overlay.hidden = true);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.hidden = true; });

  function buildFilters() {
    const order = ['charcuterie', 'entrees', 'plats', 'accompagnements', 'desserts'];
    const cats = Array.from(new Set(items.map(i => i.category)))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));

    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filter = cat;
      btn.textContent = categoryLabel(cat);
      filterRow.appendChild(btn);
    });

    filterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      filterRow.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      renderGrid(cat === 'all' ? items : items.filter(i => i.category === cat));
    });
  }

  try {
    const data = await window.DataSource.loadFood();
    items = data.items || [];
    buildFilters();
    renderGrid(items);
  } catch (err) {
    grid.innerHTML = '<p style="color:var(--paper-dim)">Could not load the food menu.</p>';
    console.error(err);
  }
})();
