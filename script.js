const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer, firmsLayer, radarLayer;
const selectedZones = [];
const timeContainer = document.getElementById('timezone-time-container');

// Colors to cycle through for highlighting
const zoneColors = [
  '#0077ff', '#00aa55', '#cc4400', '#aa00aa', '#008899',
  '#cc0077', '#ffaa00', '#0066cc', '#00ccaa', '#9933ff'
];
let colorIndex = 0;

// Load timezones with IANA zone data
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
            // If already selected, remove
            const existing = selectedZones.find(z => z.layer === layer);
            if (existing) {
              timezoneLayer.resetStyle(layer);
              timeContainer.removeChild(existing.box);
              selectedZones.splice(selectedZones.indexOf(existing), 1);
              if (selectedZones.length === 0) clearAllBtn.style.display = "none";
              return;
            }

            const color = zoneColors[colorIndex % zoneColors.length];
            colorIndex++;

            const timeBox = document.createElement('div');
            timeBox.className = 'timezone-box';
            timeBox.style.border = `2px solid ${color}`;
            timeBox.style.backgroundColor = `${color}20`;

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

            clearAllBtn.style.display = "inline-block";
            updateClock(clockEl, zoneName);
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

setInterval(() => {
  for (const z of selectedZones) {
    updateClock(z.clockEl, z.zone);
  }
  updateDenverClock();
}, 1000);

function updateDenverClock() {
  try {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/Denver" });
    document.getElementById("denver-clock").textContent = time;
  } catch {
    document.getElementById("denver-clock").textContent = "unsupported";
  }
}
updateDenverClock();

// Layer toggle menu
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

// Add "Clear All" button and manage it
const clearAllBtn = document.createElement('button');
clearAllBtn.textContent = "Clear All";
clearAllBtn.style.padding = "10px 20px";
clearAllBtn.style.border = "none";
clearAllBtn.style.borderRadius = "5px";
clearAllBtn.style.background = "#ff5555";
clearAllBtn.style.color = "#fff";
clearAllBtn.style.fontWeight = "bold";
clearAllBtn.style.cursor = "pointer";
clearAllBtn.style.display = "none";
clearAllBtn.style.marginBottom = "10px";

clearAllBtn.addEventListener('click', () => {
  selectedZones.forEach(z => {
    timezoneLayer.resetStyle(z.layer);
    timeContainer.removeChild(z.box);
  });
  selectedZones.length = 0;
  clearAllBtn.style.display = "none";
});

timeContainer.before(clearAllBtn);

// Persistent invisible box to prevent layout shift
const ghostBox = document.createElement('div');
ghostBox.className = 'timezone-box';
ghostBox.style.visibility = 'hidden';
ghostBox.style.height = '60px';
ghostBox.style.marginTop = '0';
timeContainer.appendChild(ghostBox);
