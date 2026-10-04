const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "CanteenSync Backend is running!"
    });
});

app.get("/api/menu", (req, res) => {
    res.json([
        {
            id: 1,
            name: "Chicken Biryani",
            price: 120,
            stall: "Main Stall"
        },
        {
            id: 2,
            name: "Veg Fried Rice",
            price: 80,
            stall: "Main Stall"
        },
        {
            id: 3,
            name: "Chicken Sandwich",
            price: 70,
            stall: "Cafe"
        },
        {
            id: 4,
            name: "Cold Coffee",
            price: 60,
            stall: "Cafe"
        }
    ]);
});

app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
        SELECT * FROM orders
        ORDER BY id DESC
    `).all();

    res.json(orders);
});

app.post("/api/orders", (req, res) => {
    const { total } = req.body;

    if (total === undefined) {
        return res.status(400).json({
            message: "Total is required"
        });
    }

    const createdAt = new Date().toISOString();

    const result = db.prepare(`
        INSERT INTO orders (total, status, created_at)
        VALUES (?, ?, ?)
    `).run(total, "Placed", createdAt);

    const order = db.prepare(`
        SELECT * FROM orders WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
        message: "Order placed successfully",
        order: order
    });
});

app.put("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    const orderId = Number(req.params.id);

    const existingOrder = db.prepare(`
        SELECT * FROM orders WHERE id = ?
    `).get(orderId);

    if (!existingOrder) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    db.prepare(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
    `).run(status, orderId);

    const updatedOrder = db.prepare(`
        SELECT * FROM orders WHERE id = ?
    `).get(orderId);

    res.json({
        message: "Order status updated",
        order: updatedOrder
    });
});

app.listen(PORT, () => {
    console.log(`CanteenSync Backend running on http://localhost:${PORT}`);
});