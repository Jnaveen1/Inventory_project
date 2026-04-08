# Inventory System — Part A & Part B

---

## Part A: Inventory Search API + UI

### Overview

A search system that lets buyers filter surplus products by name, category, and price using a REST API and a browser-based UI.

---

### How to Run

```bash
cd inventory-search-project/backend
npm install
npm start
# Open http://localhost:3000 in your browser
```

---

### Search Logic

The `GET /search` endpoint accepts four optional query parameters:

| Parameter  | Type   | Description                     |
|------------|--------|---------------------------------|
| `q`        | string | Partial product name match      |
| `category` | string | Exact category match            |
| `minPrice` | number | Minimum price (inclusive)       |
| `maxPrice` | number | Maximum price (inclusive)       |

Filters are applied in sequence — name → category → minPrice → maxPrice. Only records matching **all** supplied filters are returned. If no filters are provided, all items are returned.

#### Case-insensitive search

Product name search converts both the query string and each product name to lowercase before comparing:

```js
item.productName.toLowerCase().includes(q.toLowerCase())
```

This ensures searches like `Chair`, `chair`, or `CHAIR` all return the same results.

#### Edge cases handled

- **Empty `q`**: Ignored — all items pass the name filter.
- **Invalid price range** (`minPrice > maxPrice`): Returns `400 Bad Request` with a descriptive message.
- **No matches**: Returns an empty array; the UI displays "No results found".

---

### API Examples

```
GET /search                                   → all 15 items
GET /search?q=chair                           → items with "chair" in name
GET /search?category=Electronics              → electronics only
GET /search?minPrice=50&maxPrice=200          → items priced 50–200
GET /search?q=desk&category=Furniture&maxPrice=400
```

---

### Performance Improvement (for large datasets)

For 10–15 records, an in-memory JSON array is fast enough. For thousands of records, the following improvements would help:

1. **Move data to a database** (SQLite or PostgreSQL) and add full-text search index on `product_name`.
2. **Debounce frontend input** so the API is not called on every keystroke.
3. **Add pagination** (`page` and `limit` params) to avoid returning thousands of rows at once.
4. **Caching** — cache frequent searches in memory with a short TTL (e.g. 30 seconds).

---

---

## Part B: Inventory Database + APIs

### Overview

A database-backed inventory system with supplier management, inventory CRUD, validation, and a grouped summary query.

---

### How to Run

```bash
cd inventory-database-project
npm install
npm start
# API running at http://localhost:4000
```

The SQLite database file (`inventory.db`) is created automatically on first run.

---

### Database Schema

#### `suppliers`

| Column | Type    | Notes           |
|--------|---------|-----------------|
| id     | INTEGER | Primary key, auto-increment |
| name   | TEXT    | Not null        |
| city   | TEXT    | Not null        |

#### `inventory`

| Column       | Type    | Notes                        |
|--------------|---------|------------------------------|
| id           | INTEGER | Primary key, auto-increment  |
| supplier_id  | INTEGER | Foreign key → suppliers(id)  |
| product_name | TEXT    | Not null                     |
| quantity     | INTEGER | Must be >= 0                 |
| price        | REAL    | Must be > 0                  |

**Relationship:** One supplier → many inventory items.

---

### API Endpoints

#### `POST /supplier`

Create a new supplier.

```json
// Request body
{ "name": "ABC Traders", "city": "Mumbai" }

// Response 201
{ "message": "Supplier created successfully", "supplier": { "id": 1, "name": "ABC Traders", "city": "Mumbai" } }
```

#### `GET /supplier`

Returns all suppliers.

#### `POST /inventory`

Add an inventory item.

```json
// Request body
{ "supplier_id": 1, "product_name": "Office Chair", "quantity": 50, "price": 120.00 }

// Response 201
{ "message": "Inventory item created successfully", "item": { ... } }
```

**Validation errors returned as `400 Bad Request`:**
- Missing fields
- `quantity < 0` → `"Quantity must be 0 or more"`
- `price <= 0` → `"Price must be greater than 0"`
- Non-existent `supplier_id` → `"Invalid supplier_id"`

#### `GET /inventory`

Returns all inventory items joined with supplier info.

#### `GET /inventory/grouped`

Returns inventory grouped by supplier, sorted by total inventory value descending.

```json
// Example response
[
  { "supplier_id": 1, "supplier_name": "ABC Traders", "total_items": 3, "total_inventory_value": 28500 },
  { "supplier_id": 2, "supplier_name": "TechSupply",  "total_items": 5, "total_inventory_value": 14200 }
]
```

**SQL used:**
```sql
SELECT
  s.id, s.name,
  COUNT(i.id) AS total_items,
  SUM(i.quantity * i.price) AS total_inventory_value
FROM suppliers s
JOIN inventory i ON s.id = i.supplier_id
GROUP BY s.id, s.name
ORDER BY total_inventory_value DESC;
```

---

### Why SQL (SQLite)?

SQL was chosen because:
- The supplier-to-inventory relationship is structured and maps naturally to relational tables with a foreign key.
- SQL makes the grouped-by-supplier query straightforward with `GROUP BY` and `SUM()`.
- SQLite requires zero setup — no separate server process needed.

---

### Optimization Suggestion

An index on `supplier_id` in the `inventory` table is already included in the schema:

```sql
CREATE INDEX idx_inventory_supplier_id ON inventory(supplier_id);
```

This speeds up the `JOIN` in the grouped query significantly as the inventory table grows, because SQLite can locate matching rows by supplier without scanning the entire table.

Additional improvements for scale:
- **Pagination** on `GET /inventory` to avoid loading thousands of rows.
- **Composite index** on `(supplier_id, price)` if price-range queries are added later.

---

### Postman Testing Checklist

| Test Case                        | Expected Result              |
|----------------------------------|------------------------------|
| `POST /supplier` with valid data | 201 + supplier object        |
| `POST /inventory` valid data     | 201 + item object            |
| `POST /inventory` bad supplier   | 400 Invalid supplier_id      |
| `POST /inventory` quantity = -1  | 400 Quantity must be 0+      |
| `POST /inventory` price = 0      | 400 Price must be > 0        |
| `GET /inventory`                 | Array of all items           |
| `GET /inventory/grouped`         | Grouped array, sorted by value |
