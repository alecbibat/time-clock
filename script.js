const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0.2
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.zone) {
          layer.bindPopup(`Time Zone: ${feature.properties.zone}`);
        }
      }
    }).addTo(map);
  });

function updateClock(elementId, timeZone) {
  const el = document.getElementById(elementId);
  if (!el) return;
  function update() {
    const now = new Date().toLocaleString("en-US", { timeZone });
    el.textContent = new Date(now).toLocaleTimeString();
  }
  update();
  setInterval(update, 1000);
}

updateClock('denver-clock', 'America/Denver');
