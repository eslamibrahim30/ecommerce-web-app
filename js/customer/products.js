import { db, checkUserLogin } from "../shared/auth.js";
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

function displayProducts(list) {
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

    list.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product-card";
        productDiv.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}" class="product-image">
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
                    <button class="add-cart-btn primary" style="padding: 5px 10px; margin-left: 5px;">Cart 🛒</button>
                </div>
            </div>
        `;

        productDiv.querySelector(".product-image").onclick = () => openProduct(product.id);
        productDiv.querySelector(".wishlist-action").onclick = () => addToWishlist(product.id);
        productDiv.querySelector(".add-cart-btn").onclick = () => addToCart(product.id);

        container.appendChild(productDiv);
    });
}

function openProduct(id) {
    window.location.href = "../customer/productDtls.html?id=" + id;
}

async function addToCart(id) {
    // Check authentication
    const user = await checkUserLogin();
    if (!user) {
        toast.error("Please login to add items to cart");
        setTimeout(() => {
            window.location.href = "/auth/login.html";
        }, 1500);
        return;
    }

    let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
    const product = products.find(p => p.id === id);

    // Check if item already exists
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
        toast.success("Quantity updated in cart");
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            qty: 1
        });
        toast.success("Added to cart");
    }

    localStorage.setItem("shopping_cart", JSON.stringify(cart));
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

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const product = products.find(p => p.id === id);

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
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
