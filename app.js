// Constants
const LS_MENU_KEY = "pizza.menu";
const LS_CART_KEY = "pizza.cart";

// Seed menu
function getSeedMenu(){
  return {
    categories: ["specialty","build","sides","drinks"],
    items: [
      {id:"pep-supreme", name:"Heavy Hitter", basePrice:12.99, category:"specialty", sizes:["Small","Medium","Large"], desc:"Classic pepperoni with extra cheese.", active:true, img:"https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80"},
      {id:"margherita", name:"Slice of Summer", basePrice:11.5, category:"specialty", sizes:["Small","Medium","Large"], desc:"Fresh mozzarella, basil, tomato.", active:true, img:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80"},
      {id:"veggie-delight", name:"Veggie Delight", basePrice:12, category:"specialty", sizes:["Small","Medium","Large"], desc:"Seasonal vegetables & zesty tomato sauce.", active:true, img:"https://meatfreemondays.com/wp-content/uploads/2020/01/Mziuri-Vegetarian-Pizza-RS-N.jpg"}
    ],
    toppings: [
      {name:"Mozzarella", price:1, active:true},
      {name:"Pepperoni", price:1.25, active:true},
      {name:"Mushrooms", price:0.9, active:true},
      {name:"Olives", price:0.75, active:true},
      {name:"Basil", price:0.5, active:true}
    ],
    sizeMultipliers:{Small:1, Medium:1.25, Large:1.5},
    taxRate:0.07
  };
}

// LocalStorage helpers
function getMenu(){ 
  try { return JSON.parse(localStorage.getItem(LS_MENU_KEY)) || getSeedMenu(); } 
  catch { return getSeedMenu(); } 
}
function saveMenu(menu){ localStorage.setItem(LS_MENU_KEY, JSON.stringify(menu)); }
function getCart(){ try { return JSON.parse(localStorage.getItem(LS_CART_KEY) || "[]"); } catch { return []; } }
function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart)); }

// Build Your Own interactive
function renderBuildYourOwn(){
  const menu = getMenu();
  const wrap = document.getElementById("buildYourOwn");
  if(!wrap) return;

  wrap.innerHTML = `
    <h3>Build Your Own Pizza</h3>
    <label>Choose Base:
      <select id="byoBase">
        ${menu.items.filter(i=>i.category==="build").map(i=>`<option value="${i.id}">${i.name} ($${i.basePrice})</option>`).join("")}
      </select>
    </label>
    <label>Size:
      <select id="byoSize">
        ${Object.keys(menu.sizeMultipliers).map(sz=>`<option value="${sz}">${sz}</option>`).join("")}
      </select>
    </label>
    <fieldset>
      <legend>Toppings ($)</legend>
      ${menu.toppings.map((t,idx)=>`
        <label>
          <input type="checkbox" data-idx="${idx}" /> ${t.name} (${t.price})
        </label>
      `).join("")}
    </fieldset>
    <div>Total: $<span id="byoTotal">0.00</span></div>
    <button id="addByoCart">Add to Cart</button>
  `;

  const baseEl = document.getElementById("byoBase");
  const sizeEl = document.getElementById("byoSize");
  const toppingEls = wrap.querySelectorAll("input[type=checkbox]");
  const totalEl = document.getElementById("byoTotal");
  const addBtn = document.getElementById("addByoCart");

  function calcTotal(){
    const base = menu.items.find(i=>i.id===baseEl.value);
    const sizeMult = menu.sizeMultipliers[sizeEl.value] || 1;
    let total = base.basePrice * sizeMult;
    toppingEls.forEach(t => {
      if(t.checked){
        const tp = menu.toppings[Number(t.dataset.idx)];
        total += tp.price;
      }
    });
    totalEl.textContent = total.toFixed(2);
    return total;
  }

  // Recalculate on change
  [baseEl,sizeEl,...toppingEls].forEach(el => el.addEventListener("change", calcTotal));
  calcTotal();

  // Add to cart
  addBtn.addEventListener("click",()=>{
    const cart = getCart();
    const base = menu.items.find(i=>i.id===baseEl.value);
    const size = sizeEl.value;
    const selectedToppings = Array.from(toppingEls).filter(t=>t.checked).map(t=>menu.toppings[Number(t.dataset.idx)].name);
    cart.push({
      id: base.id,
      name: base.name,
      size,
      toppings: selectedToppings,
      unit: calcTotal(),
      total: calcTotal(),
      qty: 1
    });
    saveCart(cart);
    alert("Pizza added to cart!");
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", ()=>{
  // Seed menu if missing
  if(!localStorage.getItem(LS_MENU_KEY)){
    saveMenu(getSeedMenu());
  }

  renderBuildYourOwn();
});
