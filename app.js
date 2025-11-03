const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Helper: format number as currency
function currency(n) { return `$${n.toFixed(2)}`; }

// LocalStorage helpers
function getMenu() { 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || seedMenu(); } 
  catch { return seedMenu(); } 
}
function getCart() { 
  try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } 
  catch { return []; } 
}
function saveCart(cart) { localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

// Seed menu if empty
function seedMenu() {
  const menu = {
    categories: ["specialty","build","sides","drinks"],
    items: [
      {id:"pep-supreme", name:"Heavy Hitter", category:"specialty", basePrice:12.99, sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"https://i.imgur.com/8Q7rC9X.jpg"},
      {id:"margherita", name:"Slice of Summer", category:"specialty", basePrice:11.5, sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"https://i.imgur.com/Y1E8xDN.jpg"},
      {id:"veggie-delight", name:"Veggie Delight", category:"specialty", basePrice:12, sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"https://i.imgur.com/0R0Ed9q.jpg"}
    ],
    toppings: [
      {name:"Mozzarella", price:1, active:true},
      {name:"Pepperoni", price:1.25, active:true},
      {name:"Mushrooms", price:0.9, active:true},
      {name:"Olives", price:0.75, active:true},
      {name:"Onions", price:0.5, active:true}
    ],
    sizeMultipliers: {Small:1, Medium:1.35, Large:1.75},
    taxRate:0.07
  };
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu));
  return menu;
}

// Render menu items
function renderMenu(searchTerm="") {
  const menu = getMenu();
  const wrap = document.getElementById("menuWrap");
  if(!wrap) return;
  
  let items = menu.items.filter(i => i.active);
  if(searchTerm) {
    const term = searchTerm.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(term) || i.desc.toLowerCase().includes(term));
  }

  wrap.innerHTML = items.map(i => `
    <div class="menu-card">
      <img src="${i.img}" alt="${i.name}" class="menu-img"/>
      <div class="menu-content">
        <h3>${i.name}</h3>
        <p>${i.desc}</p>
        <p>${i.sizes.map(sz => `${sz}: ${currency(i.basePrice * menu.sizeMultipliers[sz])}`).join(" | ")}</p>
        <button class="add-btn" data-id="${i.id}">Add to Cart</button>
      </div>
    </div>
  `).join("");

  // Bind add buttons
  wrap.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", ()=> addToCart(btn.dataset.id));
  });
}

// Add item to cart
function addToCart(id, size="Medium", qty=1, toppings=[]) {
  const menu = getMenu();
  const item = menu.items.find(i => i.id===id);
  if(!item) return;

  const price = item.basePrice * menu.sizeMultipliers[size] + toppings.reduce((sum,t) => sum + (menu.toppings.find(tt=>tt.name===t)?.price||0),0);
  
  const cart = getCart();
  cart.push({id:item.id, name:item.name, size, qty, toppings, unit:price, total:price*qty});
  saveCart(cart);
  renderCart();
}

// Render cart
function renderCart() {
  const cart = getCart();
  const wrap = document.getElementById("cartWrap");
  if(!wrap) return;
  if(!cart.length) { wrap.innerHTML = "<em>Cart is empty.</em>"; return; }

  const menu = getMenu();
  let subtotal = 0;

  wrap.innerHTML = cart.map((i,idx) => {
    subtotal += i.total;
    return `
      <div class="cart-row">
        <div><strong>${i.name}</strong> (${i.size}) x${i.qty}</div>
        <div>${i.toppings.join(", ")}</div>
        <div>${currency(i.total)}</div>
        <button data-del="${idx}" class="ghost">Del</button>
      </div>
    `;
  }).join("");

  wrap.innerHTML += `<div class="cart-summary">Subtotal: ${currency(subtotal)} | Tax: ${currency(subtotal * menu.taxRate)} | Total: ${currency(subtotal*(1+menu.taxRate))}</div>`;

  wrap.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", ()=>{
      const c = getCart();
      c.splice(Number(btn.dataset.del),1);
      saveCart(c);
      renderCart();
    });
  });
}

// Build Your Own
function renderBYO() {
  const menu = getMenu();
  const wrap = document.getElementById("byoToppings");
  if(!wrap) return;

  wrap.innerHTML = menu.toppings.filter(t=>t.active).map(t => `
    <label>
      <input type="checkbox" value="${t.name}" data-price="${t.price}" />
      ${t.name} (+${currency(t.price)})
    </label>
  `).join("");

  // Price update
  const priceEl = document.getElementById("byoPrice");
  const basePrice = 10; // Base price for Build Your Own
  const sizeSelect = document.getElementById("byoSize");
  const checkboxes = wrap.querySelectorAll("input[type=checkbox]");

  function updatePrice() {
    const selectedToppings = Array.from(checkboxes).filter(c=>c.checked).map(c=>c.value);
    const toppingCost = selectedToppings.reduce((sum,t)=>sum + Number(menu.toppings.find(tt=>tt.name===t)?.price||0),0);
    const sizeMult = menu.sizeMultipliers[sizeSelect.value] || 1;
    priceEl.textContent = currency((basePrice + toppingCost) * sizeMult);
  }

  checkboxes.forEach(c => c.addEventListener("change", updatePrice));
  sizeSelect?.addEventListener("change", updatePrice);
  updatePrice();

  document.getElementById("addByoBtn")?.addEventListener("click", ()=>{
    const selectedToppings = Array.from(checkboxes).filter(c=>c.checked).map(c=>c.value);
    addToCart("byo-"+Date.now(), sizeSelect.value, 1, selectedToppings);
    checkboxes.forEach(c=>c.checked=false);
    updatePrice();
  });
}

// Search
document.getElementById("searchInput")?.addEventListener("input", e=>{
  renderMenu(e.target.value);
});

// Initialize
document.addEventListener("DOMContentLoaded", ()=>{
  renderMenu();
  renderCart();
  renderBYO();
});
