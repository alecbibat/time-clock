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
          style: function (feature) {
            const baseColor = feature.properties?.color || "#5c5cff";
            return {
              color: "#333",
              weight: 1,
              fillOpacity: 0.2,
              fillColor: baseColor
            };
          },
          onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.zone) {
              const zoneName = feature.properties.zone;
              const color = feature.properties.color || "#5c5cff";

              layer.bindPopup(`Time Zone: ${zoneName}`);

              layer.on("click", () => {
                const safeId = zoneName.replace(/[^a-zA-Z0-9]/g, "_");

                if (selectedZones.has(safeId)) {
                  selectedZones.delete(safeId);
                  layer.setStyle({ fillOpacity: 0.2, weight: 1 });
                  document.getElementById(`zone-badge-${safeId}`)?.remove();
                } else {
                  selectedZones.add(safeId);
                  layer.setStyle({ fillOpacity: 0.6, weight: 3 });

                  const badge = document.createElement("div");
                  badge.id = `zone-badge-${safeId}`;
                  badge.textContent = zoneName;
                  badge.style.background = color;
                  badge.style.color = "#fff";
                  badge.style.padding = "4px 8px";
                  badge.style.margin = "4px";
                  badge.style.borderRadius = "4px";
                  badge.style.fontSize = "0.9em";
                  badge.style.display = "inline-block";

                  document.getElementById("zone-badge-container")?.appendChild(badge);
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
