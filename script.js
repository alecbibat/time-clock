const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('')
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
