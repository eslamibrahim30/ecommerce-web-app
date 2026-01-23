const products = [
  {
    id: 1,
    name: "Laptop",
    description: "High performance laptop",
    price: 15000,
    category: "Electronics",
    image: "/images/1.jpg",
  },
  {
    id: 2,
    name: "Smartphone",
    description: "Latest mobile phone",
    price: 8000,
    category: "Electronics",
    image: "/images/2.1.jpeg",
  },
  {
    id: 3,
    name: "Headphones",
    description: "Wireless headphones",
    price: 1200,
    category: "Electronics",
    image: "/images/3.1.jpg",
  },
  {
    id: 4,
    name: "T-Shirt",
    description: "Cotton t-shirt",
    price: 250,
    category: "Clothes",
    image: "/images/4.webp",
  },
  {
    id: 5,
    name: "Jeans",
    description: "Blue jeans pants",
    price: 600,
    category: "Clothes",
    image: "/images/5.webp",
  },
  {
    id: 6,
    name: "Jacket",
    description: "Winter jacket",
    price: 1200,
    category: "Clothes",
    image: "/images/6.jfif",
  },
  {
    id: 7,
    name: "Book A",
    description: "Interesting novel",
    price: 100,
    category: "Books",
    image: "/images/7.jpg",
  },
  {
    id: 8,
    name: "Book B",
    description: "Science book",
    price: 150,
    category: "Books",
    image: "/images/8.jfif",
  },
  {
    id: 9,
    name: "Book C",
    description: "Programming guide",
    price: 200,
    category: "Books",
    image: "/images/9.jpg",
  },
];

function displayProducts(list) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  list.forEach((product) => {
    container.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" onclick="openProduct(${product.id})">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>${product.price} EGP</p>

                <button onclick="addToWishlist(${product.id})">
                    Add to Wishlist
                </button>
            </div>
        `;
  });
}

function openProduct(id) {
  window.location.href = "productDtls.html?id=" + id;
}

function addToWishlist(id) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const product = products.find((p) => p.id === id);

  if (!wishlist.some((item) => item.id === id)) {
    wishlist.push(product);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    alert("Added to wishlist");
  } else {
    alert("Already in wishlist");
  }
}

document.getElementById("searchInput").addEventListener("input", function () {
  const value = this.value.toLowerCase();

  const filtered = products.filter((p) => p.name.toLowerCase().includes(value));

  displayProducts(filtered);
});

document
  .getElementById("categoryFilter")
  .addEventListener("change", function () {
    const category = this.value;

    if (category === "all") {
      displayProducts(products);
    } else {
      const filtered = products.filter((p) => p.category === category);
      displayProducts(filtered);
    }
  });

displayProducts(products);
