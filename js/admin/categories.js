import { db } from "../shared/auth.js";
import { toast, showConfirm } from "../shared/notifications.js";
import { validate } from "../shared/validation.js";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    getDocs,
    where
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
        toast.error("Failed to add category");
    }
}

async function updateCategory(id, updatedData) {
    try {
        const categoryDoc = doc(db, "categories", id);
        await updateDoc(categoryDoc, updatedData);
    } catch (error) {
        console.error("Error updating category:", error);
        toast.error("Failed to update category");
    }
}

async function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Check if any products use this category
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", category.name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const productCount = querySnapshot.size;
            toast.error(
                `Cannot delete "${category.name}". ${productCount} product${productCount > 1 ? 's' : ''} ${productCount > 1 ? 'are' : 'is'} using this category. Please reassign or delete ${productCount > 1 ? 'them' : 'it'} first.`
            );
            return;
        }
    } catch (error) {
        console.error("Error checking products:", error);
        toast.error("Failed to verify category usage");
        return;
    }

    // No products found, proceed with confirmation
    const confirmed = await showConfirm(
        `Are you sure you want to delete "${category.name}"?`,
        null,
        null,
        { title: "Delete Category", confirmText: "Yes, Delete", cancelText: "Cancel" }
    );

    if (confirmed) {
        try {
            const categoryDoc = doc(db, "categories", id);
            await deleteDoc(categoryDoc);
            toast.success("Category deleted successfully");
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Failed to delete category");
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
    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();

    // 1. Check if category name is empty
    if (!name) {
        toast.error("Category name is required");
        return;
    }

    // 2. Check if category name in valid format
    if (!validate(name, 'categoryName')) {
        return;
    }

    // 3. Check if category desc is empty
    if (!description) {
        toast.error("Category description is required");
        return;
    }

    // 4. Check if category desc in valid format
    if (!validate(description, 'description')) {
        return;
    }

    const categoryData = {
        name,
        description
    };

    // Check for duplicates (exclude current category if editing)
    const isDuplicate = categories.some(c =>
        c.name.toLowerCase() === categoryData.name.toLowerCase() && c.id !== categoryId
    );

    if (isDuplicate) {
        toast.error("A category with this name already exists.");
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
