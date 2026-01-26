import { db, checkUserLogin } from "../shared/auth.js";
import { toast, showConfirm } from "../shared/notifications.js";
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Global state to hold fetched orders
let orders = [];
let unsubscribe = null;

/**
 * Initialization: Fetch data from Firestore and render
 */
async function init() {
  const tbody = document.getElementById('customer-orders-body');
  if (!tbody) return; // Guard clause if element doesn't exist

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading orders...</td></tr>';

  const user = await checkUserLogin();
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  // Subscribe to real-time updates
  subscribeToOrders(user.uid);
}

/**
 * Subscribe to Orders from Firestore
 */
function subscribeToOrders(userId) {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(q, (querySnapshot) => {
    orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    renderOrders();
  }, (error) => {
    console.error("Error fetching orders:", error);
    const tbody = document.getElementById('customer-orders-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading orders.</td></tr>';
  });
}

/**
 * Main Render Function
 */
function renderOrders() {
  const tbody = document.getElementById('customer-orders-body');
  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>';
    return;
  }

  orders.forEach((order, index) => {
    // Handle Date
    const orderDate = order.createdAt?.seconds
      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
      : new Date(order.date || Date.now()).toLocaleDateString();

    // Main Row
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td style="font-weight:600">#${order.id.substring(0, 8)}...</td>
            <td>${orderDate}</td>
            <td style="font-weight:600">${Number(order.total).toFixed(2)} EGP</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <button class="btn-view" data-index="${index}">View Details</button>
            </td>
        `;
    tbody.appendChild(tr);

    // Details Hidden Row
    const detailsTr = document.createElement('tr');
    detailsTr.id = `details-${index}`;
    detailsTr.style.display = 'none';

    const itemsList = order.items ? order.items.map(item => `
            <div class="item-row" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} <strong>x${item.qty || item.quantity}</strong></span>
                <span>${(item.price * (item.qty || item.quantity)).toFixed(2)} EGP</span>
            </div>
        `).join('') : 'No items';

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
                        <p>${order.shippingAddress || 'N/A'}</p>
                        ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
                    </div>
                    <div class="detail-section">
                        <h4>Payment Details</h4>
                        <p>Method: ${order.paymentMethod}</p>
                    </div>
                </div>
            </td>
        `;
    tbody.appendChild(detailsTr);
  });

  // Attach Listeners
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.onclick = () => toggleDetails(btn.dataset.index);
  });

  document.querySelectorAll('.btn-cancel-link').forEach(btn => {
    btn.onclick = () => cancelOrder(btn.dataset.id, Number(btn.dataset.index));
  });
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

      // Update local state and UI
      orders[index].status = "Cancelled";
      renderOrders();
      toast.success("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancellation failed:", error);
      toast.error("Could not cancel order. Please try again.");
    }
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);