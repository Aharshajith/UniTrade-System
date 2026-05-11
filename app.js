const API = "http://localhost:5000/api/users";

function showRegister() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

// REGISTER
async function register() {
  const data = {
    name: name.value,
    email: email.value,
    password: password.value,
    university: university.value
  };

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);

  showLogin();
}

// LOGIN
async function login() {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  });

  const result = await res.json();

  if (result.user) {
    localStorage.setItem("user", JSON.stringify(result.user));
    loadDashboard();
  } else {
    alert(result.message);
  }
}

// DASHBOARD
function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  userInfo.innerText = `${user.name} | ${user.email}`;
}

// LOGOUT
function logout() {
  localStorage.removeItem("user");
  location.reload();
}