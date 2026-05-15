const API = "http://localhost:5000/api/users";

/* =========================
   PAGE TOGGLE FUNCTIONS
========================= */

function showRegister() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

/* =========================
   REGISTER USER
========================= */

async function register() {
  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    university: document.getElementById("university").value
  };

  console.log("Register data:", data);

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || result.error || "Registration failed");
      return;
    }

    alert(result.message || "Registration successful ✅");
    showLogin();

  } catch (error) {
    console.error(error);
    alert("Server error. Is backend running?");
  }
}

/* =========================
   LOGIN USER
========================= */

async function login() {
  const loginData = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value
  };

  console.log("Login data:", loginData);

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || result.error || "Login failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(result.user));
    loadDashboard();
    showAddItemPage();

  } catch (error) {
    console.error(error);
    alert("Server error. Is backend running?");
  }
}

/* =========================
   DASHBOARD
========================= */

function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  document.getElementById("userInfo").innerText =
    `${user.name} | ${user.email} | ${user.university}`;
}

/* =========================
   LOGOUT
========================= */

function logout() {
  localStorage.removeItem("user");
  location.reload();
}


const ITEM_API = "http://localhost:5000/api/items";

// SHOW ITEM PAGE AFTER LOGIN
function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("itemPage").classList.remove("hidden");

  document.getElementById("userInfo").innerText =
    `${user.name} | ${user.email} | ${user.university}`;
}

// ADD ITEM
async function addItem() {
  const user = JSON.parse(localStorage.getItem("user"));

  const itemData = {
    title: document.getElementById("itemTitle").value,
    description: document.getElementById("itemDescription").value,
    price: Number(document.getElementById("itemPrice").value),
    category: document.getElementById("itemCategory").value,
    university: document.getElementById("itemUniversity").value,
    seller: user.name
  };

  console.log("Item data:", itemData);

  try {
    const res = await fetch(ITEM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to add item");
      return;
    }

    alert("Item added successfully ✅");

    // clear form
    document.getElementById("itemTitle").value = "";
    document.getElementById("itemDescription").value = "";
    document.getElementById("itemPrice").value = "";
    document.getElementById("itemCategory").value = "";
    document.getElementById("itemUniversity").value = "";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}