const express = require('express');
const path = require('path');
const app = express();

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Frontend is available at http://localhost:${PORT}/en/index.html`);
});