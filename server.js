const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files (HTML, CSS, JS, GeoJSON, etc.)
app.use(express.static(__dirname));

// Fallback: always return index.html for unknown paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌍 Server running on http://localhost:${PORT}`);
});
