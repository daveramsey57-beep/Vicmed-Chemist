// ===== State & Data =====
let allDrugs = [];
let allSales = [];
const MIN_STOCK = 5;

// Login credentials
const VALID_USERNAME = "@user001";
const VALID_PASSWORD = "user254";

// ===== DOM Elements =====
const loginPage = document.getElementById("loginPage");
const mainApp = document.getElementById("mainApp");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const drugSelect = document.getElementById("drugSelect");
const qtyInput = document.getElementById("qty");
const drugSearchInput = document.getElementById("drugSearch");
const salesBody = document.getElementById("salesBody");
const recentSalesBody = document.getElementById("recentSalesBody");
const inventoryBody = document.getElementById("inventoryBody");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const filterSalesBtn = document.getElementById("filterSalesBtn");
const clearSalesFilterBtn = document.getElementById("clearSalesFilterBtn");

// Stats elements
const totalSalesEl = document.getElementById("totalSales");
const dailyEl = document.getElementById("dailyTotal");
const monthlyEl = document.getElementById("monthlyTotal");
const yearlyEl = document.getElementById("yearlyTotal");
const currentDateEl = document.getElementById("currentDate");

// Inventory stats
const totalDrugsEl = document.getElementById("totalDrugs");
const lowStockCountEl = document.getElementById("lowStockCount");
const totalValueEl = document.getElementById("totalValue");

// Modal elements
const drugModal = document.getElementById("drugModal");
const drugForm = document.getElementById("drugForm");
const editDrugId = document.getElementById("editDrugId");
const modalTitle = document.getElementById("modalTitle");

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  setupLogin();
});

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    showMainApp();
  } else {
    showLoginPage();
  }
}

function showLoginPage() {
  loginPage.style.display = "flex";
  mainApp.style.display = "none";
}

function showMainApp() {
  loginPage.style.display = "none";
  mainApp.style.display = "flex";
  mainApp.style.width = "100%";
  initData();
  setupNavigation();
  setCurrentDate();
  loadAll();
}

function setupLogin() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem("isLoggedIn", "true");
      showMainApp();
    } else {
      loginError.textContent = "Invalid username or password";
      setTimeout(() => { loginError.textContent = ""; }, 3000);
    }
  });
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  showLoginPage();
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function initData() {
  const storedDrugs = localStorage.getItem("drugs");
  if (!storedDrugs) {
    allDrugs = getDefaultDrugs();
    localStorage.setItem("drugs", JSON.stringify(allDrugs));
  } else {
    allDrugs = JSON.parse(storedDrugs);
  }

  const storedSales = localStorage.getItem("sales");
  if (storedSales) {
    allSales = JSON.parse(storedSales);
  }
}

function getDefaultDrugs() {
  return [
    { id: "1", name: "Paracetamol", category: "Pain Relief", quantity: 100, price: 20, expiry: "2026-12-31" },
    { id: "2", name: "Amoxicillin", category: "Antibiotic", quantity: 50, price: 150, expiry: "2026-06-30" },
    { id: "3", name: "Aspirin", category: "Pain Relief", quantity: 75, price: 15, expiry: "2027-01-31" },
    { id: "4", name: "Ibuprofen", category: "Pain Relief", quantity: 60, price: 35, expiry: "2026-09-30" },
    { id: "5", name: "Cetirizine", category: "Allergy", quantity: 40, price: 25, expiry: "2026-08-31" },
    { id: "6", name: "Vitamin C", category: "Vitamins", quantity: 200, price: 50, expiry: "2027-06-30" },
    { id: "7", name: "Metronidazole", category: "Antibiotic", quantity: 30, price: 120, expiry: "2026-05-31" },
    { id: "8", name: "Panadol", category: "Pain Relief", quantity: 80, price: 30, expiry: "2026-11-30" }
  ];
}

function loadAll() {
  loadDrugs();
  loadSales();
  updateSalesTotals();
  updateInventoryStats();
  renderRecentSales();
}

function setCurrentDate() {
  const now = new Date();
  currentDateEl.textContent = now.toLocaleDateString("en-KE", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
}

// ===== Navigation =====
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  // Update nav
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  // Show page
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });
  document.getElementById(`${page}-page`).classList.add("active");

  // Refresh data
  if (page === "inventory") {
    renderInventory();
  }
}

// ===== Drugs =====
function loadDrugs() {
  renderDrugOptions(allDrugs);
}

function renderDrugOptions(drugs) {
  drugSelect.innerHTML = "";
  if (drugs.length === 0) {
    drugSelect.innerHTML = "<option>No drugs available</option>";
    return;
  }
  drugs.forEach(drug => {
    const option = document.createElement("option");
    option.value = drug.id;
    const stockWarning = (drug.quantity ?? 0) <= MIN_STOCK ? " (Low Stock!)" : "";
    option.textContent = `${drug.name} (${drug.category}) - ${drug.quantity ?? 0} left${stockWarning}`;
    if ((drug.quantity ?? 0) <= MIN_STOCK) option.style.color = "red";
    drugSelect.appendChild(option);
  });
}

// Filter drugs in dropdown
drugSearchInput.addEventListener("input", () => {
  const query = drugSearchInput.value.trim().toLowerCase();
  if (!query) return renderDrugOptions(allDrugs);
  const filtered = allDrugs.filter(d => 
    (d.name?.toLowerCase().includes(query)) ||
    (d.category?.toLowerCase().includes(query))
  );
  renderDrugOptions(filtered);
});

// ===== Sell Drug =====
function sellDrug() {
  const id = drugSelect.value;
  const qty = Number(qtyInput.value);
  
  if (!id || qty <= 0) {
    alert("Select drug and enter valid quantity");
    return;
  }

  const drug = allDrugs.find(d => d.id === id);
  if (!drug) {
    alert("Drug not found!");
    return;
  }

  if (drug.expiry && new Date(drug.expiry) < new Date()) {
    alert("Cannot sell expired drugs!");
    return;
  }
  if ((drug.quantity ?? 0) < qty) {
    alert("Not enough stock!");
    return;
  }

  const totalPrice = qty * (drug.price ?? 0);

  const sale = {
    id: Date.now().toString(),
    drugId: id,
    drugName: drug.name,
    category: drug.category,
    quantity: qty,
    price: drug.price,
    totalPrice,
    timestamp: new Date().toISOString(),
    deleted: false
  };

  allSales.push(sale);
  localStorage.setItem("sales", JSON.stringify(allSales));

  drug.quantity = (drug.quantity ?? 0) - qty;
  localStorage.setItem("drugs", JSON.stringify(allDrugs));

  alert(`Sold ${qty} x ${drug.name} for ${formatKsh(totalPrice)}`);
  qtyInput.value = "";
  drugSearchInput.value = "";
  
  loadDrugs();
  loadSales();
  updateSalesTotals();
  renderRecentSales();
  updateInventoryStats();
}

// ===== Sales =====
function loadSales() {
  const activeSales = allSales.filter(s => !s.deleted);
  renderSales(activeSales);
}

function renderSales(salesArray) {
  salesBody.innerHTML = "";
  const grouped = {};

  salesArray.forEach(sale => {
    const dateObj = sale.timestamp ? new Date(sale.timestamp) : new Date();
    const dateKey = dateObj.toLocaleDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push({ ...sale, dateObj });
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    // Date header row
    const headerRow = document.createElement("tr");
    headerRow.className = "date-group-header";
    const headerCell = document.createElement("td");
    headerCell.colSpan = 6;
    headerCell.innerHTML = `<i class="fa-solid fa-calendar"></i> ${date}`;
    headerRow.appendChild(headerCell);
    salesBody.appendChild(headerRow);

    // Sort by time
    grouped[date].sort((a, b) => b.dateObj - a.dateObj);

    grouped[date].forEach(sale => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sale.drugName || "N/A"}</td>
        <td>${sale.category || "N/A"}</td>
        <td>${sale.quantity ?? 0}</td>
        <td>${formatKsh(sale.totalPrice ?? 0)}</td>
        <td>${date}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editSale('${sale.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" onclick="deleteSale('${sale.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      salesBody.appendChild(row);
    });
  });

  if (salesArray.length === 0) {
    salesBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">No sales found</td></tr>';
  }
}

// Recent sales for dashboard
function renderRecentSales() {
  recentSalesBody.innerHTML = "";
  const activeSales = allSales.filter(s => !s.deleted);
  const recent = activeSales.slice(-5).reverse();
  
  recent.forEach(sale => {
    const date = new Date(sale.timestamp).toLocaleDateString();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sale.drugName}</td>
      <td>${sale.category}</td>
      <td>${sale.quantity}</td>
      <td>${formatKsh(sale.totalPrice)}</td>
      <td>${date}</td>
    `;
    recentSalesBody.appendChild(row);
  });

  if (recent.length === 0) {
    recentSalesBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:40px;">No recent sales</td></tr>';
  }
}

function editSale(id) {
  const sale = allSales.find(s => s.id === id);
  if (!sale) return;
  
  const newQty = Number(prompt("New quantity:", sale.quantity));
  if (!newQty || newQty <= 0) return;

  const drug = allDrugs.find(d => d.id === sale.drugId);
  if (!drug) return;

  let stock = (drug.quantity ?? 0) + (sale.quantity ?? 0);
  if (stock < newQty) { alert("Not enough stock!"); return; }
  stock -= newQty;
  const newTotal = newQty * (sale.price ?? 0);

  sale.quantity = newQty;
  sale.totalPrice = newTotal;
  drug.quantity = stock;

  localStorage.setItem("sales", JSON.stringify(allSales));
  localStorage.setItem("drugs", JSON.stringify(allDrugs));

  alert("Sale updated!");
  loadSales();
  loadDrugs();
  updateSalesTotals();
  renderRecentSales();
  updateInventoryStats();
}

function deleteSale(id) {
  if (!confirm("Delete this sale?")) return;
  
  const sale = allSales.find(s => s.id === id);
  if (!sale) return;

  const drug = allDrugs.find(d => d.id === sale.drugId);
  if (drug) {
    drug.quantity = (drug.quantity ?? 0) + (sale.quantity ?? 0);
  }

  sale.deleted = true;
  localStorage.setItem("sales", JSON.stringify(allSales));
  localStorage.setItem("drugs", JSON.stringify(allDrugs));

  alert("Sale deleted!");
  loadSales();
  loadDrugs();
  updateSalesTotals();
  renderRecentSales();
  updateInventoryStats();
}

// Sales filtering
filterSalesBtn.addEventListener("click", () => {
  const startVal = startDateInput.value;
  const endVal = endDateInput.value;
  if (!startVal || !endVal) { alert("Select both start and end dates."); return; }
  const start = new Date(startVal);
  const end = new Date(endVal); end.setHours(23,59,59,999);
  const filtered = allSales.filter(s => {
    if (s.deleted) return false;
    const saleDate = new Date(s.timestamp);
    return saleDate >= start && saleDate <= end;
  });
  renderSales(filtered);
});

clearSalesFilterBtn.addEventListener("click", () => {
  startDateInput.value = "";
  endDateInput.value = "";
  loadSales();
});

// ===== Stats =====
function updateSalesTotals() {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const endYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  let totalAll = 0, daily = 0, monthly = 0, yearly = 0;

  allSales.forEach(sale => {
    if (sale.deleted) return;
    const saleDate = new Date(sale.timestamp);
    totalAll += sale.totalPrice ?? 0;
    if (saleDate >= startDay && saleDate <= endDay) daily += sale.totalPrice ?? 0;
    if (saleDate >= startMonth && saleDate <= endMonth) monthly += sale.totalPrice ?? 0;
    if (saleDate >= startYear && saleDate <= endYear) yearly += sale.totalPrice ?? 0;
  });

  totalSalesEl.textContent = formatKsh(totalAll);
  dailyEl.textContent = formatKsh(daily);
  monthlyEl.textContent = formatKsh(monthly);
  yearlyEl.textContent = formatKsh(yearly);
}

// ===== Inventory =====
function renderInventory() {
  inventoryBody.innerHTML = "";
  
  allDrugs.forEach(drug => {
    const row = document.createElement("tr");
    const qty = drug.quantity ?? 0;
    let stockClass = "in-stock";
    if (qty === 0) stockClass = "out-of-stock";
    else if (qty <= MIN_STOCK) stockClass = "low-stock";
    
    row.innerHTML = `
      <td><strong>${drug.name}</strong></td>
      <td>${drug.category}</td>
      <td>${formatKsh(drug.price)}</td>
      <td><span class="stock-status ${stockClass}">${qty}</span></td>
      <td>${drug.expiry || "N/A"}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="openEditDrug('${drug.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" onclick="deleteDrug('${drug.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    inventoryBody.appendChild(row);
  });

  if (allDrugs.length === 0) {
    inventoryBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">No drugs in inventory</td></tr>';
  }
}

function updateInventoryStats() {
  totalDrugsEl.textContent = allDrugs.length;
  const lowStock = allDrugs.filter(d => d.quantity <= MIN_STOCK).length;
  lowStockCountEl.textContent = lowStock;
  const totalValue = allDrugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);
  totalValueEl.textContent = formatKsh(totalValue);
  renderInventory();
}

// ===== Modal Functions =====
function showAddDrugModal() {
  modalTitle.textContent = "Add New Drug";
  editDrugId.value = "";
  drugForm.reset();
  drugModal.classList.add("active");
}

function openEditDrug(id) {
  const drug = allDrugs.find(d => d.id === id);
  if (!drug) return;
  
  modalTitle.textContent = "Edit Drug";
  editDrugId.value = drug.id;
  document.getElementById("drugName").value = drug.name;
  document.getElementById("drugCategory").value = drug.category;
  document.getElementById("drugPrice").value = drug.price;
  document.getElementById("drugQuantity").value = drug.quantity;
  document.getElementById("drugExpiry").value = drug.expiry || "";
  drugModal.classList.add("active");
}

function closeModal() {
  drugModal.classList.remove("active");
}

function saveDrug(e) {
  e.preventDefault();
  
  const id = editDrugId.value;
  const name = document.getElementById("drugName").value;
  const category = document.getElementById("drugCategory").value;
  const price = Number(document.getElementById("drugPrice").value);
  const quantity = Number(document.getElementById("drugQuantity").value);
  const expiry = document.getElementById("drugExpiry").value;

  if (id) {
    // Edit existing
    const drug = allDrugs.find(d => d.id === id);
    if (drug) {
      drug.name = name;
      drug.category = category;
      drug.price = price;
      drug.quantity = quantity;
      drug.expiry = expiry || null;
    }
  } else {
    // Add new
    const newDrug = {
      id: Date.now().toString(),
      name,
      category,
      price,
      quantity,
      expiry: expiry || null
    };
    allDrugs.push(newDrug);
  }

  localStorage.setItem("drugs", JSON.stringify(allDrugs));
  closeModal();
  loadDrugs();
  updateInventoryStats();
}

function deleteDrug(id) {
  if (!confirm("Delete this drug from inventory?")) return;
  allDrugs = allDrugs.filter(d => d.id !== id);
  localStorage.setItem("drugs", JSON.stringify(allDrugs));
  loadDrugs();
  updateInventoryStats();
}

// ===== Utilities =====
function formatKsh(amount) {
  return "KSh " + (amount ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

// Make functions global
window.sellDrug = sellDrug;
window.editSale = editSale;
window.deleteSale = deleteSale;
window.showAddDrugModal = showAddDrugModal;
window.openEditDrug = openEditDrug;
window.closeModal = closeModal;
window.saveDrug = saveDrug;
window.deleteDrug = deleteDrug;
window.navigateTo = navigateTo;
window.logout = logout;

// Close modal on outside click
drugModal.addEventListener("click", (e) => {
  if (e.target === drugModal) closeModal();
});