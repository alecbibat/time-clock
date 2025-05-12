const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer, firmsLayer, radarLayer;
const timeContainer = document.getElementById('timezone-time-container');

const selectedZones = []; // array of { layer, zone, clockEl, color }

// Predefined colors to cycle through
const zoneColors = [
  '#0077ff', '#00aa55', '#cc4400', '#aa00aa', '#008899',
  '#cc0077', '#ffaa00', '#0066cc', '#00ccaa', '#9933ff'
];

let colorIndex = 0;

// Load GeoJSON with IANA time zones
fetch('timezones_wVVG8_with_iana.geojson')
  .then(res => res.json())
  .then(data => {
    timezoneLayer = L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0.2
      },
      onEachFeature: function (feature, layer) {
        const zoneName = feature.properties.ianaZone;
        const label = feature.properties.zone;

        if (label) {
          layer.bindPopup(`Time Zone: ${label}`);
        }

        if (zoneName) {
          layer.on('click', function () {
            // Check if already selected
            const existing = selectedZones.find(z => z.layer === layer);
            if (existing) {
              timezoneLayer.resetStyle(layer);
              timeContainer.removeChild(existing.box);
              selectedZones.splice(selectedZones.indexOf(existing), 1);
              return;
            }

            const color = zoneColors[colorIndex % zoneColors.length];
            colorIndex++;

            const timeBox = document.createElement('div');
            timeBox.className = 'timezone-box';
            timeBox.style.border = `2px solid ${color}`;
            timeBox.style.backgroundColor = `${color}20`; // transparent fill

            const labelEl = document.createElement('div');
            labelEl.innerText = `🕒 ${label}`;

            const clockEl = document.createElement('div');
            clockEl.style.fontSize = '1.2em';
            clockEl.style.marginTop = '4px';

            timeBox.appendChild(labelEl);
            timeBox.appendChild(clockEl);
            timeContainer.appendChild(timeBox);

            layer.setStyle({
              color: color,
              weight: 2,
              fillOpacity: 0.5
            });

            selectedZones.push({
              layer: layer,
              zone: zoneName,
              clockEl: clockEl,
              box: timeBox
            });

            updateClock(clockEl, zoneName); // immediate update
          });
        }
      }
    }).addTo(map);
  });

function updateClock(el, zone) {
  try {
    const time = new Date().toLocaleTimeString([], { timeZone: zone });
    el.textContent = time;
  } catch {
    el.textContent = 'unsupported';
  }
}

// Update all clocks every second
setInterval(() => {
  for (const z of selectedZones) {
    updateClock(z.clockEl, z.zone);
  }
  updateDenverClock();
}, 1000);

// Denver clock
function updateDenverClock() {
  try {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/Denver" });
    document.getElementById("denver-clock").textContent = time;
  } catch {
    document.getElementById("denver-clock").textContent = "unsupported";
  }
}
updateDenverClock();

// Layer toggle menu logic
document.getElementById('menu-toggle').addEventListener('click', () => {
  const menu = document.getElementById('overlay-menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('toggle-timezones').addEventListener('change', e => {
  if (timezoneLayer) {
    e.target.checked ? timezoneLayer.addTo(map) : map.removeLayer(timezoneLayer);
  }
});

document.getElementById('toggle-firms').addEventListener('change', e => {
  if (!firmsLayer) {
    firmsLayer = L.tileLayer.wms('https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires', {
      layers: 'fires_viirs_24',
      format: 'image/png',
      transparent: true,
      attribution: 'NASA FIRMS'
    });
  }
  e.target.checked ? firmsLayer.addTo(map) : map.removeLayer(firmsLayer);
});

document.getElementById('toggle-radar').addEventListener('change', e => {
  if (!radarLayer) {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        const lastFrame = data.radar?.nowcast?.slice(-1)[0];
        if (lastFrame) {
          radarLayer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${lastFrame}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0.6,
            zIndex: 999,
            attribution: '&copy; RainViewer'
          });
          if (e.target.checked) radarLayer.addTo(map);
        }
      });
  } else {
    e.target.checked ? radarLayer.addTo(map) : map.removeLayer(radarLayer);
  }
});
