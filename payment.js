const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";
const LS_ORDERS_KEY = "pizza.orders";

function currency(n){ return `$${(n||0).toFixed(2)}`; }
function getMenu(){ try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function getCart(){ try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveOrders(list){ localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list)); }
function clearCart(){ localStorage.setItem(LS_CART_KEY,"[]"); }

function renderSummary(){
  const menu = getMenu();
  const taxRate = menu?.taxRate ?? 0.07;
  const cart = getCart();
  const wrap = document.getElementById("orderItems");

  wrap.innerHTML = cart.length ? cart.map(i=>`
    <div class="cart-row">
      <div>
        <div><strong>${i.name}</strong> × ${i.qty}</div>
        <small>${i.toppings?.length ? i.toppings.join(", ") : ""}</small>
        <small>${currency(i.unit)} each</small>
      </div>
      <div><strong>${currency(i.total)}</strong></div>
    </div>
  `).join("") : `<em>Your cart is empty.</em>`;

  const subtotal = cart.reduce((s,i)=>s+i.total,0);
  const tax = subtotal*taxRate;
  document.getElementById("sumSub").textContent = currency(subtotal);
  document.getElementById("sumTax").textContent = currency(tax);
  document.getElementById("sumTotal").textContent = currency(subtotal+tax);
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderSummary();

  const form = document.getElementById("payForm");
  const result = document.getElementById("payResult");

  form.addEventListener("submit", e=>{
    e.preventDefault();
    const cart = getCart();
    if(!cart.length){
      result.innerHTML = `<span style="color:#fca5a5">Cart is empty. Go back and add items.</span>`;
      return;
    }

    const menu = getMenu();
    const taxRate = menu?.taxRate ?? 0.07;
    const subtotal = cart.reduce((s,i)=>s+i.total,0);
    const tax = subtotal*taxRate;
    const total = subtotal+tax;

    const orderId = "ORD-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const customer = {
      name: document.getElementById("cardName").value || "(Guest)",
      phone: "-",
      address: "-"
    };

    // Save order locally
    const existing = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]");
    existing.push({
      id: orderId,
      date: new Date().toISOString(),
      customer,
      items: cart,
      totals:{sub:subtotal,tax,total}
    });
    saveOrders(existing);

    clearCart();
    renderSummary();

    result.innerHTML = `
      <div class="order-summary">
        <h3>Payment Approved (Staging)</h3>
        <p>Order <strong>${orderId}</strong> has been recorded locally.</p>
        <p>No real card was charged.</p>
        <a class="primary" href="./index.html">Return to Home</a>
      </div>
    `;
  });
});
