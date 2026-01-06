// API credentials loaded from config.js
const API_KEY = CONFIG.API_KEY;
const SHEET_ID = CONFIG.SHEET_ID;
const SHEET_NAME = CONFIG.SHEET_NAME;

let items = [];
let filteredItems = [];
let cart = [];
let currentModalIndex = 0;

// DOM Elements
const grid = document.getElementById('grid');
const searchInput = document.getElementById('q');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const fabricSelect = document.getElementById('fabric');
const colorSelect = document.getElementById('color');
const sortSelect = document.getElementById('sort');
const soldFilterSelect = document.getElementById('soldFilter');
const hideSoldCheckbox = document.getElementById('hideSold');

const modal = document.getElementById('item-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const modalPrice = document.getElementById('modal-price');
const modalSell = document.getElementById('modal-sell');
const modalClose = document.getElementById('modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');
const modalBackdrop = document.getElementById('modal-backdrop');

const cartBtn = document.getElementById('btn-cart');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const closeCartBtn = document.getElementById('close-cart');
const backdrop = document.getElementById('backdrop');
const exportBtn = document.getElementById('btn-export');
const clearBtn = document.getElementById('btn-clear');
const checkoutBtn = document.getElementById('checkout');

const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener('input', filterItems);
  minPriceInput.addEventListener('input', filterItems);
  maxPriceInput.addEventListener('input', filterItems);
  fabricSelect.addEventListener('change', filterItems);
  colorSelect.addEventListener('change', filterItems);
  sortSelect.addEventListener('change', filterItems);
  soldFilterSelect.addEventListener('change', filterItems);
  hideSoldCheckbox.addEventListener('change', filterItems);

  cartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  backdrop.addEventListener('click', closeCart);
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', () => navigateModal(-1));
  modalNext.addEventListener('click', () => navigateModal(1));

  exportBtn.addEventListener('click', exportCSV);
  clearBtn.addEventListener('click', clearFilters);
  checkoutBtn.addEventListener('click', checkout);
}

async function fetchData() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.values) throw new Error('No data found');

    parseData(data.values);
    populateFilters();
    filterItems();
    updateStats();
  } catch (error) {
    showError(`Error loading data: ${error.message}`);
    console.error(error);
  }
}

function parseData(values) {
  items = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.length) continue;

    items.push({
      timestamp: row[0] || '',
      photo: row[1] || '',
      number: row[2] || '',
      color: row[3] || '',
      fabric: row[4] || '',
      status: row[5] || 'Available',
      sellPrice: parseFloat(row[6]) || 0,
      soldPrice: parseFloat(row[7]) || 0
    });
  }
}

function populateFilters() {
  const fabrics = [...new Set(items.map(i => i.fabric).filter(Boolean))].sort();
  const colors = [...new Set(items.map(i => i.color).filter(Boolean))].sort();

  fabrics.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    fabricSelect.appendChild(opt);
  });

  colors.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    colorSelect.appendChild(opt);
  });
}

function filterItems() {
  const query = searchInput.value.toLowerCase();
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
  const fabric = fabricSelect.value;
  const color = colorSelect.value;
  const sold = soldFilterSelect.value;
  const hideSold = hideSoldCheckbox.checked;

  filteredItems = items.filter(item => {
    const matchQuery = !query || 
      item.number.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.fabric.toLowerCase().includes(query);

    const price = item.sellPrice || item.soldPrice;
    const matchPrice = price >= minPrice && price <= maxPrice;
    const matchFabric = !fabric || item.fabric === fabric;
    const matchColor = !color || item.color === color;

    let matchSold = true;
    if (sold === 'available') matchSold = item.status !== 'Sold';
    if (sold === 'sold') matchSold = item.status === 'Sold';

    const shouldHide = hideSold && item.status === 'Sold';

    return matchQuery && matchPrice && matchFabric && matchColor && matchSold && !shouldHide;
  });

  const sortBy = sortSelect.value;
  if (sortBy === 'price-asc') {
    filteredItems.sort((a, b) => (a.sellPrice || 0) - (b.sellPrice || 0));
  } else if (sortBy === 'price-desc') {
    filteredItems.sort((a, b) => (b.sellPrice || 0) - (a.sellPrice || 0));
  } else if (sortBy === 'number-asc') {
    filteredItems.sort((a, b) => a.number.localeCompare(b.number));
  } else if (sortBy === 'number-desc') {
    filteredItems.sort((a, b) => b.number.localeCompare(a.number));
  }

  renderGrid();
  updateStats();
}

function renderGrid() {
  grid.innerHTML = '';

  if (filteredItems.length === 0) {
    grid.innerHTML = '<div class="no-results">No sarees found</div>';
    return;
  }

  filteredItems.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = item.status === 'Sold' ? 'card sold' : 'card';
    card.innerHTML = `
      <img src="${getImageUrl(item.photo)}" alt="${item.number}" class="card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
      <div class="card-content">
        <div class="card-title">${item.number}</div>
        <div class="card-meta">${item.color}</div>
        <div class="card-price">
          <span class="price">₹${item.sellPrice.toLocaleString()}</span>
        </div>
        <span class="card-status ${item.status === 'Sold' ? 'sold' : 'available'}">${item.status}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(idx));
    grid.appendChild(card);
  });
}

function getImageUrl(photoUrl) {
  if (!photoUrl) return '';
  
  let url = photoUrl.trim();
  if (url.includes('drive.google.com')) {
    const matches = [
      url.match(/\/d\/([a-zA-Z0-9-_]+)/),
      url.match(/id=([a-zA-Z0-9-_]+)/),
      url.match(/open\?id=([a-zA-Z0-9-_]+)/)
    ];
    
    for (let m of matches) {
      if (m && m[1]) {
        return `https://lh3.googleusercontent.com/d/${m[1]}=w400`;
      }
    }
  }
  return url;
}

function openModal(idx) {
  currentModalIndex = idx;
  const item = filteredItems[idx];
  
  modalTitle.textContent = item.number;
  modalImage.src = getImageUrl(item.photo);
  
  modalMeta.innerHTML = `
    <div><span>Color</span><span>${item.color}</span></div>
    <div><span>Fabric</span><span>${item.fabric}</span></div>
    <div><span>Date</span><span>${item.timestamp}</span></div>
  `;
  
  modalPrice.innerHTML = `<div><span>Sell Price</span><span class="price">₹${item.sellPrice.toLocaleString()}</span></div>`;
  modalSell.innerHTML = item.status === 'Sold' ? `<div><span>Sold Price</span><span class="sold-price">₹${item.soldPrice.toLocaleString()}</span></div>` : '';
  
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
}

function navigateModal(direction) {
  let newIdx = currentModalIndex + direction;
  if (newIdx < 0) newIdx = filteredItems.length - 1;
  if (newIdx >= filteredItems.length) newIdx = 0;
  openModal(newIdx);
}

function openCart() {
  cartDrawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('open');
}

function closeCart() {
  cartDrawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('open');
}

function renderCart() {
  cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="no-results">Cart is empty</div>';
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const price = item.soldPrice || item.sellPrice;
    total += price;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${getImageUrl(item.photo)}" alt="${item.number}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.number}</div>
        <div class="cart-item-price">₹${price.toLocaleString()}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.number}')">✕</button>
    `;
    cartItems.appendChild(div);
  });

  cartTotal.textContent = total.toLocaleString();
  cartCount.textContent = cart.length;
}

function removeFromCart(number) {
  cart = cart.filter(i => i.number !== number);
  renderCart();
}

function updateStats() {
  const total = items.length;
  const sold = items.filter(i => i.status === 'Sold').length;
  const totalInvested = items.reduce((sum, i) => sum + (i.sellPrice || 0), 0);
  const investedSold = items.filter(i => i.status === 'Sold').reduce((sum, i) => sum + (i.sellPrice || 0), 0);
  const totalSoldPrice = items.filter(i => i.status === 'Sold').reduce((sum, i) => sum + (i.soldPrice || 0), 0);
  const profit = totalSoldPrice - investedSold;

  document.getElementById('stat-total-items').textContent = total;
  document.getElementById('stat-sold-items').textContent = sold;
  document.getElementById('stat-total-invested').textContent = '₹' + totalInvested.toLocaleString();
  document.getElementById('stat-invested-sold').textContent = '₹' + investedSold.toLocaleString();
  document.getElementById('stat-total-sold').textContent = '₹' + totalSoldPrice.toLocaleString();
  document.getElementById('stat-profit').textContent = '₹' + profit.toLocaleString();
}

function exportCSV() {
  const rows = [['Timestamp', 'Number', 'Color', 'Fabric', 'Status', 'Sell Price', 'Sold Price']];
  
  filteredItems.forEach(item => {
    rows.push([
      item.timestamp,
      item.number,
      item.color,
      item.fabric,
      item.status,
      item.sellPrice,
      item.soldPrice
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `saree-inventory-${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  showToast('CSV exported successfully');
}

function clearFilters() {
  searchInput.value = '';
  minPriceInput.value = '';
  maxPriceInput.value = '';
  fabricSelect.value = '';
  colorSelect.value = '';
  sortSelect.value = 'relevance';
  soldFilterSelect.value = 'all';
  hideSoldCheckbox.checked = false;
  filterItems();
}

function checkout() {
  showToast(`Order placed for ${cart.length} items!`);
  cart = [];
  renderCart();
  closeCart();
}

function showError(message) {
  grid.innerHTML = `<div class="error">${message}</div>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
