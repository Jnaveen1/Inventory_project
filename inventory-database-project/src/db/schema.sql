-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL,
  city TEXT    NOT NULL
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id  INTEGER NOT NULL,
  product_name TEXT    NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity >= 0),
  price        REAL    NOT NULL CHECK (price > 0),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Index for faster lookups by supplier
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);
