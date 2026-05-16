function getApiBase() {
  const { protocol, port } = window.location;
  if (protocol === "file:" || (port && port !== "5000")) {
    return "http://localhost:5000/api";
  }
  return "/api";
}

const API = getApiBase();
const ADMIN_SESSION_KEY = "unitrade_admin_session";

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return null;
  }
}

function setAdminSession(session) {
  if (session) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
  updateAdminAuthUI();
  showAdminView(session ? "dashboard" : "login");
}

async function adminApi(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const session = getAdminSession();
  if (session?.email && session?.password) {
    headers["x-admin-email"] = session.email;
    headers["x-admin-password"] = session.password;
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed (${res.status})`);
  }

  return data;
}

function escapeHtml(str) {
  const el = document.createElement("div");
  el.textContent = str ?? "";
  return el.innerHTML;
}

function formatPrice(price) {
  const amount = Number(price);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function showToast(message, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add("hidden"), 3200);
}

function showAdminView(name) {
  document.getElementById("admin-login-view").classList.toggle("active", name === "login");
  document.getElementById("admin-dashboard-view").classList.toggle("active", name === "dashboard");
  if (name === "dashboard") loadAdminData();
}

function updateAdminAuthUI() {
  const area = document.getElementById("admin-auth-area");
  const session = getAdminSession();

  if (session?.admin) {
    const adminName = session.admin.name ?? "";
    const adminInitials =
      adminName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "A";

    area.classList.add("auth-area--signed-in");
    area.innerHTML = `
      <div class="user-badge user-badge--admin" role="status">
        <span class="user-avatar" aria-hidden="true">${escapeHtml(adminInitials)}</span>
        <span class="user-badge-text">
          <span class="user-badge-greeting">Hi, <span class="user-badge-name">${escapeHtml(adminName)}</span></span>
        </span>
      </div>
      <button type="button" class="btn btn-ghost btn-header" id="btn-admin-logout">Log out</button>
    `;
    document.getElementById("btn-admin-logout").addEventListener("click", () => {
      setAdminSession(null);
      showToast("Logged out");
    });
  } else {
    area.classList.remove("auth-area--signed-in");
    area.innerHTML = `<a href="index.html" class="btn btn-ghost btn-header">Marketplace</a>`;
  }
}

function setAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.getElementById("admin-panel-users").classList.toggle("active", tab === "users");
  document.getElementById("admin-panel-items").classList.toggle("active", tab === "items");
}

async function loadAdminData() {
  try {
    const [usersData, itemsData] = await Promise.all([
      adminApi("/admin/users"),
      adminApi("/admin/items")
    ]);

    renderUsers(usersData.users || []);
    renderItems(itemsData.items || []);
    document.getElementById("users-count").textContent = usersData.count ?? 0;
    document.getElementById("items-count").textContent = itemsData.count ?? 0;
  } catch (err) {
    showToast(err.message, "error");
    if (err.message.includes("authentication") || err.message.includes("credentials")) {
      setAdminSession(null);
    }
  }
}

function renderUsers(users) {
  const tbody = document.getElementById("admin-users-body");
  const empty = document.getElementById("admin-users-empty");

  if (!users.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  tbody.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.university)}</td>
      <td>${escapeHtml(u.faculty)}</td>
      <td>${escapeHtml(u.phoneNumber)}</td>
      <td class="td-actions">
        <button type="button" class="btn btn-danger btn-sm" data-delete-user="${u._id}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser));
  });
}

function renderItems(items) {
  const tbody = document.getElementById("admin-items-body");
  const empty = document.getElementById("admin-items-empty");

  if (!items.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  tbody.innerHTML = items
    .map((item) => {
      const seller = item.sellerId;
      const sellerLabel =
        typeof seller === "object" && seller
          ? `${seller.name || "—"} (${seller.email || "—"})`
          : "—";

      return `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${formatPrice(item.price)}</td>
      <td>${escapeHtml(item.category || "—")}</td>
      <td>${escapeHtml(sellerLabel)}</td>
      <td class="td-actions">
        <button type="button" class="btn btn-danger btn-sm" data-delete-item="${item._id}">Delete</button>
      </td>
    </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-delete-item]").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.dataset.deleteItem));
  });
}

async function deleteUser(userId) {
  if (!confirm("Delete this user and all their listings?")) return;

  try {
    await adminApi(`/admin/users/${userId}`, { method: "DELETE" });
    showToast("User deleted");
    loadAdminData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteItem(itemId) {
  if (!confirm("Delete this item?")) return;

  try {
    await adminApi(`/admin/items/${itemId}`, { method: "DELETE" });
    showToast("Item deleted");
    loadAdminData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAdminAuthUI();
  showAdminView(getAdminSession() ? "dashboard" : "login");

  document.getElementById("form-admin-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    try {
      const data = await adminApi("/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password")
        })
      });

      setAdminSession({
        email: fd.get("email"),
        password: fd.get("password"),
        admin: data.admin
      });
      showToast("Welcome, admin!");
      e.target.reset();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => setAdminTab(tab.dataset.tab));
  });
});
