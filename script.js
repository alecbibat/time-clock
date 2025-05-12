document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let timezoneLayers = [];
  const activeZones = new Map();

  const zoneTimesContainer = document.createElement('div');
  zoneTimesContainer.id = 'zone-times';
  document.body.appendChild(zoneTimesContainer);

  fetch('timezones_cleaned.geojson')
    .then(response => {
      if (!response.ok) throw new Error("Failed to load GeoJSON");
      return response.json();
    })
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
            const zone = feature.properties?.zone;
            if (!zone) return;

            layer.on('click', () => toggleZone(layer, zone));
            layer.bindPopup(`Time Zone: ${zone}`);
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
    if (!el) return;
    function update() {
      try {
        const now = new Date().toLocaleString("en-US", { timeZone });
        el.textContent = new Date(now).toLocaleTimeString();
      } catch {
        el.textContent = "unsupported";
      }
    }
    update();
    setInterval(update, 1000);
  }

  updateClock('denver-clock', 'America/Denver');

  // Time zone color lookup
  const colorLookup = {};
  for (const z of timeZones) {
    colorLookup[z.name] = z.color;
  }

  function toggleZone(layer, zone) {
    if (activeZones.has(zone)) {
      map.removeLayer(activeZones.get(zone).layer);
      clearInterval(activeZones.get(zone).interval);
      document.getElementById(`tzbox-${cssSafe(zone)}`)?.remove();
      activeZones.delete(zone);
    } else {
      layer.setStyle({ color: '#000', weight: 2, fillOpacity: 0.5 });

      const color = colorLookup[zone] || '#ccc';

      const box = document.createElement('div');
      box.className = 'timezone-box';
      box.style.backgroundColor = color;
      box.id = `tzbox-${cssSafe(zone)}`;
      box.innerHTML = `<div><strong>${zone}</strong></div><div id="clock-${cssSafe(zone)}">Loading...</div>`;
      zoneTimesContainer.appendChild(box);

      const interval = setInterval(() => {
        try {
          const now = new Date().toLocaleString("en-US", { timeZone: zone });
          document.getElementById(`clock-${cssSafe(zone)}`).textContent = new Date(now).toLocaleTimeString();
        } catch {
          document.getElementById(`clock-${cssSafe(zone)}`).textContent = "unsupported";
        }
      }, 1000);

      activeZones.set(zone, { layer, interval });
    }
  }

  function cssSafe(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
  }
});
