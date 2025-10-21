const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// SEED_MENU: used if data/menu.json can't be fetched or nothing in localStorage.
// Includes renamed pizzas:
//  - "Pepperoni Supreme" -> "Heavy Hitter"
//  - "Margherita" -> "Slice of Summer"
//  - "Garlic Knots" -> "Get Twised"
const SEED_MENU = {
  categories: [
    { id: "specialty", name: "Specialty Pizzas" },
    { id: "build", name: "Build Your Own" },
    { id: "sides", name: "Sides" }
  ],
  items: [
    {
      id: "pep-supreme",
      name: "Heavy Hitter",
      desc: "A classic pepperoni pizza with extra cheese and baked to perfection.",
      img: "images/pep-supreme.jpg",
      basePrice: 12.99,
      category: "specialty",
      sizes: ["Small", "Medium", "Large"],
      active: true
    },
    {
      id: "margherita",
      name: "Slice of Summer",
      desc: "Fresh mozzarella, basil, and tomato — a light and bright classic.",
      img: "images/margherita.jpg",
      basePrice: 11.5,
      category: "specialty",
      sizes: ["Small", "Medium", "Large"],
      active: true
    },
    {
      id: "veggie-delight",
      name: "Veggie Delight",
      desc: "Loaded with seasonal vegetables and zesty tomato sauce.",
      img: "images/veggie.jpg",
      basePrice: 12.0,
      category: "specialty",
      sizes: ["Small", "Medium", "Large"],
      active: true
    },
    {
      id: "garlic-knots",
      name: "Get Twised",
      desc: "Warm garlic knots brushed with herb butter and parmesan.",
      img: "images/garlic-knots.jpg",
      basePrice: 4.5,
      category: "sides",
      active: true
    }
  ],
  toppings: [
    { id: "mozzarella", name: "Mozzarella", price: 1.0, active: true },
    { id: "pepperoni", name: "Pepperoni", price: 1.25, active: true },
    { id: "mushrooms", name: "Mushrooms", price: 0.9, active: true },
    { id: "onions", name: "Onions", price: 0.6, active: true },
    { id: "olives", name: "Olives", price: 0.8, active: true }
  ],
  sizeMultipliers: {
    Small: 1,
    Medium: 1.35,
    Large: 1.75
  },
  taxRate: 0.07
};

function currency(n) { return `$${n.toFixed(2)}`; }
const $ = (id) => document.getElementById(id);

function getCart() { try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveCart(c) { localStorage.setItem(LS_CART_KEY, JSON.stringify(c)); updateCartCount(); recalcTotals(); }
function getMenu() { try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function saveMenu(m) { localStorage.setItem(LS_MENU_KEY, JSON.stringify(m)); }

async function fetchMenuJson() {
  try {
    const res = await fetch("./data/menu.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) { console.warn("menu.json fetch failed; using seed.", e); return null; }
}

async function loadMenu() {
  const cached = getMenu();
  if (cached) return cached;
  const file = await fetchMenuJson();
  if (file) { saveMenu(file); return file; }
  saveMenu(SEED_MENU); return SEED_MENU;
}

// Cached elements
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
  if (!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All</option>` + (menu.categories || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderMenuList(menu){
  if (!menuGrid) return;
  const term = (searchInput?.value||"").toLowerCase().trim();
  const cat = categoryFilter?.value || "all";
  const filtered = (menu.items || []).filter(i =>
    i.active !== false &&
    (cat === "all" || i.category === cat) &&
    (i.name.toLowerCase().includes(term) || (i.desc || "").toLowerCase().includes(term))
  );
  menuGrid.innerHTML = filtered.map(i => `
    <article class="item">
      <img src="${i.img || 'images/placeholder.png'}" alt="${i.name}" />
      <div class="content">
        <h3>${i.name}</h3>
        <p>${i.desc || ''}</p>
        <div class="price">from $${(i.basePrice || 0).toFixed(2)}</div>
        ${i.sizes?.length ? `
          <label>Size:
            <select data-id="${i.id}" class="sizePick">
              ${i.sizes.map(s=>`<option>${s}</option>`).join("")}
            </select>
          </label>` : ``}
        <button class="primary" data-add="${i.id}">Add to Cart</button>
      </div>
    </article>
  `).join("");

  menuGrid.querySelectorAll("button[data-add]").forEach(btn=> btn.addEventListener("click", () => addPresetToCart(btn.dataset.add)));
}

function renderBuilder(menu){
  if (!baseSelect) return;
  const bases = [{id:"plain-cheese", name:"Plain Cheese", basePrice:10.0, sizes:["Small","Medium","Large"], active:true}, ...(menu.items || []).filter(i=>i.category==="specialty")];
  baseSelect.innerHTML = bases.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
  sizeSelect.innerHTML = Object.keys(menu.sizeMultipliers || { Small:1 }).map(s => `<option>${s}</option>`).join("");
  toppingsWrap.innerHTML = (menu.toppings || []).filter(t=>t.active!==false).map(t => `
    <label><input type="checkbox" value="${t.id}" data-price="${t.price}"> ${t.name} (+$${t.price.toFixed(2)})</label>
  `).join("");
  recalcBuildPrice();
}

function updateCartCount(){ if (!cartCount) return; cartCount.textContent = getCart().reduce((a,c)=>a+c.qty,0); }
function recalcTotals(){
  const menu = getMenu(); const taxRate = menu?.taxRate ?? 0.07;
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
  if (subTotal) subTotal.textContent = currency(subtotal);
  if (taxTotal) taxTotal.textContent = currency(subtotal * taxRate);
  if (grandTotal) grandTotal.textContent = currency(subtotal * (1 + taxRate));
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function addPresetToCart(itemId){
  const menu = getMenu();
  const item = (menu.items || []).find(i=>i.id===itemId);
  if (!item) return;
  const size = item.sizes?.[0] || null;
  const mult = size ? (menu.sizeMultipliers?.[size] ?? 1) : 1;
  const price = (item.basePrice || 0) * mult;
  const line = { id: (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)), name:item.name, size, toppings:[], unit:price, qty:1, total:price };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

function addBuildToCart(){
  const menu = getMenu();
  const baseId = baseSelect.value;
  const base = (baseId==="plain-cheese") ? {name:"Plain Cheese", basePrice:10.0, sizes:["Small","Medium","Large"]} : (menu.items || []).find(i=>i.id===baseId);
  if (!base) return;
  const size = sizeSelect.value;
  const mult = menu.sizeMultipliers?.[size] ?? 1;
  const toppingChecks = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost = toppingChecks.reduce((s,c)=>s + Number(c.dataset.price||0), 0);
  const unit = (base.basePrice || base.basePrice === 0 ? base.basePrice : (base.basePrice || 0)) * mult + toppingCost;
  const qty = Math.max(1, Number(qtyInput.value||1));
  const line = { id: (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)), name: `${base.name} (${size})`, size, toppings: toppingChecks.map(c=>c.value), unit, qty, total: unit*qty };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

function renderCart(){
  const cart = getCart();
  if (!cartItems) return;
  cartItems.innerHTML = cart.map(i=>`
    <div class="cart-row" data-id="${i.id}">
      <div>
        <div><strong>${i.name}</strong> × ${i.qty}</div>
        ${i.toppings?.length ? `<small>${i.toppings.join(", ")}</small>` : ``}
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

  // Remove handlers
  cartItems.querySelectorAll("button[data-remove]").forEach(b=> b.addEventListener("click", ()=> {
    const newCart = getCart().filter(x=>x.id!==b.dataset.remove);
    saveCart(newCart);
    renderCart();
  }));

  // Qty change handlers
  cartItems.querySelectorAll("button[data-qty]").forEach(b=> b.addEventListener("click", ()=> {
    const c = getCart();
    const it = c.find(x=>x.id===b.dataset.qty);
    if (!it) return;
    const d = Number(b.dataset.d);
    it.qty = Math.max(1, (it.qty || 1) + d);
    it.total = (it.unit || 0) * it.qty;
    saveCart(c);
    renderCart();
  }));

  recalcTotals();
}

function recalcBuildPrice(){
  const menu=getMenu();
  const baseId=baseSelect?.value;
  const base=(baseId==="plain-cheese")?{basePrice:10.0}: (menu.items || []).find(i=>i.id===baseId) || {basePrice:10.0};
  const size=sizeSelect?.value;
  const mult=menu.sizeMultipliers?.[size] ?? 1;
  const toppingChecks=[...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost=toppingChecks.reduce((s,c)=>s+Number(c.dataset.price||0),0);
  const unit=(base.basePrice * mult)+toppingCost;
  const qty=Math.max(1, Number(qtyInput?.value||1));
  if (estPriceEl) estPriceEl.textContent=currency(unit*qty);
}

// --- Browse-all modal / popup functions ---
// Injects minimal styles, creates modal DOM, and provides show/hide and a helper to
// ensure a "Browse All" button exists on the page.

function ensureBrowseModalStyles(){
  if (document.getElementById("browseModalStyles")) return;
  const s = document.createElement("style");
  s.id = "browseModalStyles";
  s.innerText = `
  .browse-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10000; }
  .browse-modal { background: #fff; width: 90%; max-width:900px; max-height:80vh; overflow:auto; border-radius:8px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,0.3); position:relative; }
  .browse-modal h2{margin:0 0 8px 0;}
  .browse-modal .close { position:absolute; right:20px; top:14px; background:transparent; border:none; font-size:20px; cursor:pointer; }
  .browse-list { display:flex; flex-direction:column; gap:12px; }
  .browse-item { display:flex; gap:12px; align-items:flex-start; border-bottom:1px solid #eee; padding-bottom:8px; }
  .browse-item img { width:88px; height:64px; object-fit:cover; border-radius:6px; }
  .browse-item .meta { flex:1; }
  .browse-item .meta h3{margin:0 0 6px 0;}
  `;
  document.head.appendChild(s);
}

function ensureBrowseModalDom(){
  if (document.getElementById("browseModalBackdrop")) return;
  ensureBrowseModalStyles();

  const backdrop = document.createElement("div");
  backdrop.id = "browseModalBackdrop";
  backdrop.className = "browse-modal-backdrop";
  backdrop.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "browse-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <button class="close" id="browseModalClose" aria-label="Close">&times;</button>
    <h2>Full Menu</h2>
    <div id="browseModalContent" class="browse-list" tabindex="0"></div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // close handlers
  document.getElementById("browseModalClose").addEventListener("click", hideBrowseModal);
  backdrop.addEventListener("click", (e)=> { if (e.target === backdrop) hideBrowseModal(); });
  document.addEventListener("keydown", (e)=> { if (e.key === "Escape") hideBrowseModal(); });
}

function showBrowseModal(menu){
  ensureBrowseModalDom();
  const content = document.getElementById("browseModalContent");
  if (!menu) menu = getMenu();
  // group by categories for nicer display
  const categories = (menu?.categories || []).reduce((acc,c)=>{ acc[c.id] = {...c, items:[]}; return acc; }, {});
  (menu?.items || []).forEach(it => {
    if (!categories[it.category]) {
      categories[it.category] = { id: it.category, name: it.category, items: [] };
    }
    categories[it.category].items.push(it);
  });

  const html = Object.values(categories).map(cat => {
    const items = (cat.items || []).filter(i=> i.active !== false).map(i => `
      <div class="browse-item">
        <img src="${i.img || 'images/placeholder.png'}" alt="${i.name}" />
        <div class="meta">
          <h3>${i.name}</h3>
          <div class="desc">${i.desc || ''}</div>
          <div class="price">from ${currency(i.basePrice || 0)}</div>
        </div>
        <div>
          <button class="primary" data-add="${i.id}">Add</button>
        </div>
      </div>
    `).join("");
    return `<h3 style="margin-top:12px">${cat.name}</h3>${items}`;
  }).join("");

  content.innerHTML = html || "<div>No menu items found.</div>";

  // wire add buttons inside modal
  content.querySelectorAll("button[data-add]").forEach(btn=> btn.addEventListener("click", () => {
    addPresetToCart(btn.dataset.add);
    // Optionally close modal after add: hideBrowseModal();
  }));

  document.getElementById("browseModalBackdrop").style.display = "flex";
}

function hideBrowseModal(){
  const b = document.getElementById("browseModalBackdrop");
  if (b) b.style.display = "none";
}

function ensureBrowseButton(){
  if ($("browseAllBtn")) return;
  const btn = document.createElement("button");
  btn.id = "browseAllBtn";
  btn.className = "secondary";
  btn.innerText = "Browse All";
  // try to place near categoryFilter if available, otherwise before menuGrid
  if (categoryFilter && categoryFilter.parentNode) {
    categoryFilter.parentNode.insertBefore(btn, categoryFilter.nextSibling);
  } else if (menuGrid && menuGrid.parentNode) {
    menuGrid.parentNode.insertBefore(btn, menuGrid);
  } else {
    document.body.insertBefore(btn, document.body.firstChild);
  }
  btn.addEventListener("click", async ()=>{
    const menu = await loadMenu();
    showBrowseModal(menu);
  });
}
// --- end browse-all modal / popup functions ---

function wire(){
  $("addBuildBtn")?.addEventListener("click", addBuildToCart);
  $("toppingsWrap")?.addEventListener("change", recalcBuildPrice);
  sizeSelect?.addEventListener("change", recalcBuildPrice);
  qtyInput?.addEventListener("input", recalcBuildPrice);
  $("cartButton")?.addEventListener("click",()=>{ $("cartDrawer").classList.add("open"); $("cartDrawer").setAttribute("aria-hidden","false"); });
  $("closeCart")?.addEventListener("click",()=>{ $("cartDrawer").classList.remove("open"); $("cartDrawer").setAttribute("aria-hidden","true"); });
  $("clearCart")?.addEventListener("click",()=>{ saveCart([]); renderCart(); });
  $("searchInput")?.addEventListener("input", ()=>renderMenuList(getMenu()));
  $("categoryFilter")?.addEventListener("change", ()=>renderMenuList(getMenu()));
}

// helper: ensure a browse button exists and wire it (called from boot)
function ensureBrowseButtonOnBoot(){
  // ensureBrowseButton relies on cached elements being set
  ensureBrowseButton();
}

async function boot(){
  cacheEls();
  const menu = await loadMenu();

  // create and wire the browse-all button
  ensureBrowseButton();

  renderCategoryOptions(menu);
  renderMenuList(menu);
  renderBuilder(menu);
  updateCartCount();
  renderCart();
  wire();
  // wire checkout nav
  checkoutBtn?.addEventListener("click", () => {
    // Simple nav to staging payment page
    window.location.href = "./payment.html";
  });
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
