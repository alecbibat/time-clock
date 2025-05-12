const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    const wrappedFeatures = [];

    data.features.forEach(feature => {
      // Original feature
      wrappedFeatures.push(feature);

      // Clone with shifted longitudes: -360 and +360
      const shiftedLeft = JSON.parse(JSON.stringify(feature));
      const shiftedRight = JSON.parse(JSON.stringify(feature));

      shiftLongitude(shiftedLeft, -360);
      shiftLongitude(shiftedRight, 360);

      wrappedFeatures.push(shiftedLeft, shiftedRight);
    });

    const wrappedGeoJSON = {
      type: "FeatureCollection",
      features: wrappedFeatures
    };

    L.geoJSON(wrappedGeoJSON, {
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
    }).addTo(map);
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
