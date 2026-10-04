const Database = require("better-sqlite3");

const db = new Database("canteen.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
        item_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        stock INTEGER NOT NULL,
        low_stock_limit INTEGER NOT NULL
    );
`);

const inventoryCount = db.prepare(`
    SELECT COUNT(*) AS count FROM inventory
`).get();

if (inventoryCount.count === 0) {
    const insertInventory = db.prepare(`
        INSERT INTO inventory
        (item_id, name, stock, low_stock_limit)
        VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction(() => {
        insertInventory.run(1, "Chicken Biryani", 20, 5);
        insertInventory.run(2, "Veg Fried Rice", 20, 5);
        insertInventory.run(3, "Chicken Sandwich", 20, 5);
        insertInventory.run(4, "Cold Coffee", 20, 5);
        insertInventory.run(5, "Samosa", 30, 8);
        insertInventory.run(6, "French Fries", 20, 5);
    });

    insertMany();
}

module.exports = db;