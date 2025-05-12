const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer;

fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    const wrappedFeatures = [];

    const offsets = [-720, -360, 0, 360, 720];

    data.features.forEach(feature => {
      offsets.forEach(offset => {
        const shifted = JSON.parse(JSON.stringify(feature));
        shiftLongitude(shifted, offset);
        wrappedFeatures.push(shifted);
      });
    });

    const wrappedGeoJSON = {
      type: "FeatureCollection",
      features: wrappedFeatures
    };

    timezoneLayer = L.geoJSON(wrappedGeoJSON, {
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

    if (document.getElementById('timezone-checkbox').checked) {
      timezoneLayer.addTo(map);
    }
  });

document.getElementById('timezone-checkbox').addEventListener('change', e => {
  if (timezoneLayer) {
    e.target.checked ? timezoneLayer.addTo(map) : map.removeLayer(timezoneLayer);
  }
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
