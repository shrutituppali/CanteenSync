const API_URL = "http://localhost:3000/api";

let selectedLoginRole = "student";
let currentUser = null;

let cart = [];
let activeOrder = null;

let menuData = [];
let inventoryData = [];

let currentFilter = "all";
let currentSearch = "";



/* =========================
   LOGIN
========================= */

function selectLoginRole(role) {
    selectedLoginRole = role;

    const studentBtn = document.getElementById("studentRoleBtn");
    const stallBtn = document.getElementById("stallRoleBtn");

    studentBtn.classList.toggle("active", role === "student");
    stallBtn.classList.toggle("active", role === "stall");

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    if (role === "student") {
        emailInput.value = "shruti@gmail.com";
        passwordInput.value = "hello123";
    } else {
        emailInput.value = "stall@canteen.com";
        passwordInput.value = "stall123";
    }

    const error = document.getElementById("loginError");

    if (error) {
        error.style.display = "none";
        error.textContent = "";
    }
}


async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const error = document.getElementById("loginError");
    const button = document.querySelector(".login-submit-btn");

    error.style.display = "none";
    error.textContent = "";

    button.disabled = true;
    button.innerHTML = "Signing in...";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                role: selectedLoginRole
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        currentUser = data.user;

        localStorage.setItem(
            "canteenSyncUser",
            JSON.stringify(currentUser)
        );

        showApplication();

    } catch (loginError) {
        error.textContent = loginError.message;
        error.style.display = "block";
    } finally {
        button.disabled = false;
        button.innerHTML = `Sign In <span>→</span>`;
    }
}


function showApplication() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("appPage").style.display = "flex";

    updateUserDetails();

    if (currentUser.role === "student") {
        document.getElementById("studentNav").style.display = "block";
        document.getElementById("stallNav").style.display = "none";

        document.getElementById("studentArea").style.display = "block";
        document.getElementById("stallArea").style.display = "none";

        showStudent("dashboard");

        loadMenu();
        loadStudentOrders();

    } else {
        document.getElementById("studentNav").style.display = "none";
        document.getElementById("stallNav").style.display = "block";

        document.getElementById("studentArea").style.display = "none";
        document.getElementById("stallArea").style.display = "block";

        showStall("dashboard");

        loadStallData();
    }
}


function updateUserDetails() {
    if (!currentUser) {
        return;
    }

    const firstLetter = currentUser.name
        ? currentUser.name.charAt(0).toUpperCase()
        : "U";

    document.getElementById("sidebarUserName").textContent =
        currentUser.name;

    document.getElementById("sidebarUserRole").textContent =
        currentUser.role === "student"
            ? "Student"
            : "Stall Manager";

    document.getElementById("sidebarUserAvatar").textContent =
        firstLetter;

    document.getElementById("topbarUserName").textContent =
        currentUser.name;

    document.getElementById("topbarUserRole").textContent =
        currentUser.role === "student"
            ? "Student"
            : "Stall Manager";

    document.getElementById("topbarUserAvatar").textContent =
        firstLetter;
}


function logout() {
    localStorage.removeItem("canteenSyncUser");

    currentUser = null;
    cart = [];
    activeOrder = null;

    document.getElementById("appPage").style.display = "none";
    document.getElementById("loginPage").style.display = "flex";

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";

    selectLoginRole("student");
}


function checkExistingLogin() {
    const savedUser = localStorage.getItem("canteenSyncUser");

    if (!savedUser) {
        return;
    }

    try {
        currentUser = JSON.parse(savedUser);

        if (
            currentUser &&
            (currentUser.role === "student" ||
                currentUser.role === "stall")
        ) {
            showApplication();
        }

    } catch (error) {
        localStorage.removeItem("canteenSyncUser");
    }
}



/* =========================
   NAVIGATION
========================= */

function setActiveNav(containerId, activeId) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    container
        .querySelectorAll(".nav-item")
        .forEach(item => item.classList.remove("active"));

    const active = document.getElementById(activeId);

    if (active) {
        active.classList.add("active");
    }
}


function showStudent(section) {
    if (!currentUser || currentUser.role !== "student") {
        return;
    }

    const sections = [
        "studentDashboardSection",
        "studentMenuSection",
        "studentCartSection",
        "studentOrdersSection"
    ];

    sections.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }
    });

    if (section === "dashboard") {
        document.getElementById("studentDashboardSection").style.display =
            "block";

        setActiveNav(
            "studentNav",
            "studentDashboardNav"
        );

        updateStudentStats();
        updateStudentDashboard();

    } else if (section === "menu") {
        document.getElementById("studentMenuSection").style.display =
            "block";

        setActiveNav(
            "studentNav",
            "studentMenuNav"
        );

        renderMenu();

    } else if (section === "cart") {
        document.getElementById("studentCartSection").style.display =
            "block";

        updateCart();

    } else if (section === "orders") {
        document.getElementById("studentOrdersSection").style.display =
            "block";

        setActiveNav(
            "studentNav",
            "studentOrdersNav"
        );

        loadStudentOrders();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showStall(section) {
    if (!currentUser || currentUser.role !== "stall") {
        return;
    }

    const sections = [
        "stallDashboardSection",
        "stallOrdersSection",
        "stallInventorySection",
        "stallAnalyticsSection"
    ];

    sections.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }
    });

    if (section === "dashboard") {
        document.getElementById("stallDashboardSection").style.display =
            "block";

        setActiveNav(
            "stallNav",
            "stallDashboardNav"
        );

        loadStallData();

    } else if (section === "orders") {
        document.getElementById("stallOrdersSection").style.display =
            "block";

        setActiveNav(
            "stallNav",
            "stallOrdersNav"
        );

        loadStallOrders();

    } else if (section === "inventory") {
        document.getElementById("stallInventorySection").style.display =
            "block";

        setActiveNav(
            "stallNav",
            "stallInventoryNav"
        );

        loadInventory();

    } else if (section === "analytics") {
        document.getElementById("stallAnalyticsSection").style.display =
            "block";

        setActiveNav(
            "stallNav",
            "stallAnalyticsNav"
        );

        loadAnalytics();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function scrollToSection(id) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    if (id === "studentCartSection") {
        showStudent("cart");
        return;
    }

    element.scrollIntoView({
        behavior: "smooth"
    });
}



/* =========================
   MENU
========================= */

async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);

        if (!response.ok) {
            throw new Error("Failed to load menu");
        }

        menuData = await response.json();

        renderMenu();
        renderPopularItems();

    } catch (error) {
        console.error("Menu loading error:", error);

        const grid = document.getElementById("menuGrid");

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Unable to load menu</h3>
                    <p>Please make sure the backend server is running.</p>
                </div>
            `;
        }
    }
}


function renderMenu() {
    const grid = document.getElementById("menuGrid");

    if (!grid) {
        return;
    }

    let filteredItems = [...menuData];

    if (currentFilter !== "all") {
        filteredItems = filteredItems.filter(item => {
            const category = String(
                item.category || ""
            ).toLowerCase();

            return category === currentFilter;
        });
    }

    if (currentSearch.trim()) {
        const search = currentSearch
            .trim()
            .toLowerCase();

        filteredItems = filteredItems.filter(item =>
            String(item.name)
                .toLowerCase()
                .includes(search)
        );
    }

    if (filteredItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3>No items found</h3>
                <p>Try another search or category.</p>
            </div>
        `;

        return;
    }

    grid.innerHTML = filteredItems
        .map(item => {

            const stockItem = inventoryData.find(
                inventory =>
                    Number(inventory.item_id) === Number(item.id)
            );

            const stock =
                stockItem
                    ? Number(stockItem.stock)
                    : null;

            const unavailable =
                stock !== null && stock <= 0;

            const lowStock =
                stock !== null &&
                stock > 0 &&
                stock <= Number(stockItem.low_stock_limit || 5);

            let stockText = "Available";

            if (unavailable) {
                stockText = "Out of stock";
            } else if (lowStock) {
                stockText = `Only ${stock} left`;
            }

            return `
                <article class="menu-card">

                    <div class="menu-image ${getFoodClass(item.name)}">
                        ${getFoodEmoji(item.name)}
                    </div>

                    <div class="menu-card-body">

                        <div class="menu-card-top">

                            <span class="menu-category">
                                ${formatCategory(item.category)}
                            </span>

                            <span class="availability ${
                                unavailable
                                    ? "unavailable"
                                    : lowStock
                                        ? "low"
                                        : ""
                            }">
                                ${stockText}
                            </span>

                        </div>

                        <h3>${escapeHtml(item.name)}</h3>

                        <p>
                            ${getFoodDescription(item.name)}
                        </p>

                        <div class="menu-card-bottom">

                            <strong>
                                ₹${Number(item.price).toFixed(0)}
                            </strong>

                            <button
                                type="button"
                                class="add-btn"
                                onclick="addToCart(${item.id})"
                                ${unavailable ? "disabled" : ""}
                            >
                                ${unavailable ? "Unavailable" : "Add +"}
                            </button>

                        </div>

                    </div>

                </article>
            `;
        })
        .join("");
}


function filterMenu(filter, button) {
    currentFilter = filter;

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    if (button) {
        button.classList.add("active");
    }

    renderMenu();
}


function searchMenu(value) {
    currentSearch = value;
    renderMenu();
}


function getFoodEmoji(name) {
    const value = String(name).toLowerCase();

    if (value.includes("biryani")) {
        return "🍛";
    }

    if (value.includes("rice")) {
        return "🍚";
    }

    if (value.includes("sandwich")) {
        return "🥪";
    }

    if (value.includes("coffee")) {
        return "☕";
    }

    if (value.includes("samosa")) {
        return "🥟";
    }

    if (value.includes("fries")) {
        return "🍟";
    }

    return "🍽️";
}


function getFoodClass(name) {
    const value = String(name).toLowerCase();

    if (value.includes("biryani")) {
        return "food-biryani";
    }

    if (value.includes("rice")) {
        return "food-rice";
    }

    if (value.includes("sandwich")) {
        return "food-sandwich";
    }

    if (value.includes("coffee")) {
        return "food-coffee";
    }

    if (value.includes("samosa")) {
        return "food-samosa";
    }

    if (value.includes("fries")) {
        return "food-fries";
    }

    return "food-default";
}


function getFoodDescription(name) {
    const value = String(name).toLowerCase();

    if (value.includes("biryani")) {
        return "Aromatic rice with tender chicken and rich spices.";
    }

    if (value.includes("fried rice")) {
        return "Flavourful fried rice with fresh vegetables.";
    }

    if (value.includes("sandwich")) {
        return "Freshly prepared sandwich packed with flavour.";
    }

    if (value.includes("coffee")) {
        return "Cold, creamy coffee for a refreshing break.";
    }

    if (value.includes("samosa")) {
        return "Crispy golden snack with a delicious filling.";
    }

    if (value.includes("fries")) {
        return "Crispy golden fries served fresh.";
    }

    return "Freshly prepared and available at the canteen.";
}


function formatCategory(category) {
    if (!category) {
        return "Canteen";
    }

    return String(category)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}



/* =========================
   CART
========================= */

function addToCart(itemId) {
    const item = menuData.find(
        currentItem =>
            Number(currentItem.id) === Number(itemId)
    );

    if (!item) {
        return;
    }

    const inventoryItem = inventoryData.find(
        currentInventory =>
            Number(currentInventory.item_id) === Number(itemId)
    );

    if (
        inventoryItem &&
        Number(inventoryItem.stock) <= 0
    ) {
        alert("This item is currently out of stock.");
        return;
    }

    const existing = cart.find(
        cartItem =>
            Number(cartItem.id) === Number(itemId)
    );

    if (existing) {

        if (
            inventoryItem &&
            existing.quantity >= Number(inventoryItem.stock)
        ) {
            alert("You cannot add more than the available stock.");
            return;
        }

        existing.quantity += 1;

    } else {

        cart.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: 1
        });
    }

    updateCart();
}


function increaseCartItem(itemId) {
    const cartItem = cart.find(
        item =>
            Number(item.id) === Number(itemId)
    );

    if (!cartItem) {
        return;
    }

    const inventoryItem = inventoryData.find(
        item =>
            Number(item.item_id) === Number(itemId)
    );

    if (
        inventoryItem &&
        cartItem.quantity >= Number(inventoryItem.stock)
    ) {
        alert("Maximum available stock reached.");
        return;
    }

    cartItem.quantity += 1;

    updateCart();
}


function decreaseCartItem(itemId) {
    const cartItem = cart.find(
        item =>
            Number(item.id) === Number(itemId)
    );

    if (!cartItem) {
        return;
    }

    cartItem.quantity -= 1;

    if (cartItem.quantity <= 0) {
        cart = cart.filter(
            item =>
                Number(item.id) !== Number(itemId)
        );
    }

    updateCart();
}


function removeFromCart(itemId) {
    cart = cart.filter(
        item =>
            Number(item.id) !== Number(itemId)
    );

    updateCart();
}


function updateCart() {
    const cartItems = document.getElementById("cartItems");

    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    document.getElementById("cartItemCount").textContent =
        totalQuantity;

    document.getElementById("cartSubtotal").textContent =
        `₹${total.toFixed(0)}`;

    document.getElementById("cartTotal").textContent =
        `₹${total.toFixed(0)}`;

    const floatingCount =
        document.getElementById("floatingCartCount");

    if (floatingCount) {
        floatingCount.textContent = totalQuantity;
    }

    const floatingCart =
        document.getElementById("floatingCart");

    if (floatingCart) {
        floatingCart.style.display =
            currentUser &&
            currentUser.role === "student" &&
            totalQuantity > 0
                ? "flex"
                : "none";
    }

    if (!cartItems) {
        return;
    }

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add some delicious items from the menu.</p>

                <button
                    type="button"
                    class="primary-btn"
                    onclick="showStudent('menu')"
                >
                    Browse Menu
                </button>
            </div>
        `;

        return;
    }

    cartItems.innerHTML = cart
        .map(item => `
            <div class="cart-item">

                <div class="cart-item-image">
                    ${getFoodEmoji(item.name)}
                </div>

                <div class="cart-item-info">

                    <span class="menu-category">
                        Canteen Item
                    </span>

                    <h3>
                        ${escapeHtml(item.name)}
                    </h3>

                    <strong>
                        ₹${item.price.toFixed(0)}
                    </strong>

                </div>

                <div class="cart-item-actions">

                    <div class="quantity-control">

                        <button
                            type="button"
                            onclick="decreaseCartItem(${item.id})"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            onclick="increaseCartItem(${item.id})"
                        >
                            +
                        </button>

                    </div>

                    <strong class="cart-line-total">
                        ₹${(
                            item.price * item.quantity
                        ).toFixed(0)}
                    </strong>

                    <button
                        type="button"
                        class="remove-cart-btn"
                        onclick="removeFromCart(${item.id})"
                    >
                        ×
                    </button>

                </div>

            </div>
        `)
        .join("");
}



/* =========================
   PLACE ORDER
========================= */

async function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    const orderButton =
        document.getElementById("placeOrderBtn");

    orderButton.disabled = true;
    orderButton.innerHTML = "Placing Order...";

    try {

        const response = await fetch(
            `${API_URL}/orders`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    total,
                    items: cart.map(item => ({
                        item_id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to place order"
            );
        }

        activeOrder = data.order || data;

        cart = [];

        updateCart();

        alert(
            `Order #${activeOrder.id || data.id} placed successfully!`
        );

        await loadMenu();
        await loadStudentOrders();

        showStudent("orders");

    } catch (error) {

        alert(error.message);

    } finally {

        orderButton.disabled = false;
        orderButton.innerHTML =
            `Place Order <span>→</span>`;
    }
}



/* =========================
   STUDENT ORDERS
========================= */

async function loadStudentOrders() {
    if (
        !currentUser ||
        currentUser.role !== "student"
    ) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/orders`);

        if (!response.ok) {
            throw new Error("Failed to load orders");
        }

        const orders = await response.json();

        const sortedOrders = [...orders].sort(
            (a, b) =>
                Number(b.id) - Number(a.id)
        );

        if (sortedOrders.length > 0) {
            activeOrder =
                sortedOrders.find(
                    order =>
                        order.status !== "Ready"
                ) || sortedOrders[0];
        } else {
            activeOrder = null;
        }

        renderStudentOrders(sortedOrders);
        updateOrderDisplay(activeOrder);
        updateStudentStats(sortedOrders);
        updateStudentDashboard(sortedOrders);

    } catch (error) {

        console.error(
            "Student orders error:",
            error
        );
    }
}


function renderStudentOrders(orders) {
    const container =
        document.getElementById("studentOrdersList");

    if (!container) {
        return;
    }

    if (!orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Your placed orders will appear here.</p>

                <button
                    type="button"
                    class="primary-btn"
                    onclick="showStudent('menu')"
                >
                    Browse Menu
                </button>
            </div>
        `;

        return;
    }

    container.innerHTML = orders
        .map(order => {

            const statusClass =
                String(order.status)
                    .toLowerCase();

            const date = order.created_at
                ? new Date(
                    order.created_at
                ).toLocaleString()
                : "";

            const itemsText =
                Array.isArray(order.items)
                    ? order.items
                        .map(
                            item =>
                                `${item.name} × ${item.quantity}`
                        )
                        .join(", ")
                    : "Order items";

            return `
                <article class="student-order-card">

                    <div class="student-order-top">

                        <div>

                            <span class="eyebrow">
                                ORDER #${order.id}
                            </span>

                            <h3>
                                ${escapeHtml(itemsText)}
                            </h3>

                            <span class="order-date">
                                ${date}
                            </span>

                        </div>

                        <span
                            class="status-pill ${statusClass}"
                        >
                            ${order.status}
                        </span>

                    </div>

                    <div class="student-order-bottom">

                        <strong>
                            ₹${Number(order.total).toFixed(0)}
                        </strong>

                        ${
                            order.status !== "Ready"
                                ? `
                                    <button
                                        type="button"
                                        class="text-btn"
                                        onclick="trackOrder(${order.id})"
                                    >
                                        Track Order →
                                    </button>
                                `
                                : `
                                    <span class="completed-label">
                                        ✓ Ready for pickup
                                    </span>
                                `
                        }

                    </div>

                </article>
            `;
        })
        .join("");
}


function trackOrder(orderId) {
    const orderIdNumber = Number(orderId);

    fetch(`${API_URL}/orders`)
        .then(response => response.json())
        .then(orders => {

            const order = orders.find(
                currentOrder =>
                    Number(currentOrder.id) ===
                    orderIdNumber
            );

            if (!order) {
                return;
            }

            activeOrder = order;

            updateOrderDisplay(order);

            const tracking =
                document.getElementById(
                    "studentTracking"
                );

            if (tracking) {
                tracking.scrollIntoView({
                    behavior: "smooth"
                });
            }

        })
        .catch(error =>
            console.error(error)
        );
}


function updateOrderDisplay(order) {
    const trackingContent =
        document.getElementById(
            "trackingContent"
        );

    const currentOrder =
        document.getElementById(
            "studentCurrentOrder"
        );

    if (!order) {

        const emptyHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No active order</h3>
                <p>
                    Place an order to start tracking it.
                </p>
            </div>
        `;

        if (trackingContent) {
            trackingContent.innerHTML =
                emptyHTML;
        }

        if (currentOrder) {
            currentOrder.innerHTML =
                emptyHTML;
        }

        return;
    }

    const status =
        order.status || "Placed";

    const steps = [
        "Placed",
        "Accepted",
        "Preparing",
        "Ready"
    ];

    const currentIndex =
        steps.indexOf(status);

    const trackingHTML = `
        <div class="tracking-card">

            <div class="tracking-order-header">

                <div>
                    <span class="eyebrow">
                        ORDER #${order.id}
                    </span>

                    <h3>
                        ₹${Number(order.total).toFixed(0)}
                    </h3>
                </div>

                <span class="status-pill ${status.toLowerCase()}">
                    ${status}
                </span>

            </div>


            <div class="tracking-progress">

                ${steps.map(
                    (step, index) => `
                        <div
                            class="tracking-step ${
                                index <= currentIndex
                                    ? "completed"
                                    : ""
                            } ${
                                index === currentIndex
                                    ? "current"
                                    : ""
                            }"
                        >

                            <div class="tracking-circle">
                                ${
                                    index < currentIndex
                                        ? "✓"
                                        : index + 1
                                }
                            </div>

                            <span>${step}</span>

                        </div>
                    `
                ).join("")}

            </div>

        </div>
    `;

    if (trackingContent) {
        trackingContent.innerHTML =
            trackingHTML;
    }

    if (currentOrder) {
        currentOrder.innerHTML =
            trackingHTML;
    }
}


function updateStudentStats(orders = null) {
    if (!orders) {
        return;
    }

    const total =
        orders.length;

    const completed =
        orders.filter(
            order =>
                order.status === "Ready"
        ).length;

    const active =
        orders.filter(
            order =>
                order.status !== "Ready"
        ).length;

    document.getElementById(
        "studentOrderCount"
    ).textContent = total;

    document.getElementById(
        "studentCompletedCount"
    ).textContent = completed;

    document.getElementById(
        "studentActiveCount"
    ).textContent = active;
}


function updateStudentDashboard(orders = null) {
    const currentOrder =
        orders
            ? orders.find(
                order =>
                    order.status !== "Ready"
            )
            : activeOrder;

    const container =
        document.getElementById(
            "studentCurrentOrder"
        );

    if (!container) {
        return;
    }

    if (!currentOrder) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛍️</div>
                <h3>No active order</h3>
                <p>
                    Your latest order status will appear here.
                </p>
            </div>
        `;

        return;
    }

    const status =
        currentOrder.status || "Placed";

    container.innerHTML = `
        <div class="mini-order-card">

            <div>

                <span class="eyebrow">
                    ORDER #${currentOrder.id}
                </span>

                <h3>
                    ₹${Number(currentOrder.total).toFixed(0)}
                </h3>

            </div>

            <div class="mini-order-right">

                <span class="status-pill ${status.toLowerCase()}">
                    ${status}
                </span>

                <button
                    type="button"
                    class="text-btn"
                    onclick="showStudent('orders')"
                >
                    Track →
                </button>

            </div>

        </div>
    `;
}



/* =========================
   STUDENT POPULAR ITEMS
========================= */

function renderPopularItems() {
    const container =
        document.getElementById(
            "studentPopularItems"
        );

    if (!container || !menuData.length) {
        return;
    }

    const items =
        menuData.slice(0, 4);

    container.innerHTML =
        items.map(item => `
            <div class="popular-item">

                <div
                    class="popular-item-image ${getFoodClass(item.name)}"
                >
                    ${getFoodEmoji(item.name)}
                </div>

                <div class="popular-item-info">

                    <strong>
                        ${escapeHtml(item.name)}
                    </strong>

                    <span>
                        ₹${Number(item.price).toFixed(0)}
                    </span>

                </div>

                <button
                    type="button"
                    class="small-add-btn"
                    onclick="addToCart(${item.id})"
                >
                    +
                </button>

            </div>
        `)
        .join("");
}



/* =========================
   STALL DATA
========================= */

async function loadStallData() {
    await Promise.all([
        loadStallOrders(),
        loadInventory(),
        loadAnalytics()
    ]);
}


async function loadStallOrders() {
    try {

        const response =
            await fetch(`${API_URL}/orders`);

        if (!response.ok) {
            throw new Error("Failed to load orders");
        }

        const orders = await response.json();

        renderDashboardOrders(orders);
        renderStallOrderList(orders);
        updateDashboardStats(orders);

    } catch (error) {

        console.error(
            "Stall order error:",
            error
        );
    }
}


function renderDashboardOrders(orders) {
    const container =
        document.getElementById(
            "dashboardOrders"
        );

    if (!container) {
        return;
    }

    const activeOrders =
        orders
            .filter(
                order =>
                    order.status !== "Ready"
            )
            .sort(
                (a, b) =>
                    Number(b.id) - Number(a.id)
            )
            .slice(0, 5);

    if (!activeOrders.length) {

        container.innerHTML = `
            <div class="empty-state compact-empty">
                <div class="empty-icon">✓</div>
                <h3>No active orders</h3>
                <p>New orders will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        activeOrders
            .map(order =>
                createOrderCard(order)
            )
            .join("");
}


function renderStallOrderList(orders) {
    const container =
        document.getElementById(
            "stallOrdersList"
        );

    if (!container) {
        return;
    }

    const sorted =
        [...orders].sort(
            (a, b) =>
                Number(b.id) - Number(a.id)
        );

    if (!sorted.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Incoming orders will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        sorted
            .map(order =>
                createOrderCard(order)
            )
            .join("");
}


function createOrderCard(order) {
    const status =
        order.status || "Placed";

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const itemsHTML =
        items.length
            ? items.map(item => `
                <div class="order-item-row">
                    <span>
                        ${escapeHtml(item.name)}
                    </span>

                    <strong>
                        × ${item.quantity}
                    </strong>
                </div>
            `).join("")
            : `
                <div class="order-item-row">
                    <span>Order items</span>
                </div>
            `;

    return `
        <article class="order-card">

            <div class="order-card-header">

                <div>

                    <span class="eyebrow">
                        ORDER #${order.id}
                    </span>

                    <span class="order-time">
                        ${formatOrderDate(order.created_at)}
                    </span>

                </div>

                <span class="status-pill ${status.toLowerCase()}">
                    ${status}
                </span>

            </div>


            <div class="order-items">
                ${itemsHTML}
            </div>


            <div class="order-card-footer">

                <strong class="order-total">
                    ₹${Number(order.total).toFixed(0)}
                </strong>

                <div class="order-action">
                    ${getOrderActionButton(order)}
                </div>

            </div>

        </article>
    `;
}


function getOrderActionButton(order) {
    const status =
        order.status || "Placed";

    if (status === "Placed") {
        return `
            <button
                type="button"
                class="order-action-btn accept"
                onclick="changeOrderStatus(${order.id}, 'Accepted')"
            >
                Accept Order
            </button>
        `;
    }

    if (status === "Accepted") {
        return `
            <button
                type="button"
                class="order-action-btn preparing"
                onclick="changeOrderStatus(${order.id}, 'Preparing')"
            >
                Start Preparing
            </button>
        `;
    }

    if (status === "Preparing") {
        return `
            <button
                type="button"
                class="order-action-btn ready"
                onclick="changeOrderStatus(${order.id}, 'Ready')"
            >
                Mark as Ready
            </button>
        `;
    }

    return `
        <span class="ready-label">
            ✓ Ready for pickup
        </span>
    `;
}


async function changeOrderStatus(orderId, status) {
    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to update order"
            );
        }

        await loadStallOrders();

        if (currentUser &&
            currentUser.role === "student") {
            await loadStudentOrders();
        }

    } catch (error) {

        alert(error.message);
    }
}


function updateDashboardStats(orders) {
    const newOrders =
        orders.filter(
            order =>
                order.status === "Placed"
        ).length;

    const preparing =
        orders.filter(
            order =>
                order.status === "Preparing"
        ).length;

    const ready =
        orders.filter(
            order =>
                order.status === "Ready"
        ).length;

    const today =
        orders.filter(order => {

            if (!order.created_at) {
                return false;
            }

            const orderDate =
                new Date(order.created_at);

            const now =
                new Date();

            return (
                orderDate.getDate() ===
                    now.getDate() &&
                orderDate.getMonth() ===
                    now.getMonth() &&
                orderDate.getFullYear() ===
                    now.getFullYear()
            );

        }).length;

    document.getElementById(
        "newOrdersCount"
    ).textContent = newOrders;

    document.getElementById(
        "preparingOrdersCount"
    ).textContent = preparing;

    document.getElementById(
        "readyOrdersCount"
    ).textContent = ready;

    document.getElementById(
        "todayOrdersCount"
    ).textContent = today;
}


function renderStallOrders(filter = "all", button = null) {
    document
        .querySelectorAll(".order-tab")
        .forEach(tab =>
            tab.classList.remove("active")
        );

    if (button) {
        button.classList.add("active");
    }

    fetch(`${API_URL}/orders`)
        .then(response =>
            response.json()
        )
        .then(orders => {

            let filtered = orders;

            if (filter !== "all") {
                filtered =
                    orders.filter(
                        order =>
                            order.status === filter
                    );
            }

            const container =
                document.getElementById(
                    "stallOrdersList"
                );

            if (!container) {
                return;
            }

            if (!filtered.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✓</div>
                        <h3>No matching orders</h3>
                        <p>
                            There are no orders in this category.
                        </p>
                    </div>
                `;

                return;
            }

            container.innerHTML =
                filtered
                    .sort(
                        (a, b) =>
                            Number(b.id) -
                            Number(a.id)
                    )
                    .map(order =>
                        createOrderCard(order)
                    )
                    .join("");

        })
        .catch(error =>
            console.error(error)
        );
}



/* =========================
   INVENTORY
========================= */

async function loadInventory() {
    try {

        const response =
            await fetch(
                `${API_URL}/inventory`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load inventory"
            );
        }

        inventoryData =
            await response.json();

        updateInventorySummary();
        renderInventory();
        renderDashboardInventory();

        if (menuData.length) {
            renderMenu();
        }

    } catch (error) {

        console.error(
            "Inventory error:",
            error
        );
    }
}


function updateInventorySummary() {
    const totalItems =
        inventoryData.length;

    const totalStock =
        inventoryData.reduce(
            (sum, item) =>
                sum + Number(item.stock),
            0
        );

    const lowStock =
        inventoryData.filter(
            item =>
                Number(item.stock) <=
                Number(item.low_stock_limit)
        ).length;

    document.getElementById(
        "inventoryTotalItems"
    ).textContent = totalItems;

    document.getElementById(
        "inventoryTotalStock"
    ).textContent = totalStock;

    document.getElementById(
        "inventoryLowStock"
    ).textContent = lowStock;
}


function renderInventory() {
    const container =
        document.getElementById(
            "inventoryList"
        );

    if (!container) {
        return;
    }

    if (!inventoryData.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No inventory data</h3>
                <p>Inventory information will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        inventoryData
            .map(item => {

                const stock =
                    Number(item.stock);

                const limit =
                    Number(item.low_stock_limit);

                let status = "In Stock";
                let statusClass = "in-stock";

                if (stock <= 0) {
                    status = "Out of Stock";
                    statusClass = "out-stock";
                } else if (stock <= limit) {
                    status = "Low Stock";
                    statusClass = "low-stock";
                }

                const percentage =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            (stock / Math.max(limit * 4, 1)) *
                            100
                        )
                    );

                return `
                    <div class="inventory-row">

                        <div class="inventory-item-name">

                            <div class="inventory-icon">
                                ${getFoodEmoji(item.name)}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHtml(item.name)}
                                </strong>

                                <span>
                                    Item #${item.item_id}
                                </span>
                            </div>

                        </div>


                        <div class="inventory-stock">

                            <div class="stock-top">

                                <strong>
                                    ${stock}
                                </strong>

                                <span>
                                    units
                                </span>

                            </div>

                            <div class="stock-bar">

                                <span
                                    style="width: ${percentage}%"
                                ></span>

                            </div>

                        </div>


                        <span class="inventory-status ${statusClass}">
                            ${status}
                        </span>

                    </div>
                `;
            })
            .join("");
}


function renderDashboardInventory() {
    const container =
        document.getElementById(
            "dashboardInventory"
        );

    if (!container) {
        return;
    }

    const preview =
        inventoryData.slice(0, 5);

    if (!preview.length) {
        container.innerHTML = `
            <div class="empty-state compact-empty">
                <div class="empty-icon">📦</div>
                <h3>No inventory</h3>
            </div>
        `;

        return;
    }

    container.innerHTML =
        preview
            .map(item => {

                const stock =
                    Number(item.stock);

                const limit =
                    Number(item.low_stock_limit);

                let status = "In Stock";
                let className = "in-stock";

                if (stock <= 0) {
                    status = "Out of Stock";
                    className = "out-stock";
                } else if (stock <= limit) {
                    status = "Low Stock";
                    className = "low-stock";
                }

                return `
                    <div class="inventory-preview-row">

                        <div class="inventory-preview-name">

                            <span class="inventory-mini-icon">
                                ${getFoodEmoji(item.name)}
                            </span>

                            <strong>
                                ${escapeHtml(item.name)}
                            </strong>

                        </div>

                        <strong>
                            ${stock}
                        </strong>

                        <span class="inventory-status ${className}">
                            ${status}
                        </span>

                    </div>
                `;
            })
            .join("");
}



/* =========================
   ANALYTICS
========================= */

async function loadAnalytics() {
    try {

        const response =
            await fetch(
                `${API_URL}/analytics`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load analytics"
            );
        }

        const data =
            await response.json();

        renderAnalytics(data);

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );
    }
}


function renderAnalytics(data) {
    document.getElementById(
        "analyticsTotalOrders"
    ).textContent =
        data.totalOrders || 0;

    document.getElementById(
        "analyticsRevenue"
    ).textContent =
        `₹${Number(
            data.totalRevenue || 0
        ).toFixed(0)}`;

    const topItem =
        data.popularItems &&
        data.popularItems.length
            ? data.popularItems[0].name
            : "—";

    document.getElementById(
        "analyticsTopItem"
    ).textContent = topItem;


    const popularContainer =
        document.getElementById(
            "popularItemsList"
        );

    if (popularContainer) {

        if (
            !data.popularItems ||
            !data.popularItems.length
        ) {

            popularContainer.innerHTML = `
                <div class="empty-state compact-empty">
                    <h3>No sales data yet</h3>
                </div>
            `;

        } else {

            popularContainer.innerHTML =
                data.popularItems
                    .map(
                        (item, index) => `
                            <div class="popular-row">

                                <div class="popular-rank">
                                    ${index + 1}
                                </div>

                                <div class="popular-row-icon">
                                    ${getFoodEmoji(item.name)}
                                </div>

                                <div class="popular-row-info">

                                    <strong>
                                        ${escapeHtml(item.name)}
                                    </strong>

                                    <span>
                                        ${item.quantity} sold
                                    </span>

                                </div>

                            </div>
                        `
                    )
                    .join("");
        }
    }


    const statusContainer =
        document.getElementById(
            "orderStatusList"
        );

    if (statusContainer) {

        const statuses =
            data.ordersByStatus || [];

        if (!statuses.length) {

            statusContainer.innerHTML = `
                <div class="empty-state compact-empty">
                    <h3>No order data yet</h3>
                </div>
            `;

        } else {

            const total =
                statuses.reduce(
                    (sum, item) =>
                        sum + Number(item.count),
                    0
                );

            statusContainer.innerHTML =
                statuses
                    .map(item => {

                        const percentage =
                            total > 0
                                ? (
                                    Number(item.count) /
                                    total
                                ) * 100
                                : 0;

                        return `
                            <div class="status-row">

                                <div class="status-row-top">

                                    <span>
                                        ${item.status}
                                    </span>

                                    <strong>
                                        ${item.count}
                                    </strong>

                                </div>

                                <div class="status-progress">
                                    <span
                                        style="width: ${percentage}%"
                                    ></span>
                                </div>

                            </div>
                        `;
                    })
                    .join("");
        }
    }
}



/* =========================
   HELPERS
========================= */

function formatOrderDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}


function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



/* =========================
   INITIALIZATION
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        selectLoginRole("student");

        checkExistingLogin();

    }
);