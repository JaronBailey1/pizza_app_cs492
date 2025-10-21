const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

const SEED_MENU = {
  version: 1, // Increment to force updates
  categories: [
    { id: "specialty", name: "Specialty Pizzas" },
    { id: "build", name: "Build Your Own" },
    { id: "sides", name: "Sides" }
  ],
  items: [
    { id: "pep-supreme", name: "The Heavy Hitter", category: "specialty", basePrice: 14.0, sizes: ["Small","Medium","Large"], desc: "Loaded with double pepperoni and mozzarella.", img: "https://picsum.photos/seed/pep/800/500", active:true },
    { id: "marg", name: "Slice of Summer", category: "specialty", basePrice: 13.0, sizes: ["Small","Medium","Large"], desc: "Tomato, fresh mozzarella, basil, olive oil.", img: "https://picsum.photos/seed/marg/800/500", active:true },
    { id: "garlic-knots", name: "Get Twisted", category: "sides", basePrice: 6.0, sizes: [], desc: "Buttery knots with garlic and herbs.", img: "https://picsum.photos/seed/knots/800/500", active:true }
  ],
  toppings: [
    {id:"pep", name:"Pepperoni", price:1.5, active:true},
    {id:"sau", name:"Sausage", price:1.5, active:true},
    {id:"mus", name:"Mushrooms", price:1.0, active:true},
    {id:"oli", name:"Olives", price:1.0, active:true},
    {id:"jal", name:"Jalapeños", price:1.0, active:true}
  ],
  sizeMultipliers: {Small:1.0, Medium:1.25, Large:1.5},
  taxRate: 0.07,
  discounts: []
};

function currency(n) { return `$${n.toFixed(2)}`; }
const $ = id => document.getElementById(id);

function getCart() { try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveCart(c) { localStorage.setItem(LS_CART_KEY, JSON.stringify(c)); updateCartCount(); recalcTotals(); }
function getMenu() { try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function saveMenu(m) { localStorage.setItem(LS_MENU_KEY, JSON.stringify(m)); }

// Always use SEED_MENU and check version
async function loadMenu() {
  const cached = getMenu();
  if (!cached || cached.version !== SEED_MENU.version) {
    saveMenu(SEED_MENU);
    return SEED_MENU;
  }
  return cached;
}

// Cached elements
let menuGrid, categoryFilter, searchInput, baseSelect, sizeSelect, toppingsWrap, qtyInput, estPriceEl;
let cartButton, cartDrawer, closeCart, cartItems, subTotal, taxTotal, grandTotal, checkoutBtn, clearCart, cartCount;

function cacheEls() {
  menuGrid = $("menuGrid"); categoryFilter = $("categoryFilter"); searchInput = $("searchInput");
  baseSelect = $("baseSelect"); sizeSelect = $("sizeSelect"); toppingsWrap = $("toppingsWrap"); qtyInput = $("qtyInput");
  estPriceEl = $("estPrice"); cartButton = $("cartButton"); cartDrawer = $("cartDrawer"); closeCart = $("closeCart");
  cartItems = $("cartItems"); subTotal = $("subTotal"); taxTotal = $("taxTotal"); grandTotal = $("grandTotal");
  checkoutBtn = $("checkoutBtn"); clearCart = $("clearCart"); cartCount = $("cartCount");
}

function renderCategoryOptions(menu){
  categoryFilter.innerHTML = `<option value="all">All</option>` + menu.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderMenuList(menu){
  const term = (searchInput.value||"").toLowerCase().trim();
  const cat = categoryFilter.value || "all";
  const filtered = menu.items.filter(i =>
    i.active !== false &&
    (cat === "all" || i.category === cat) &&
    (i.name.toLowerCase().includes(term) || i.desc.toLowerCase().includes(term))
  );

  menuGrid.innerHTML = filtered.map(i => {
    const defaultSize = i.sizes?.[0] || null;
    const mult = defaultSize ? (menu.sizeMultipliers[defaultSize] ?? 1) : 1;
    const price = i.basePrice * mult;

    return `
      <article class="item">
        <img src="${i.img}" alt="${i.name}" />
        <div class="content">
          <h3>${i.name}</h3>
          <p>${i.desc}</p>
          <div class="price" data-id="${i.id}">${currency(price)}</div>
          ${i.sizes?.length ? `
            <label>Size:
              <select data-id="${i.id}" class="sizePick">
                ${i.sizes.map(s=>`<option>${s}</option>`).join("")}
              </select>
            </label>` : ``}
          <button class="primary" data-add="${i.id}">Add to Cart</button>
        </div>
      </article>
    `;
  }).join("");

  menuGrid.querySelectorAll(".sizePick").forEach(sel => {
    sel.addEventListener("change", e => {
      const menuData = getMenu();
      const id = e.target.dataset.id;
      const item = menuData.items.find(i => i.id === id);
      const size = e.target.value;
      const mult = menuData.sizeMultipliers[size] ?? 1;
      const newPrice = item.basePrice * mult;
      e.target.closest(".item").querySelector(".price").textContent = currency(newPrice);
    });
  });

  menuGrid.querySelectorAll("button[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.add;
      const sizeSelect = btn.closest("article").querySelector(".sizePick");
      const selectedSize = sizeSelect ? sizeSelect.value : null;
      addPresetToCart(id, selectedSize);
    });
  });
}

function addPresetToCart(itemId, selectedSize = null){
  const menu = getMenu();
  const item = menu.items.find(i=>i.id===itemId);
  const size = selectedSize || item.sizes?.[0] || null;
  const mult = size ? menu.sizeMultipliers[size] : 1;
  const price = item.basePrice * mult;

  const line = { 
    id: crypto.randomUUID(), 
    name: item.name,
    basePrice: item.basePrice,
    size, 
    toppings:[], 
    unit:price, 
    qty:1, 
    total:price 
  };
  const cart = getCart(); 
  cart.push(line); 
  saveCart(cart); 
  renderCart();
}

function renderBuilder(menu){
  const bases = [
    {id:"plain-cheese", name:"Plain Cheese", basePrice:10.0, sizes:["Small","Medium","Large"], active:true},
    ...menu.items.filter(i => i.category === "specialty" || i.category === "sides")
  ];

  baseSelect.innerHTML = bases.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
  sizeSelect.innerHTML = Object.keys(menu.sizeMultipliers).map(s => `<option>${s}</option>`).join("");
  toppingsWrap.innerHTML = menu.toppings.filter(t=>t.active!==false).map(t => `
    <label><input type="checkbox" value="${t.id}" data-price="${t.price}"> ${t.name} (+${currency(t.price)})</label>
  `).join("");
  recalcBuildPrice();
}

function updateCartCount(){ cartCount.textContent = getCart().reduce((a,c)=>a+c.qty,0); }

function recalcTotals(){
  const menu = getMenu(); 
  const taxRate = menu?.taxRate ?? 0.07;
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  subTotal.textContent = currency(subtotal);
  taxTotal.textContent = currency(subtotal * taxRate);
  grandTotal.textContent = currency(subtotal * (1 + taxRate));
  checkoutBtn.disabled = cart.length === 0;
}

function addBuildToCart(){
  const menu = getMenu();
  const baseId = baseSelect.value;
  const base = (baseId==="plain-cheese") ? {name:"Plain Cheese", basePrice:10.0, sizes:["Small","Medium","Large"]} : menu.items.find(i=>i.id===baseId);
  const size = sizeSelect.value;
  const mult = menu.sizeMultipliers[size] ?? 1;
  const toppingChecks = [...toppingsWrap.querySelectorAll("input[type=checkbox]:checked")];
  const toppingCost = toppingChecks.reduce((s,c)=>s + Number(c.dataset.price||0), 0);
  const unit = (base.basePrice * mult) + toppingCost;
  const qty = Math.max(1, Number(qtyInput.value||1));
  const line = { 
    id: crypto.randomUUID(), 
    name: `${base.name}`, // keep base name
    size, 
    toppings: toppingChecks.map(c=>c.value), 
    unit, 
    qty, 
    total: unit*qty 
  };
  const cart = getCart(); cart.push(line); saveCart(cart); renderCart();
}

function renderCart(){
  const cart = getCart();
  cartItems.innerHTML = cart.map(i=>`
    <div class="cart-row">
      <div>
        <div><strong>${i.name}${i.size ? ` (${i.size})` : ""}</strong> × ${i.qty}</div>
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

  cartItems.querySelectorAll("button[data-remove]").forEach(b=> 
    b.addEventListener("click", ()=>{ 
      let c=getCart().filter(x=>x.id!==b.dataset.remove); 
      save
