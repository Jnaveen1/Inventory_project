const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db;

async function getDB() {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, 'inventory.db'),
    driver: sqlite3.Database
  });

  // Enable foreign key enforcement
  await db.run('PRAGMA foreign_keys = ON');

  // Load and run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.exec(schema);

  return db;
}

module.exports = { getDB };
