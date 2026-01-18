// Firebase App // Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Firebase Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firestore
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
// DOM Elements
// =====================
const form = document.querySelector("form");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("pass");
const repeatPassInput = document.getElementById("repeatpass");
const errorBox = document.getElementById("error");



// =====================
// Register
// =====================
async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log("userCredential", userCredential);
    const user = userCredential.user;
    // Save user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "user",
      createdAt: new Date(),
    });
    // console.log("User Registered:", user.uid);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Register Error:", error.message);
  }
}



// =====================
// Login
// =====================
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.data().role;
    

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      console.log("Logged In:", userCredential.user.email);
      window.location.href = "home.html";
    }

  } catch (error) {
    console.error("Login Error:", error.message);
  }
}



// =====================
// Clear error while typing
// =====================
passInput.addEventListener("input", () => {
  if (errorBox) errorBox.textContent = "";
});

repeatPassInput?.addEventListener("input", () => {
  if (errorBox) errorBox.textContent = "";
});



// =====================
// Handle Form Submit
// =====================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const emailInput = document.getElementById("email");

  const email = emailInput.value.trim();
  const password = passInput.value;

  // 🟢 REGISTER PAGE
  if (repeatPassInput) {
    const repeatPass = repeatPassInput.value;

    if (!password || !repeatPass) {
      errorBox.textContent = "Password fields cannot be empty";
      return;
    }

    if (password !== repeatPass) {
      errorBox.textContent = "Passwords do not match";
      return;
    }

    errorBox.textContent = "";
    register(email, password);
  }

  // 🔵 LOGIN PAGE
  else {
    login(email, password);
  }
});
