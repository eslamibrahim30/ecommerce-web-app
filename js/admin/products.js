import { db } from "../shared/auth.js";
import { toast, showConfirm } from "../shared/notifications.js";
import { validate, validateMin } from "../shared/validation.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
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
    productsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading products...</td></tr>`;

    const q = query(productsCol, orderBy("name"));
    const querySnapshot = await getDocs(q);

    products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    renderTable();
  } catch (error) {
    console.error("Error fetching products:", error);
    productsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error loading products.</td></tr>`;
  }
}

function renderTable() {
  productsTbody.innerHTML = "";
  if (products.length === 0) {
    productsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No products found.</td></tr>`;
    return;
  }

  products.forEach(product => {
    const tr = document.createElement("tr");
    const stockQty = product.stockQuantity ?? 0;
    const stockClass = stockQty === 0 ? 'style="color: #ef4444; font-weight: 600;"' : '';
    tr.innerHTML = `
            <td><img src="${product.image || '/images/no-image.jpeg'}" alt="${product.name}" class="product-thumb"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.price ? product.price.toLocaleString() : 0}</td>
            <td ${stockClass}>${stockQty}</td>
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
    toast.error("Failed to add product");
  }
}

async function updateProduct(id, updatedProduct) {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, updatedProduct);
    await fetchAndRenderProducts();
  } catch (error) {
    console.error("Error updating product:", error);
    toast.error("Failed to update product");
  }
}

async function deleteProduct(id) {
  const confirmed = await showConfirm(
    "Are you sure you want to delete this product?",
    null,
    null,
    { title: "Delete Product", confirmText: "Yes, Delete", cancelText: "Cancel" }
  );

  if (confirmed) {
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
      await fetchAndRenderProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
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
  document.getElementById("stockQuantity").value = product.stockQuantity ?? 0;

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
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const priceStr = document.getElementById("price").value.trim();
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").value.trim();
  const stockQuantityStr = document.getElementById("stockQuantity").value.trim();

  // 1. Check if name is empty
  if (!name) {
    toast.error("Product name is required");
    return;
  }

  // 2. Check if name is in valid format (at least 2 chars)
  if (!validate(name, 'productName')) {
    return;
  }

  // 3. Check if description is empty
  if (!description) {
    toast.error("Description is required");
    return;
  }

  // 4. Check if description is in valid format (at least 10 chars)
  if (!validate(description, 'description')) {
    return;
  }

  // 5. Check if price is empty
  if (!priceStr) {
    toast.error("Price is required");
    return;
  }

  // 6. Check if price in valid format
  if (!validate(priceStr, 'price')) {
    return;
  }

  const price = parseFloat(priceStr);

  // Check if price is negative
  if (price < 0) {
    toast.error("Price cannot be negative");
    return;
  }

  // Validate price is greater than 0
  if (!validateMin(price, 0.01, "Price")) {
    return;
  }

  // 7. Check if Category is selected
  if (!category) {
    toast.error("Please select a category");
    return;
  }

  // 8. Check if image url is empty
  if (!image) {
    toast.error("Image URL is required");
    return;
  }

  // 9. Check if it in valid format
  if (!validate(image, 'imageUrl')) {
    return;
  }

  // 10. Check if stock quantity is empty
  if (!stockQuantityStr) {
    toast.error("Stock quantity is required");
    return;
  }

  // 11. Check if stock quantity in valid format
  const stockQuantity = parseInt(stockQuantityStr);

  if (stockQuantity < 0 || isNaN(stockQuantity)) {
    toast.error("Stock quantity must be a valid number");
    return;
  }

  // Check if stock quantity is negative
  if (stockQuantity < 0) {
    toast.error("Stock quantity cannot be negative");
    return;
  }

  const productData = {
    name,
    description,
    price,
    category,
    image: image || '/images/no-image.jpeg',
    stockQuantity
  };

  // Check for duplicates (exclude current product if editing)
  const isDuplicate = products.some(p =>
    p.name.toLowerCase() === productData.name.toLowerCase() && p.id !== productId
  );

  if (isDuplicate) {
    toast.error("A product with this name already exists.");
    return;
  }

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

// Categories Logic
function populateCategories() {
  const categorySelect = document.getElementById("category");
  const categoriesRef = collection(db, "categories");
  const q = query(categoriesRef, orderBy("name"));

  onSnapshot(q, (snapshot) => {
    const categories = [];
    snapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });

    // Save current selection if any
    const currentVal = categorySelect.value;

    // Clear and add default
    categorySelect.innerHTML = '<option value="">Select a category</option>';

    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name; // Storing name as value based on current usage
      option.textContent = cat.name; // You might want to show description or icon too?
      categorySelect.appendChild(option);
    });

    // Restore selection if it still exists
    if (categories.some(c => c.name === currentVal)) {
      categorySelect.value = currentVal;
    }
  }, (error) => {
    console.error("Error fetching categories:", error);
  });
}

// Initial Render
populateCategories();
fetchAndRenderProducts();
