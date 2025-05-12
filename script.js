let timezoneLayer;

fetch('timezones_wVVG8.geojson')
  .then(response => response.json())
  .then(data => {
    const wrappedFeatures = [];

    data.features.forEach(feature => {
      wrappedFeatures.push(feature);
      const shiftedLeft = JSON.parse(JSON.stringify(feature));
      const shiftedRight = JSON.parse(JSON.stringify(feature));
      shiftLongitude(shiftedLeft, -360);
      shiftLongitude(shiftedRight, 360);
      wrappedFeatures.push(shiftedLeft, shiftedRight);
    });

    timezoneLayer = L.geoJSON({ type: "FeatureCollection", features: wrappedFeatures }, {
      style: { color: '#555', weight: 1, fillOpacity: 0.2 },
      onEachFeature: (feature, layer) => {
        if (feature.properties?.zone) {
          layer.bindPopup(`Time Zone: ${feature.properties.zone}`);
        }
      }
    });

    if (document.getElementById('timezone-checkbox').checked) {
      timezoneLayer.addTo(map);
    }
  });

document.getElementById('timezone-checkbox').addEventListener('change', e => {
  if (timezoneLayer) {
    e.target.checked ? timezoneLayer.addTo(map) : map.removeLayer(timezoneLayer);
  }
});
