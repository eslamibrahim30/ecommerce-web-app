import { db, checkUserLogin, getUserCartKey, getUserWishlistKey } from "../shared/auth.js";
import { toast } from "../shared/notifications.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let currentProduct = null;

function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadProduct() {
    const id = getProductId();
    const container = document.getElementById("productDetails");

    if (!id) {
        container.innerHTML = "Product not found";
        return;
    }

    try {
        const productDoc = await getDoc(doc(db, "products", id));

        if (!productDoc.exists()) {
            container.innerHTML = "Product not found";
            return;
        }

        currentProduct = { id: productDoc.id, ...productDoc.data() };
        renderProduct(currentProduct);

    } catch (error) {
        console.error("Error loading product:", error);
        container.innerHTML = "Error loading details.";
    }
}

async function renderProduct(product) {
    const container = document.getElementById("productDetails");

    // Get user's cart to calculate available stock
    const cartKey = await getUserCartKey();
    const cart = cartKey ? JSON.parse(localStorage.getItem(cartKey) || '[]') : [];

    // Calculate available stock
    const totalStock = product.stockQuantity ?? 0;
    const cartItem = cart.find(item => item.id === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;
    const availableStock = totalStock - inCartQty;

    // Determine stock status
    let stockDisplay = '';
    let addToCartDisabled = '';

    if (availableStock <= 0) {
        stockDisplay = '<p style="color: #ef4444; font-weight: 600;">Out of Stock</p>';
        addToCartDisabled = 'disabled';
    } else if (availableStock <= 5) {
        stockDisplay = `<p style="color: #f59e0b; font-weight: 600;">${availableStock} Left in Stock</p>`;
    } else {
        stockDisplay = `<p style="color: #10b981; font-weight: 600;">${availableStock} In Stock</p>`;
    }

    container.innerHTML = `
        <div class="card">
            <h2 class="product-title">${product.name}</h2>
            <img src="${product.image || '/images/no-image.jpeg'}" alt="${product.name}" class="product-image" style="max-width: 400px; height: auto;">
            <div class="product-info">
                <p class="product-category">${product.category || 'General'}</p>
                <p>${product.description || 'No description available'}</p>
                <p class="product-price">${Number(product.price).toLocaleString()} EGP</p>
                ${stockDisplay}
                <div class="flex gap-2">
                    <button class="primary mt-4" id="add-to-wishlist-btn">
                        Add to Wishlist ❤️
                    </button>
                    <button class="primary mt-4" id="add-to-cart-btn" style="background-color: #2ecc71;" ${addToCartDisabled}>
                        Add to Cart 🛒
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("add-to-wishlist-btn").onclick = () => addToWishlist(product.id);

    const addToCartBtn = document.getElementById("add-to-cart-btn");
    if (!addToCartDisabled) {
        addToCartBtn.onclick = () => addToCart(product.id, availableStock);
    }
}

async function addToCart(id, availableStock) {
    // Check authentication
    const user = await checkUserLogin();
    if (!user) {
        toast.error("Please login to add items to cart");
        setTimeout(() => {
            window.location.href = "/auth/login.html";
        }, 1500);
        return;
    }

    if (!currentProduct) return;

    // Show quantity selection modal
    showQuantityModal(currentProduct, availableStock);
}

function showQuantityModal(product, availableStock) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'quantity-modal-overlay';
    overlay.innerHTML = `
        <div class="quantity-modal">
            <div class="quantity-modal-header">
                <h3 class="quantity-modal-title">Select Quantity</h3>
            </div>
            <div class="quantity-modal-body">
                <div class="quantity-product-info">
                    <img src="${product.image || '/images/no-image.jpeg'}" alt="${product.name}" class="quantity-product-image">
                    <div class="quantity-product-details">
                        <h4>${product.name}</h4>
                        <div class="quantity-product-price">${product.price.toLocaleString()} EGP</div>
                    </div>
                </div>
                <div class="quantity-selector">
                    <label>Quantity</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" id="qty-decrease">−</button>
                        <input type="number" class="quantity-input" id="qty-input" value="1" min="1" max="${availableStock}" readonly>
                        <button class="quantity-btn" id="qty-increase">+</button>
                    </div>
                    <div class="stock-info">${availableStock} available</div>
                </div>
            </div>
            <div class="quantity-modal-footer">
                <button class="btn btn-cancel-qty">Cancel</button>
                <button class="btn btn-add-qty">Add to Cart</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => overlay.classList.add('show'), 10);

    // Get elements
    const qtyInput = overlay.querySelector('#qty-input');
    const decreaseBtn = overlay.querySelector('#qty-decrease');
    const increaseBtn = overlay.querySelector('#qty-increase');
    const cancelBtn = overlay.querySelector('.btn-cancel-qty');
    const addBtn = overlay.querySelector('.btn-add-qty');

    // Update button states
    const updateButtons = () => {
        const currentQty = parseInt(qtyInput.value);
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= availableStock;
    };

    // Quantity controls
    decreaseBtn.onclick = () => {
        const currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
            updateButtons();
        }
    };

    increaseBtn.onclick = () => {
        const currentQty = parseInt(qtyInput.value);
        if (currentQty < availableStock) {
            qtyInput.value = currentQty + 1;
            updateButtons();
        }
    };

    // Close modal
    const closeModal = () => {
        overlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    // Add to cart
    addBtn.onclick = async () => {
        const quantity = parseInt(qtyInput.value);
        await addProductToCart(product, quantity);
        closeModal();
        // Refresh display to update stock
        await renderProduct(currentProduct);
    };

    updateButtons();
}

async function addProductToCart(product, quantity) {
    const cartKey = await getUserCartKey();
    if (!cartKey) return;

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    // Check if item already exists
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.qty += quantity;
        toast.success(`Added ${quantity} more. Total: ${existingItem.qty}`);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            qty: quantity
        });
        toast.success(`Added ${quantity} to cart`);
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
}

async function addToWishlist(id) {
    // Check authentication
    const user = await checkUserLogin();
    if (!user) {
        toast.error("Please login to add items to wishlist");
        setTimeout(() => {
            window.location.href = "/auth/login.html";
        }, 1500);
        return;
    }

    const wishlistKey = await getUserWishlistKey();
    if (!wishlistKey) return;

    let wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(currentProduct);
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        toast.success("Added to wishlist");
    } else {
        toast.info("Already in wishlist");
    }
}

loadProduct();

// Listen for auth state changes to refresh stock display
import { auth } from "../shared/auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    // Refresh product display when auth state changes (login/logout)
    // This ensures stock calculations use the correct user's cart
    if (currentProduct) {
        renderProduct(currentProduct);
    }
});
