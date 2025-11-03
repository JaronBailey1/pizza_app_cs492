const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Helpers
function currency(n){ return `$${n.toFixed(2)}`; }
function getMenu(){ try{ return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } catch{ return { items: [], toppings: [], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } }
function getCart(){ try{ return JSON.parse(localStorage.getItem(LS_CART_KEY)||"[]"); } catch{ return []; } }
function setCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

// Cart Rendering
function renderCart(){
  const cart = getCart();
  const wrap = document.getElementById("cartItems");
  const cartSection = document.getElementById("cartSection");
  const cartCount = document.getElementById("cartCount");

  if(!cart.length){
    wrap.innerHTML = `<em>Your cart is empty.</em>`;
    cartSection.style.display = "none";
    cartCount.textContent = `(0)`;
    return;
  }

  wrap.innerHTML = cart.map((i,idx)=>`
    <div class="cart-row">
      <div>
        <strong>${i.name}</strong> ${i.size?`(${i.size})`:``} × ${i.qty}
        ${i.toppings?.length ? `<small>Toppings: ${i.toppings.join(", ")}</small>` : ""}
        <small>${currency(i.unit)} each</small>
      </div>
      <div>
        <strong>${currency(i.total)}</strong>
        <button class="ghost" data-rem="${idx}">Remove</button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("button[data-rem]").forEach(btn=>{
    btn.addEventListener("click",()=>{ 
      cart.splice(Number(btn.dataset.rem),1); 
      setCart(cart); renderCart(); 
    });
  });

  // Totals
  const menu = getMenu();
  const sub = cart.reduce((s,i)=>s+i.total,0);
  const tax = sub * (menu.taxRate||0.07);
  document.getElementById("cartSub").textContent = currency(sub);
  document.getElementById("cartTax").textContent = currency(tax);
  document.getElementById("cartTotal").textContent = currency(sub+tax);

  cartSection.style.display = "block";
  cartCount.textContent = `(${cart.length})`;
}

// Menu Rendering
function renderMenu(){
  const menu = getMenu();
  const wrap = document.getElementById("menuSection");
  wrap.innerHTML = menu.items.filter(i=>i.active!==false).map(i=>{
    return `
    <div class="card menu-item">
      <img src="${i.img}" alt="${i.name}" style="max-width:150px;"/>
      <h3>${i.name}</h3>
      <p>${i.desc||''}</p>
      <div>Sizes:
        ${i.sizes.map(sz=>`<button class="sizeBtn" data-id="${i.id}" data-size="${sz}">${sz}</button>`).join(" ")}
      </div>
      <button class="primary addBtn" data-id="${i.id}">Add to Cart</button>
    </div>`;
  }).join("");

  // Bind add buttons
  wrap.querySelectorAll(".addBtn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = btn.dataset.id;
      const sizeBtns = wrap.querySelectorAll(`.sizeBtn[data-id="${id}"]`);
      let size = Array.from(sizeBtns).find(b=>b.classList.contains("selected"))?.dataset.size || i.sizes[0];
      addToCart(id, size);
    });
  });

  // Size selection
  wrap.querySelectorAll(".sizeBtn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const siblings = wrap.querySelectorAll(`.sizeBtn[data-id="${btn.dataset.id}"]`);
      siblings.forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}

// Add to Cart
function addToCart(id, size){
  const menu = getMenu();
  const item = menu.items.find(i=>i.id===id);
  if(!item) return;

  const unit = item.basePrice * (menu.sizeMultipliers[size]||1);
  const cart = getCart();
  cart.push({ id, name:item.name, size, qty:1, unit, total:unit, toppings:[] });
  setCart(cart);
  renderCart();
}

// Checkout
document.getElementById("checkoutBtn")?.addEventListener("click", ()=>{
  window.location.href = "./payment.html";
});

// Boot app
document.addEventListener("DOMContentLoaded", ()=>{
  renderMenu();
  renderCart();
});
