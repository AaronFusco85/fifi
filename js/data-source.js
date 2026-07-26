window.DataSource = (function () {

  function csvUrlConfigured(url) {
    return url && !url.startsWith('PASTE_');
  }

  function parseCsv(text) {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    return result.data;
  }

  async function fetchCsv(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('CSV fetch failed: ' + res.status);
    const text = await res.text();
    return parseCsv(text);
  }

  // Turns a raw Wines-tab row into the same shape the site has always used
  // for a menu item (data/menu.json's item objects).
  function rowToWine(row) {
    return {
      id: (row.id || '').trim(),
      category: (row.category || '').trim(),
      name: (row.name || '').trim(),
      producer: (row.producer || '').trim(),
      vintage: (row.vintage || '').trim(),
      region: (row.region || '').trim(),
      grape: (row.grape || '').trim(),
      priceGlass: (row.priceGlass || '').trim(),
      priceBottle: (row.priceBottle || '').trim() || '—',
      tastingNotes: (row.tastingNotes || '').trim(),
      wineryProfile: (row.wineryProfile || '').trim(),
      farmingWinemaking: (row.farmingWinemaking || '').trim(),
      aboutCuvee: (row.aboutCuvee || '').trim(),
      vintageDetails: (row.vintageDetails || '').trim(),
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      pinLabel: (row.pinLabel || '').trim(),
      imageUrl: (row.imageUrl || '').trim()
    };
  }

  function rowToCard(row) {
    return {
      id: (row.id || '').trim(),
      wineId: (row.wineId || '').trim(),
      category: (row.category || '').trim(),
      wine: (row.wine || '').trim(),
      question: (row.question || '').trim(),
      answer: (row.answer || '').trim(),
      q: parseInt(row.q, 10)
    };
  }

  // Groups wines that share a pinLabel (+ lat/lng) into a single map pin.
  // Two wines belong to the same pin if their pinLabel matches exactly —
  // that's the only thing that needs to match when adding a wine to an
  // existing pin (copy the pinLabel, lat, and lng from a wine already
  // there).
  function derivePins(wines) {
    const byLabel = {};
    wines.forEach((wine) => {
      if (!wine.pinLabel || isNaN(wine.lat) || isNaN(wine.lng)) return;
      if (!byLabel[wine.pinLabel]) {
        byLabel[wine.pinLabel] = {
          id: wine.pinLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          label: wine.pinLabel,
          lat: wine.lat,
          lng: wine.lng,
          wineIds: []
        };
      }
      byLabel[wine.pinLabel].wineIds.push(wine.id);
    });
    return Object.values(byLabel);
  }

  async function loadFromSheets() {
    const [wineRows, cardRows] = await Promise.all([
      fetchCsv(window.WINES_CSV_URL),
      fetchCsv(window.FLASHCARDS_CSV_URL)
    ]);
    const wines = wineRows.map(rowToWine).filter(w => w.id);
    const cards = cardRows.map(rowToCard).filter(c => c.id);
    const pins = derivePins(wines);
    return { wines, cards, pins };
  }

  async function loadFromLocalJson() {
    const [menuRes, cardsRes, regionsRes] = await Promise.all([
      fetch('data/menu.json'),
      fetch('data/flashcards.json'),
      fetch('data/regions.json').catch(() => null)
    ]);
    const menuData = await menuRes.json();
    const cardsData = await cardsRes.json();
    const wines = menuData.items || [];

    let pins = [];
    if (regionsRes && regionsRes.ok) {
      const regionsData = await regionsRes.json();
      pins = Object.values(regionsData.countries).flatMap(c => c.pins);
    }

    return { wines, cards: cardsData.cards || [], pins };
  }

  let loadPromise = null;

  function load() {
    if (loadPromise) return loadPromise;

    const sheetsReady = csvUrlConfigured(window.WINES_CSV_URL) && csvUrlConfigured(window.FLASHCARDS_CSV_URL);

    loadPromise = (sheetsReady ? loadFromSheets() : loadFromLocalJson())
      .catch((err) => {
        console.warn('[DataSource] Sheets load failed, falling back to local JSON:', err);
        return loadFromLocalJson();
      });

    return loadPromise;
  }

  function rowToFood(row) {
    return {
      id: (row.id || '').trim(),
      category: (row.category || '').trim(),
      name: (row.name || '').trim(),
      price: (row.price || '').trim(),
      description: (row.description || '').trim(),
      sourcingNotes: (row.sourcingNotes || '').trim(),
      allergies: (row.allergies || '').trim(),
      substitutions: (row.substitutions || '').trim(),
      imageUrl: (row.imageUrl || '').trim()
    };
  }

  async function loadFoodFromSheets() {
    const rows = await fetchCsv(window.FOOD_CSV_URL);
    return { items: rows.map(rowToFood).filter(f => f.id) };
  }

  async function loadFoodFromLocalJson() {
    const res = await fetch('data/food.json');
    const data = await res.json();
    return { items: data.items || [] };
  }

  let loadFoodPromise = null;

  // Separate from load() on purpose — only the Food Menu page needs this
  // data, so Menu/Flashcards/Map/Quiz don't pay for an extra fetch they
  // don't use.
  function loadFood() {
    if (loadFoodPromise) return loadFoodPromise;

    const sheetsReady = csvUrlConfigured(window.FOOD_CSV_URL);

    loadFoodPromise = (sheetsReady ? loadFoodFromSheets() : loadFoodFromLocalJson())
      .catch((err) => {
        console.warn('[DataSource] Food Sheets load failed, falling back to local JSON:', err);
        return loadFoodFromLocalJson();
      });

    return loadFoodPromise;
  }

  return { load, loadFood };
})();
