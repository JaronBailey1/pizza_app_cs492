// Use the global LS_MENU_KEY and LS_CART_KEY from app.js

function currency(n){ return `$${n.toFixed(2)}`; }

function getMenu(){ 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } 
  catch { return null; } 
}

function getCart(){ 
  try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } 
  catch { return []; } 
}

function clearCart(){ localStorage.setItem(LS_CART_KEY, "[]"); }

function renderSummary(){
  const menu = getMenu();
  const taxRate = menu?.taxRate ?? 0.07;
  const cart = getCart();

  const wrap = document.getElementById("orderItems");
  wrap.innerHTML = cart.length ? cart.map(i => `
    <div class="cart-row">
      <div>
        <div><strong>${i.name}</strong> × ${i.qty}</div>
        ${i.toppings?.length ? `<small>${i.toppings.join(", ")}</small>` : ``}
        <small>${currency(i.unit)}</small>
      </div>
      <div><strong>${currency(i.total)}</strong></div>
    </div>
  `).join("") : `<em>Your cart is empty.</em>`;

  const subtotal = cart.reduce((s,i)=>s+i.total,0);
  const tax = subtotal * taxRate;
  document.getElementById("sumSub").textContent = currency(subtotal);
  document.getElementById("sumTax").textContent = currency(tax);
  document.getElementById("sumTotal").textContent = currency(subtotal + tax);
}

document.addEventListener("DOMContentLoaded", () => {
  const cust = JSON.parse(localStorage.getItem("pizza.customer") || "{}");
  renderSummary();

  const form = document.getElementById("payForm");
  const result = document.getElementById("payResult");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cart = getCart();
    if (!cart.length) {
      result.innerHTML = `<span style="color:#fca5a5">Cart is empty. Go back and add items.</span>`;
      return;
    }

    const orderId = "ORD-" + Math.random().toString(36).slice(2,8).toUpperCase();
    const sub = cart.reduce((s,i)=>s+i.total,0);
    const tax = (getMenu()?.taxRate ?? 0.07) * sub;
    const total = sub + tax;

    // Save order locally
    const existing = JSON.parse(localStorage.getItem("pizza.orders") || "[]");
    existing.push({
      id: orderId,
      date: new Date().toISOString(),
      customer: cust,
      items: cart,
      totals: { sub, tax, total }
    });
    localStorage.setItem("pizza.orders", JSON.stringify(existing));

    clearCart();

    result.innerHTML = `
      <div class="order-summary">
        <h3>Payment Approved (Staging)</h3>
        <p>Order <strong>${orderId}</strong> has been recorded locally.</p>
        <p>No real card was charged.</p>
        <a class="primary" href="./index.html">Return to Home</a>
      </div>
    `;
    renderSummary();
  });
});
