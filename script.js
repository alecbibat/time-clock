const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer, firmsLayer, radarLayer;
const selectedZones = [];
const timeContainer = document.getElementById('timezone-time-container');

// Highlight color palette
const zoneColors = [
  '#0077ff', '#00aa55', '#cc4400', '#aa00aa', '#008899',
  '#cc0077', '#ffaa00', '#0066cc', '#00ccaa', '#9933ff'
];
let colorIndex = 0;

// Predefined major timezones
const majorZones = [
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney'
];

let geoData = null;

// Load timezone data
fetch('timezones_wVVG8_with_iana.geojson')
  .then(res => res.json())
  .then(data => {
    geoData = data;
    timezoneLayer = L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0.2
      },
      onEachFeature: function (feature, layer) {
        const zoneName = feature.properties.ianaZone;
        const label = feature.properties.zone;

        if (zoneName) {
          layer.bindPopup(`Time Zone: ${label}`);
          layer.on('click', () => handleZoneClick(layer, zoneName, label));
        }
      }
    }).addTo(map);
  });

function handleZoneClick(layer, zoneName, label) {
  const existing = selectedZones.find(z => z.layer === layer);
  if (existing) {
    timezoneLayer.resetStyle(layer);
    timeContainer.removeChild(existing.box);
    selectedZones.splice(selectedZones.indexOf(existing), 1);
    if (selectedZones.length === 0) toggleButtonToShow();
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

  updateClock(clockEl, zoneName);
  toggleButtonToClear();
}

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

function updateDenverClock() {
  try {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/Denver" });
    document.getElementById("denver-clock").textContent = time;
  } catch {
    document.getElementById("denver-clock").textContent = "unsupported";
  }
}
updateDenverClock();

// Layer toggle UI
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

// Create the dual-purpose button
const actionButton = document.createElement('button');
actionButton.textContent = "Show 7 Major Time Zones";
Object.assign(actionButton.style, {
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  background: "#0077ff",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "10px"
});
timeContainer.before(actionButton);

// Invisible ghost box for layout spacing
const ghostBox = document.createElement('div');
ghostBox.className = 'timezone-box';
ghostBox.style.visibility = 'hidden';
ghostBox.style.height = '60px';
ghostBox.style.marginTop = '0';
timeContainer.appendChild(ghostBox);

// Mode switchers
function toggleButtonToClear() {
  actionButton.textContent = "Clear All";
  actionButton.onclick = () => {
    selectedZones.forEach(z => {
      timezoneLayer.resetStyle(z.layer);
      timeContainer.removeChild(z.box);
    });
    selectedZones.length = 0;
    ghostBox.style.display = 'block';
    toggleButtonToShow();
  };
  ghostBox.style.display = 'none';
}

function toggleButtonToShow() {
  actionButton.textContent = "Show 7 Major Time Zones";
  actionButton.onclick = () => {
    if (!geoData) return;
    const matches = geoData.features.filter(f =>
      majorZones.includes(f.properties.ianaZone)
    );
    matches.forEach(f => {
      const matchingLayer = timezoneLayer.getLayers().find(l =>
        l.feature === f
      );
      if (matchingLayer) {
        handleZoneClick(matchingLayer, f.properties.ianaZone, f.properties.zone);
      }
    });
  };
  ghostBox.style.display = 'block';
}

// Initialize default mode
toggleButtonToShow();
