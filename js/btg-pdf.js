// Builds the "Complete BTG Packet" PDF on the fly from the current Google
// Sheet data (wines + flashcards), instead of serving a static file that goes
// out of date. Runs entirely in the browser — nothing is uploaded anywhere.
//
// Sections (same shape as the old static packet):
//   cover → BTG summary → BTG full detail → dessert summary → dessert detail
//   → server study guide (questions only) → answer key
//
// The library (js/vendor/jspdf.umd.min.js) is only loaded when someone clicks
// the download link, and is precached by sw.js so it also works offline.

window.BtgPdf = (function () {

  const CATEGORY_ORDER = ['sparkling', 'white', 'rose', 'red', 'dessert'];
  const CATEGORY_LABEL = {
    sparkling: 'Sparkling', white: 'White', rose: 'Rosé', red: 'Red', dessert: 'Dessert Wine'
  };

  const PAGE = { w: 612, h: 792, mx: 54, top: 54, bottom: 58 }; // US Letter, points
  const ACCENT = [150, 30, 70];
  const INK = [25, 25, 25];
  const LINE_HEIGHT = 1.3;

  // The built-in PDF fonts only cover Windows-1252 (which includes é è ô · — –
  // etc.). Anything outside that set is reduced to a plain equivalent so it
  // never prints as a garbled box.
  const EXTRA_MAP = { '₂': '2', '₁': '1', '₃': '3', '\u2009': ' ', '\u00a0': ' ', '\u202f': ' ' };
  function safe(str) {
    let out = '';
    for (const ch of String(str == null ? '' : str)) {
      if (EXTRA_MAP[ch] !== undefined) { out += EXTRA_MAP[ch]; continue; }
      const code = ch.codePointAt(0);
      if (code < 128 || (code >= 160 && code <= 255) || '—–‘’“”•…€™·'.includes(ch)) { out += ch; continue; }
      const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      out += (stripped.length && stripped.charCodeAt(0) < 256) ? stripped : '';
    }
    return out;
  }

  function categoryLabel(cat) { return CATEGORY_LABEL[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'); }

  function priceOf(w) {
    const glass = (w.priceGlass || '').trim();
    const bottle = (w.priceBottle || '').trim();
    const hasBottle = bottle && bottle !== '—';
    if (glass && glass !== '—' && hasBottle) return `${glass} glass / ${bottle} bottle`;
    if (glass && glass !== '—') return glass;
    return hasBottle ? `${bottle} bottle` : '';
  }

  function wineTitle(w) {
    return [w.producer, w.name].filter(Boolean).join(' — ');
  }

  // Groups wines by category, in list order, honoring the site's category order.
  function groupByCategory(wines, cats) {
    const present = Array.from(new Set(wines.map(w => w.category)));
    const ordered = CATEGORY_ORDER.filter(c => present.includes(c))
      .concat(present.filter(c => !CATEGORY_ORDER.includes(c)));
    return ordered.filter(c => cats(c)).map(c => ({ category: c, wines: wines.filter(w => w.category === c) }));
  }

  function cardsFor(wineId, cards) {
    return cards
      .map((c, i) => ({ c, i }))
      .filter(x => x.c.wineId === wineId)
      .sort((a, b) => (a.c.q - b.c.q) || (a.i - b.i))
      .map(x => x.c);
  }

  // data: { wines, cards }   meta: { dateText, sourceNote }
  function build(jsPDF, data, meta) {
    const wines = (data.wines || []).filter(w => w.id);
    const wineIds = new Set(wines.map(w => w.id));
    const cards = (data.cards || []).filter(c => wineIds.has(c.wineId) && c.question);

    const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
    doc.setProperties({ title: 'Chez Fifi — Complete BTG Packet', author: 'Chez Fifi', creator: 'Chez Fifi Staff Education Portal' });

    const W = PAGE.w - PAGE.mx * 2;
    let y = PAGE.top;

    function newPage() { doc.addPage(); y = PAGE.top; }
    function need(h) { if (y + h > PAGE.h - PAGE.bottom) newPage(); }

    // Writes wrapped text, flowing across pages line by line.
    function text(str, o) {
      o = o || {};
      const size = o.size || 10;
      const indent = o.indent || 0;
      doc.setFont('times', o.style || 'normal');
      doc.setFontSize(size);
      doc.setTextColor.apply(doc, o.color || INK);
      const lines = doc.splitTextToSize(safe(str).replace(/\s*\n\s*/g, ' '), W - indent);
      const lh = size * LINE_HEIGHT;
      lines.forEach((line) => {
        need(lh);
        y += lh;
        if (o.align === 'center') doc.text(line, PAGE.w / 2, y, { align: 'center' });
        else doc.text(line, PAGE.mx + indent, y);
      });
      y += o.after || 0;
    }

    // "Label: value" where the label is bold and the value wraps underneath it.
    function labelValue(label, value, o) {
      o = o || {};
      const size = o.size || 10;
      const lh = size * LINE_HEIGHT;
      const lab = safe(label) + ' ';
      const val = safe(value).replace(/\s*\n\s*/g, ' ');
      doc.setFont('times', 'bold'); doc.setFontSize(size);
      const lw = doc.getTextWidth(lab);
      doc.setFont('times', 'normal');
      const first = doc.splitTextToSize(val, W - lw)[0] || '';
      need(lh); y += lh;
      doc.setFont('times', 'bold'); doc.setTextColor.apply(doc, INK); doc.text(lab, PAGE.mx, y);
      doc.setFont('times', 'normal'); doc.text(first, PAGE.mx + lw, y);
      const rest = val.slice(first.length).trim();
      if (rest) text(rest, { size });
      y += o.after || 0;
    }

    function rule(weight) {
      doc.setDrawColor.apply(doc, ACCENT);
      doc.setLineWidth(weight || 0.9);
      doc.line(PAGE.mx, y, PAGE.mx + W, y);
    }

    function sectionPage(title, subtitle) {
      newPage();
      text(title, { size: 15, style: 'bold', align: 'center', after: 2 });
      if (subtitle) text(subtitle, { size: 10, style: 'italic', align: 'center', after: 6 });
      y += 8;
    }

    function categoryHeading(cat) {
      need(60);
      y += 8;
      text(categoryLabel(cat).toUpperCase(), { size: 11, style: 'bold' });
      y += 2; rule(); y += 4;
    }

    // ---------- cover ----------
    y = 250;
    text('Chez Fifi · By the Glass', { size: 26, style: 'bold', align: 'center', after: 6 });
    text('Complete BTG Packet', { size: 14, style: 'italic', align: 'center', after: 4 });
    text('Descriptions · Dessert Wine · Server Study Guide · Answer Key', { size: 10.5, style: 'italic', align: 'center', after: 40 });
    text(`Generated ${meta.dateText}`, { size: 9.5, align: 'center', color: [100, 100, 100], after: 2 });
    if (meta.sourceNote) text(meta.sourceNote, { size: 9, style: 'italic', align: 'center', color: [100, 100, 100] });

    const mainCats = (c) => c !== 'dessert';
    const dessertCats = (c) => c === 'dessert';

    function summarySection(title, catFilter) {
      const groups = groupByCategory(wines, catFilter);
      if (!groups.length) return;
      sectionPage(title);
      groups.forEach((g) => {
        categoryHeading(g.category);
        g.wines.forEach((w) => {
          need(52);
          text(wineTitle(w), { size: 10, style: 'bold' });
          const meta2 = [w.vintage, w.region].filter(Boolean).join(' · ');
          const price = priceOf(w);
          text([meta2, price].filter(Boolean).join('  |  '), { size: 9.5 });
          if (w.grape) text(w.grape, { size: 9.5, style: 'italic', color: [80, 80, 80] });
          y += 7;
        });
      });
    }

    function detailSection(title, catFilter) {
      const groups = groupByCategory(wines, catFilter);
      if (!groups.length) return;
      let firstPage = true;
      groups.forEach((g) => {
        g.wines.forEach((w) => {
          if (firstPage) { sectionPage(title); firstPage = false; } else { newPage(); }
          text(wineTitle(w) + (priceOf(w) ? `  |  ${priceOf(w)}` : ''), { size: 13, style: 'bold', after: 3 });
          text([w.vintage, w.region].filter(Boolean).join(' · '), { size: 10, style: 'italic', after: 4 });
          if (w.grape) labelValue('Grapes:', w.grape, { after: 6 });
          [
            ['TASTING NOTES', w.tastingNotes],
            ['WINERY PROFILE', w.wineryProfile],
            ['FARMING & WINEMAKING', w.farmingWinemaking],
            ['ABOUT THE CUVÉE', w.aboutCuvee],
            ['VINTAGE DETAILS', w.vintageDetails]
          ].forEach(([label, body]) => {
            if (!body) return;
            need(40);
            y += 6;
            text(label, { size: 9, style: 'bold', color: ACCENT, after: 1 });
            text(body, { size: 10.5, after: 2 });
          });
        });
      });
    }

    function studySection(title, subtitle, withAnswers) {
      const groups = groupByCategory(wines, () => true);
      const any = groups.some(g => g.wines.some(w => cardsFor(w.id, cards).length));
      if (!any) return;
      sectionPage(title, subtitle);
      groups.forEach((g) => {
        const withCards = g.wines.filter(w => cardsFor(w.id, cards).length);
        if (!withCards.length) return;
        categoryHeading(g.category);
        withCards.forEach((w) => {
          need(70);
          y += 4;
          text(`${wineTitle(w)}${w.vintage ? '  |  ' + w.vintage : ''}`, { size: 10, style: 'bold', after: 2 });
          cardsFor(w.id, cards).forEach((c, i) => {
            text(`${i + 1}. ${c.question}`, { size: 10, indent: 0, after: withAnswers ? 1 : 2 });
            if (withAnswers) text(c.answer, { size: 10, style: 'italic', indent: 14, color: [60, 60, 60], after: 3 });
          });
          y += 5;
        });
      });
    }

    summarySection('BTG DESCRIPTIONS — SUMMARY', mainCats);
    detailSection('BTG DESCRIPTIONS — FULL DETAIL', mainCats);
    summarySection('DESSERT WINE — SUMMARY', dessertCats);
    detailSection('DESSERT WINE — FULL DETAIL', dessertCats);
    studySection('SERVER STUDY GUIDE', 'Quiz Sheet — Questions Only', false);
    studySection('ANSWER KEY', 'Matches the Study Guide numbering', true);

    // ---------- footers (skip the cover) ----------
    const total = doc.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      doc.setPage(p);
      doc.setFont('times', 'italic'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
      doc.text(`Chez Fifi — internal staff resource — not for guest use   ·   Page ${p} of ${total}`,
        PAGE.w / 2, PAGE.h - 30, { align: 'center' });
    }
    return doc;
  }

  // ---------- browser wiring ----------

  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/jspdf.umd.min.js?v=1';
      s.onload = () => (window.jspdf && window.jspdf.jsPDF) ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF missing'));
      s.onerror = () => reject(new Error('Could not load the PDF library'));
      document.head.appendChild(s);
    });
  }

  function dateParts() {
    const d = new Date();
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return { iso, text: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) };
  }

  async function generate() {
    const [jsPDF, data] = await Promise.all([loadJsPdf(), window.DataSource.loadFresh()]);
    const when = dateParts();
    const sourceNote = data.source === 'live'
      ? 'Built from the current wine list.'
      : 'Built from the wine list saved on this device — it may be slightly out of date. Reconnect and download again for the latest.';
    const doc = build(jsPDF, data, { dateText: when.text, sourceNote });
    doc.save(`Chez-Fifi-BTG-Packet-${when.iso}.pdf`);
    return data.source;
  }

  function init() {
    const link = document.getElementById('btgPdfLink');
    if (!link) return;
    const original = link.textContent.trim();
    let busy = false;

    function say(msg, ms) {
      link.textContent = msg;
      if (ms) setTimeout(() => { link.textContent = original; }, ms);
    }

    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (busy) return;
      busy = true;
      link.setAttribute('aria-busy', 'true');
      say('Building your packet from the current wine list…');
      await new Promise(r => setTimeout(r, 40)); // let the message paint first
      try {
        const source = await generate();
        say(source === 'live' ? 'Packet downloaded ✓' : 'Packet downloaded (from saved data — reconnect for the latest) ✓', 4000);
      } catch (err) {
        console.error('[BtgPdf]', err);
        say('Couldn’t build the packet — check your connection and try again.', 5000);
      } finally {
        busy = false;
        link.removeAttribute('aria-busy');
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }

  return { build, generate };
})();
