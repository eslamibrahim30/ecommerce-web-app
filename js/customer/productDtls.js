import { db } from "../shared/auth.js";
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

function renderProduct(product) {
    const container = document.getElementById("productDetails");

    container.innerHTML = `
        <div class="card">
            <h2 class="product-title">${product.name}</h2>
            <img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}" class="product-image" style="max-width: 400px; height: auto;">
            <div class="product-info">
                <p class="product-category">${product.category || 'General'}</p>
                <p>${product.description || 'No description available'}</p>
                <p class="product-price">${Number(product.price).toLocaleString()} EGP</p>
                <div class="flex gap-2">
                    <button class="primary mt-4" id="add-to-wishlist-btn">
                        Add to Wishlist ❤️
                    </button>
                    <button class="primary mt-4" id="add-to-cart-btn" style="background-color: #2ecc71;">
                        Add to Cart 🛒
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("add-to-wishlist-btn").onclick = () => addToWishlist(product.id);
    document.getElementById("add-to-cart-btn").onclick = () => addToCart(product.id);
}

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];

    // Check if item already exists
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
        toast.success("Quantity updated in cart");
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: Number(currentProduct.price),
            image: currentProduct.image,
            qty: 1
        });
        toast.success("Added to cart");
    }

    localStorage.setItem("shopping_cart", JSON.stringify(cart));
}

function addToWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(currentProduct);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        toast.success("Added to wishlist");
    } else {
        toast.info("Already in wishlist");
    }
}

loadProduct();
