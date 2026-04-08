const { getDB } = require('../db/connection');

// POST /supplier
async function createSupplier(req, res) {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: 'name and city are required' });
    }

    const db = await getDB();
    const result = await db.run(
      'INSERT INTO suppliers (name, city) VALUES (?, ?)',
      [name.trim(), city.trim()]
    );

    return res.status(201).json({
      message: 'Supplier created successfully',
      supplier: { id: result.lastID, name: name.trim(), city: city.trim() }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /supplier
async function getAllSuppliers(req, res) {
  try {
    const db = await getDB();
    const suppliers = await db.all('SELECT * FROM suppliers ORDER BY id');
    return res.json(suppliers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { createSupplier, getAllSuppliers };
