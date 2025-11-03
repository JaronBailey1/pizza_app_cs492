const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Helpers
function currency(n){ return `$${n.toFixed(2)}`; }
function getMenu(){ try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function getCart(){ try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

// Seed menu if missing
function ensureMenu(){
  let menu = getMenu();
  if(!menu){
    menu = {
      categories: ["specialty","build","sides","drinks"],
      items: [
        {id:"pep-supreme", name:"Heavy Hitter", basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"images/pep-supreme.jpg"},
        {id:"margherita", name:"Slice of Summer", basePrice:11.5, category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"images/margherita.jpg"},
        {id:"veggie-delight", name:"Veggie Delight", basePrice:12, category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"images/veggie.jpg"}
      ],
      toppings: [
        {name:"Mozzarella", price:1, active:true},
        {name:"Pepperoni", price:1.25, active:true},
        {name:"Mushrooms", price:0.9, active:true},
        {name:"Olives", price:0.75, active:true},
        {name:"Onions", price:0.5, active:true}
      ],
      sizeMultipliers:{Small:1, Medium:1.25, Large:1.5},
      taxRate:0.07
    };
    localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu));
  }
  return menu;
}

// DOM references
const menuWrap = document.getElementById("menuWrap");
const searchInput = document.getElementById("searchInput");
const cartWrap = document.getElementById("cartWrap");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartBtn = document.getElementById("cartBtn");

// Render menu
function renderMenu(filter=""){
  const menu = ensureMenu();
  menuWrap.innerHTML = "";

  menu.categories.forEach(cat => {
    const items = menu.items.filter(i => i.active && i.category===cat && i.name.toLowerCase().includes(filter.toLowerCase()));
    if(!items.length) return;

    const section = document.createElement("section");
    section.innerHTML = `<h2>${cat.charAt(0).toUpperCase()+cat.slice(1)}</h2><div class="row" id="${cat}Items"></div>`;
    menuWrap.appendChild(section);
    const row = section.querySelector(`#${cat}Items`);

    items.forEach(i => {
      const div = document.createElement("div");
      div.className = "menu-item card";
      div.innerHTML = `
        <img src="${i.img}" alt="${i.name}" class="menu-img"/>
        <h3>${i.name}</h3>
        <p>${i.desc}</p>
        <div><strong>${currency(i.basePrice)}</strong></div>
        <button class="primary add-to-cart" data-id="${i.id}">Add to Cart</button>
      `;
      row.appendChild(div);
    });
  });

  bindAddButtons();
}

// Build Your Own pizza
function renderBuildYourOwn(){
  const menu = ensureMenu();
  const buildWrap = document.getElementById("buildItems");
  if(!buildWrap) return;
  buildWrap.innerHTML = "";

  const div = document.createElement("div");
  div.className = "menu-item card";
  div.innerHTML = `
    <h3>Build Your Own</h3>
    <label>Size:
      <select id="byoSize">
        ${Object.keys(menu.sizeMultipliers).map(sz => `<option value="${sz}">${sz}</option>`).join("")}
      </select>
    </label>
    <div>Toppings:<br>
      ${menu.toppings.filter(t=>t.active).map((t,idx)=>`<label><input type="checkbox" data-idx="${idx}"/> ${t.name} (+${currency(t.price)})</label>`).join("")}
    </div>
    <div>Total: <strong id="byoTotal">${currency(menu.items[0]?.basePrice || 10)}</strong></div>
    <button class="primary" id="byoAdd">Add to Cart</button>
  `;
  buildWrap.appendChild(div);

  const byoSize = document.getElementById("byoSize");
  const byoTotal = document.getElementById("byoTotal");
  const checkboxes = div.querySelectorAll("input[type=checkbox]");

  function updateTotal(){
    const base = menu.items.find(i=>i.category==="build")?.basePrice || 10;
    const sizeMult = menu.sizeMultipliers[byoSize.value] || 1;
    const toppingTotal = Array.from(checkboxes).reduce((sum,cb)=>{
      return sum + (cb.checked ? menu.toppings[Number(cb.dataset.idx)].price : 0);
    },0);
    byoTotal.textContent = currency((base*sizeMult)+toppingTotal);
  }
  byoSize.addEventListener("change", updateTotal);
  checkboxes.forEach(cb=>cb.addEventListener("change", updateTotal));

  document.getElementById("byoAdd").addEventListener("click", ()=>{
    const base = menu.items.find(i=>i.category==="build")?.basePrice || 10;
    const sizeMult = menu.sizeMultipliers[byoSize.value] || 1;
    const selectedToppings = Array.from(checkboxes).filter(cb=>cb.checked).map(cb=>menu.toppings[Number(cb.dataset.idx)].name);
    const total = (base*sizeMult) + selectedToppings.reduce((sum,name)=>sum+menu.toppings.find(t=>t.name===name).price,0);
    const cart = getCart();
    cart.push({id:"byo-"+Date.now(), name:"Build Your Own", size:byoSize.value, toppings:selectedToppings, qty:1, unit:base*sizeMult, total:total});
    saveCart(cart);
    updateCartUI();
    alert("Added to cart!");
  });

  updateTotal();
}

// Cart UI
function updateCartUI(){
  const cart = getCart();
  cartWrap.innerHTML = cart.length ? cart.map((i,idx)=>`
    <div class="cart-row">
      <div><strong>${i.name}${i.size?` (${i.size})`:""}</strong> x ${i.qty}</div>
      <div>${currency(i.total)}</div>
      <button class="ghost remove-btn" data-idx="${idx}">x</button>
    </div>
  `).join("") : "<em>Cart is empty</em>";
  cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
  cartTotal.textContent = currency(cart.reduce((s,i)=>s+i.total,0));

  cartWrap.querySelectorAll(".remove-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const cart = getCart();
      cart.splice(Number(btn.dataset.idx),1);
      saveCart(cart);
      updateCartUI();
    });
  });
}

// Search filter
searchInput?.addEventListener("input", ()=>renderMenu(searchInput.value));

// Cart toggle
cartBtn?.addEventListener("click", ()=>cartWrap.classList.toggle("show"));

// Initialize
document.addEventListener("DOMContentLoaded", ()=>{
  ensureMenu();
  renderMenu();
  renderBuildYourOwn();
  updateCartUI();
});
