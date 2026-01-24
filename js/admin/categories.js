import { db } from "../shared/auth.js";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// DOM Elements
const categoriesTbody = document.getElementById("categories-tbody");
const categoryModal = document.getElementById("category-modal");
const categoryForm = document.getElementById("category-form");
const addCategoryBtn = document.getElementById("add-category-btn");
const closeBtn = document.querySelector(".close-btn");
const modalTitle = document.getElementById("modal-title");

// State
let categories = [];
let unsubscribe = null;

// Collection Reference
const categoriesRef = collection(db, "categories");

// Subscribe to Categories
function subscribeToCategories() {
    const q = query(categoriesRef, orderBy("name"));

    if (unsubscribe) {
        unsubscribe();
    }

    // Real-time listener
    unsubscribe = onSnapshot(q, (snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
    }, (error) => {
        console.error("Error fetching categories:", error);
        categoriesTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error loading categories.</td></tr>`;
    });
}

// Render Table
function renderTable() {
    categoriesTbody.innerHTML = "";
    if (categories.length === 0) {
        categoriesTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No categories found.</td></tr>`;
        return;
    }

    categories.forEach(category => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight: 500;">${category.name}</td>
            <td>${category.description || '-'}</td>
            <td class="actions-cell">
                <button class="edit-btn" data-id="${category.id}">Edit</button>
                <button class="delete-btn" data-id="${category.id}">Delete</button>
            </td>
        `;

        // Add event listeners
        tr.querySelector(".edit-btn").addEventListener("click", () => openEditModal(category.id));
        tr.querySelector(".delete-btn").addEventListener("click", () => deleteCategory(category.id));

        categoriesTbody.appendChild(tr);
    });
}

// CRUD Operations
async function addCategory(categoryData) {
    try {
        await addDoc(categoriesRef, {
            ...categoryData,
            createdAt: new Date()
        });
        // No need to manually fetch, onSnapshot handles it
    } catch (error) {
        console.error("Error adding category:", error);
        alert("Failed to add category");
    }
}

async function updateCategory(id, updatedData) {
    try {
        const categoryDoc = doc(db, "categories", id);
        await updateDoc(categoryDoc, updatedData);
    } catch (error) {
        console.error("Error updating category:", error);
        alert("Failed to update category");
    }
}

async function deleteCategory(id) {
    if (confirm("Are you sure you want to delete this category?")) {
        try {
            const categoryDoc = doc(db, "categories", id);
            await deleteDoc(categoryDoc);
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        }
    }
}

// Modal Logic
function openAddModal() {
    modalTitle.textContent = "Add Category";
    categoryForm.reset();
    document.getElementById("category-id").value = "";
    categoryModal.style.display = "block";
}

function openEditModal(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    modalTitle.textContent = "Edit Category";
    document.getElementById("category-id").value = category.id;
    document.getElementById("name").value = category.name;
    document.getElementById("description").value = category.description;

    categoryModal.style.display = "block";
}

function closeModal() {
    categoryModal.style.display = "none";
}

// Event Listeners
addCategoryBtn.addEventListener("click", openAddModal);
closeBtn.addEventListener("click", closeModal);

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === categoryModal) closeModal();
});

// Form Submit
categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryId = document.getElementById("category-id").value;
    const categoryData = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim()
    };

    if (!categoryData.name) {
        alert("Category Name is required.");
        return;
    }

    // Check for duplicates (exclude current category if editing)
    const isDuplicate = categories.some(c =>
        c.name.toLowerCase() === categoryData.name.toLowerCase() && c.id !== categoryId
    );

    if (isDuplicate) {
        alert("A category with this name already exists.");
        return;
    }

    const submitBtn = categoryForm.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    if (categoryId) {
        await updateCategory(categoryId, categoryData);
    } else {
        await addCategory(categoryData);
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    closeModal();
});

// Init
document.addEventListener("DOMContentLoaded", () => {
    // Initial load
    categoriesTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Loading categories...</td></tr>`;
    subscribeToCategories();
});
