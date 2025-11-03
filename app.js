(() => {
  const LS_MENU_KEY = "pizza.menu";
  const LS_CART_KEY = "pizza.cart";

  // Helpers
  function currency(n) { return `$${n.toFixed(2)}`; }
  function getMenu() { try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || {}; } catch { return {}; } }
  function getCart() { try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
  function saveCart(cart) { localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }
  function clearCart() { localStorage.setItem(LS_CART_KEY, "[]"); }

  // Render menu
  function renderMenu() {
    const menu = getMenu();
    const wrap = document.getElementById("menuWrap");
    if (!wrap) return;

    wrap.innerHTML = menu.items.map(item => `
      <div class="menu-card">
        <img src="${item.img}" alt="${item.name}">
        <div class="menu-info">
          <strong>${item.name}</strong>
          <div>${item.desc || ""}</div>
          <div>${item.sizes.map(sz => `${sz}: ${currency(item.basePrice * (menu.sizeMultipliers[sz] || 1))}`).join(" | ")}</div>
        </div>
        <button class="add-cart" data-id="${item.id}">Add to Cart</button>
      </div>
    `).join("");

    // Bind add to cart buttons
    wrap.querySelectorAll("button.add-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const cart = getCart();
        const menuItem = menu.items.find(i => i.id === id);
        if (!menuItem) return;

        const existing = cart.find(c => c.id === id && c.size === "Medium"); // default size
        if (existing) {
          existing.qty++;
        } else {
          cart.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.basePrice * (menu.sizeMultipliers["Medium"] || 1),
            qty: 1,
            size: "Medium",
            toppings: []
          });
        }
        saveCart(cart);
        renderCart();
      });
    });
  }

  // Render cart
  function renderCart() {
    const cartWrap = document.getElementById("cartWrap");
    if (!cartWrap) return;

    const cart = getCart();
    if (!cart.length) {
      cartWrap.innerHTML = "<em>Your cart is empty</em>";
      return;
    }

    cartWrap.innerHTML = cart.map((item, idx) => `
      <div class="cart-row">
        <div>${item.name} (${item.size}) × ${item.qty}</div>
        <div>${currency(item.price * item.qty)}</div>
        <button class="remove-cart" data-idx="${idx}">✕</button>
      </div>
    `).join("");

    // Remove from cart
    cartWrap.querySelectorAll("button.remove-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
      });
    });

    // Update totals
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const taxRate = getMenu()?.taxRate ?? 0.07;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const sumSub = document.getElementById("sumSub");
    const sumTax = document.getElementById("sumTax");
    const sumTotal = document.getElementById("sumTotal");
    if (sumSub) sumSub.textContent = currency(subtotal);
    if (sumTax) sumTax.textContent = currency(tax);
    if (sumTotal) sumTotal.textContent = currency(total);
  }

  // Build Your Own interactive
  function bindBuildYourOwn() {
    const menu = getMenu();
    const byoWrap = document.getElementById("buildYourOwn");
    if (!byoWrap) return;

    const toppings = menu.toppings || [];
    byoWrap.innerHTML = toppings.map((t, idx) => `
      <label>
        <input type="checkbox" data-idx="${idx}"> ${t.name} (+${currency(t.price)})
      </label>
    `).join("");

    byoWrap.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        const selected = [];
        byoWrap.querySelectorAll("input[type=checkbox]:checked").forEach(inp => {
          const t = toppings[Number(inp.dataset.idx)];
          selected.push(t);
        });
        // Update price preview
        const basePrice = menu.items.find(i => i.id === "plain")?.basePrice || 10;
        const total = basePrice + selected.reduce((s,t)=>s+t.price,0);
        const pricePreview = document.getElementById("byoPrice");
        if(pricePreview) pricePreview.textContent = currency(total);
      });
    });
  }

  // Initialization
  document.addEventListener("DOMContentLoaded", () => {
    renderMenu();
    renderCart();
    bindBuildYourOwn();
  });

})();
