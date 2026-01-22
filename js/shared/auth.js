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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================
// Auth State Observer
// =====================
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  const isAuthPage = path.includes("auth/login.html") || path.includes("auth/register.html");
  const isAdminPage = path.includes("admin.html");

  if (user) {
    try {
      // User is signed in
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      if (isAuthPage) {
        if (userData?.role === "admin") {
          window.location.href = "/admin.html";
        } else {
          window.location.href = "/index.html";
        }
      }

      if (isAdminPage && userData?.role !== "admin") {
        window.location.href = "/index.html";
        return; // Stop execution
      }

      // Update UI if elements exist
      updateAuthUI(user, userData);
    } catch (error) {
      console.error("Firestore Permission Error:", error.message);
      // Even if firestore fails, we can show basic user info from auth
      updateAuthUI(user, null);
    }
  } else {
    // User is signed out
    updateAuthUI(null, null);

    if (!isAuthPage && path !== "/" && !path.endsWith("index.html")) {
      // If on a protected page (like admin), redirect to login
      if (isAdminPage) {
        window.location.href = "/auth/login.html";
        return;
      }
    }
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
    if (errorBox) errorBox.textContent = error.message;
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
        window.location.href = "/admin.html";
      } else {
        window.location.href = "/index.html";
      }
    } else {
      window.location.href = "/index.html";
    }
  } catch (error) {
    if (errorBox) errorBox.textContent = "Invalid email or password";
    console.error("Login Error:", error.message);
  }
}

// =====================
// Event Listeners
// =====================

// Clear error while typing (using optional chaining ?. to prevent null errors)
passInput?.addEventListener("input", () => {
  if (errorBox) errorBox.textContent = "";
});

repeatPassInput?.addEventListener("input", () => {
  if (errorBox) errorBox.textContent = "";
});

// Handle Register Form
registerForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("registeremail")?.value.trim();
  const password = passInput.value;
  const repeatPass = repeatPassInput.value;

  if (password !== repeatPass) {
    errorBox.textContent = "Passwords do not match";
    return;
  }

  register(email, password);
});

// Handle Login Form
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = passInput.value;

  login(email, password);
});