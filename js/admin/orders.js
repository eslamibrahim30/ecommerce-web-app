import { collection, query, orderBy, onSnapshot, doc, updateDoc }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "../shared/auth.js";
import { toast, showConfirm } from "../shared/notifications.js";


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

  // Event Delegation
  tbody.addEventListener('click', handleOrderActions);

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
                <button class="btn-view js-view-details" data-index="${index}">View Details</button>
                ${order.status === 'Pending' ? `
                    <button class="btn-view js-confirm-order" style="background:#dcfce7; color:#166534; margin-left:5px;" data-id="${order.id}" data-index="${index}">Confirm</button>
                    <button class="btn-view destructive js-cancel-order" data-id="${order.id}" data-index="${index}">Cancel</button>
                ` : ''}
            </td>
        `;
    tbody.appendChild(tr);

    // Details Hidden Row
    const detailsTr = document.createElement('tr');
    detailsTr.id = `details-${index}`;
    detailsTr.style.display = 'none';

    const itemsList = order.items.map(item => {
      const qty = Number(item.qty || item.quantity || 0);
      const price = Number(item.price || 0);
      const total = qty * price;
      return `
            <div class="item-row" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} <strong>x${qty}</strong></span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }).join('');

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
/**
 * Event Handler for Delegated Clicks
 */
function handleOrderActions(event) {
  const target = event.target;

  // View Details
  if (target.matches('.js-view-details')) {
    const index = target.dataset.index;
    toggleDetails(index);
    return;
  }

  // Confirm Order
  if (target.matches('.js-confirm-order')) {
    const { id, index } = target.dataset;
    confirmOrder(id, index);
    return;
  }

  // Cancel Order
  if (target.matches('.js-cancel-order')) {
    const { id, index } = target.dataset;
    cancelOrder(id, index);
    return;
  }
}

/**
 * Action: Toggle Detail Visibility
 */
function toggleDetails(index) {
  const el = document.getElementById(`details-${index}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
  }
}

/**
 * Action: Confirm Order (Processing -> Shipped)
 */
async function confirmOrder(orderId, index) {
  const confirmed = await showConfirm(
    "Are you sure you want to mark this order as Shipped?",
    null,
    null,
    { title: "Confirm Shipment", confirmText: "Yes, Ship It", cancelText: "Cancel" }
  );

  if (confirmed) {
    try {
      // Update Firebase
      await updateDoc(doc(db, "orders", orderId), { status: "Shipped" });

      // Update local state and UI (optional as onSnapshot handles it, but good for feedback)
      if (orders[index]) orders[index].status = "Shipped";
      // No need to call renderOrders() manually if onSnapshot handles it, 
      // but if we want instant feedback before server roundtrip we could. 
      // However, onSnapshot is usually fast enough. 
      // We will rely on onSnapshot to re-render to avoid conflicts.
    } catch (error) {
      console.error("Confirmation failed:", error);
      toast.error("Could not update order. Please try again.");
    }
  }
}

/**
 * Action: Cancel Order in Firebase
 */
async function cancelOrder(orderId, index) {
  const confirmed = await showConfirm(
    "Are you sure you want to cancel this order?",
    null,
    null,
    { title: "Cancel Order", confirmText: "Yes, Cancel", cancelText: "No, Keep It" }
  );

  if (confirmed) {
    try {
      // Update Firebase
      await updateDoc(doc(db, "orders", orderId), { status: "Cancelled" });

      // Update local state
      if (orders[index]) orders[index].status = "Cancelled";
    } catch (error) {
      console.error("Cancellation failed:", error);
      toast.error("Could not cancel order. Please try again.");
    }
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);