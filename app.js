// ===============================
// app.js (fixed, safe, complete)
// ===============================

// Utilities
function currency(n){ return `$${n.toFixed(2)}`; }

function getMenu(){ 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } 
  catch { return null; } 
}

function saveMenu(menu){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu)); }

function getCart(){ 
  try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } 
  catch { return []; } 
}

function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

function clearCart(){ saveCart([]); }

// Seed menu if empty
function ensureMenu(){
  let menu = getMenu();
  if(menu && menu.items?.length) return menu;

  menu = {
    categories: ["specialty","build","sides","drinks"],
    items: [
      {id:"pep-supreme", name:"Heavy Hitter", basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"https://picsum.photos/id/1025/300/200"},
      {id:"margherita", name:"Slice of Summer", basePrice:11.5, category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"https://picsum.photos/id/103/300/200"},
      {id:"veggie-delight", name:"Veggie Delight", basePrice:12, category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"https://picsum.photos/id/1080/300/200"}
    ],
    toppings: [
      {name:"Mozzarella", price:1, active:true},
      {name:"Pepperoni", price:1.25, active:true},
      {name:"Mushrooms", price:0.9, active:true},
      {name:"Olives", price:0.75, active:true}
    ],
    sizeMultipliers:{Small:1, Medium:1.25, Large:1.5},
    taxRate:0.07
  };
  saveMenu(menu);
  return menu;
}

// Render menu items
function renderMenu(filter=""){
  const menu = ensureMenu();
  const wrap = document.getElementById("menuWrap");
  if(!wrap) return;

  const filtered = menu.items.filter(i => i.active && i.name.toLowerCase().includes(filter.toLowerCase()));

  wrap.innerHTML = filtered.map(item => `
    <div class="menu-item">
      <img src="${item.img}" alt="${item.name}" class="menu-img"/>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <p>${item.sizes.map(sz => `${sz}: ${currency(item.basePrice*menu.sizeMultipliers[sz])}`).join(" | ")}</p>
      <button class="add-cart-btn" data-id="${item.id}">Add to Cart</button>
    </div>
  `).join("");

  bindAddToCart();
}

// Build Your Own section
function renderBuildYourOwn(){
  const menu = ensureMenu();
  const wrap = document.getElementById("buildWrap");
  if(!wrap) return;

  wrap.innerHTML = `
    <h3>Build Your Own Pizza</h3>
    <label>Size:
      <select id="byoSize">
        ${Object.keys(menu.sizeMultipliers).map(sz => `<option value="${sz}">${sz}</option>`).join("")}
      </select>
    </label>
    <div id="byoToppings">
      ${menu.toppings.filter(t=>t.active).map((t,idx)=>`
        <label>
          <input type="checkbox" data-idx="${idx}" /> ${t.name} (${currency(t.price)})
        </label>
      `).join("")}
    </div>
    <button id="addByoBtn">Add Build-Your-Own to Cart</button>
  `;

  document.getElementById("addByoBtn").addEventListener("click", ()=>{
    const size = document.getElementById("byoSize").value;
    const selected = Array.from(document.querySelectorAll("#byoToppings input:checked"))
                          .map(i=>menu.toppings[Number(i.dataset.idx)]);
    const unit = 10 * menu.sizeMultipliers[size] + selected.reduce((s,t)=>s+t.price,0);
    const cart = getCart();
    cart.push({
      id:"byo-"+Date.now(),
      name:"Build Your Own",
      size,
      toppings:selected.map(t=>t.name),
      unit,
      qty:1,
      total:unit
    });
    saveCart(cart);
    renderCart();
  });
}

// Cart rendering
function renderCart(){
  const cart = getCart();
  const wrap = document.getElementById("cartWrap");
  if(!wrap) return;

  if(!cart.length){
    wrap.innerHTML = "<em>Cart is empty.</em>";
    return;
  }

  wrap.innerHTML = cart.map((i,idx)=>`
    <div class="cart-row">
      <div>${i.name}${i.size?` (${i.size})`:''} × ${i.qty}</div>
      <div>${i.toppings?.length?i.toppings.join(", "):''}</div>
      <div>${currency(i.total)}</div>
      <div><button class="remove-btn" data-idx="${idx}">Remove</button></div>
    </div>
  `).join("");

  wrap.querySelectorAll(".remove-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.idx);
      const cart = getCart();
      cart.splice(idx,1);
      saveCart(cart);
      renderCart();
    });
  });
}

// Bind add to cart buttons
function bindAddToCart(){
  document.querySelectorAll(".add-cart-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      const menu = ensureMenu();
      const item = menu.items.find(i=>i.id===id);
      if(!item) return;
      const cart = getCart();
      const unit = item.basePrice * menu.sizeMultipliers[item.sizes[0]];
      cart.push({id:item.id,name:item.name,qty:1,unit,total:unit});
      saveCart(cart);
      renderCart();
    });
  });
}

// Search functionality
function bindSearch(){
  const search = document.getElementById("searchInput");
  if(!search) return;
  search.addEventListener("input", ()=> renderMenu(search.value));
}

// Initialize app
document.addEventListener("DOMContentLoaded", ()=>{
  ensureMenu();
  renderMenu();
  renderBuildYourOwn();
  renderCart();
  bindSearch();
});
