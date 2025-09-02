const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));

// ✅ Use a different port to avoid conflict
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Frontend running: http://localhost:${PORT}/en/index.html`);
});