import { db } from "../shared/auth.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// DOM Elements
const productsTbody = document.getElementById("products-tbody");
const productModal = document.getElementById("product-modal");
const productForm = document.getElementById("product-form");
const addProductBtn = document.getElementById("add-product-btn");
const closeBtn = document.querySelector(".close-btn");
const modalTitle = document.getElementById("modal-title");

// State
let products = [];

// Collection Reference
const productsCol = collection(db, "products");

// Render Products Table
async function fetchAndRenderProducts() {
  try {
    productsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading products...</td></tr>`;

    const q = query(productsCol, orderBy("name"));
    const querySnapshot = await getDocs(q);

    products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    renderTable();
  } catch (error) {
    console.error("Error fetching products:", error);
    productsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading products.</td></tr>`;
  }
}

function renderTable() {
  productsTbody.innerHTML = "";
  if (products.length === 0) {
    productsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No products found.</td></tr>`;
    return;
  }

  products.forEach(product => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td><img src="${product.image || '/images/default-product.jpg'}" alt="${product.name}" class="product-thumb"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.price ? product.price.toLocaleString() : 0}</td>
            <td class="actions-cell">
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </td>
        `;

    // Add event listeners to buttons (since it's a module, inline onclick is harder to use)
    tr.querySelector(".edit-btn").addEventListener("click", () => openEditModal(product.id));
    tr.querySelector(".delete-btn").addEventListener("click", () => deleteProduct(product.id));

    productsTbody.appendChild(tr);
  });
}

// CRUD Operations
async function addProduct(productData) {
  try {
    await addDoc(productsCol, {
      ...productData,
      createdAt: new Date()
    });
    await fetchAndRenderProducts();
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Failed to add product");
  }
}

async function updateProduct(id, updatedProduct) {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, updatedProduct);
    await fetchAndRenderProducts();
  } catch (error) {
    console.error("Error updating product:", error);
    alert("Failed to update product");
  }
}

async function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
      await fetchAndRenderProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  }
}

// Modal Logic
function openAddModal() {
  modalTitle.textContent = "Add Product";
  productForm.reset();
  document.getElementById("product-id").value = "";
  productModal.style.display = "block";
}

function openEditModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  modalTitle.textContent = "Edit Product";
  document.getElementById("product-id").value = product.id;
  document.getElementById("name").value = product.name;
  document.getElementById("description").value = product.description;
  document.getElementById("price").value = product.price;
  document.getElementById("category").value = product.category;
  document.getElementById("image").value = product.image;

  productModal.style.display = "block";
}

function closeModal() {
  productModal.style.display = "none";
}

// Event Listeners
addProductBtn.addEventListener("click", openAddModal);
closeBtn.addEventListener("click", closeModal);

// window.addEventListener("click", (e) => {
//   if (e.target === productModal) closeModal();
// });

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const productId = document.getElementById("product-id").value;
  const productData = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price: parseFloat(document.getElementById("price").value),
    category: document.getElementById("category").value,
    image: document.getElementById("image").value
  };

  // Show loading state on button
  const submitBtn = productForm.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Saving...";
  submitBtn.disabled = true;

  if (productId) {
    await updateProduct(productId, productData);
  } else {
    await addProduct(productData);
  }

  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
  closeModal();
});

// Initial Render
fetchAndRenderProducts();
