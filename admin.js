const LS_MENU_KEY = "pizza.menu";

function getMenu() { 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } 
  catch { return null; } 
}
function saveMenu(m) { 
  localStorage.setItem(LS_MENU_KEY, JSON.stringify(m)); 
}

// Ensure menu exists in localStorage
async function ensureMenu() {
  let m = getMenu();
  if (m) return m;
  try {
    const res = await fetch("./data/menu.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    m = await res.json();
  } catch (e) {
    m = { categories: [], items: [], toppings: [], sizeMultipliers: {Small:1, Medium:1.25, Large:1.5}, taxRate: 0.07 };
  }
  saveMenu(m);
  return m;
}

// DOM elements
const adminMenuTable = document.getElementById("adminMenuTable");
const adminToppings = document.getElementById("adminToppings");
const addItemBtn = document.getElementById("addItemBtn");
const saveMenuBtn = document.getElementById("saveMenuBtn");
const taxRateInput = document.getElementById("taxRateInput");
const sizeMultWrap = document.getElementById("sizeMultWrap");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const refreshMenuBtn = document.getElementById("refreshMenuBtn");

// Render admin table & settings
function renderAdmin(){
  const menu = getMenu();
  
  // Items table
  adminMenuTable.innerHTML = `
    <div class="admin-row" style="font-weight:700;">
      <div>Name</div><div>Base $</div><div>Category</div><div>Active</div><div></div>
    </div>
    ${menu.items.map((i,idx)=>`
      <div class="admin-row">
        <input data-i="${idx}" data-k="name" value="${i.name}">
        <input data-i="${idx}" data-k="basePrice" type="number" step="0.5" min="0" value="${i.basePrice}">
        <input data-i="${idx}" data-k="category" value="${i.category}">
        <input data-i="${idx}" data-k="active" type="checkbox" ${i.active!==false?'checked':''}>
        <button data-del="${idx}" class="ghost">Del</button>
      </div>
    `).join("")}
  `;

  // Toppings table
  adminToppings.innerHTML = `
    <div class="admin-row" style="font-weight:700; grid-template-columns: 1fr 100px 90px 60px;">
      <div>Name</div><div>Price</div><div>Active</div><div></div>
    </div>
    ${menu.toppings.map((t,idx)=>`
      <div class="admin-row" style="grid-template-columns: 1fr 100px 90px 60px;">
        <input data-t="${idx}" data-k="name" value="${t.name}">
        <input data-t="${idx}" data-k="price" type="number" step="0.5" min="0" value="${t.price}">
        <input data-t="${idx}" data-k="active" type="checkbox" ${t.active!==false?'checked':''}>
        <button data-delt="${idx}" class="ghost">Del</button>
      </div>
    `).join("")}
  `;

  // Tax rate
  taxRateInput.value = menu.taxRate ?? 0.07;

  // Size multipliers
  sizeMultWrap.innerHTML = Object.entries(menu.sizeMultipliers).map(([sz,val])=>`
    <div style="display:flex; gap:8px; align-items:center; margin:6px 0;">
      <label style="width:80px;">${sz}</label>
      <input data-size="${sz}" type="number" step="0.05" min="0.5" value="${val}">
    </div>
  `).join("");

  // Bind events for items
  adminMenuTable.querySelectorAll("input[data-i]").forEach(input=>{
    input.addEventListener("input", ()=>{
      const m = getMenu();
      const idx = Number(input.dataset.i);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="basePrice") val = Number(val);
      if(key==="active") val = Boolean(val);
      m.items[idx][key] = val;
      saveMenu(m);
    });
  });
  adminMenuTable.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const m = getMenu(); m.items.splice(Number(btn.dataset.del),1); saveMenu(m); renderAdmin();
    });
  });

  // Bind events for toppings
  adminToppings.querySelectorAll("input[data-t]").forEach(input=>{
    input.addEventListener("input", ()=>{
      const m = getMenu();
      const idx = Number(input.dataset.t);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="price") val = Number(val);
      if(key==="active") val = Boolean(val);
      m.toppings[idx][key] = val;
      saveMenu(m);
    });
  });
  adminToppings.querySelectorAll("button[data-delt]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const m = getMenu(); m.toppings.splice(Number(btn.dataset.delt),1); saveMenu(m); renderAdmin();
    });
  });
}

// Add new item
addItemBtn?.addEventListener("click", ()=>{
  const m = getMenu();
  m.items.push({
    id: `custom-${crypto.randomUUID().slice(0,6)}`,
    name: "New Item",
    category: "specialty",
    basePrice: 10,
    sizes: ["Small","Medium","Large"],
    desc: "",
    img: "https://picsum.photos/seed/new/800/500",
    active: true
  });
  saveMenu(m); renderAdmin();
});

// Save menu (alert only)
saveMenuBtn?.addEventListener("click", ()=> alert("Saved! (stored in your browser)"));

// Save tax and size settings
saveSettingsBtn?.addEventListener("click", ()=>{
  const m = getMenu();
  m.taxRate = Number(taxRateInput.value || 0.07);
  sizeMultWrap.querySelectorAll("input[data-size]").forEach(inp=>{
    m.sizeMultipliers[inp.dataset.size] = Number(inp.value || 1);
  });
  saveMenu(m); alert("Settings saved.");
});

// Refresh menu for app.js
refreshMenuBtn?.addEventListener("click", ()=>{
  const m = getMenu();
  saveMenu(m); // update localStorage
  window.dispatchEvent(new Event("storage")); // notify app.js if open
  alert("Menu refreshed! Open or refresh the main menu page to see updates.");
});

// Boot
async function boot(){
  await ensureMenu();
  renderAdmin();
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
