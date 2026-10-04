const menuItems = [
    {
        id: 1,
        name: "Chicken Biryani",
        price: 120,
        stall: "Main Stall",
        icon: "🍛",
        description: "Freshly prepared campus special biryani."
    },
    {
        id: 2,
        name: "Veg Fried Rice",
        price: 80,
        stall: "Main Stall",
        icon: "🍚",
        description: "Vegetable fried rice with fresh ingredients."
    },
    {
        id: 3,
        name: "Chicken Sandwich",
        price: 70,
        stall: "Cafe",
        icon: "🥪",
        description: "Grilled sandwich with chicken and vegetables."
    },
    {
        id: 4,
        name: "Cold Coffee",
        price: 60,
        stall: "Cafe",
        icon: "☕",
        description: "Chilled coffee served fresh."
    },
    {
        id: 5,
        name: "Samosa",
        price: 25,
        stall: "Snacks",
        icon: "🥟",
        description: "Crispy potato-filled samosa."
    },
    {
        id: 6,
        name: "French Fries",
        price: 90,
        stall: "Snacks",
        icon: "🍟",
        description: "Crispy golden fries."
    }
];

let cart = [];
let currentFilter = "all";
let inventoryData = [];

let currentOrder = {
    id: null,
    status: "Placed",
    total: 0
};

function renderMenu() {
    const grid = document.getElementById("menuGrid");

    if (!grid) return;

    const filteredItems = currentFilter === "all"
        ? menuItems
        : menuItems.filter(item => item.stall === currentFilter);

    grid.innerHTML = filteredItems.map(item => {
        const inventoryItem = inventoryData.find(
            stockItem => stockItem.item_id === item.id
        );

        const stock = inventoryItem
            ? inventoryItem.stock
            : null;

        let stockText = "Checking stock...";
        let stockClass = "stock-good";
        let buttonText = "+ Add";
        let buttonDisabled = "";

        if (stock !== null) {
            if (stock === 0) {
                stockText = "Out of Stock";
                stockClass = "stock-out";
                buttonText = "Out of Stock";
                buttonDisabled = "disabled";
            } else if (
                stock <= inventoryItem.low_stock_limit
            ) {
                stockText = `Low Stock • ${stock} left`;
                stockClass = "stock-low";
            } else {
                stockText = `${stock} available`;
                stockClass = "stock-good";
            }
        }

        return `
            <div class="menu-card">

                <div class="food-image">
                    ${item.icon}
                </div>

                <div class="menu-content">

                    <span class="stall-name">
                        ${item.stall}
                    </span>

                    <h4>${item.name}</h4>

                    <p>${item.description}</p>

                    <div class="${stockClass}">
                        ${stockText}
                    </div>

                    <div class="menu-bottom">

                        <span class="price">
                            ₹${item.price}
                        </span>

                        <button
                            class="add-btn"
                            onclick="addToCart(${item.id})"
                            ${buttonDisabled}>
                            ${buttonText}
                        </button>

                    </div>

                </div>
            </div>
        `;
    }).join("");
}

function filterMenu(filter, button) {
    currentFilter = filter;

    document.querySelectorAll(".filter").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    renderMenu();
}

function addToCart(id) {
    const item = menuItems.find(item => item.id === id);

    if (!item) return;

    const inventoryItem = inventoryData.find(
        stockItem => stockItem.item_id === id
    );

    if (!inventoryItem || inventoryItem.stock <= 0) {
        alert(`${item.name} is currently out of stock.`);
        return;
    }

    const existing = cart.find(
        cartItem => cartItem.id === id
    );

    const currentQuantity = existing
        ? existing.quantity
        : 0;

    if (currentQuantity >= inventoryItem.stock) {
        alert(
            `Only ${inventoryItem.stock} ${item.name} available.`
        );
        return;
    }

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }

    updateCart();

    const floatingCart =
        document.getElementById("floatingCart");

    if (floatingCart) {
        floatingCart.classList.remove("hidden");
    }
}

function updateCart() {
    const cartItems =
        document.getElementById("cartItems");

    const cartCount =
        document.getElementById("cartCount");

    const cartTotal =
        document.getElementById("cartTotal");

    if (!cartItems || !cartCount || !cartTotal) {
        return;
    }

    let total = 0;
    let count = 0;

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="pickup-message">
                Your cart is empty.
            </div>
        `;

    } else {

        cartItems.innerHTML = cart.map(item => {

            total += item.price * item.quantity;
            count += item.quantity;

            return `
                <div class="cart-item">

                    <div class="cart-item-info">

                        <strong>
                            ${item.name}
                        </strong>

                        <span>
                            ${item.quantity} × ₹${item.price}
                        </span>

                    </div>

                    <strong>
                        ₹${item.price * item.quantity}
                    </strong>

                </div>
            `;

        }).join("");
    }

    cartCount.textContent = count;
    cartTotal.textContent = `₹${total}`;

    const floatingCart =
        document.getElementById("floatingCart");

    if (floatingCart) {

        if (count === 0) {
            floatingCart.classList.add("hidden");
        } else {
            floatingCart.classList.remove("hidden");
        }
    }
}

function openCart() {
    const cartPanel =
        document.getElementById("cartPanel");

    if (!cartPanel) return;

    cartPanel.classList.remove("hidden");

    cartPanel.scrollIntoView({
        behavior: "smooth"
    });
}

function closeCart() {
    const cartPanel =
        document.getElementById("cartPanel");

    if (!cartPanel) return;

    cartPanel.classList.add("hidden");
}

async function placeOrder() {

    if (cart.length === 0) {
        return;
    }

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    try {

        const response = await fetch(
            "http://localhost:3000/api/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    total: total,
                    items: cart
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to place order"
            );
        }

        currentOrder = {
            id: data.order.id,
            status: data.order.status,
            total: data.order.total
        };

        cart = [];

        updateCart();

        closeCart();

        showStudent();

        updateOrderDisplay();

        await renderStallOrders();

        await renderInventory();

        alert(
            `Order #${data.order.id} placed successfully!`
        );

    } catch (error) {

        console.error(
            "Error placing order:",
            error
        );

        alert(
            error.message ||
            "Unable to place order. Make sure the backend is running."
        );
    }
}

function updateOrderDisplay() {

    const badge =
        document.getElementById("orderStatusBadge");

    if (!badge) return;

    badge.className = "status-badge";

    badge.textContent = currentOrder.status;

    if (currentOrder.status === "Placed") {

        badge.classList.add("placed");

    } else if (currentOrder.status === "Accepted") {

        badge.classList.add("placed");

    } else if (currentOrder.status === "Preparing") {

        badge.classList.add("preparing");

    } else if (currentOrder.status === "Ready") {

        badge.classList.add("ready");
    }

    const steps = [
        "stepPlaced",
        "stepAccepted",
        "stepPreparing",
        "stepReady"
    ];

    const lines = [
        "line1",
        "line2",
        "line3"
    ];

    const statusIndex = {
        Placed: 0,
        Accepted: 1,
        Preparing: 2,
        Ready: 3
    };

    const currentIndex =
        statusIndex[currentOrder.status];

    steps.forEach((step, index) => {

        const element =
            document.getElementById(step);

        if (!element) return;

        if (index <= currentIndex) {

            element.classList.add("active");

        } else {

            element.classList.remove("active");
        }
    });

    lines.forEach((line, index) => {

        const element =
            document.getElementById(line);

        if (!element) return;

        if (index < currentIndex) {

            element.classList.add("active");

        } else {

            element.classList.remove("active");
        }
    });

    const message =
        document.getElementById("pickupMessage");

    if (!message) return;

    if (currentOrder.status === "Placed") {

        message.textContent =
            "Your order has been sent to the stall.";

    } else if (currentOrder.status === "Accepted") {

        message.textContent =
            "The stall has accepted your order.";

    } else if (currentOrder.status === "Preparing") {

        message.textContent =
            "Your food is being prepared.";

    } else if (currentOrder.status === "Ready") {

        message.textContent =
            "Your order is ready. Please collect it from the stall.";
    }
}

async function renderStallOrders() {

    const stallOrdersContainer =
        document.getElementById("stallOrders");

    if (!stallOrdersContainer) return;

    try {

        const response = await fetch(
            "http://localhost:3000/api/orders"
        );

        if (!response.ok) {

            throw new Error(
                "Failed to fetch orders"
            );
        }

        const orders =
            await response.json();

        if (orders.length === 0) {

            stallOrdersContainer.innerHTML = `
                <div class="empty-state">
                    No orders yet.
                </div>
            `;

            updateDashboardStats(orders);

            return;
        }

        stallOrdersContainer.innerHTML =
            orders.map(order => `

                <div class="stall-order-card">

                    <div class="stall-order-header">

                        <strong>
                            Order #${order.id}
                        </strong>

                        <span class="status-badge">
                            ${order.status}
                        </span>

                    </div>

                    <div class="stall-order-info">

                        <p>
                            Total: ₹${order.total}
                        </p>

                        <p>
                            Time:
                            ${new Date(
                                order.created_at
                            ).toLocaleTimeString()}
                        </p>

                    </div>

                    <div class="order-items">

                        ${
                            order.items &&
                            order.items.length > 0

                            ? order.items.map(item => `
                                <div class="order-item-row">

                                    <span>
                                        ${item.name}
                                    </span>

                                    <span>
                                        ${item.quantity} × ₹${item.price}
                                    </span>

                                </div>
                            `).join("")

                            : `
                                <p>
                                    Order items unavailable
                                </p>
                            `
                        }

                    </div>

                    <div class="stall-order-actions">

                        ${getOrderActionButton(order)}

                    </div>

                </div>

            `).join("");

        updateDashboardStats(orders);

    } catch (error) {

        console.error(
            "Error loading stall orders:",
            error
        );

        stallOrdersContainer.innerHTML = `
            <div class="empty-state">
                Unable to load orders.
            </div>
        `;
    }
}

function getOrderActionButton(order) {

    if (order.status === "Placed") {

        return `
            <button
                class="btn-primary"
                onclick="changeOrderStatus(
                    ${order.id},
                    'Accepted'
                )">
                Accept Order
            </button>
        `;
    }

    if (order.status === "Accepted") {

        return `
            <button
                class="btn-primary"
                onclick="changeOrderStatus(
                    ${order.id},
                    'Preparing'
                )">
                Start Preparing
            </button>
        `;
    }

    if (order.status === "Preparing") {

        return `
            <button
                class="btn-primary"
                onclick="changeOrderStatus(
                    ${order.id},
                    'Ready'
                )">
                Mark Ready
            </button>
        `;
    }

    if (order.status === "Ready") {

        return `
            <span class="ready-message">
                Ready for Pickup
            </span>
        `;
    }

    return "";
}

async function changeOrderStatus(
    orderId,
    status
) {

    try {

        const response = await fetch(
            `http://localhost:3000/api/orders/${orderId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to update order"
            );
        }

        if (currentOrder.id === orderId) {

            currentOrder.status =
                data.order.status;

            updateOrderDisplay();
        }

        await renderStallOrders();

    } catch (error) {

        console.error(
            "Error updating order:",
            error
        );

        alert(
            "Unable to update order status."
        );
    }
}

function updateDashboardStats(orders) {

    let newOrders = 0;
    let preparing = 0;
    let ready = 0;

    orders.forEach(order => {

        if (order.status === "Placed") {
            newOrders++;
        }

        if (order.status === "Preparing") {
            preparing++;
        }

        if (order.status === "Ready") {
            ready++;
        }
    });

    const newOrdersElement =
        document.getElementById("newOrders");

    const preparingElement =
        document.getElementById("preparingOrders");

    const readyElement =
        document.getElementById("readyOrders");

    const todayOrdersElement =
        document.getElementById("todayOrders");

    if (newOrdersElement) {
        newOrdersElement.textContent =
            newOrders;
    }

    if (preparingElement) {
        preparingElement.textContent =
            preparing;
    }

    if (readyElement) {
        readyElement.textContent =
            ready;
    }

    if (todayOrdersElement) {
        todayOrdersElement.textContent =
            orders.length;
    }
}

async function renderInventory() {

    const inventoryGrid =
        document.getElementById("inventoryGrid");

    if (!inventoryGrid) return;

    try {

        const response = await fetch(
            "http://localhost:3000/api/inventory"
        );

        if (!response.ok) {

            throw new Error(
                "Failed to fetch inventory"
            );
        }

        const inventory =
            await response.json();

        inventoryData = inventory;

        renderMenu();

        inventoryGrid.innerHTML =
            inventory.map(item => {

                let stockClass = "stock-good";
                let stockText = "In Stock";

                if (item.stock === 0) {

                    stockClass = "stock-out";
                    stockText = "Out of Stock";

                } else if (
                    item.stock <=
                    item.low_stock_limit
                ) {

                    stockClass = "stock-low";
                    stockText = "Low Stock";
                }

                return `
                    <div class="inventory-card">

                        <div>
                            <strong>
                                ${item.name}
                            </strong>

                            <p>
                                Stock:
                                ${item.stock}
                            </p>
                        </div>

                        <span class="${stockClass}">
                            ${stockText}
                        </span>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "Error loading inventory:",
            error
        );

        inventoryGrid.innerHTML = `
            <div class="empty-state">
                Unable to load inventory.
            </div>
        `;
    }
}

function showStudent() {

    document
        .getElementById("studentView")
        .classList.remove("hidden");

    document
        .getElementById("stallView")
        .classList.add("hidden");

    document
        .querySelectorAll(".role-btn")[0]
        .classList.add("active");

    document
        .querySelectorAll(".role-btn")[1]
        .classList.remove("active");
}

function showStall() {

    document
        .getElementById("studentView")
        .classList.add("hidden");

    document
        .getElementById("stallView")
        .classList.remove("hidden");

    document
        .querySelectorAll(".role-btn")[0]
        .classList.remove("active");

    document
        .querySelectorAll(".role-btn")[1]
        .classList.add("active");

    renderStallOrders();
    renderInventory();
}

renderMenu();
updateCart();
renderStallOrders();
renderInventory();