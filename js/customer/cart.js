
function getCart() {
    const cart = localStorage.getItem('shopping_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const cart = getCart();
    const listContainer = document.getElementById('cart-items-list');
    
    if (cart.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <p style="color: var(--text-muted);">Your cart is empty.</p>
                <a href="home.html" style="color: var(--primary); font-weight: 600;">Go Shopping</a>
            </div>`;
        updateTotals(0);
        return;
    }

    listContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="item-img"></div>
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                <button class="btn-remove" onclick="removeItem(${index})">Remove</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateTotals(total);
}

function updateQty(index, change) {
    const cart = getCart();
    cart[index].qty += change;
    
    if (cart[index].qty < 1) {
        removeItem(index);
    } else {
        saveCart(cart);
    }
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function updateTotals(total) {
    document.getElementById('subtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `$${total.toFixed(2)}`;
}

// Initial Data Seed (Only for testing if cart is empty)
function seedTestItems() {
    if (getCart().length === 0) {
        const testItems = [
            { id: 101, name: "Wireless Headphones", price: 149.99, qty: 1 },
            { id: 102, name: "Phone Case", price: 37.50, qty: 2 }
        ];
        saveCart(testItems);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // seedTestItems();
    renderCart();
});