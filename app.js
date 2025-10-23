const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

const SEED_MENU = {
  categories: [
    { id: "specialty", name: "Specialty Pizzas" },
    { id: "build", name: "Build Your Own" },
    { id: "sides", name: "Sides" },
    { id: "drinks", name: "Drinks" }
  ],
  items: [
    { id: "pep-supreme", name: "Heavy Hitter", desc: "Classic pepperoni with extra cheese.", img: "images/pep-supreme.jpg", basePrice: 12.99, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "margherita", name: "Slice of Summer", desc: "Fresh mozzarella, basil, tomato.", img: "images/margherita.jpg", basePrice: 11.5, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "veggie-delight", name: "Veggie Delight", desc: "Seasonal vegetables & zesty tomato sauce.", img: "images/veggie.jpg", basePrice: 12, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "garlic-knots", name: "Get Twisted", desc: "Warm garlic knots brushed with herb butter.", img: "images/garlic-knots.jpg", basePrice: 4.5, category: "sides", active: true },
    { id: "coke", name: "Coca-Cola", desc: "Classic soda.", img: "images/coke.jpg", basePrice: 1.5, category: "drinks", active: true },
    { id: "sprite", name: "Sprite", desc: "Lemon-lime soda.", img: "images/sprite.jpg", basePrice: 1.5, category: "drinks", active: true }
  ],
  toppings: [
    { id: "mozzarella", name: "Mozzarella", price: 1.0, active: true },
    { id: "pepperoni", name: "Pepperoni", price: 1.25, active: true },
    { id: "mushrooms", name: "Mushrooms", price: 0.9, active: true },
    { id: "onions", name: "Onions", price: 0.6, active: true },
    { id: "olives", name: "Olives", price: 0.8, active: true }
  ],
  sizeMultipliers: { Small:1, Medium:1.35, Large:1.75 },
  taxRate: 0.07
};

// Utility functions
const $ = id => document.getElementById(id);
const currency = n => `$${Number(n||0).toFixed(2)}`;

function getCart(){ try{ return JSON.parse(localStorage.getItem(LS_CART_KEY)||"[]"); } catch{return [];} }
function saveCart(c){ localStorage.setItem(LS_CART_KEY, JSON.stringify(c)); updateCartCount(); recalcTotals(); }
function getMenu(){ try{ return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch{return null;} }
function saveMenu(m){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(m)); }

async function loadMenu() {
  const cached = getMenu();
  if(cached) return cached;
  saveMenu(SEED_MENU);
  return SEED_MENU;
}

// DOM elements
let menuGrid, categoryFilter, searchInput, baseSelect, sizeSelect, toppingsWrap, qtyInput, estPriceEl;
let cartButton, cartDrawer, closeCart, cartItems, subTotal, taxTotal, grandTotal, checkoutBtn, clearCart, cartCount;
let custName, custPhone, custAddress;

function cacheEls(){
  menuGrid = $("menuGrid"); categoryFilter = $("categoryFilter"); searchInput = $("searchInput");
  baseSelect = $("baseSelect"); sizeSelect = $("sizeSelect"); toppingsWrap = $("toppingsWrap"); qtyInput = $("qtyInput");
  estPriceEl = $("estPrice"); cartButton = $("cartButton"); cartDrawer = $("cartDrawer"); closeCart = $("closeCart");
  cartItems = $("cartItems"); subTotal = $("subTotal"); taxTotal = $("taxTotal"); grandTotal = $("grandTotal");
  checkoutBtn = $("checkoutBtn"); clearCart = $("clearCart"); cartCount = $("cartCount");
  custName = $("custName"); custPhone = $("custPhone"); custAddress = $("custAddress");
}

// Render functions (menu, builder, cart)
function renderCategoryOptions(menu){
  if(!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All</option>`+
    (menu.categories||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}

function renderMenuList(menu){
  if(!menuGrid) return;
  const term = (searchInput?.value||"").toLowerCase().trim();
  const cat = categoryFilter?.value||"all";
  const items = (menu.items||[]).filter(i=>i.active!==false &&
    (cat==="all"||i.category===cat) &&
    (i.name.toLowerCase().includes(term)||(i.desc||"").toLowerCase().includes(term))
  );

  menuGrid.innerHTML = items.map(i=>`
    <article class="item" data-id="${i.id}">
      <img src="${i.img||'images/placeholder.png'}" alt="${i.name}" />
      <div class="content">
        <h3>${i.name}</h3>
        <p>${i.desc||''}</p>
        <div class="price">${currency(i.basePrice||0)}</div>
        ${i.sizes?.length?`<label>Size:
          <select data-id="${i.id}" class="sizePick">
            ${i.sizes.map(s=>`<option>${s}</option>`).join("")}
          </select></label>`:``}
        <button class="primary" data-add="${i.id}">Add to Cart</button>
      </div>
    </article>
  `).join("");

  menuGrid.querySelectorAll("select.sizePick").forEach(sel=>{
    sel.addEventListener("change",()=>{
      const item = menu.items.find(x=>x.id===sel.dataset.id);
      const mult = menu.sizeMultipliers?.[sel.value]??1;
      const priceEl = sel.closest(".item")?.querySelector(".price");
      if(priceEl && item) priceEl.textContent = currency(item.basePrice*mult);
    });
    sel.dispatchEvent(new Event("change"));
  });

  menuGrid.querySelectorAll("button[data-add]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = btn.dataset.add;
      const sel = menuGrid.querySelector(`select.sizePick[data-id="${id}"]`);
      const size = sel?.value || "Small";
      addPresetToCart(id,size);
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden","false");
    });
  });
}

// Builder price recalc
function recalcBuildPrice(){
  const menu = getMenu();
  const base = menu.items.find(i=>i.id===baseSelect.value)||{basePrice:10,name:"Plain Cheese"};
  const size = sizeSelect.value||"Small";
  const mult = menu.sizeMultipliers?.[size]??1;
  const toppingCost = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")].reduce((s,c)=>s+Number(c.dataset.price||0),0);
  const qty = Math.max(1,Number(qtyInput.value||1));
  estPriceEl.textContent = currency((base.basePrice*mult + toppingCost)*qty);
}

// Add preset pizza to cart
function addPresetToCart(id,size){
  const menu = getMenu();
  const item = menu.items.find(i=>i.id===id);
  if(!item) return;
  const mult = menu.sizeMultipliers?.[size]??1;
  const line = { id: crypto.randomUUID(), name:`${item.name} (${size})`, size, qty:1, unit:item.basePrice*mult, total:item.basePrice*mult, toppings:[] };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

// Add build to cart
function addBuildToCart(){
  const menu = getMenu();
  const base = menu.items.find(i=>i.id===baseSelect.value)||{basePrice:10,name:"Plain Cheese"};
  const size = sizeSelect.value||"Small";
  const mult = menu.sizeMultipliers?.[size]??1;
  const toppingChecks = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost = toppingChecks.reduce((s,c)=>s + Number(c.dataset.price||0),0);
  const qty = Math.max(1, Number(qtyInput.value||1));
  const unit = base.basePrice*mult+toppingCost;
  const line = { id: crypto.randomUUID(), name:`${base.name} (${size})`, size, qty, unit, total:unit*qty, toppings: toppingChecks.map(c=>c.value) };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
  cartDrawer.classList.add("open"); cartDrawer.setAttribute("aria-hidden","false");
}

// Cart rendering
function renderCart(){
  const cart = getCart();
  cartItems.innerHTML = cart.map(c=>{
    return `<div class="cart-row" data-id="${c.id}">
      <div>${c.name}${c.toppings?.length?`<br><small>Toppings: ${c.toppings.join(", ")}</small>`:""}</div>
      <div>
        <input type="number" min="1" value="${c.qty}" class="cart-qty" style="width:40px">
      </div>
      <div>${currency(c.total)}</div>
      <button class="remove-item" title="Remove">✕</button>
    </div>`;
  }).join("");
  cartItems.querySelectorAll(".cart-qty").forEach(inp=>{
    inp.addEventListener("change",e=>{
      const row = e.target.closest(".cart-row"); const id=row.dataset.id;
      const cart = getCart(); const item=cart.find(x=>x.id===id);
      if(!item) return;
      item.qty = Math.max(1, Number(e.target.value||1));
      item.total = item.unit*item.qty;
      saveCart(cart); renderCart();
    });
  });
  cartItems.querySelectorAll(".remove-item").forEach(btn=>{
    btn.addEventListener("click",e=>{
      const row = e.target.closest(".cart-row"); const id=row.dataset.id;
      const cart = getCart(); saveCart(cart.filter(x=>x.id!==id)); renderCart();
    });
  });
  recalcTotals();
}

// Totals recalc
function recalcTotals(){
  const cart = getCart();
  const subtotal = cart.reduce((s,c)=>s+c.total,0);
  const tax = subtotal*SEED_MENU.taxRate;
  subTotal.textContent = currency(subtotal);
  taxTotal.textContent = currency(tax);
  grandTotal.textContent = currency(subtotal+tax);
  checkoutBtn.disabled = !(custName.value && custPhone.value && custAddress.value && cart.length>0);
  cartCount.textContent = cart.length;
}

// Init builder toppings
function renderBuilderToppings(){
  const menu = getMenu();
  toppingsWrap.innerHTML = (menu.toppings||[]).map(t=>`
    <label><input type="checkbox" value="${t.name}" data-price="${t.price}"> ${t.name} (${currency(t.price)})</label>
  `).join("");
}

// Event listeners
function bindEvents(){
  cartButton.addEventListener("click",()=>{ cartDrawer.classList.add("open"); cartDrawer.setAttribute("aria-hidden","false"); });
  closeCart.addEventListener("click",()=>{ cartDrawer.classList.remove("open"); cartDrawer.setAttribute("aria-hidden","true"); });
  clearCart.addEventListener("click",()=>{ localStorage.removeItem(LS_CART_KEY); renderCart(); });
  checkoutBtn.addEventListener("click",()=>{ alert("Order placed!"); localStorage.removeItem(LS_CART_KEY); renderCart(); cartDrawer.classList.remove("open"); });
  baseSelect.addEventListener("change",recalcBuildPrice);
  sizeSelect.addEventListener("change",recalcBuildPrice);
  qtyInput.addEventListener("input",recalcBuildPrice);
  toppingsWrap.addEventListener("change",recalcBuildPrice);
  [custName,custPhone,custAddress].forEach(inp=>inp.addEventListener("input",recalcTotals));
  categoryFilter.addEventListener("change",()=>{ loadMenu().then(renderMenuList); });
  searchInput.addEventListener("input",()=>{ loadMenu().then(renderMenuList); });
  $("addBuildBtn").addEventListener("click",addBuildToCart);
}

// Populate builder selects
function renderBuilderOptions(){
  const menu = getMenu();
  baseSelect.innerHTML = menu.items.filter(i=>i.active).map(i=>`<option value="${i.id}">${i.name}</option>`).join("");
  sizeSelect.innerHTML = Object.keys(menu.sizeMultipliers).map(s=>`<option>${s}</option>`).join("");
}

// App init
async function init(){
  cacheEls();
  const menu = await loadMenu();
  renderCategoryOptions(menu);
  renderMenuList(menu);
  renderBuilderOptions();
  renderBuilderToppings();
  bindEvents();
  recalcBuildPrice();
  renderCart();
}

document.addEventListener("DOMContentLoaded", init);
