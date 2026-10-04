
const Database = require("better-sqlite3");

const db = new Database("canteen.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
`);

module.exports = db;