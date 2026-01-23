import { collection, query, orderBy, onSnapshot, doc, updateDoc }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "../shared/auth.js";


// Global state to hold fetched orders
let orders = [];
let unsubscribe = null;

// Orders CRUD

const ordersRef = collection(db, "orders");

/**
 * Initialization: Fetch data from Firestore and render
 */
async function init() {
  const tbody = document.getElementById('admin-orders-body');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading orders...</td></tr>';

  subscribeToOrders();
}

function subscribeToOrders() {
  // Admin sees ALL orders
  const q = query(ordersRef, orderBy("createdAt", "desc"));

  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(q, (snapshot) => {
    orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    renderOrders();
  }, (error) => {
    console.error("Error fetching admin orders:", error);
    document.getElementById('admin-orders-body').innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading orders.</td></tr>';
  });
}

/**
 * Main Render Function
 */
function renderOrders() {
  const tbody = document.getElementById('admin-orders-body');
  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>';
    return;
  }

  orders.forEach((order, index) => {
    // Handle Date: Firestore stores dates as Timestamps, static code uses strings
    const orderDate = order.createdAt?.seconds
      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
      : new Date(order.date || Date.now()).toLocaleDateString();

    // Main Row
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td style="font-weight:600">#${order.id.substring(0, 8)}...</td>
            <td>${orderDate}</td>
            <td style="font-weight:600">$${Number(order.total).toFixed(2)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <button class="btn-view" onclick="toggleDetails(${index})">View Details</button>
                ${order.status === 'Processing' ? `
                    <button class="btn-view" style="background:#dcfce7; color:#166534; margin-left:5px;" onclick="confirmOrder('${order.id}', ${index})">Confirm</button>
                    <button class="btn-view destructive" onclick="cancelOrder('${order.id}', ${index})">Cancel</button>
                ` : ''}
            </td>
        `;
    tbody.appendChild(tr);

    // Details Hidden Row
    const detailsTr = document.createElement('tr');
    detailsTr.id = `details-${index}`;
    detailsTr.style.display = 'none';

    const itemsList = order.items.map(item => `
            <div class="item-row" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} <strong>x${item.quantity}</strong></span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

    detailsTr.innerHTML = `
            <td colspan="5">
                <div class="order-details-container" style="padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 10px 0;">
                    <div class="detail-section">
                        <h4>Items Purchased</h4>
                        ${itemsList}
                    </div>
                    <hr>
                    <div class="detail-section">
                        <h4>Delivery Address</h4>
                        <p>${order.shippingAddress}</p>
                        ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
                    </div>
                    <div class="detail-section">
                        <h4>Payment Details</h4>
                        <p>Method: ${order.paymentMethod}</p>
                        <p>Status: <span style="color:green">Paid</span></p>
                    </div>
                </div>
            </td>
        `;
    tbody.appendChild(detailsTr);
  });
}

/**
 * Action: Toggle Detail Visibility
 */
window.toggleDetails = function (index) {
  const el = document.getElementById(`details-${index}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
  }
};

/**
 * Action: Confirm Order (Processing -> Shipped)
 */
window.confirmOrder = async function (orderId, index) {
  if (confirm("Are you sure you want to mark this order as Shipped?")) {
    try {
      // Update Firebase
      await updateDoc(doc(db, "orders", orderId), { status: "Shipped" });

      // Update local state and UI (optional as onSnapshot handles it, but good for feedback)
      orders[index].status = "Shipped";
      renderOrders();
      alert("Order marked as Shipped.");
    } catch (error) {
      console.error("Confirmation failed:", error);
      alert("Could not update order. Please try again.");
    }
  }
};

/**
 * Action: Cancel Order in Firebase
 */
window.cancelOrder = async function (orderId, index) {
  if (confirm("Are you sure you want to cancel this order?")) {
    try {
      // Update Firebase
      await updateDoc(doc(db, "orders", orderId), { status: "Cancelled" });

      // Update local state and UI
      orders[index].status = "Cancelled";
      renderOrders();
      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancellation failed:", error);
      alert("Could not cancel order. Please try again.");
    }
  }
};

// Start the app
document.addEventListener('DOMContentLoaded', init);