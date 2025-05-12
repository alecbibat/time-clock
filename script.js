// Assuming this script handles loading and displaying the GeoJSON data

// This part assumes you're now using a different GeoJSON (like 'timezones_wVVG8.geojson')
// Update this line if you want to load a different file
fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: function (feature) {
        return {
          color: "#333",
          weight: 1,
          fillOpacity: 0.3
        };
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindPopup("Timezone: " + feature.properties.name);
        }
      }
    }).addTo(map);
  })
  .catch(err => console.error('Failed to load GeoJSON:', err));
