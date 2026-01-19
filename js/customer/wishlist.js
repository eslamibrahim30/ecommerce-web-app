function loadWishlist() {
    const container = document.getElementById("wishlistContainer");

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    container.innerHTML = "";

    if (wishlist.length === 0) {
        container.innerHTML = "<p>No items in wishlist</p>";
        return;
    }

    wishlist.forEach(item => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${item.image}">
                <h3>${item.name}</h3>
                <p>${item.price} EGP</p>

                <button onclick="removeFromWishlist(${item.id})">
                    Remove
                </button>
            </div>
        `;
    });
}

function removeFromWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    wishlist = wishlist.filter(item => item.id !== id);

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    loadWishlist();
}

loadWishlist();
