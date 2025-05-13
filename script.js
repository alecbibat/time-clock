const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer, firmsLayer, radarLayer;
let alertLayers = L.layerGroup().addTo(map);
const selectedZones = [];
const timeContainer = document.getElementById('timezone-time-container');

const zoneColors = [
  '#0077ff', '#00aa55', '#cc4400', '#aa00aa', '#008899',
  '#cc0077', '#ffaa00', '#0066cc', '#00ccaa', '#9933ff'
];
let colorIndex = 0;

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
}

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

// UI Toggles
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
    firmsLayer = L.tileLayer.wms(
      'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires?MAP_KEY=98816b6dadda86b7a77d0477889142db', {
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

// Weather Alert Fetch + Mapping
async function fetchWeatherAlerts() {
  try {
    const response = await fetch("https://api.weather.gov/alerts/active");
    const data = await response.json();

    const alerts = data.features.map(feature => {
      const props = feature.properties;
      return {
        headline: props.headline,
        description: props.description,
        areaDesc: props.areaDesc,
        severity: props.severity,
        urgency: props.urgency,
        event: props.event,
        expires: props.expires,
        geometry: feature.geometry
      };
    });

    displayAlerts(alerts);
  } catch (error) {
    console.error("Error fetching weather alerts:", error);
    document.getElementById("alert-feed").innerText = "⚠️ Unable to load alerts.";
  }
}

function displayAlerts(alerts) {
  const container = document.getElementById("alert-feed");
  container.innerHTML = '';
  alertLayers.clearLayers();

  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const validAlerts = alerts.filter(alert => {
    const expires = new Date(alert.expires || alert.ends || alert.onset || 0);
    return expires <= cutoff;
  });

  if (validAlerts.length === 0) {
    container.innerHTML = '<p>No active alerts in the next 24 hours.</p>';
    return;
  }

  validAlerts.forEach(alert => {
    const alertDiv = document.createElement("div");
    alertDiv.classList.add("weather-alert");
    alertDiv.innerHTML = `
      <h3>${alert.event}</h3>
      <p><strong>Urgency:</strong> ${alert.urgency}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p>${alert.headline}</p>
      <p>${alert.description}</p>
      <p><em>Area: ${alert.areaDesc}</em></p>
    `;
    container.appendChild(alertDiv);

    if (alert.geometry) {
      const layer = L.geoJSON(alert.geometry, {
        style: {
          color: '#ff0000',
          weight: 2,
          fillOpacity: 0.2
        }
      }).bindPopup(`${alert.event}<br>${alert.headline}`);
      alertLayers.addLayer(layer);
    }
  });
}

fetchWeatherAlerts();
setInterval(fetchWeatherAlerts, 60000);

document.getElementById("last-updated").innerText =
  "Last updated: " + new Date().toLocaleTimeString();
