document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let timezoneLayers = [];
  const zoneBoxes = new Map();
  const zoneColors = {};
  timeZones.forEach(z => zoneColors[z.name] = z.color);
  const zoneTimesContainer = document.getElementById('zone-times');

  fetch('timezones_cleaned.geojson')
    .then(res => res.json())
    .then(data => {
      const offsets = [-360, 0, 360];

      offsets.forEach(offset => {
        const shiftedFeatures = data.features.map(f => {
          const copy = JSON.parse(JSON.stringify(f));
          shiftLongitude(copy, offset);
          return copy;
        });

        const layer = L.geoJSON({ type: 'FeatureCollection', features: shiftedFeatures }, {
          style: { color: '#555', weight: 1, fillOpacity: 0.2 },
          onEachFeature: (feature, layer) => {
            const zone = feature.properties?.zone;
            const offsetHrs = feature.properties?.offset;
            if (!zone || offsetHrs === undefined) return;

            layer.on('click', () => toggleZone(layer, zone, offsetHrs));
            layer.bindPopup(`Zone: ${zone} (UTC${offsetHrs >= 0 ? '+' : ''}${offsetHrs})`);
          }
        });

        timezoneLayers.push(layer);
      });

      if (document.getElementById('timezone-checkbox').checked) {
        timezoneLayers.forEach(l => l.addTo(map));
      }
    });

  document.getElementById('timezone-checkbox').addEventListener('change', e => {
    timezoneLayers.forEach(layer => {
      e.target.checked ? layer.addTo(map) : map.removeLayer(layer);
    });
  });

  const firmsLayer = L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires?', {
    layers: 'fires_viirs_24',
    format: 'image/png',
    transparent: true,
    attribution: 'NASA FIRMS'
  });
  firmsLayer.setOpacity(0);
  firmsLayer.addTo(map);

  document.getElementById('firms-checkbox').addEventListener('change', e => {
    firmsLayer.setOpacity(e.target.checked ? 1 : 0);
  });

  function shiftLongitude(feature, offset) {
    function shiftCoords(coords) {
      return coords.map(coord => Array.isArray(coord[0]) ? shiftCoords(coord) : [coord[0] + offset, coord[1]]);
    }
    if (feature.geometry?.coordinates) {
      feature.geometry.coordinates = shiftCoords(feature.geometry.coordinates);
    }
  }

  function toggleZone(layer, zone, offsetHrs) {
    const id = zone.replace(/[^\w]/g, '_');

    if (zoneBoxes.has(id)) {
      map.removeLayer(layer);
      document.getElementById(id)?.remove();
      zoneBoxes.delete(id);
    } else {
      layer.setStyle({ color: 'black', fillOpacity: 0.4, weight: 2 });

      const box = document.createElement('div');
      box.className = 'timezone-box';
      box.id = id;
      box.style.backgroundColor = zoneColors[zone] || '#eee';
      box.innerHTML = `<strong>${zone}</strong><div>UTC${offsetHrs >= 0 ? '+' : ''}${offsetHrs}</div>`;
      zoneTimesContainer.appendChild(box);
      zoneBoxes.set(id, box);
    }
  }

  // Live update of Denver clock
  function updateClock(elId, timeZone) {
    const el = document.getElementById(elId);
    function tick() {
      const now = new Date().toLocaleString("en-US", { timeZone });
      el.textContent = new Date(now).toLocaleTimeString();
    }
    tick();
    setInterval(tick, 1000);
  }

  updateClock('denver-clock', 'America/Denver');
});
