const LS_MENU_KEY = "pizza.menu";

// Get / set menu in localStorage
function getMenu(){ 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } 
  catch { return { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } 
}
function saveMenu(menu){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu)); }

// Ensure menu exists (seed if not)
async function ensureMenu(){
  let m = getMenu();
  if(m.items.length || m.toppings.length) return m;

  // Seed example menu if none exists
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

// DOM elements
const adminMenuTable = document.getElementById("adminMenuTable");
const adminToppings = document.getElementById("adminToppings");
const addItemBtn = document.getElementById("addItemBtn");
const saveMenuBtn = document.getElementById("saveMenuBtn");
const taxRateInput = document.getElementById("taxRateInput");
const sizeMultWrap = document.getElementById("sizeMultWrap");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

// Render admin interface
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

  // Bind events
  bindMenuInputs();
  bindToppingInputs();
}

// Menu item input bindings
function bindMenuInputs(){
  const menu = getMenu();
  adminMenuTable.querySelectorAll("input[data-i]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.i);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="basePrice") val = Number(val);
      if(key==="active") val = Boolean(val);
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

// Topping input bindings
function bindToppingInputs(){
  const menu = getMenu();
  adminToppings.querySelectorAll("input[data-t]").forEach(input=>{
    input.addEventListener("input",()=>{
      const idx = Number(input.dataset.t);
      const key = input.dataset.k;
      let val = input.type==="checkbox" ? input.checked : input.value;
      if(key==="price") val = Number(val);
      if(key==="active") val = Boolean(val);
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

// Add new menu item
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

// Save buttons
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

// Boot admin page
async function boot(){
  await ensureMenu();
  renderAdmin();
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();


document.getElementById("refreshMenuBtn")?.addEventListener("click", ()=>{
  alert("Menu saved. Reloading the app to reflect changes…");
  window.location.href = "./index.html";
});
