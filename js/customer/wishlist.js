function loadWishlist() {
    const container = document.getElementById("wishlistContainer");
    const emptyState = document.getElementById("emptyState");

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    container.innerHTML = "";

    if (wishlist.length === 0) {
        container.style.display = "none";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    container.style.display = "grid";
    if (emptyState) emptyState.style.display = "none";

    wishlist.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "product-card";
        itemDiv.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}" class="product-image">
            </div>
            <div class="product-info">
                <span class="product-category">${item.category || 'General'}</span>
                <h3 class="product-title">${item.name}</h3>
                <div class="product-footer">
                    <div class="product-price">${item.price.toLocaleString()} <span class="currency">EGP</span></div>
                    <button class="btn destructive sm remove-btn">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
        itemDiv.querySelector(".remove-btn").onclick = () => removeFromWishlist(item.id);
        container.appendChild(itemDiv);
    });
}

function removeFromWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    wishlist = wishlist.filter(item => item.id !== id);

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    loadWishlist();
}

loadWishlist();
