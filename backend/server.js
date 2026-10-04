const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


/* =========================
   LOGIN
========================= */

const users = [
    {
        id: 1,
        email: "shruti@gmail.com",
        password: "hello123",
        role: "student",
        name: "Shruti"
    },
    {
        id: 2,
        email: "stall@canteen.com",
        password: "stall123",
        role: "stall",
        name: "Stall Manager"
    }
];

app.post("/api/login", (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({
            message: "Email, password and role are required"
        });
    }

    const user = users.find(
        currentUser =>
            currentUser.email.toLowerCase() === email.toLowerCase() &&
            currentUser.password === password &&
            currentUser.role === role
    );

    if (!user) {
        return res.status(401).json({
            message: "Invalid email, password or selected role"
        });
    }

    res.json({
        message: "Login successful",
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    });
});


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
    res.send("CanteenSync Backend is running");
});


/* =========================
   MENU
========================= */

app.get("/api/menu", (req, res) => {
    try {
        const menu = [
            {
                id: 1,
                name: "Chicken Biryani",
                price: 120,
                category: "main"
            },
            {
                id: 2,
                name: "Veg Fried Rice",
                price: 90,
                category: "main"
            },
            {
                id: 3,
                name: "Chicken Sandwich",
                price: 80,
                category: "cafe"
            },
            {
                id: 4,
                name: "Cold Coffee",
                price: 60,
                category: "cafe"
            },
            {
                id: 5,
                name: "Samosa",
                price: 30,
                category: "snacks"
            },
            {
                id: 6,
                name: "French Fries",
                price: 70,
                category: "snacks"
            }
        ];

        res.json(menu);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load menu"
        });
    }
});


/* =========================
   INVENTORY
========================= */

app.get("/api/inventory", (req, res) => {
    try {
        const inventory = db.prepare(`
            SELECT
                item_id,
                name,
                stock,
                low_stock_limit
            FROM inventory
            ORDER BY item_id
        `).all();

        res.json(inventory);

    } catch (error) {
        console.error(
            "Error fetching inventory:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch inventory"
        });
    }
});


/* =========================
   ANALYTICS
========================= */

app.get("/api/analytics", (req, res) => {
    try {
        const totalOrders = db.prepare(`
            SELECT COUNT(*) AS count
            FROM orders
        `).get().count;

        const totalRevenue = db.prepare(`
            SELECT COALESCE(SUM(total), 0) AS revenue
            FROM orders
        `).get().revenue;

        const ordersByStatus = db.prepare(`
            SELECT
                status,
                COUNT(*) AS count
            FROM orders
            GROUP BY status
        `).all();

        const popularItems = db.prepare(`
            SELECT
                name,
                SUM(quantity) AS quantity
            FROM order_items
            GROUP BY item_id, name
            ORDER BY quantity DESC
            LIMIT 5
        `).all();

        const inventorySummary = db.prepare(`
            SELECT
                COUNT(*) AS total_items,
                SUM(stock) AS total_stock,
                SUM(
                    CASE
                        WHEN stock <= low_stock_limit
                        THEN 1
                        ELSE 0
                    END
                ) AS low_stock_items
            FROM inventory
        `).get();

        res.json({
            totalOrders,
            totalRevenue,
            ordersByStatus,
            popularItems,
            inventorySummary
        });

    } catch (error) {
        console.error(
            "Error fetching analytics:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch analytics"
        });
    }
});


/* =========================
   GET ORDERS
========================= */

app.get("/api/orders", (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT
                id,
                total,
                status,
                created_at
            FROM orders
            ORDER BY id DESC
        `).all();

        const getItems = db.prepare(`
            SELECT
                item_id,
                name,
                price,
                quantity
            FROM order_items
            WHERE order_id = ?
        `);

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: getItems.all(order.id)
        }));

        res.json(ordersWithItems);

    } catch (error) {
        console.error(
            "Error fetching orders:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
});


/* =========================
   CREATE ORDER
========================= */

app.post("/api/orders", (req, res) => {
    try {
        const { total, items } = req.body;

        if (
            typeof total !== "number" ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Invalid order data"
            });
        }

        for (const item of items) {
            if (
                !item.item_id ||
                !item.name ||
                typeof item.price !== "number" ||
                !item.quantity ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid order item"
                });
            }

            const inventoryItem = db.prepare(`
                SELECT
                    stock,
                    name
                FROM inventory
                WHERE item_id = ?
            `).get(item.item_id);

            if (!inventoryItem) {
                return res.status(400).json({
                    message:
                        `${item.name} is not available in inventory`
                });
            }

            if (
                inventoryItem.stock <
                item.quantity
            ) {
                return res.status(400).json({
                    message:
                        `Insufficient stock for ${item.name}`
                });
            }
        }


        const createOrder = db.transaction(() => {

            const orderResult = db.prepare(`
                INSERT INTO orders
                (total, status, created_at)
                VALUES (?, ?, ?)
            `).run(
                total,
                "Placed",
                new Date().toISOString()
            );

            const orderId =
                orderResult.lastInsertRowid;


            const insertItem = db.prepare(`
                INSERT INTO order_items
                (
                    order_id,
                    item_id,
                    name,
                    price,
                    quantity
                )
                VALUES (?, ?, ?, ?, ?)
            `);


            const reduceStock = db.prepare(`
                UPDATE inventory
                SET stock = stock - ?
                WHERE item_id = ?
            `);


            for (const item of items) {

                insertItem.run(
                    orderId,
                    item.item_id,
                    item.name,
                    item.price,
                    item.quantity
                );

                reduceStock.run(
                    item.quantity,
                    item.item_id
                );
            }


            return orderId;
        });


        const orderId =
            createOrder();


        const order = db.prepare(`
            SELECT
                id,
                total,
                status,
                created_at
            FROM orders
            WHERE id = ?
        `).get(orderId);


        const orderItems = db.prepare(`
            SELECT
                item_id,
                name,
                price,
                quantity
            FROM order_items
            WHERE order_id = ?
        `).all(orderId);


        res.status(201).json({
            message: "Order placed successfully",
            order: {
                ...order,
                items: orderItems
            }
        });

    } catch (error) {
        console.error(
            "Error creating order:",
            error
        );

        res.status(500).json({
            message: "Failed to create order"
        });
    }
});


/* =========================
   UPDATE ORDER STATUS
========================= */

app.put("/api/orders/:id/status", (req, res) => {
    try {
        const orderId =
            Number(req.params.id);

        const { status } = req.body;

        const allowedStatuses = [
            "Placed",
            "Accepted",
            "Preparing",
            "Ready"
        ];

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }


        const order =
            db.prepare(`
                SELECT
                    id,
                    status
                FROM orders
                WHERE id = ?
            `).get(orderId);


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        const validTransitions = {
            Placed: "Accepted",
            Accepted: "Preparing",
            Preparing: "Ready"
        };


        if (
            order.status !== status &&
            validTransitions[order.status] !== status
        ) {
            return res.status(400).json({
                message:
                    `Invalid status transition from ${order.status} to ${status}`
            });
        }


        db.prepare(`
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `).run(
            status,
            orderId
        );


        const updatedOrder =
            db.prepare(`
                SELECT
                    id,
                    total,
                    status,
                    created_at
                FROM orders
                WHERE id = ?
            `).get(orderId);


        res.json({
            message: "Order status updated",
            order: updatedOrder
        });

    } catch (error) {
        console.error(
            "Error updating order status:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update order status"
        });
    }
});


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(
        `CanteenSync Backend running on http://localhost:${PORT}`
    );
});