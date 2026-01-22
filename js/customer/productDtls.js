const products = [
    {
        id: 1,
        name: "Laptop",
        description: "High performance laptop",
        price: 15000,
        category: "Electronics",
        image: "/images/1.jpg"
    },
    {
        id: 2,
        name: "Smartphone",
        description: "Latest mobile phone",
        price: 8000,
        category: "Electronics",
        image: "/images/2.1.jpeg"
    },
    {
        id: 3,
        name: "Headphones",
        description: "Wireless headphones",
        price: 1200,
        category: "Electronics",
        image: "/images/3.1.jpg"
    },
    {
        id: 4,
        name: "T-Shirt",
        description: "Cotton t-shirt",
        price: 250,
        category: "Clothes",
        image: "/images/4.webp"
    },
    {
        id: 5,
        name: "Jeans",
        description: "Blue jeans pants",
        price: 600,
        category: "Clothes",
        image: "/images/5.webp"
    },
    {
        id: 6,
        name: "Jacket",
        description: "Winter jacket",
        price: 1200,
        category: "Clothes",
        image: "/images/6.jfif"
    },
    {
        id: 7,
        name: "Book A",
        description: "Interesting novel",
        price: 100,
        category: "Books",
        image: "/images/7.jpg"
    },
    {
        id: 8,
        name: "Book B",
        description: "Science book",
        price: 150,
        category: "Books",
        image: "/images/8.jfif"
    },
    {
        id: 9,
        name: "Book C",
        description: "Programming guide",
        price: 200,
        category: "Books",
        image: "/images/9.jpg"
    },
    
];


function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function loadProduct() {
    const id = getProductId();

    const product = products.find(p => p.id == id);

    const container = document.getElementById("productDetails");

    if (!product) {
        container.innerHTML = "Product not found";
        return;
    }

    container.innerHTML = `
        <div class="card">
            <h2 class="product-title">${product.name}</h2>
            <img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}" class="product-image" style="max-width: 400px; height: auto;">
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <p>${product.description}</p>
                <p class="product-price">${product.price} EGP</p>
                <button class="primary mt-4" id="add-to-wishlist-btn">
                    Add to Wishlist ❤️
                </button>
            </div>
        </div>
    `;
    document.getElementById("add-to-wishlist-btn").onclick = () => addToWishlist(product.id);
}

function addToWishlist(id) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    const product = products.find(p => p.id === id);

    if (!wishlist.some(item => item.id === id)) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        alert("Added to wishlist");
    }
}

loadProduct();
