const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

const SEED_MENU = {
  categories: [
    { id: "specialty", name: "Specialty Pizzas" },
    { id: "build", name: "Build Your Own" },
    { id: "sides", name: "Sides" }
  ],
  items: [
    { id: "pep-supreme", name: "Heavy Hitter", desc: "A classic pepperoni pizza with extra cheese and baked to perfection.", img: "images/pep-supreme.jpg", basePrice: 12.99, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "margherita", name: "Slice of Summer", desc: "Fresh mozzarella, basil, and tomato — a light and bright classic.", img: "images/margherita.jpg", basePrice: 11.5, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "veggie-delight", name: "Veggie Delight", desc: "Loaded with seasonal vegetables and zesty tomato sauce.", img: "images/veggie.jpg", basePrice: 12.0, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
    { id: "garlic-knots", name: "Get Twisted", desc: "Warm garlic knots brushed with herb butter and parmesan.", img: "images/garlic-knots.jpg", basePrice: 4.5, category: "sides", active: true }
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

const $ = id => document.getElementById(id);
const currency = n => `$${Number(n||0).toFixed(2)}`;

function getCart() { try { return JSON.parse(localStorage.getItem(LS_CART_KEY)||"[]"); } catch { return []; } }
function saveCart(c) { localStorage.setItem(LS_CART_KEY, JSON.stringify(c)); updateCartCount(); recalcTotals(); }
function getMenu() { try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function saveMenu(m) { localStorage.setItem(LS_MENU_KEY, JSON.stringify(m)); }

async function fetchMenuJson() {
  try {
    const res = await fetch("./data/menu.json", { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP "+res.status);
    return await res.json();
  } catch(e) { console.warn("menu.json fetch failed; using seed.", e); return null; }
}

async function loadMenu() {
  const cached = getMenu();
  if(cached) return cached;
  const file = await fetchMenuJson();
  if(file) { saveMenu(file); return file; }
  saveMenu(SEED_MENU); return SEED_MENU;
}

// DOM elements
let menuGrid, categoryFilter, searchInput, baseSelect, sizeSelect, toppingsWrap, qtyInput, estPriceEl;
let cartButton, cartDrawer, closeCart, cartItems, subTotal, taxTotal, grandTotal, checkoutBtn, clearCart, cartCount;

function cacheEls(){
  menuGrid = $("menuGrid"); categoryFilter = $("categoryFilter"); searchInput = $("searchInput");
  baseSelect = $("baseSelect"); sizeSelect = $("sizeSelect"); toppingsWrap = $("toppingsWrap"); qtyInput = $("qtyInput");
  estPriceEl = $("estPrice"); cartButton = $("cartButton"); cartDrawer = $("cartDrawer"); closeCart = $("closeCart");
  cartItems = $("cartItems"); subTotal = $("subTotal"); taxTotal = $("taxTotal"); grandTotal = $("grandTotal");
  checkoutBtn = $("checkoutBtn"); clearCart = $("clearCart"); cartCount = $("cartCount");
}

function renderCategoryOptions(menu){
  if(!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All</option>` +
    (menu.categories||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}

function renderMenuList(menu){
  if(!menuGrid) return;
  const term = (searchInput?.value||"").toLowerCase().trim();
  const cat = categoryFilter?.value||"all";
  const items = (menu.items||[]).filter(i=>
    i.active!==false &&
    (cat==="all" || i.category===cat) &&
    (i.name.toLowerCase().includes(term) || (i.desc||"").toLowerCase().includes(term))
  );

  menuGrid.innerHTML = items.map(i=>`
    <article class="item" data-id="${i.id}">
      <img src="${i.img||'images/placeholder.png'}" alt="${i.name}" />
      <div class="content">
        <h3>${i.name}</h3>
        <p>${i.desc||''}</p>
        <div class="price">${currency(i.basePrice||0)}</div>
        ${i.sizes?.length?`
          <label>Size:
            <select data-id="${i.id}" class="sizePick">
              ${i.sizes.map(s=>`<option>${s}</option>`).join("")}
            </select>
          </label>`:``}
        <button class="primary" data-add="${i.id}">Add to Cart</button>
      </div>
    </article>
  `).join("");

  menuGrid.querySelectorAll("select.sizePick").forEach(sel=>{
    sel.addEventListener("change",()=>{
      const itemId = sel.dataset.id;
      const item = (menu.items||[]).find(x=>x.id===itemId);
      const size = sel.value;
      const mult = menu.sizeMultipliers?.[size]??1;
      const priceEl = sel.closest(".item")?.querySelector(".price");
      if(priceEl && item) priceEl.textContent = currency((item.basePrice||0)*mult);
    });
    sel.dispatchEvent(new Event("change"));
  });

  menuGrid.querySelectorAll("button[data-add]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = btn.dataset.add;
      const sel = menuGrid.querySelector(`select.sizePick[data-id="${id}"]`);
      const size = sel?.value || "Small";
      addPresetToCart(id,size);
    });
  });
}

function renderBuilder(menu){
  if(!baseSelect) return;
  baseSelect.innerHTML = [{id:"plain-cheese",name:"Plain Cheese",basePrice:10,sizes:["Small","Medium","Large"],active:true},
    ...(menu.items||[]).filter(i=>i.category==="specialty")]
    .map(b=>`<option value="${b.id}">${b.name}</option>`).join("");
  sizeSelect.innerHTML = Object.keys(menu.sizeMultipliers||{Small:1}).map(s=>`<option>${s}</option>`).join("");
  toppingsWrap.innerHTML = (menu.toppings||[]).filter(t=>t.active!==false)
    .map(t=>`<label><input type="checkbox" value="${t.id}" data-price="${t.price}"> ${t.name} (+$${(t.price||0).toFixed(2)})</label>`).join("");
  recalcBuildPrice();
}

function updateCartCount(){
  if(!cartCount) return;
  cartCount.textContent = getCart().reduce((a,c)=>a+(c.qty||0),0);
}

function recalcTotals(){
  if(!subTotal || !taxTotal || !grandTotal) return;
  const menu = getMenu();
  const taxRate = menu?.taxRate??0.07;
  const cart = getCart();
  const subtotal = cart.reduce((sum,item)=>sum+(item.total||0),0);
  subTotal.textContent = currency(subtotal);
  taxTotal.textContent = currency(subtotal*taxRate);
  grandTotal.textContent = currency(subtotal*(1+taxRate));
  if(checkoutBtn) checkoutBtn.disabled = cart.length===0;
}

function addPresetToCart(id,size){
  const menu = getMenu();
  const item = (menu.items||[]).find(i=>i.id===id);
  if(!item) return;
  const mult = menu.sizeMultipliers?.[size]??1;
  const unit = (item.basePrice||0)*mult;
  const line = { id: crypto.randomUUID(), name:`${item.name} (${size})`, size, qty:1, unit, total:unit, toppings:[] };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

function addBuildToCart(){
  const menu = getMenu();
  const baseId = baseSelect.value;
  const base = baseId==="plain-cheese" ? {name:"Plain Cheese", basePrice:10} : menu.items.find(i=>i.id===baseId);
  const size = sizeSelect.value||"Small";
  const mult = menu.sizeMultipliers?.[size]??1;
  const toppingChecks = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost = toppingChecks.reduce((s,c)=>s + Number(c.dataset.price||0),0);
  const qty = Math.max(1, Number(qtyInput.value||1));
  const unit = (base.basePrice*mult)+toppingCost;
  const line = { id: crypto.randomUUID(), name:`${base.name} (${size})`, size, qty, unit, total:unit*qty, toppings:toppingChecks.map(c=>c.value) };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

function renderCart(){
  const cart = getCart();
  if(!cartItems) return;
  cartItems.innerHTML = cart.map(i=>`
    <div class="cart-row" data-id="${i.id}">
      <div>
        <div><strong>${i.name}</strong> × ${i.qty}</div>
        ${i.size?`<div><small>Size: ${i.size}</small></div>`:``}
        ${i.toppings?.length?`<small>${i.toppings.join(", ")}</small>`:``}
        <small>${currency(i.unit)} each</small>
      </div>
      <div>
        <strong>${currency(i.total)}</strong><br/>
        <button data-qty="${i.id}" data-d="-1">-</button>
        <button data-qty="${i.id}" data-d="1">+</button>
        <button data-remove="${i.id}" class="ghost">Remove</button>
      </div>
    </div>
  `).join("");

  cartItems.querySelectorAll("button[data-remove]").forEach(b=>b.addEventListener("click",()=>{
    const newCart = getCart().filter(x=>x.id!==b.dataset.remove);
    saveCart(newCart); renderCart();
  }));

  cartItems.querySelectorAll("button[data-qty]").forEach(b=>b.addEventListener("click",()=>{
    const c = getCart();
    const it = c.find(x=>x.id===b.dataset.qty);
    if(!it) return;
    it.qty = Math.max(1,it.qty + Number(b.dataset.d));
    it.total = it.unit*it.qty;
    saveCart(c); renderCart();
  }));

  recalcTotals();
}

function recalcBuildPrice(){
  const menu = getMenu();
  const baseId = baseSelect.value;
  const base = baseId==="plain-cheese" ? {basePrice:10} : menu.items.find(i=>i.id===baseId)||{basePrice:10, name:"Plain Cheese"};
  const size = sizeSelect.value||"Small";
  const mult = menu.sizeMultipliers?.[size]??1;
  const toppingChecks = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost = toppingChecks.reduce((s,c)=>s + Number(c.dataset.price||0),0);
  const qty = Math.max(1, Number(qtyInput.value||1));
  if(estPriceEl) estPriceEl.textContent = currency((base.basePrice*mult + toppingCost)*qty);
}

function wire(){
  $("addBuildBtn")?.addEventListener("click", addBuildToCart);
  toppingsWrap?.addEventListener("change", recalcBuildPrice);
  sizeSelect?.addEventListener("change", recalcBuildPrice);
  qtyInput?.addEventListener("input", recalcBuildPrice);

  cartButton?.addEventListener("click",()=>{ cartDrawer?.classList.add("open"); cartDrawer?.setAttribute("aria-hidden","false"); });
  closeCart?.addEventListener("click",()=>{ cartDrawer?.classList.remove("open"); cartDrawer?.setAttribute("aria-hidden","true"); });
  clearCart?.addEventListener("click",()=>{ saveCart([]); renderCart(); });
  searchInput?.addEventListener("input",()=>renderMenuList(getMenu()));
  categoryFilter?.addEventListener("change",()=>renderMenuList(getMenu()));
}

async function boot(){
  cacheEls();
  const menu = await loadMenu();
  renderCategoryOptions(menu);
  renderMenuList(menu);
  renderBuilder(menu);
  updateCartCount();
  renderCart();
  wire();
  checkoutBtn?.addEventListener("click",()=>window.location.href="./payment.html");
}

document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
