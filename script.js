document.addEventListener("DOMContentLoaded", () => {
  const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let timezoneLayers = [];

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
            const tzid = feature.properties.tzid;
            const color = getColorForZone(tzid);
            layer.setStyle({ fillColor: color });
            layer.on('click', () => {
              selectedZones[tzid] = layer;
              createTimeBox(tzid, color);
            });
          }
        }).addTo(map);

        timezoneLayers.push(layer);
      });
    });

  function shiftLongitude(feature, offset) {
    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(ring =>
        ring.map(coord => [coord[0] + offset, coord[1]])
      );
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(polygon =>
        polygon.map(ring => ring.map(coord => [coord[0] + offset, coord[1]]))
      );
    }
  }

  function updateDenverTime() {
    const denverTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    document.getElementById('denver-clock').textContent = denverTime;
  }

  setInterval(updateDenverTime, 1000);
  updateDenverTime();

  // Toggle overlays
  document.getElementById("toggle-timezones").addEventListener("change", function () {
    timezoneLayers.forEach(layer => {
      if (this.checked) {
        map.addLayer(layer);
      } else {
        map.removeLayer(layer);
      }
    });
  });
});

// -------- Overlay Click Behavior and Time Box Logic --------
let selectedZones = {};

function getTimeInZone(tzid) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tzid,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function createTimeBox(tzid, color) {
  const container = document.getElementById("time-zone-times");
  const boxId = `time-box-${tzid.replace(/[\\/]/g, '-')}`;

  if (selectedZones[tzid]) {
    document.getElementById(boxId)?.remove();
    selectedZones[tzid].setStyle({ fillOpacity: 0.2 });
    delete selectedZones[tzid];
    return;
  }

  const box = document.createElement("div");
  box.className = "time-box";
  box.id = boxId;
  box.style.backgroundColor = color;
  box.style.padding = "10px";
  box.style.marginBottom = "5px";
  box.style.borderRadius = "6px";
  box.style.color = "white";
  box.style.whiteSpace = "pre-line";
  box.innerText = `${tzid}\n${getTimeInZone(tzid)}`;
  container.appendChild(box);

  selectedZones[tzid].setStyle({ fillOpacity: 0.6 });

  box.interval = setInterval(() => {
    box.innerText = `${tzid}\n${getTimeInZone(tzid)}`;
  }, 1000);
}

// Optional: use consistent color per tzid
function getColorForZone(tzid) {
  let hash = 0;
  for (let i = 0; i < tzid.length; i++) {
    hash = tzid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 60%, 50%)`;
}
