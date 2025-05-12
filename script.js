document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let timezoneLayers = [];
  const selectedZones = new Set();

  fetch('timezones_cleaned.geojson')
    .then(response => {
      if (!response.ok) throw new Error("Failed to load GeoJSON");
      return response.json();
    })
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

              layer.on('click', () => {
                const zoneId = feature.properties.zone.replace(/[^a-zA-Z0-9]/g, '_');
                const color = layer.options.fillColor || '#555';

                if (selectedZones.has(zoneId)) {
                  selectedZones.delete(zoneId);
                  layer.setStyle({ fillOpacity: 0.2, weight: 1 });

                  const badge = document.getElementById(`zone-badge-${zoneId}`);
                  if (badge) badge.remove();
                } else {
                  selectedZones.add(zoneId);
                  layer.setStyle({ fillOpacity: 0.6, weight: 3 });

                  const badge = document.createElement('div');
                  badge.textContent = feature.properties.zone;
                  badge.id = `zone-badge-${zoneId}`;
                  badge.style.background = color;
                  badge.style.color = '#fff';
                  badge.style.padding = '4px 8px';
                  badge.style.margin = '4px';
                  badge.style.borderRadius = '4px';
                  badge.style.fontSize = '0.9em';
                  badge.style.display = 'inline-block';

                  document.getElementById('zone-badge-container')?.appendChild(badge);
                }
              });
            }
          }
        });

        timezoneLayers.push(layer);
      });

      if (document.getElementById('timezone-checkbox')?.checked) {
        timezoneLayers.forEach(l => l.addTo(map));
      }
    })
    .catch(err => console.error("Error loading GeoJSON:", err));

  document.getElementById('timezone-checkbox')?.addEventListener('change', e => {
    timezoneLayers.forEach(layer => {
      e.target.checked ? layer.addTo(map) : map.removeLayer(layer);
    });
  });

  const firmsLayer = L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires?', {
    layers: 'fires_viirs_24',
    format: 'image/png',
    transparent: true,
    attribution: 'NASA FIRMS',
    MAP_KEY: '98816b6dadda86b7a77d0477889142db'
  });
  firmsLayer.setOpacity(0);
  firmsLayer.addTo(map);

  document.getElementById('firms-checkbox')?.addEventListener('change', e => {
    firmsLayer.setOpacity(e.target.checked ? 1 : 0);
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
    if (!el) {
      console.warn(`Clock element "${elementId}" not found`);
      return;
    }
    function update() {
      try {
        const now = new Date().toLocaleString("en-US", { timeZone });
        el.textContent = new Date(now).toLocaleTimeString();
      } catch (e) {
        el.textContent = "unsupported";
      }
    }
    update();
    setInterval(update, 1000);
  }

  updateClock('denver-clock', 'America/Denver');
});
