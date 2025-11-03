const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

function currency(n){ return `$${n.toFixed(2)}`; }
function getMenu(){ 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || seedMenu(); } 
  catch { return seedMenu(); } 
}
function saveMenu(menu){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu)); }

function getCart(){ 
  try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } 
  catch { return []; } 
}
function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

function seedMenu(){
  const m = {
    categories: ["specialty","build","sides","drinks"],
    items:[
      {id:"pep-supreme", name:"Heavy Hitter", basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"https://source.unsplash.com/400x300/?pepperoni,pizza"},
      {id:"margherita", name:"Slice of Summer", basePrice:11.5, category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"https://source.unsplash.com/400x300/?margherita,pizza"},
      {id:"veggie-delight", name:"Veggie Delight", basePrice:12, category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"https://source.unsplash.com/400x300/?veggie,pizza"},
      {id:"breadsticks", name:"Garlic Knots", basePrice:5, category:"sides", sizes:["Single","Pack"], desc:"Soft garlic knots with butter.", active:true, img:"https://source.unsplash.com/400x300/?breadsticks,garlic"},
      {id:"cola", name:"Soda", basePrice:2.5, category:"drinks", sizes:["Can","Bottle"], desc:"Chilled soda drinks.", active:true, img:"https://source.unsplash.com/400x300/?soda,drink"}
    ],
    toppings:[
      {name:"Mozzarella", price:1, active:true},
      {name:"Pepperoni", price:1.25, active:true},
      {name:"Mushrooms", price:0.9, active:true},
      {name:"Onions", price:0.8, active:true}
    ],
    sizeMultipliers:{Small:1, Medium:1.35, Large:1.75},
    taxRate:0.07
  };
  saveMenu(m);
  return m;
}

/* ======= Render Menu ======= */
function renderMenu(filter=""){
  const menu = getMenu();
  const grid = document.getElementById("menuGrid");
  if(!grid) return;

  const items = menu.items.filter(i=>i.active && i.name.toLowerCase().includes(filter.toLowerCase()));
  grid.innerHTML = items.map(i=>`
    <div class="menu-card" data-id="${i.id}">
      <img src="${i.img}" alt="${i.name}" />
      <strong>${i.name}</strong>
      <p>${i.desc}</p>
      <div>$${i.basePrice.toFixed(2)}</div>
      <button class="addBtn">Add to Cart</button>
    </div>
  `).join("");

  // Bind Add buttons
  grid.querySelectorAll(".addBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest(".menu-card").dataset.id;
      addToCart(id);
    });
  });
}

/* ======= Build Your Own ======= */
function renderBuildYourOwn(){
  const menu = getMenu();
  const wrap = document.getElementById("buildYourOwn");
  if(!wrap) return;

  wrap.innerHTML = `
    <h2>Build Your Own Pizza</h2>
    <div class="menu-card">
      <strong>Choose your size:</strong>
      <select id="byoSize">
        ${Object.keys(menu.sizeMultipliers).map(sz=>`<option value="${sz}">${sz}</option>`).join("")}
      </select>
      <strong>Select toppings:</strong>
      <div id="byoToppings" style="display:flex; gap:8px; flex-wrap:wrap;">
        ${menu.toppings.filter(t=>t.active).map(t=>`
          <label style="display:flex; align-items:center; gap:4px;">
            <input type="checkbox" value="${t.name}" data-price="${t.price}" /> ${t.name} (+$${t.price})
          </label>
        `).join("")}
      </div>
      <button id="byoAddBtn" class="primary">Add to Cart</button>
    </div>
  `;

  document.getElementById("byoAddBtn").addEventListener("click",()=>{
    const size = document.getElementById("byoSize").value;
    const selectedToppings = Array.from(document.querySelectorAll("#byoToppings input:checked")).map(inp=>({name: inp.value, price: Number(inp.dataset.price)}));
    const menuBasePrice = 10; // base for build your own
    const sizeMult = menu.sizeMultipliers[size] || 1;
    const total = (menuBasePrice*sizeMult) + selectedToppings.reduce((s,t)=>s+t.price,0);

    const cart = getCart();
    cart.push({
      id:"BYO-"+Date.now(),
      name:"Build Your Own",
      size,
      toppings:selectedToppings.map(t=>t.name),
      qty:1,
      unit: total,
      total: total
    });
    saveCart(cart);
    renderCart();
    alert("Added Build Your Own pizza to cart!");
  });
}

/* ======= Add to Cart ======= */
function addToCart(id){
  const menu = getMenu();
  const item = menu.items.find(i=>i.id===id);
  if(!item) return;
  const cart = getCart();
  cart.push({
    id: item.id+"-"+Date.now(),
    name: item.name,
    qty:1,
    unit: item.basePrice,
    total: item.basePrice,
    size: item.sizes?.[0] || ""
  });
  saveCart(cart);
  renderCart();
  alert(`Added ${item.name} to cart!`);
}

/* ======= Search ======= */
const searchBar = document.getElementById("searchBar");
searchBar?.addEventListener("input", (e)=>{
  renderMenu(e.target.value);
});

/* ======= Initialize ======= */
document.addEventListener("DOMContentLoaded", ()=>{
  renderMenu();
  renderBuildYourOwn();
  renderCart();
});
