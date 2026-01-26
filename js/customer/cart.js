
import { auth, db, checkUserLogin, getUserCartKey } from "../shared/auth.js";
import { toast } from "../shared/notifications.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

async function getCart() {
    const cartKey = await getUserCartKey();
    if (!cartKey) return [];
    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
}

async function saveCart(cart) {
    const cartKey = await getUserCartKey();
    if (!cartKey) return;
    localStorage.setItem(cartKey, JSON.stringify(cart));
    renderCart();
}

async function renderCart() {
    const cart = await getCart();
    const listContainer = document.getElementById('cart-items-list');

    if (cart.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <p style="color: var(--text-muted);">Your cart is empty.</p>
                <a href="/index.html" style="color: var(--primary); font-weight: 600;">Go Shopping</a>
            </div>`;
        updateTotals(0);
        return;
    }

    listContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}" class="item-img" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-price">${Number(item.price).toFixed(2)} EGP</div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" style="color: var(--primary);" data-index="${index}" data-change="-1">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" style="color: var(--primary);" data-index="${index}" data-change="1">+</button>
                <button class="btn-remove" data-index="${index}">Remove</button>
            </div>
        </div>
    `).join('');

    // Re-attach event listeners since inline onclicks don't work well with modules
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => updateQty(Number(btn.dataset.index), Number(btn.dataset.change));
    });
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.onclick = () => removeItem(Number(btn.dataset.index));
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateTotals(total);
}

async function updateQty(index, change) {
    const cart = await getCart();
    cart[index].qty += change;

    if (cart[index].qty < 1) {
        removeItem(index);
    } else {
        saveCart(cart);
    }
}

async function removeItem(index) {
    const cart = await getCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function updateTotals(total) {
    document.getElementById('subtotal').textContent = `${total.toFixed(2)} EGP`;
    document.getElementById('grand-total').textContent = `${total.toFixed(2)} EGP`;
}

async function checkout() {
    const user = await checkUserLogin();
    if (!user) {
        toast.error("Please login to checkout.");
        window.location.href = "/auth/login.html";
        return;
    }

    const cart = await getCart();
    if (cart.length === 0) {
        toast.warning("Your cart is empty!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = {
        userId: user.uid,
        userEmail: user.email,
        items: cart,
        total: total,
        status: "Pending",
        createdAt: serverTimestamp(),
        date: new Date().toISOString(), // Fallback
        shippingAddress: "123 Main St (Default)", // Placeholder as we don't have address form yet
        paymentMethod: "Cash on Delivery"
    };

    try {
        await addDoc(collection(db, "orders"), order);
        const cartKey = await getUserCartKey();
        if (cartKey) {
            localStorage.removeItem(cartKey);
        }
        toast.success("Order placed successfully!");
        setTimeout(() => {
            window.location.href = "orders.html";
        }, 1000);
    } catch (error) {
        console.error("Checkout Error:", error);
        toast.error("Failed to place order. Please try again.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const user = await checkUserLogin();
    if (!user) {
        window.location.href = "/auth/login.html";
        return;
    }

    // Make updateQty and removeItem global if needed, but better to attach listeners
    // In modules, global scope is not window. 
    // We attached listeners in renderCart.

    renderCart();

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = checkout;
    }
});