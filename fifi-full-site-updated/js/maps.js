(function () {
  let allPins = [];
  let menuById = {};
  let map = null;
  let infoWindow = null;

  const mapNotice = document.getElementById('mapNotice');
  const mapCanvas = document.getElementById('map');

  function categoryLabel(cat) { return window.WineDetail.categoryLabel(cat); }

  function pinShortLabel(pin) {
    const wines = pin.wineIds.map(id => menuById[id]).filter(Boolean);
    const producers = Array.from(new Set(wines.map(w => w.producer)));
    if (producers.length === 1) return producers[0];
    return pin.label.split(',')[0];
  }

  function buildInfoWindowContent(pin) {
    const wines = pin.wineIds.map(id => menuById[id]).filter(Boolean);
    const rows = wines.map(w => `
      <div class="pin-wine-row" data-id="${w.id}">
        <span class="tag tag-${w.category}">${categoryLabel(w.category)}</span>
        <div class="pin-wine-name">${w.producer}</div>
        <div class="pin-wine-meta">${w.name}, ${w.vintage} · ${w.priceGlass}</div>
      </div>
    `).join('');

    return `
      <div class="pin-popup">
        <div class="pin-popup-label">${pin.label}</div>
        ${rows}
      </div>
    `;
  }

  function attachPopupHandlers() {
    document.querySelectorAll('.pin-wine-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        const item = menuById[id];
        if (item) window.WineDetail.open(item);
      });
    });
  }

  function addAllMarkers() {
    const bounds = new google.maps.LatLngBounds();

    allPins.forEach(pin => {
      bounds.extend({ lat: pin.lat, lng: pin.lng });

      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: map,
        title: pin.label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#c9b790',
          fillOpacity: 1,
          strokeColor: '#201712',
          strokeWeight: 2
        },
        label: {
          text: pinShortLabel(pin),
          className: 'map-pin-label',
          color: '#f0ece2',
          fontSize: '12px',
          fontWeight: '600'
        }
      });

      marker.addListener('click', () => {
        infoWindow.setContent(buildInfoWindowContent(pin));
        infoWindow.open(map, marker);
        google.maps.event.addListenerOnce(infoWindow, 'domready', attachPopupHandlers);
      });
    });

    if (allPins.length > 0) map.fitBounds(bounds, 40);
  }

  window.initMap = function () {
    map = new google.maps.Map(mapCanvas, {
      center: { lat: 42, lng: -4 },
      zoom: 5,
      styles: window.WineDetail.MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false
    });
    infoWindow = new google.maps.InfoWindow();
    addAllMarkers();
  };

  async function boot() {
    window.WineDetail.init();

    const data = await window.DataSource.load();
    data.wines.forEach(item => { menuById[item.id] = item; });
    allPins = data.pins || [];

    const key = window.GOOGLE_MAPS_API_KEY;

    if (navigator && navigator.onLine === false) {
      mapNotice.hidden = false;
      mapNotice.innerHTML = 'The Wine Map needs an internet connection to load (it streams live map data from Google) — try the Beverage Menu or Flashcards while offline.';
      mapCanvas.style.display = 'none';
      return;
    }

    if (!key || key === 'PASTE_YOUR_KEY_HERE') {
      mapNotice.hidden = false;
      mapCanvas.style.display = 'none';
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapNotice.hidden = false;
      mapNotice.innerHTML = 'Could not reach Google Maps — check your connection and reload this page.';
      mapCanvas.style.display = 'none';
    };
    document.head.appendChild(script);
  }

  boot();
})();
