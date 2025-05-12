document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Timezone layer handling
  let timezoneLayers = [];

  fetch('timezones_cleaned.geojson')
    .then(response => response.json())
    .then(data => {
      console.log("Loaded GeoJSON features:", data.features.length);

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

  // FIRMS fire layer handling with API key
  const firmsLayer = L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires?', {
    layers: 'fires_viirs_24',
    format: 'image/png',
    transparent: true,
    attribution: 'NASA FIRMS',
    MAP_KEY: '98816b6dadda86b7a77d0477889142db'
  });
  firmsLayer.setOpacity(0);
  firmsLayer.addTo(map);

  document.getElementById('firms-checkbox').addEventListener('change', e => {
    firmsLayer.setOpacity(e.target.checked ? 1 : 0);
  });

  // Helper to shift longitude
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

  // Clock updater
  function updateClock(elementId, timeZone) {
    const el = document.getElementById(elementId);
    if (!el) return;
    function update() {
      const now = new Date
