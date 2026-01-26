import { db, checkUserLogin, getUserCartKey, getUserWishlistKey } from "../shared/auth.js";
import { toast } from "../shared/notifications.js";
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

let products = [];

async function fetchProducts() {
    try {
        const productsCol = collection(db, "products");
        const q = query(productsCol, orderBy("name"));
        const querySnapshot = await getDocs(q);

        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        document.getElementById("productsContainer").innerHTML = "<p>Error loading products.</p>";
    }
}

async function displayProducts(list) {
    const container = document.getElementById("productsContainer");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">No products found</h3>
                <p class="empty-state-text">Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }

    // Get user's cart to calculate available stock
    const cartKey = await getUserCartKey();
    const cart = cartKey ? JSON.parse(localStorage.getItem(cartKey) || '[]') : [];

    list.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product-card";

        // Calculate available stock
        const totalStock = product.stockQuantity ?? 0;
        const cartItem = cart.find(item => item.id === product.id);
        const inCartQty = cartItem ? cartItem.qty : 0;
        const availableStock = totalStock - inCartQty;

        // Determine stock status
        let stockBadgeHTML = '';
        let stockClass = '';
        let addToCartDisabled = '';

        if (availableStock <= 0) {
            stockBadgeHTML = '<div class="stock-badge out-of-stock">Out of Stock</div>';
            stockClass = 'out-of-stock';
            addToCartDisabled = 'disabled';
        } else if (availableStock <= 5) {
            stockBadgeHTML = `<div class="stock-badge low-stock">${availableStock} Left</div>`;
        } else {
            stockBadgeHTML = `<div class="stock-badge in-stock">In Stock</div>`;
        }

        productDiv.className = `product-card ${stockClass}`;
        productDiv.innerHTML = `
            <div class="product-image-wrapper">
                ${stockBadgeHTML}
                <img src="${product.image || '/images/no-image.jpeg'}" alt="${product.name}" class="product-image">
                <div class="product-actions">
                    <button class="product-action-btn wishlist-action" title="Add to Wishlist">❤️</button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category || 'General'}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                    <div class="product-price">${product.price.toLocaleString()} <span class="currency">EGP</span></div>
                    <button class="add-cart-btn primary" style="padding: 5px 10px; margin-left: 5px;" ${addToCartDisabled}>Cart 🛒</button>
                </div>
            </div>
        `;

        productDiv.querySelector(".product-image").onclick = () => openProduct(product.id);
        productDiv.querySelector(".wishlist-action").onclick = () => addToWishlist(product.id);

        const addCartBtn = productDiv.querySelector(".add-cart-btn");
        if (!addToCartDisabled) {
            addCartBtn.onclick = () => addToCart(product.id, availableStock);
        }

        container.appendChild(productDiv);
    });
}

function openProduct(id) {
    window.location.href = "../customer/productDtls.html?id=" + id;
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

    const product = products.find(p => p.id === id);
    if (!product) return;

    // Show quantity selection modal
    showQuantityModal(product, availableStock);
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
                    <img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}" class="quantity-product-image">
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
        // Refresh display to update stock badges
        displayProducts(products);
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
    const product = products.find(p => p.id === id);

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(product);
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        toast.success("Added to wishlist");
    } else {
        toast.info("Already in wishlist");
    }
}

// Search and Filter Listeners
document.getElementById("searchInput").addEventListener("input", function () {
    const value = this.value.toLowerCase();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(value)
    );
    displayProducts(filtered);
});

document.getElementById("categoryFilter").addEventListener("change", function () {
    const category = this.value;
    if (category === "all") {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
});

// Initial Fetch
fetchCategories();
fetchProducts();

// Listen for auth state changes to refresh stock display
import { auth } from "../shared/auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    // Refresh product display when auth state changes (login/logout)
    // This ensures stock calculations use the correct user's cart
    if (products.length > 0) {
        displayProducts(products);
    }
});

async function fetchCategories() {
    try {
        const categoriesCol = collection(db, "categories");
        const q = query(categoriesCol, orderBy("name"));
        const querySnapshot = await getDocs(q);

        const filterSelect = document.getElementById("categoryFilter");

        querySnapshot.forEach((doc) => {
            const cat = doc.data();
            const option = document.createElement("option");
            option.value = cat.name;
            option.textContent = cat.name; // Could add icon if stored: `${cat.icon || ''} ${cat.name}`
            filterSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}
