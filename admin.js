const LS_MENU_KEY = "pizza.menu";
const LS_ORDERS_KEY = "pizza.orders";

// ------------------ Menu Helpers ------------------
function getMenu(){ 
  try { 
    return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; 
  } catch { 
    return { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; 
  } 
}
function saveMenu(menu){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu)); }

// Ensure menu exists
async function ensureMenu(){
  let m = getMenu();
  if(m.items.length || m.toppings.length) return m;

  m = {
    categories: ["specialty","build","sides","drinks"],
    items: [
      {id:"pep-supreme", name:"Heavy Hitter", basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"images/pep-supreme.jpg"},
      {id:"margherita", name:"Slice of Summer", basePrice:11.5, category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"images/margherita.jpg"},
      {id:"veggie-delight", name:"Veggie Delight", basePrice:12, category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"images/veggie.jpg"}
    ],
    toppings: [
      {name:"Mozzarella", price:1, active:true},
      {name:"Pepperoni", price:1.25, active:true},
      {name:"Mushrooms", price:0.9, active:true}
    ],
    sizeMultipliers:{Small:1, Medium:1.35, Large:1.75},
    taxRate:0.07
  };
  saveMenu(m);
  return m;
}

// ------------------ DOM Elements ------------------
const adminMenuTable = document.getElementById("adminMenuTable");
const adminToppings = document.getElementById("adminToppings");
const addItemBtn = document.getElementById("addItemBtn");
const saveMenuBtn = document.getElementById("saveMenuBtn");
const taxRateInput = document.getElementById("taxRateInput");
const sizeMultWrap = document.getElementById("sizeMultWrap");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const refreshMenuBtn = document.getElementById("refreshMenuBtn");

// ------------------ Render Admin ------------------
function renderAdmin(){
  const menu = getMenu();

  // Menu items table
  adminMenuTable.innerHTML = `
    <div class="admin-row header-row">
      <div>Name</div><div>Base $</div><div>Category</div><div>Active</div><div>Actions</div>
    </div>
    ${menu.items.map((i,idx)=>`
      <div class="admin-row">
        <input data-i="${idx}" data-k="name" value="${i.name}">
        <input data-i="${idx}" data-k="basePrice" type="number" step="0.5" min="0" value="${i.basePrice}">
        <input data-i="${idx}" data-k="category" value="${i.category}">
        <input data-i="${idx}" data-k="active" type="checkbox" ${i.active!==false?'checked':''}>
        <button data-del="${idx}" class="ghost">Del</button>
      </div>`).join("")}
  `;

  // Toppings table
  adminToppings.innerHTML = `
    <div class="admin-row header-row" style="grid-template-columns: 1fr 100px 90px 80px;">
      <div>Name</div><div>Price</div><div>Active</div><div>Actions</div>
    </div>
    ${menu.toppings.map((t,idx)=>`
      <div class="admin-row" style="grid-template-columns: 1fr 100px 90px 80px;">
        <input data-t="${idx}" data-k="name" value="${t.name}">
        <input data-t="${idx}" data-k="price" type="number" step="0.5" min="0" value="${t.price}">
        <input data-t="${idx}" data-k="active" type="checkbox" ${t.active!==false?'checked':''}>
        <button data-delt="${idx}" class="ghost">Del</button>
      </div>`).join("")}
  `;

  // Settings
  taxRateInput.value = menu.taxRate ?? 0.07;
  sizeMultWrap.innerHTML = Object.entries(menu.sizeMultipliers).map(([sz,val])=>`
    <div class="size-row">
      <label>${sz}</label>
      <input data-size="${sz}" type="number" step="0.05" min="0.5" value="${val}">
    </div>`).join("");

  bindMenuInputs();
  bindToppingInputs();
}

// ------------------ Bind Menu Inputs ------------------
function bindMenuInputs(){
  const menu = getMenu();
  adminMenuTable.querySelectorAll("input[data-i]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.i);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="basePrice") val = Number(val);
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

// ------------------ Bind Topping Inputs ------------------
function bindToppingInputs(){
  const menu = getMenu();
  adminToppings.querySelectorAll("input[data-t]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.t);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="price") val = Number(val);
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

// ------------------ Add / Save ------------------
addItemBtn?.addEventListener("click",()=>{
  const menu = getMenu();
  menu.items.push({
    id:`custom-${crypto.randomUUID().slice(0,6)}`,
    name:"New Item",
    category:"specialty",
    basePrice:10,
    sizes:["Small","Medium","Large"],
    desc:"",
    img:"https://picsum.photos/seed/new/800/500",
    active:true
  });
  saveMenu(menu); renderAdmin();
});

saveMenuBtn?.addEventListener("click",()=>alert("Menu saved in browser storage."));
saveSettingsBtn?.addEventListener("click",()=>{
  const menu = getMenu();
  menu.taxRate = Number(taxRateInput.value || 0.07);
  sizeMultWrap.querySelectorAll("input[data-size]").forEach(inp=>{
    menu.sizeMultipliers[inp.dataset.size] = Number(inp.value || 1);
  });
  saveMenu(menu);
  alert("Settings saved.");
});

refreshMenuBtn?.addEventListener("click", ()=>{
  alert("Menu saved. Reloading the app to reflect changes…");
  window.location.href = "./index.html";
});

// ------------------ Recent Orders ------------------
function getOrders(){ try { return JSON.parse(localStorage.getItem(LS_ORDERS_KEY)||"[]"); } catch { return []; } }
function setOrders(list){ localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list)); }
function currency(n){ return `$${(Number(n)||0).toFixed(2)}`; }

function orderRow(o, idx){
  const when = o.date ? new Date(o.date) : null;
  const whenStr = when ? when.toLocaleString() : "(unknown time)";
  const items = Array.isArray(o.items) ? o.items.map(i=>{
    const size = i.size ? ` (${i.size})` : "";
    return `<div class="topping-badge">${i.name}${size} x${i.qty}</div>`;
  }).join(" ") : "<div class='muted'>(no items)</div>";

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
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <strong>${name}</strong>
        <span>📞 ${phone}</span>
        <span>🏠 ${addr}</span>
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
    ${orders.map((o,i)=>orderRow(o,i)).join("")}`;

  // Delete single order
  wrap.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const revIndex = Number(btn.dataset.del);
      const full = getOrders();
      const idx = full.length - 1 - revIndex;
      full.splice(idx,1);
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

// ------------------ Boot ------------------
async function boot(){
  await ensureMenu();
  renderAdmin();
  renderOrders();
  bindOrdersActions();
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
