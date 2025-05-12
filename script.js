const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayers = [];

fetch('timezones_cleaned.geojson')
  .then(response => response.json())
  .then(data => {
    const offsets = [-360, 0, 360];

    offsets.forEach(offset => {
      const shiftedFeatures = data.features.map(feature => {
        const shifted = JSON.parse(JSON.stringify(feature));
        shiftLongitude(shifted, offset);
        return shifted;
      });

      const layer = L.geoJSON({ type: 'FeatureCollection', features: shiftedFeatures }, {
        style: {
          color: '#555',
          weight: 1,
          fillOpacity: 0.2
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.zone) {
            layer.bindPopup(`Time Zone: ${feature.properties.zone}`);
          }
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

function shiftLongitude(feature, offset) {
  function shiftCoords(coords) {
    return coords.map(coord => {
      if (Array.isArray(coord[0])) {
        return shiftCoords(coord);
      } else {
        return [coord[0] + offset, coord[1]];
      }
    });
  }

  if (feature.geometry && feature.geometry.coordinates) {
    feature.geometry.coordinates = shiftCoords(feature.geometry.coordinates);
  }
}

function updateClock(elementId, timeZone) {
  const el = document.getElementById(elementId);
  if (!el) return;
  function update() {
    const now = new Date().toLocaleString("en-US", { timeZone });
    el.textContent = new Date(now).toLocaleTimeString();
  }
  update();
  setInterval(update, 1000);
}

updateClock('denver-clock', 'America/Denver');
