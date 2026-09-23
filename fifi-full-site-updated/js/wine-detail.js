window.WineDetail = (function () {
  let allPins = [];
  let wineIdToPin = {};
  let miniMap = null;
  let miniMarker = null;
  let googleMapsLoading = null;

  // A muted, low-intensity grey map style — shared by the mini-map here and
  // the full Wine Map page (maps.js reads this same object).
  const MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#3a3a38' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#2a2a28' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#b8b3a8' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#8a8378' }, { weight: 1 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#5c5952' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#48453f' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#26282a' }] }
  ];

  function categoryLabel(cat) {
    const labels = { white: 'White', red: 'Red', rose: 'Rosé', sparkling: 'Sparkling', dessert: 'Dessert' };
    return labels[cat] || cat;
  }

  async function loadRegions() {
    try {
      const data = await window.DataSource.load();
      allPins = data.pins || [];
      allPins.forEach(pin => {
        pin.wineIds.forEach(id => { wineIdToPin[id] = pin; });
      });
    } catch (err) {
      console.error('Could not load pin data', err);
    }
  }

  function ensureGoogleMaps(callback) {
    if (window.google && window.google.maps) { callback(true); return; }
    if (googleMapsLoading) { googleMapsLoading.then(callback); return; }

    googleMapsLoading = new Promise((resolve) => {
      const key = window.GOOGLE_MAPS_API_KEY;
      if (!key || key === 'PASTE_YOUR_KEY_HERE' || (navigator && navigator.onLine === false)) {
        resolve(false);
        return;
      }
      window.__wineDetailMapsReady = () => resolve(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=__wineDetailMapsReady`;
      script.async = true;
      script.defer = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
      // No connection or a very slow one: don't leave the mini-map hanging.
      setTimeout(() => resolve(false), 6000);
    });
    googleMapsLoading.then(callback);
  }

  // Shows a country-scale view around the wine's region (not just the pin
  // itself zoomed in tight), with a single marker for that one winery.
  function renderMiniMap(pin) {
    const container = document.getElementById('detailMiniMap');
    if (!container) return;

    if (!window.google || !window.google.maps) {
      container.closest('.detail-section').hidden = true;
      return;
    }
    container.closest('.detail-section').hidden = false;

    if (!miniMap) {
      miniMap = new google.maps.Map(container, {
        styles: MAP_STYLE,
        disableDefaultUI: true,
        gestureHandling: 'cooperative'
      });
    }

    // The container's size can only be measured correctly once it's
    // actually visible on screen — nudge Maps to re-measure first.
    google.maps.event.trigger(miniMap, 'resize');
    miniMap.setCenter({ lat: pin.lat, lng: pin.lng });
    miniMap.setZoom(5);

    if (miniMarker) miniMarker.setMap(null);
    miniMarker = new google.maps.Marker({
      position: { lat: pin.lat, lng: pin.lng },
      map: miniMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#c9b790',
        fillOpacity: 1,
        strokeColor: '#201712',
        strokeWeight: 2
      }
    });
  }

  function init() {
    const overlay = document.getElementById('detailOverlay');
    const closeBtn = document.getElementById('detailClose');
    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', () => overlay.hidden = true);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.hidden = true; });

    loadRegions();
  }

  function open(item) {
    const photo = document.getElementById('detailPhoto');
    if (item.imageUrl) {
      photo.src = item.imageUrl;
      photo.style.display = '';
    } else {
      photo.style.display = 'none';
    }

    document.getElementById('detailTag').textContent = categoryLabel(item.category);
    document.getElementById('detailTag').className = 'tag tag-' + item.category;
    document.getElementById('detailProducer').textContent = item.producer;
    document.getElementById('detailName').innerHTML = `${item.name} · ${item.vintage}`;
    document.getElementById('detailGrape').textContent = item.grape;
    document.getElementById('detailRegion').textContent = item.region;
    document.getElementById('detailGlass').textContent = item.priceGlass;

    const bottleRow = document.getElementById('detailBottle').closest('div');
    if (!item.priceBottle || item.priceBottle === '—') {
      bottleRow.style.display = 'none';
    } else {
      bottleRow.style.display = '';
      document.getElementById('detailBottle').textContent = item.priceBottle;
    }

    document.getElementById('detailTastingNotes').textContent = item.tastingNotes;
    document.getElementById('detailWineryProfile').textContent = item.wineryProfile;
    document.getElementById('detailFarmingWinemaking').textContent = item.farmingWinemaking;
    document.getElementById('detailAboutCuvee').textContent = item.aboutCuvee;
    document.getElementById('detailVintageDetails').textContent = item.vintageDetails;

    const quizLink = document.getElementById('detailQuizLink');
    if (quizLink) quizLink.href = `flashcards.html?wineId=${item.id}`;

    // Make the overlay visible BEFORE touching the map — fitBounds()
    // computed against a hidden (zero-size) container produces a bogus,
    // zoomed-way-out result.
    document.getElementById('detailOverlay').hidden = false;

    const pin = wineIdToPin[item.id];
    const mapSection = document.getElementById('detailMiniMap');
    if (mapSection) {
      if (pin) {
        ensureGoogleMaps((ready) => {
          if (ready) {
            renderMiniMap(pin);
          } else {
            mapSection.closest('.detail-section').hidden = true;
          }
        });
      } else {
        mapSection.closest('.detail-section').hidden = true;
      }
    }
  }

  return { init, open, categoryLabel, MAP_STYLE };
})();
