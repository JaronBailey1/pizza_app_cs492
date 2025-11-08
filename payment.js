// keys
const LS_MENU_KEY   = "pizza.menu";
const LS_CART_KEY   = "pizza.cart";
const LS_ORDERS_KEY = "pizza.orders";
const LS_COUPON_KEY = "pizza.coupon";
const LS_CUSTOMER_KEY = "pizza.customer"; // added for email

// utils
const $ = (id) => document.getElementById(id);
const currency = (n) => `$${Number(n || 0).toFixed(2)}`;

function getMenu()  { try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)); } catch { return null; } }
function getCart()  { try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function setCart(v) { localStorage.setItem(LS_CART_KEY, JSON.stringify(v || [])); }
function getCoupon(){ try { return JSON.parse(localStorage.getItem(LS_COUPON_KEY) || "null"); } catch { return null; } }
function setOrders(list){ localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list || [])); }
function getOrders(){ try { return JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || "[]"); } catch { return []; } }

// discount helper
function computeDiscount(subtotal, coupon){
  if (!coupon) return 0;
  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) return 0;
  if (coupon.type === "percent") return +(subtotal * (Number(coupon.value || 0) / 100)).toFixed(2);
  if (coupon.type === "amount")  return Math.min(subtotal, Number(coupon.value || 0));
  return 0;
}

function clearCart(){ setCart([]); }

// render the order summary on load
function renderSummary(){
  const menu = getMenu();
  const taxRate = menu?.taxRate ?? 0.07;
  const cart = getCart();
  const coupon = getCoupon();

  const wrap = $("orderItems");
  wrap.innerHTML = cart.length
    ? cart.map(i => `
      <div class="cart-row">
        <div>
          <div><strong>${i.name}</strong> × ${i.qty}</div>
          ${i.toppings?.length ? `<small>${i.toppings.join(", ")}</small><br>` : ``}
          <small>${currency(i.unit)} each</small>
        </div>
        <div><strong>${currency(i.total)}</strong></div>
      </div>
    `).join("")
    : `<em>Your cart is empty.</em>`;

  const subtotal = cart.reduce((s,i)=> s + Number(i.total || 0), 0);
  const discount = computeDiscount(subtotal, coupon);
  const taxable  = Math.max(0, subtotal - discount);
  const tax      = taxable * taxRate;
  const grand    = taxable + tax;

  $("sumSub").textContent   = currency(subtotal);
  $("sumTax").textContent   = currency(tax);
  $("sumTotal").textContent = currency(grand);

  const discRow = $("sumDiscRow");
  const discVal = $("sumDisc");
  if (discRow && discVal){
    if (discount > 0){
      discRow.style.display = "";
      discVal.textContent = `-${currency(discount).slice(1)}`;
    } else {
      discRow.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderSummary();

  const form   = $("payForm");
  const result = $("payResult");
  const confirmBox = $("confirmBox");
  const etaText = $("etaText");
  const confirmEmail = $("confirmEmail");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const cart   = getCart();
    const menu   = getMenu();
    const coupon = getCoupon();
    const taxRate = menu?.taxRate ?? 0.07;

    if (!cart.length){
      result.innerHTML = `<span style="color:#c6372f">Cart is empty. Go back and add items.</span>`;
      return;
    }

    // capture email
    const emailInput = $("custEmail");
    const customerEmail = emailInput?.value?.trim() || "";
    if (customerEmail) {
      localStorage.setItem(LS_CUSTOMER_KEY, JSON.stringify({ email: customerEmail }));
    }

    // recompute totals
    const subtotal = cart.reduce((s,i)=> s + Number(i.total || 0), 0);
    const discount = computeDiscount(subtotal, coupon);
    const taxable  = Math.max(0, subtotal - discount);
    const tax      = taxable * taxRate;
    const grand    = taxable + tax;

    const orderId = "ORD-" + Math.random().toString(36).slice(2,8).toUpperCase();

    // save order locally
    const orders = getOrders();
    orders.push({
      id: orderId,
      date: new Date().toISOString(),
      customer: { email: customerEmail },
      items: cart,
      totals: { sub: subtotal, discount, tax, total: grand },
      coupon: coupon?.code || null
    });
    setOrders(orders);

    // clear cart & coupon
    clearCart();
    localStorage.removeItem(LS_COUPON_KEY);

    // show confirmation section instead of old result card
    form.style.display = "none";
    result.style.display = "none";
    if (confirmBox) {
      etaText.textContent = form.dataset.defaultEta || "30–40 minutes";
      confirmEmail.textContent = customerEmail || "your email address";
      confirmBox.style.display = "block";
    }

    // optional: log simulated email
    console.log(`Simulated: order confirmation email sent to ${customerEmail}`);

    // refresh summary
    renderSummary();
  });
});
