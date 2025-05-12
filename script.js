const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let timezoneLayer, firmsLayer, radarLayer;
let selectedLayer = null;
const timeContainer = document.getElementById('timezone-time-container');

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
            if (selectedLayer === layer) {
              timeContainer.innerHTML = '';
              timezoneLayer.resetStyle(layer);
              selectedLayer = null;
              return;
            }

            timeContainer.innerHTML = '';
            if (selectedLayer) {
              timezoneLayer.resetStyle(selectedLayer);
            }

            const now = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: zoneName
            });

            const timeBox = document.createElement('div');
            timeBox.className = 'timezone-box';
            timeBox.style.border = '2px solid #0077ff';
            timeBox.style.backgroundColor = '#e0f3ff';
            timeBox.innerText = `🕒 ${label}: ${now}`;

            timeContainer.appendChild(timeBox);
            selectedLayer = layer;
            layer.setStyle({
              color: '#0077ff',
              weight: 2,
              fillOpacity: 0.5
            });
          });
        }
      }
    }).addTo(map);
  });

// Denver clock (with DST)
function updateDenverClock() {
  try {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/Denver" });
    document.getElementById("denver-clock").textContent = time;
  } catch {
    document.getElementById("denver-clock").textContent = "unsupported";
  }
}
setInterval(updateDenverClock, 1000);
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
