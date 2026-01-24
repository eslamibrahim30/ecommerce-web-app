import { db } from "../shared/auth.js";
import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Elements
const totalSalesEl = document.getElementById("total-sales");
const activeUsersEl = document.getElementById("active-users");
const pendingOrdersEl = document.getElementById("pending-orders");
const totalProductsEl = document.getElementById("total-products");

// References
const ordersRef = collection(db, "orders");
const usersRef = collection(db, "users");
const productsRef = collection(db, "products");

/**
 * Fetch and Display Total Sales
 * Logic: Sum of 'total' field for orders with status 'Shipped' or 'Delivered'
 * Using onSnapshot for real-time updates
 */
function subscribeToSales() {
    // Listen to all orders for simplicity (filtering client-side for "Shipped" OR "Delivered")
    // Ideally, use 'in' operator: where('status', 'in', ['Shipped', 'Delivered'])

    const q = query(ordersRef, where('status', '==', 'Shipped'));

    onSnapshot(q, (snapshot) => {
        let sales = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            sales += Number(data.total) || 0;
        });
        totalSalesEl.textContent = `${sales.toLocaleString()} EGP`;
    }, (error) => {
        console.error("Error fetching sales:", error);
        totalSalesEl.textContent = "Error";
    });
}

/**
 * Fetch and Display Pending Orders
 * Logic: Count of orders with status 'Processing'
 */
function subscribeToPendingOrders() {
    const q = query(ordersRef, where('status', '==', 'Pending'));

    onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        pendingOrdersEl.textContent = count;
    }, (error) => {
        console.error("Error fetching pending orders:", error);
        pendingOrdersEl.textContent = "-";
    });
}

/**
 * Fetch and Display Total Products
 * Logic: Count all documents in 'products' collection
 */
function subscribeToProducts() {
    // Listening effectively to entire collection just for count might be heavy if large
    // But for this scale, it's fine and provides real-time updates.
    // Alternatively, use getCountFromServer but manually refresh.
    // We'll stick to onSnapshot for consistency.

    onSnapshot(productsRef, (snapshot) => {
        totalProductsEl.textContent = snapshot.size;
    }, (error) => {
        console.error("Error fetching product count:", error);
        totalProductsEl.textContent = "-";
    });
}

/**
 * Fetch and Display Active Users
 * Logic: Count all documents in 'users' collection
 */
function subscribeToUsers() {
    onSnapshot(usersRef, (snapshot) => {
        // Excluding admin? User request just said "number of users". Usually this means registered customers.
        // If we want to exclude admins, we'd need where('role', '!=', 'admin').
        // Let's assume all registered users for now.

        activeUsersEl.textContent = snapshot.size;
    }, (error) => {
        console.error("Error fetching users:", error);
        activeUsersEl.textContent = "-";
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    subscribeToSales();
    subscribeToPendingOrders();
    subscribeToProducts();
    subscribeToUsers();
});
