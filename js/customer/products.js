import { db } from "../shared/auth.js";
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
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    list.forEach(product => {
        const productDiv = document.createElement("div");
        productDiv.className = "product-card";
        productDiv.innerHTML = `
            <img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p><strong>${product.price} EGP</strong></p>

            <button class="wishlist-btn">
                Add to Wishlist
            </button>
        `;

        productDiv.querySelector("img").onclick = () => openProduct(product.id);
        productDiv.querySelector(".wishlist-btn").onclick = () => addToWishlist(product.id);

        container.appendChild(productDiv);
    });
}

function openProduct(id) {
    window.location.href = "product.html?id=" + id;
}

function addToWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const product = products.find(p => p.id === id);

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        alert("Added to wishlist");
    } else {
        alert("Already in wishlist");
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
fetchProducts();
