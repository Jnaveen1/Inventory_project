const { getDB } = require('../db/connection');

// POST /inventory
async function createInventory(req, res) {
  try {
    const { supplier_id, product_name, quantity, price } = req.body;

    // Field presence check
    if (supplier_id === undefined || !product_name || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: 'supplier_id, product_name, quantity, and price are all required' });
    }

    // Quantity validation: must be >= 0
    if (Number(quantity) < 0) {
      return res.status(400).json({ message: 'Quantity must be 0 or more' });
    }

    // Price validation: must be > 0
    if (Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const db = await getDB();

    // Supplier existence check
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [supplier_id]);
    if (!supplier) {
      return res.status(400).json({ message: `Invalid supplier_id: no supplier found with id ${supplier_id}` });
    }

    const result = await db.run(
      'INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)',
      [supplier_id, product_name.trim(), Number(quantity), Number(price)]
    );

    return res.status(201).json({
      message: 'Inventory item created successfully',
      item: {
        id: result.lastID,
        supplier_id,
        product_name: product_name.trim(),
        quantity: Number(quantity),
        price: Number(price)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /inventory — returns all items joined with supplier info
async function getAllInventory(req, res) {
  try {
    const db = await getDB();
    const items = await db.all(`
      SELECT
        i.id,
        i.product_name,
        i.quantity,
        i.price,
        (i.quantity * i.price) AS total_value,
        s.id   AS supplier_id,
        s.name AS supplier_name,
        s.city AS supplier_city
      FROM inventory i
      JOIN suppliers s ON s.id = i.supplier_id
      ORDER BY i.id
    `);
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /inventory/grouped — grouped by supplier, sorted by total value DESC
async function getInventoryGroupedBySupplier(req, res) {
  try {
    const db = await getDB();
    const rows = await db.all(`
      SELECT
        s.id            AS supplier_id,
        s.name          AS supplier_name,
        s.city          AS supplier_city,
        COUNT(i.id)     AS total_items,
        SUM(i.quantity * i.price) AS total_inventory_value
      FROM suppliers s
      JOIN inventory i ON s.id = i.supplier_id
      GROUP BY s.id, s.name, s.city
      ORDER BY total_inventory_value DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { createInventory, getAllInventory, getInventoryGroupedBySupplier };
