/***********************
 * Constants & Storage *
 ***********************/
const LS_MENU_KEY   = "pizza.menu";
const LS_ORDERS_KEY = "pizza.orders";

// Storefront-compatible defaults (align with app.js)
const DEFAULT_MENU = {
  categories: [
    { id: "specialty", name: "Specialty Pizzas" },
    { id: "build",     name: "Build Your Own" },
    { id: "sides",     name: "Sides" },
    { id: "drinks",    name: "Drinks" }
  ],
  items: [],
  toppings: [],
  sizeMultipliers: { Small:1, Medium:1.35, Large:1.75, "16 oz":1 },
  taxRate: 0.07,
  builder: {
    crusts: ["Thin","Hand-Tossed","Deep Dish"],
    baseCheesePrice: 10.00,
    included: ["Tomato sauce","Mozzarella"]
  },
  coupons: [
    // examples (you can delete these in the UI)
    { code:"WELCOME10", type:"percent", value:10,  minSubtotal:0,  active:true },
    { code:"SAVE5",     type:"amount",  value:5,   minSubtotal:20, active:true }
  ],
  version: 2
};

function getMenu() {
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || null; }
  catch { return null; }
}
function saveMenu(menu) {
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu));
}

/*****************
 * Schema Helpers *
 *****************/
function migrateMenuSchema(m) {
  if (!m || typeof m !== "object") return structuredClone(DEFAULT_MENU);

  // 1) categories: ensure objects [{id,name}]
  if (Array.isArray(m.categories)) {
    if (m.categories.length && typeof m.categories[0] === "string") {
      m.categories = m.categories.map(id => ({ id, name: id[0].toUpperCase()+id.slice(1) }));
    }
  } else {
    m.categories = structuredClone(DEFAULT_MENU.categories);
  }

  // 2) sizeMultipliers
  if (!m.sizeMultipliers) m.sizeMultipliers = structuredClone(DEFAULT_MENU.sizeMultipliers);

  // 3) taxRate
  if (typeof m.taxRate !== "number") m.taxRate = DEFAULT_MENU.taxRate;

  // 4) builder block
  if (!m.builder) m.builder = structuredClone(DEFAULT_MENU.builder);

  // 5) coupons
  if (!Array.isArray(m.coupons)) m.coupons = structuredClone(DEFAULT_MENU.coupons);

  // 6) items/toppings arrays
  if (!Array.isArray(m.items)) m.items = [];
  if (!Array.isArray(m.toppings)) m.toppings = [];

  // Normalize toppings fields
  m.toppings = m.toppings.map(t => ({
    id: t.id || (t.name || "topping").toLowerCase().replace(/\s+/g,"-"),
    name: t.name || "Topping",
    price: Number(t.price || 0),
    active: t.active !== false
  }));

  // Normalize items minimal fields (don’t override your data)
  m.items = m.items.map(i => ({
    id: i.id || crypto.randomUUID(),
    name: i.name || "Menu Item",
    basePrice: Number(i.basePrice || 0),
    category: i.category || "specialty",
    sizes: Array.isArray(i.sizes) ? i.sizes : ["Small","Medium","Large"],
    desc: i.desc || "",
    img: i.img || "",
    active: i.active !== false
  }));

  // 7) version
  m.version = Math.max(Number(m.version || 0), DEFAULT_MENU.version);

  return m;
}

/********************
 * Ensure / Seeding *
 ********************/
async function ensureMenu() {
  let m = getMenu();
  if (!m) {
    // Seed a minimal, nice-looking starter set (if nothing saved yet)
    m = structuredClone(DEFAULT_MENU);
    m.items = [
      { id:"pep-supreme", name:"Heavy Hitter",     basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Double pepperoni with extra cheese.", active:true, img:"images/pep-supreme.jpg" },
      { id:"margherita",  name:"Slice of Summer",  basePrice:11.5,  category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.",   active:true, img:"images/margherita.jpg" },
      { id:"veggie-delight", name:"Veggie Delight",basePrice:12,    category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty sauce.", active:true, img:"images/veggie.jpg" },
      { id:"coke", name:"Coca-Cola", basePrice:1.5, category:"drinks", sizes:["16 oz"], desc:"Classic soda.", active:true, img:"" }
    ];
    m.toppings = [
      { id:"mozzarella", name:"Extra Mozzarella", price:1.0,  active:true },
      { id:"pepperoni",  name:"Pepperoni",        price:1.25, active:true },
      { id:"mushrooms",  name:"Mushrooms",        price:0.9,  active:true }
    ];
  }
  m = migrateMenuSchema(m);
  saveMenu(m);
  return m;
}

/****************
 * DOM Cache    *
 ****************/
const adminMenuTable   = document.getElementById("adminMenuTable");
const adminToppings    = document.getElementById("adminToppings");
const addItemBtn       = document.getElementById("addItemBtn");
const saveMenuBtn      = document.getElementById("saveMenuBtn");

const taxRateInput     = document.getElementById("taxRateInput");
const sizeMultWrap     = document.getElementById("sizeMultWrap");
const saveSettingsBtn  = document.getElementById("saveSettingsBtn");

// Coupons UI (optional—render only if these exist)
const adminCoupons     = document.getElementById("adminCoupons");
const addCouponBtn     = document.getElementById("addCouponBtn");
const saveCouponsBtn   = document.getElementById("saveCouponsBtn");

/****************
 * Rendering    *
 ****************/
function renderAdmin() {
  const menu = migrateMenuSchema(getMenu());
  // Items
  if (adminMenuTable) {
    adminMenuTable.innerHTML = `
      <div class="admin-row header-row">
        <div>Name</div><div>Base $</div><div>Category</div><div>Active</div><div>Actions</div>
      </div>
      ${menu.items.map((i,idx)=>`
        <div class="admin-row">
          <input data-i="${idx}" data-k="name" value="${i.name}">
          <input data-i="${idx}" data-k="basePrice" type="number" step="0.01" min="0" value="${i.basePrice}">
          <input data-i="${idx}" data-k="category" value="${i.category}">
          <input data-i="${idx}" data-k="active" type="checkbox" ${i.active?'checked':''}>
          <button data-del="${idx}" class="ghost">Del</button>
        </div>`).join("")}
    `;
    bindMenuInputs();
  }

  // Toppings
  if (adminToppings) {
    adminToppings.innerHTML = `
      <div class="admin-row header-row" style="grid-template-columns: 1fr 100px 90px 80px;">
        <div>Name</div><div>Price</div><div>Active</div><div>Actions</div>
      </div>
      ${menu.toppings.map((t,idx)=>`
        <div class="admin-row" style="grid-template-columns: 1fr 100px 90px 80px;">
          <input data-t="${idx}" data-k="name" value="${t.name}">
          <input data-t="${idx}" data-k="price" type="number" step="0.01" min="0" value="${t.price}">
          <input data-t="${idx}" data-k="active" type="checkbox" ${t.active?'checked':''}>
          <button data-delt="${idx}" class="ghost">Del</button>
        </div>`).join("")}
    `;
    bindToppingInputs();
  }

  // Settings
  if (taxRateInput) taxRateInput.value = menu.taxRate ?? 0.07;
  if (sizeMultWrap) {
    sizeMultWrap.innerHTML = Object.entries(menu.sizeMultipliers).map(([sz,val])=>`
      <div class="size-row">
        <label>${sz}</label>
        <input data-size="${sz}" type="number" step="0.01" min="0" value="${val}">
      </div>`).join("");
  }

  // Coupons (optional section)
  if (adminCoupons) {
    adminCoupons.innerHTML = `
      <div class="admin-row header-row" style="grid-template-columns: 1fr 140px 110px 140px 90px 80px;">
        <div>Code</div><div>Type</div><div>Value</div><div>Min Subtotal</div><div>Active</div><div>Actions</div>
      </div>
      ${(menu.coupons||[]).map((c,idx)=>`
        <div class="admin-row" style="grid-template-columns: 1fr 140px 110px 140px 90px 80px;">
          <input data-c="${idx}" data-k="code" value="${c.code}">
          <select data-c="${idx}" data-k="type">
            <option value="percent" ${c.type==="percent"?"selected":""}>percent</option>
            <option value="amount"  ${c.type==="amount" ?"selected":""}>amount</option>
          </select>
          <input data-c="${idx}" data-k="value" type="number" step="0.01" min="0" value="${c.value}">
          <input data-c="${idx}" data-k="minSubtotal" type="number" step="0.01" min="0" value="${c.minSubtotal||0}">
          <input data-c="${idx}" data-k="active" type="checkbox" ${c.active?'checked':''}>
          <button data-delc="${idx}" class="ghost">Del</button>
        </div>`).join("")}
    `;
    bindCouponInputs();
  }
}

/****************
 * Bindings     *
 ****************/
function bindMenuInputs(){
  const menu = migrateMenuSchema(getMenu());

  adminMenuTable.querySelectorAll("input[data-i]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.i);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if (key==="basePrice") val = Number(val);
      if (key==="active")    val = Boolean(val);
      menu.items[idx][key] = val;
      saveMenu(menu);
    });
  });

  adminMenuTable.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      menu.items.splice(Number(btn.dataset.del),1);
      saveMenu(menu); renderAdmin();
    });
  });
}

function bindToppingInputs(){
  const menu = migrateMenuSchema(getMenu());

  adminToppings.querySelectorAll("input[data-t]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.t);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if (key==="price")  val = Number(val);
      if (key==="active") val = Boolean(val);
      menu.toppings[idx][key] = val;
      saveMenu(menu);
    });
  });

  adminToppings.querySelectorAll("button[data-delt]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      menu.toppings.splice(Number(btn.dataset.delt),1);
      saveMenu(menu); renderAdmin();
    });
  });
}

function bindCouponInputs(){
  const menu = migrateMenuSchema(getMenu());

  adminCoupons.querySelectorAll("input[data-c], select[data-c]").forEach(el=>{
    el.addEventListener("input", ()=>{
      const idx = Number(el.dataset.c);
      const key = el.dataset.k;
      let val = el.type==="checkbox" ? el.checked : el.value;
      if (key==="value" || key==="minSubtotal") val = Number(val);
      if (key==="active") val = Boolean(val);
      menu.coupons[idx][key] = val;
      // Normalize code to uppercase for consistency
      if (key==="code") menu.coupons[idx][key] = String(val).trim().toUpperCase();
      saveMenu(menu);
    });
  });

  adminCoupons.querySelectorAll("button[data-delc]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      menu.coupons.splice(Number(btn.dataset.delc),1);
      saveMenu(menu); renderAdmin();
    });
  });
}

/********************
 * Top-level Buttons *
 ********************/
// Add new item
addItemBtn?.addEventListener("click", ()=>{
  const menu = migrateMenuSchema(getMenu());
  menu.items.push({
    id:`custom-${crypto.randomUUID().slice(0,6)}`,
    name:"New Item",
    category:"specialty",
    basePrice:10,
    sizes:["Small","Medium","Large"],
    desc:"",
    img:"",
    active:true
  });
  saveMenu(menu); renderAdmin();
});

// “Save Menu” acknowledgement (data already auto-saves on input)
saveMenuBtn?.addEventListener("click", ()=>alert("Menu saved in browser storage."));

// Settings save
saveSettingsBtn?.addEventListener("click", ()=>{
  const menu = migrateMenuSchema(getMenu());
  menu.taxRate = Number(taxRateInput?.value || 0.07);
  sizeMultWrap?.querySelectorAll("input[data-size]")?.forEach(inp=>{
    menu.sizeMultipliers[inp.dataset.size] = Number(inp.value || 1);
  });
  saveMenu(menu);
  alert("Settings saved.");
});

// Coupons add/save (optional section)
addCouponBtn?.addEventListener("click", ()=>{
  const menu = migrateMenuSchema(getMenu());
  menu.coupons.push({ code:"NEWCODE", type:"percent", value:10, minSubtotal:0, active:true });
  saveMenu(menu); renderAdmin();
});
saveCouponsBtn?.addEventListener("click", ()=>{
  alert("Coupons saved.");
});

/**********************
 * Orders (unchanged) *
 **********************/
function getOrders() {
  try { return JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]"); }
  catch { return []; }
}
function setOrders(list) {
  try { localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list)); }
  catch(e) { console.error("Failed to save orders:", e); }
}
function currency(n){ return `$${(Number(n)||0).toFixed(2)}`; }

function orderRow(o, idx){
  const when = o.date ? new Date(o.date) : null;
  const whenStr = when ? when.toLocaleString() : "(unknown time)";
  const items = Array.isArray(o.items) ? o.items.map(i => {
    const size = i.size ? ` (${i.size})` : "";
    const line = `${i.name}${size} x${i.qty}`;
    // support either i.unit or i.price fields
    const price = Number(i.unit ?? i.price ?? 0);
    return `<div class="muted">${line} — ${currency(price * (i.qty||1))}</div>`;
  }).join("") : "<div class='muted'>(no items)</div>";

  const name = (o.customer?.name || "(Guest)");
  const phone = (o.customer?.phone || "-");
  const addr = (o.customer?.address || "-");
  const sub = currency(o.totals?.sub || 0);
  const tax = currency(o.totals?.tax || 0);
  const tot = currency(o.totals?.total || 0);

  return `
    <div class="admin-row" data-order-index="${idx}" style="align-items:flex-start; grid-template-columns: 1.2fr 1fr .8fr .5fr .2fr;">
      <div>
        <div><strong>${o.id || "(no id)"}</strong></div>
        <div class="muted">${whenStr}</div>
      </div>
      <div>
        <div><strong>${name}</strong></div>
        <div class="muted">Phone: ${phone}</div>
        <div class="muted">Address: ${addr}</div>
      </div>
      <div>${items}</div>
      <div>
        <div>Sub: <strong>${sub}</strong></div>
        <div>Tax: <strong>${tax}</strong></div>
        <div>Total: <strong>${tot}</strong></div>
      </div>
      <div><button class="ghost" data-del="${idx}">Del</button></div>
    </div>`;
}

function renderOrders(){
  const wrap = document.getElementById("ordersWrap");
  if(!wrap) return;

  const orders = getOrders().slice().reverse(); // newest first
  if(!orders.length){
    wrap.innerHTML = `<div class="muted" style="padding:8px;">No orders yet.</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="admin-row header-row" style="grid-template-columns: 1.2fr 1fr .8fr .5fr .2fr;">
      <div>Order</div><div>Customer</div><div>Items</div><div>Totals</div><div>Actions</div>
    </div>
    ${orders.map((o, i) => orderRow(o, i)).join("")}
  `;

  wrap.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const revIndex = Number(btn.dataset.del); // index in reversed array
      const full = getOrders();
      const idx = full.length - 1 - revIndex;   // map back to original
      full.splice(idx, 1);
      setOrders(full);
      renderOrders();
    });
  });
}

function bindOrdersActions(){
  document.getElementById("clearOrdersBtn")?.addEventListener("click", ()=>{
    if(confirm("Clear ALL orders stored in this browser?")){
      localStorage.removeItem(LS_ORDERS_KEY);
      renderOrders();
    }
  });

  document.getElementById("exportOrdersBtn")?.addEventListener("click", ()=>{
    const data = localStorage.getItem(LS_ORDERS_KEY) || "[]";
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url, download: `orders-${new Date().toISOString().slice(0,19)}.json`
    });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
}

/********
 * Boot *
 ********/
async function boot(){
  await ensureMenu();
  renderAdmin();
  renderOrders();
  bindOrdersActions();
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", boot)
  : boot();

// Optional: “refresh” button to jump back to storefront
document.getElementById("refreshMenuBtn")?.addEventListener("click", ()=>{
  alert("Menu saved. Reloading the app to reflect changes…");
  window.location.href = "./index.html";
});
