const express = require('express');
const { getDB } = require('./db/connection');
const supplierRoutes = require('./routes/supplierRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();
const PORT = 4000;

app.use(express.json());

// Routes
app.use('/supplier', supplierRoutes);
app.use('/inventory', inventoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Inventory Database API is running' });
});

// Initialize DB then start server
getDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Inventory Database API running at http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  POST /supplier');
      console.log('  GET  /supplier');
      console.log('  POST /inventory');
      console.log('  GET  /inventory');
      console.log('  GET  /inventory/grouped');
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
