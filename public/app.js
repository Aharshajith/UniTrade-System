function getApiBase() {
  const { protocol, hostname, port } = window.location;
  if (protocol === "file:") {
    return "http://localhost:5000/api";
  }
  if (port && port !== "5000") {
    return "http://localhost:5000/api";
  }
  return "/api";
}

const API = getApiBase();
const SESSION_KEY = "unitrade_session";

const DEFAULT_CATEGORIES = [
  "Books",
  "Electronics",
  "Furniture",
  "Clothing",
  "Fashion",
  "Sports",
  "Stationery",
  "Hostel & Living",
  "Other"
];

let allItems = [];
let selectedCategory = "";

// ——— Session ———
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  updateAuthUI();
}

function getCurrentUserId() {
  const id = getSession()?.user?._id;
  return id ? String(id) : null;
}

// ——— API ———
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const session = getSession();
  if (session?.email && session?.password) {
    headers["x-user-email"] = session.email;
    headers["x-user-password"] = session.password;
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// ——— UI helpers ———
function showToast(message, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add("hidden"), 3200);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${name}`)?.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === name);
  });

  if (name === "marketplace") loadItems();
  if (name === "my-items") loadMyItems();
}

window.showView = showView;

function updateAuthUI() {
  const session = getSession();
  const area = document.getElementById("auth-area");
  const navMyItems = document.getElementById("nav-my-items");

  if (session?.user) {
    area.innerHTML = `
      <a href="admin.html" class="btn btn-ghost btn-sm admin-link">Admin</a>
      <div class="user-menu">
        <span class="user-name">Hi, <strong>${escapeHtml(session.user.name)}</strong></span>
        <button type="button" class="btn btn-ghost btn-sm" id="btn-logout">Log out</button>
      </div>
    `;
    document.getElementById("btn-logout").addEventListener("click", logout);
    navMyItems.classList.remove("hidden");
  } else {
    area.innerHTML = `
      <a href="admin.html" class="btn btn-ghost btn-sm admin-link">Admin</a>
      <button type="button" class="btn btn-ghost" id="btn-show-login">Log in</button>
      <button type="button" class="btn btn-primary" id="btn-show-register">Sign up</button>
    `;
    navMyItems.classList.add("hidden");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function getSellerId(item) {
  const s = item.sellerId;
  if (!s) return null;
  const id = typeof s === "object" ? s._id : s;
  return id ? String(id) : null;
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

function renderItemCard(item, { showActions = false } = {}) {
  const own = getCurrentUserId() && getSellerId(item) === getCurrentUserId();
  const seller = item.sellerId;
  const sellerName =
    typeof seller === "object" && seller?.name ? seller.name : "Unknown";
  const university =
    typeof seller === "object" && seller?.university
      ? ` · ${seller.university}`
      : "";

  const actions =
    showActions || own
      ? `
    <div class="item-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-edit="${item._id}">Edit</button>
      <button type="button" class="btn btn-danger btn-sm" data-delete="${item._id}">Delete</button>
    </div>`
      : "";

  return `
    <article class="item-card ${own ? "own" : ""}" data-id="${item._id}">
      ${item.category ? `<span class="item-category">${escapeHtml(item.category)}</span>` : ""}
      <h3 class="item-title">${escapeHtml(item.title)}</h3>
      <div class="item-price">${formatPrice(item.price)}</div>
      ${item.description ? `<p class="item-desc">${escapeHtml(item.description)}</p>` : ""}
      <p class="item-seller">Sold by ${escapeHtml(sellerName)}${escapeHtml(university)}</p>
      ${actions}
    </article>
  `;
}

function bindItemActions(container) {
  container.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditItem(btn.dataset.edit));
  });
  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.dataset.delete));
  });
}

// ——— Items ———
async function loadItems() {
  try {
    allItems = await api("/items");
    applyFilters();
    updateCategoryFilter();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function getAllCategories() {
  const fromItems = allItems.map((i) => i.category).filter(Boolean);
  return [...new Set([...DEFAULT_CATEGORIES, ...fromItems])].sort((a, b) => {
    const ai = DEFAULT_CATEGORIES.indexOf(a);
    const bi = DEFAULT_CATEGORIES.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

function setSelectedCategory(category) {
  selectedCategory = category || "";
  const select = document.getElementById("filter-category");
  if (select) select.value = selectedCategory;
  document.querySelectorAll(".category-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.category === selectedCategory);
  });
  applyFilters();
}

function renderCategoryChips() {
  const container = document.getElementById("category-chips");
  if (!container) return;

  const categories = getAllCategories();
  container.innerHTML =
    `<button type="button" class="category-chip${selectedCategory === "" ? " active" : ""}" data-category="">All</button>` +
    categories
      .map(
        (c) =>
          `<button type="button" class="category-chip${selectedCategory === c ? " active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join("");

  container.querySelectorAll(".category-chip").forEach((chip) => {
    chip.addEventListener("click", () => setSelectedCategory(chip.dataset.category));
  });
}

function updateCategoryFilter() {
  const select = document.getElementById("filter-category");
  if (!select) return;

  const categories = getAllCategories();
  select.innerHTML =
    '<option value="">All categories</option>' +
    categories
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join("");
  select.value = selectedCategory;
  renderCategoryChips();
}

function applyFilters() {
  const query = document.getElementById("search-items").value.trim().toLowerCase();
  const category = selectedCategory || document.getElementById("filter-category")?.value || "";

  let filtered = allItems;
  if (query) {
    filtered = filtered.filter(
      (i) =>
        i.title?.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query)
    );
  }
  if (category) {
    filtered = filtered.filter((i) => i.category === category);
  }

  const grid = document.getElementById("items-grid");
  const empty = document.getElementById("marketplace-empty");

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.textContent = allItems.length
      ? "No items match your search."
      : "No items listed yet. Be the first to sell something!";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    grid.innerHTML = filtered.map((i) => renderItemCard(i)).join("");
    bindItemActions(grid);
  }
}

async function loadMyItems() {
  const session = getSession();
  if (!session) {
    showView("auth");
    setAuthTab("login");
    return;
  }

  try {
    if (!allItems.length) allItems = await api("/items");
    const mine = allItems.filter(
      (i) => getSellerId(i) === getCurrentUserId()
    );

    const grid = document.getElementById("my-items-grid");
    const empty = document.getElementById("my-items-empty");

    if (mine.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      grid.innerHTML = mine.map((i) => renderItemCard(i, { showActions: true })).join("");
      bindItemActions(grid);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openAddItem() {
  const session = getSession();
  if (!session) {
    showToast("Please log in to add items", "error");
    showView("auth");
    return;
  }

  document.getElementById("item-modal-title").textContent = "Add item";
  document.getElementById("item-form-submit").textContent = "Save item";
  document.getElementById("form-item").reset();
  document.querySelector('[name="itemId"]').value = "";
  openModal();
}

function openEditItem(itemId) {
  const item = allItems.find((i) => i._id === itemId);
  if (!item) return;

  document.getElementById("item-modal-title").textContent = "Edit item";
  document.getElementById("item-form-submit").textContent = "Update item";
  const form = document.getElementById("form-item");
  form.querySelector('[name="itemId"]').value = item._id;
  form.title.value = item.title || "";
  form.description.value = item.description || "";
  form.price.value = item.price ?? "";
  form.category.value = item.category || "";
  openModal();
}

function openModal() {
  const modal = document.getElementById("item-modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("item-modal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

async function deleteItem(itemId) {
  if (!confirm("Delete this listing?")) return;

  try {
    await api(`/items/${itemId}`, { method: "DELETE" });
    showToast("Item deleted");
    await loadItems();
    if (document.getElementById("view-my-items").classList.contains("active")) {
      loadMyItems();
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ——— Auth ———
function setAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.auth === tab);
  });
  document.getElementById("form-login").classList.toggle("hidden", tab !== "login");
  document.getElementById("form-register").classList.toggle("hidden", tab !== "register");
}

function logout() {
  setSession(null);
  showToast("Logged out");
  showView("marketplace");
}

// ——— Init ———
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  loadItems();

  document.getElementById("auth-area").addEventListener("click", (e) => {
    if (e.target.id === "btn-show-login") {
      setAuthTab("login");
      showView("auth");
    }
    if (e.target.id === "btn-show-register") {
      setAuthTab("register");
      showView("auth");
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (link.dataset.view === "my-items" && !getSession()) {
        showToast("Please log in first", "error");
        showView("auth");
        return;
      }
      showView(link.dataset.view);
    });
  });

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => setAuthTab(tab.dataset.auth));
  });

  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api("/users/login", {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password")
        })
      });
      setSession({
        email: fd.get("email"),
        password: fd.get("password"),
        user: data.user
      });
      showToast("Welcome back!");
      e.target.reset();
      showView("marketplace");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const data = await api("/users/register", {
        method: "POST",
        body: JSON.stringify(body)
      });
      setSession({
        email: body.email,
        password: body.password,
        user: data.user
      });
      showToast("Account created!");
      e.target.reset();
      showView("marketplace");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("btn-open-add-item").addEventListener("click", openAddItem);

  document.getElementById("form-item").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemId = fd.get("itemId");
    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      price: fd.get("price"),
      category: fd.get("category")
    };

    try {
      if (itemId) {
        await api(`/items/${itemId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showToast("Item updated");
      } else {
        await api("/items", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Item listed");
      }
      closeModal();
      await loadItems();
      loadMyItems();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.getElementById("search-items").addEventListener("input", applyFilters);
  document.getElementById("filter-category").addEventListener("change", (e) => {
    setSelectedCategory(e.target.value);
  });

  renderCategoryChips();

  if (getSession()) {
    document.getElementById("nav-my-items").classList.remove("hidden");
  }
});
