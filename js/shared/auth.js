// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

// Firebase Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Firestore
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Validation
import { validate, validateMatch, validateRegistration, validateLogin } from "./validation.js";
import { toast } from "./notifications.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB6y4sAd0BRXaHCnClSk7xDRBpAb1NGVbE",
  authDomain: "e-commerce-ffd9a.firebaseapp.com",
  projectId: "e-commerce-ffd9a",
  storageBucket: "e-commerce-ffd9a.appspot.com",
  messagingSenderId: "933203816561",
  appId: "1:933203816561:web:f4487b73851818fa762bd0",
};

// Init Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// =====================
// Quick Redirects
// =====================
const currentPath = window.location.pathname.replace(/\/$/, ""); // Remove trailing slash for comparison
if (currentPath === "/login") window.location.href = "/auth/login.html";
if (currentPath === "/register") window.location.href = "/auth/register.html";
if (currentPath === "/admin") window.location.href = "/admin/dashboard.html";

// =====================
// Auth State Observer
// =====================
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;

  // Route detection
  const isAuthPage = path.includes("auth/login.html") || path.includes("auth/register.html");
  const isAdminPage = path.includes("/admin/");
  const isWishlistPage = path.includes("/customer/wishlist.html");
  const isProtectedPage = isAdminPage || isWishlistPage;

  // Prevent flicker on protected/auth transitions
  if (isProtectedPage || isAuthPage) {
    document.body.style.opacity = "0";
  }

  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid)).catch(() => ({ exists: () => false }));
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Guest-only pages (Login/Register)
      if (isAuthPage) {
        window.location.href = userData?.role === "admin" ? "/admin/dashboard.html" : "/index.html";
        return;
      }

      // Admin verification
      if (isAdminPage && userData?.role !== "admin") {
        window.location.href = "/index.html";
        return;
      }

      // Allow view & update UI
      document.body.style.opacity = "1";
      updateAuthUI(user, userData);
    } catch (error) {
      console.error("Route Protection Error:", error.message);
      document.body.style.opacity = "1";
    }
  } else {
    // Guest User
    if (isProtectedPage) {
      window.location.href = "/auth/login.html";
      return;
    }

    document.body.style.opacity = "1";
    updateAuthUI(null, null);
  }
});

// Helper to update UI
function updateAuthUI(user, userData) {
  const userEmailEl = document.getElementById("user-email");
  const logoutBtn = document.getElementById("logout-btn");
  const loginLink = document.getElementById("login-nav-link");
  const adminLink = document.getElementById("admin-link");

  if (user) {
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginLink) loginLink.style.display = "none";

    if (adminLink) {
      if (userData?.role === "admin") {
        adminLink.style.display = "inline-block";
      } else {
        adminLink.style.display = "none";
      }
    }
  } else {
    if (userEmailEl) userEmailEl.textContent = "";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginLink) loginLink.style.display = "inline-block";
    if (adminLink) adminLink.style.display = "none";
  }
}

// Function to check if user is logged in (returning a promise)
export function checkUserLogin() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Simple boolean check
export async function isLoggedIn() {
  const user = await checkUserLogin();
  return !!user;
}

// Get user role
export async function getUserRole() {
  const user = await checkUserLogin();
  if (!user) return null;
  const userDoc = await getDoc(doc(db, "users", user.uid)).catch(e => {
    console.error("getUserRole Error:", e);
    return { exists: () => false };
  });
  return userDoc.exists() ? userDoc.data().role : null;
}

// =====================
// User-Specific Storage Helpers
// =====================

/**
 * Get the localStorage key for the current user's cart
 * @returns {string|null} Cart key or null if not logged in
 */
export async function getUserCartKey() {
  const user = await checkUserLogin();
  return user ? `shopping_cart_${user.uid}` : null;
}

/**
 * Get the localStorage key for the current user's wishlist
 * @returns {string|null} Wishlist key or null if not logged in
 */
export async function getUserWishlistKey() {
  const user = await checkUserLogin();
  return user ? `wishlist_${user.uid}` : null;
}

// =====================
// Logout Logic
// =====================
async function logout() {
  try {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  } catch (error) {
    console.error("Logout Error:", error.message);
  }
}

// Expose logout to window for easy access in HTML
window.logout = logout;

// =====================
// DOM Elements
// =====================
// Note: getElementById does NOT use the "#" symbol
const registerForm = document.getElementById("registerform");
const loginForm = document.getElementById("loginform");
const passInput = document.getElementById("pass");
const repeatPassInput = document.getElementById("repeatpass");
const errorBox = document.getElementById("error");

// =====================
// Register Logic
// =====================
async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "user",
      createdAt: new Date(),
    });

    window.location.href = "/index.html";
  } catch (error) {
    // Handle specific Firebase errors
    if (error.code === "auth/email-already-in-use") {
      toast.error("Email is already registered");
    } else {
      toast.error(error.message);
    }
    console.error("Register Error:", error.message);
  }
}

// =====================
// Login Logic
// =====================
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid)).catch(e => {
      console.error("Login Profile Access Error:", e);
      return { exists: () => false };
    });

    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === "admin") {
        window.location.href = "/admin/dashboard.html";
      } else {
        window.location.href = "/index.html";
      }
    } else {
      window.location.href = "/index.html";
    }
  } catch (error) {
    toast.error("Wrong email or password");
    console.error("Login Error:", error.message);
  }
}

// =====================
// Event Listeners
// =====================



// =====================
// Event Listeners
// =====================

// Clear error while typing
passInput?.addEventListener("input", () => {
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }
});

repeatPassInput?.addEventListener("input", () => {
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }
});

// Handle Register Form
registerForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("registeremail")?.value;
  const password = passInput.value;
  const repeatPass = repeatPassInput.value;

  // Validate registration with ordered validation flow
  if (!validateRegistration(email, password, repeatPass)) {
    return;
  }

  // Email is trimmed in validateRegistration, so trim it here too
  register(email.trim(), password);
});

// Handle Login Form
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email")?.value;
  const password = passInput.value;

  // Validate login with ordered validation flow
  if (!validateLogin(email, password)) {
    return;
  }

  // Email is trimmed in validateLogin, so trim it here too
  login(email.trim(), password);
});