const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load the updated GeoJSON with offset from 'name'
fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    let selectedLayer = null;
    const timeContainer = document.getElementById('timezone-time-container');

    function getTimeString(offset) {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const local = new Date(utc + 3600000 * offset);
      return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function clearExistingBox() {
      timeContainer.innerHTML = '';
      if (selectedLayer) {
        geojson.resetStyle(selectedLayer);
        selectedLayer = null;
      }
    }

    const geojson = L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0.2
      },
      onEachFeature: function (feature, layer) {
        const offset = feature.properties.offset;
        const zone = feature.properties.zone;

        if (zone) {
          layer.bindPopup(`Time Zone: ${zone}`);
        }

        if (typeof offset === 'number') {
          layer.on('click', function () {
            clearExistingBox();

            const timeBox = document.createElement('div');
            timeBox.className = 'timezone-box';
            timeBox.style.border = '2px solid #0077ff';
            timeBox.style.backgroundColor = '#e0f3ff';
            timeBox.innerText = `🕒 ${zone}: ${getTimeString(offset)} (UTC${offset >= 0 ? '+' : ''}${offset})`;

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

// Update Denver clock
function updateDenverClock() {
  try {
    const time = new Date().toLocaleTimeString("en-US", { timeZone: "America/Denver" });
    document.getElementById("denver-clock").textContent = time;
  } catch (e) {
    document.getElementById("denver-clock").textContent = "unsupported";
  }
}
setInterval(updateDenverClock, 1000);
updateDenverClock();
