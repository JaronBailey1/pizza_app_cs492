const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Safeguard: seed menu if storage is empty
if (!localStorage.getItem(LS_MENU_KEY)) {
  localStorage.setItem(LS_MENU_KEY, JSON.stringify({
    categories: [
      { id: "specialty", name: "Specialty Pizzas" },
      { id: "build", name: "Build Your Own" },
      { id: "sides", name: "Sides" },
      { id: "drinks", name: "Drinks" }
    ],
    items: [
      { id: "pep-supreme", name: "Heavy Hitter", desc: "Classic pepperoni with extra cheese.", img: "https://cdn.pixabay.com/photo/2025/09/28/09/25/fizz-9859977_1280.jpg", basePrice: 12.99, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
      { id: "margherita", name: "Slice of Summer", desc: "Fresh mozzarella, basil, tomato.", img: "https://cdn.pixabay.com/photo/2023/05/28/14/13/ai-generated-8023786_640.jpg", basePrice: 11.5, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
      { id: "veggie-delight", name: "Veggie Delight", desc: "Seasonal vegetables & zesty tomato sauce.", img: "https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_640.jpg", basePrice: 12, category: "specialty", sizes: ["Small","Medium","Large"], active: true },
      { id: "garlic-knots", name: "Get Twisted", desc: "Warm garlic knots brushed with herb butter.", img: "https://sallysbakingaddiction.com/wp-content/uploads/2020/02/garlic-knots.jpg", basePrice: 4.5, category: "sides", active: true },
      { id: "coke", name: "Coca-Cola", desc: "Classic soda.", img: "https://soda-emporium.com/wp-content/uploads/2021/05/16oz-Coke.jpeg", basePrice: 1.5, category: "drinks", sizes: ["16 oz"], active: true },
      { id: "sprite", name: "Sprite", desc: "Lemon-lime soda.", img: "https://i5.walmartimages.com/seo/Sprite-Lemon-Lime-Soda-Pop-16-fl-oz-Can_3b4e4064-d9bb-4f2d-8b1f-a103b2522a97.c422e7827905d832b901131c3617f545.jpeg", basePrice: 1.5, category: "drinks", sizes: ["16 oz"], active: true }
    ],
    toppings: [
      { id: "mozzarella", name: "Extra Mozzarella", price: 1.0, active: true },
      { id: "pepperoni", name: "Pepperoni", price: 1.25, active: true },
      { id: "mushrooms", name: "Mushrooms", price: 0.9, active: true },
      { id: "onions", name: "Onions", price: 0.6, active: true },
      { id: "olives", name: "Olives", price: 0.8, active: true }
    ],
    sizeMultipliers: { Small: 1, Medium: 1.35, Large: 1.75, "16 oz": 1 },
    taxRate: 0.07
  }));
}

// Utility functions
function getMenu() {
  return JSON.parse(localStorage.getItem(LS_MENU_KEY));
}

function getCart() {
  return JSON.parse(localStorage.getItem(LS_CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
}

// Build and render menu
function renderMenu() {
  const menu = getMenu();
  const menuSection = document.getElementById("menuCategories");
  if (!menu) return;

  menuSection.innerHTML = "";

  menu.categories.forEach(cat => {
    const items = menu.items.filter(i => i.category === cat.id && i.active);
    if (!items.length) return;

    const catDiv = document.createElement("div");
    catDiv.className = "category";
    catDiv.innerHTML = `<h2>${cat.name}</h2>`;

    const grid = document.createElement("div");
    grid.className = "menu-grid";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "menu-item";
      card.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <p class="price">$${item.basePrice.toFixed(2)}</p>
        <button class="primary" onclick="addToCart('${item.id}')">Add to Cart</button>
      `;
      grid.appendChild(card);
    });

    catDiv.appendChild(grid);
    menuSection.appendChild(catDiv);
  });
}

// Cart logic
function addToCart(itemId) {
  const cart = getCart();
  const menu = getMenu();
  const item = menu.items.find(i => i.id === itemId);
  if (!item) return;

  cart.push({ id: item.id, name: item.name, price: item.basePrice });
  saveCart(cart);
  updateCartCount();
  showCart();
}

function updateCartCount() {
  const count = getCart().length;
  document.getElementById("cartCount").textContent = count;
}

function showCart() {
  const cartPopup = document.getElementById("cartPopup");
  const cartItemsDiv = document.getElementById("cartItems");
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cartItemsDiv.innerHTML = cart.map(c => `<p>${c.name} - $${c.price.toFixed(2)}</p>`).join("");
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price, 0);
  const tax = subtotal * getMenu().taxRate;
  const total = subtotal + tax;

  document.getElementById("cartSub").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("cartTax").textContent = `$${tax.toFixed(2)}`;
  document.getElementById("cartTotal").textContent = `$${total.toFixed(2)}`;

  cartPopup.classList.remove("hidden");
}

document.getElementById("closeCartBtn").addEventListener("click", () => {
  document.getElementById("cartPopup").classList.add("hidden");
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  window.location.href = "./payment.html";
});

document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  updateCartCount();
});
