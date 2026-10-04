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
        },
        {
            id: 5,
            name: "Samosa",
            price: 25,
            stall: "Snacks"
        },
        {
            id: 6,
            name: "French Fries",
            price: 90,
            stall: "Snacks"
        }
    ]);
});

app.get("/api/inventory", (req, res) => {
    try {
        const inventory = db.prepare(`
            SELECT *
            FROM inventory
            ORDER BY item_id
        `).all();

        res.json(inventory);
    } catch (error) {
        console.error("Error fetching inventory:", error);

        res.status(500).json({
            message: "Failed to fetch inventory"
        });
    }
});

app.get("/api/orders", (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders
            ORDER BY id DESC
        `).all();

        const ordersWithItems = orders.map(order => {
            const items = db.prepare(`
                SELECT *
                FROM order_items
                WHERE order_id = ?
            `).all(order.id);

            return {
                ...order,
                items: items
            };
        });

        res.json(ordersWithItems);

    } catch (error) {
        console.error("Error fetching orders:", error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
});

app.post("/api/orders", (req, res) => {
    const { total, items } = req.body;

    if (
        total === undefined ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            message: "Order total and items are required"
        });
    }

    try {
        const createdAt = new Date().toISOString();

        const insertOrder = db.prepare(`
            INSERT INTO orders
            (total, status, created_at)
            VALUES (?, ?, ?)
        `);

        const insertItem = db.prepare(`
            INSERT INTO order_items
            (order_id, item_id, name, price, quantity)
            VALUES (?, ?, ?, ?, ?)
        `);

        const createOrder = db.transaction(() => {
    for (const item of items) {
        const inventoryItem = db.prepare(`
            SELECT *
            FROM inventory
            WHERE item_id = ?
        `).get(item.id);

        if (!inventoryItem) {
            throw new Error(`Inventory not found for ${item.name}`);
        }

        if (inventoryItem.stock < item.quantity) {
            throw new Error(
                `Not enough stock for ${item.name}. Available: ${inventoryItem.stock}`
            );
        }
    }

    const result = insertOrder.run(
        total,
        "Placed",
        createdAt
    );

    const orderId = result.lastInsertRowid;

    items.forEach(item => {
        insertItem.run(
            orderId,
            item.id,
            item.name,
            item.price,
            item.quantity
        );

        db.prepare(`
            UPDATE inventory
            SET stock = stock - ?
            WHERE item_id = ?
        `).run(item.quantity, item.id);
    });

    return orderId;
});
        const orderId = createOrder();

        const order = db.prepare(`
            SELECT *
            FROM orders
            WHERE id = ?
        `).get(orderId);

        const orderItems = db.prepare(`
            SELECT *
            FROM order_items
            WHERE order_id = ?
        `).all(orderId);

        res.status(201).json({
            message: "Order placed successfully",
            order: order,
            items: orderItems
        });

    } catch (error) {
        console.error("Error placing order:", error);

        res.status(500).json({
            message: "Failed to place order"
        });
    }
});

app.put("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    const orderId = Number(req.params.id);

    if (!status) {
        return res.status(400).json({
            message: "Status is required"
        });
    }

    try {
        const existingOrder = db.prepare(`
            SELECT *
            FROM orders
            WHERE id = ?
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
            SELECT *
            FROM orders
            WHERE id = ?
        `).get(orderId);

        const orderItems = db.prepare(`
            SELECT *
            FROM order_items
            WHERE order_id = ?
        `).all(orderId);

        res.json({
            message: "Order status updated",
            order: updatedOrder,
            items: orderItems
        });

    } catch (error) {
        console.error("Error updating order:", error);

        res.status(500).json({
            message: "Failed to update order"
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `CanteenSync Backend running on http://localhost:${PORT}`
    );
});