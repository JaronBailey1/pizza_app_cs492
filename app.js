const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Utilities
function currency(n){ return `$${(n||0).toFixed(2)}`; }
function getMenu(){ try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || { items:[], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } catch { return { items:[], sizeMultipliers:{Small:1, Medium:1.25, Large:1.5}, taxRate:0.07 }; } }
function getCart(){ try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

// Render menu
function renderMenu(){
  const menu = getMenu();
  const grid = document.getElementById("menuGrid");
  grid.innerHTML = menu.items.map(item => `
    <div class="card">
      <img src="${item.img}" alt="${item.name}" />
      <div class="card-content">
        <h3>${item.name}</h3>
        <p>${item.desc || ""}</p>
        <div><strong>${currency(item.basePrice)}</strong></div>
        <button data-id="${item.id}" class="primary">Add to Cart</button>
      </div>
    </div>
  `).join("");

  // Add to cart buttons
  grid.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addToCart(btn.dataset.id);
    });
  });
}

// Add to cart
function addToCart(id){
  const cart = getCart();
  const menu = getMenu();
  const item = menu.items.find(i=>i.id===id);
  if(item){
    const existing = cart.find(c=>c.id===id);
    if(existing) existing.qty +=1;
    else cart.push({ id:item.id, name:item.name, qty:1, unit:item.basePrice, total:item.basePrice });
    saveCart(cart);
    renderCart();
    alert(`${item.name} added to cart!`);
  }
}

// Mini cart
function renderCart(){
  const cart = getCart();
  const wrap = document.getElementById("cartItems");
  wrap.innerHTML = cart.length ? cart.map((i,idx)=>`
    <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items:center;">
      <div>
        <strong>${i.name}</strong> x ${i.qty}<br>
        <small>${currency(i.unit)} each</small>
      </div>
      <div>
        <button data-idx="${idx}" class="ghost" style="font-size:0.8em;">❌</button>
      </div>
    </div>
  `).join("") : `<em>Your cart is empty.</em>`;

  const menu = getMenu();
  const taxRate = menu?.taxRate ?? 0.07;
  const subtotal = cart.reduce((s,i)=>s+i.total,0);
  const tax = subtotal*taxRate;
  document.getElementById("cartSub").textContent = currency(subtotal);
  document.getElementById("cartTax").textContent = currency(tax);
  document.getElementById("cartTotal").textContent = currency(subtotal + tax);

  wrap.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.idx);
      cart.splice(idx,1);
      saveCart(cart);
      renderCart();
    });
  });
}

// Cart toggle
const cartOverlay = document.getElementById("cartOverlay");
document.getElementById("openCartBtn").addEventListener("click", ()=>{ cartOverlay.style.right="0"; renderCart(); });
document.getElementById("closeCartBtn").addEventListener("click", ()=>{ cartOverlay.style.right="-320px"; });
document.getElementById("checkoutBtn").addEventListener("click", ()=>{ window.location.href="./payment.html"; });

// Boot
document.addEventListener("DOMContentLoaded", ()=>{
  renderMenu();
  renderCart();
});
