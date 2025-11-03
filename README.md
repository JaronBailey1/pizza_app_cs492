# pizza_app_cs492

This is a complete, working front-end prototype for the Pizza Restaurant Ordering System.

## Sprint 2 Features
- Guest browsing (no login required) — menu, build-your-own, cart, totals
- Checkout routes to **payment.html**, which confirms the order
- **Order Confirmation** after mock payment (shows items, totals, and customer info)
- **Admin** (login required) — edit menu/toppings/tax, changes persist in localStorage
- **Mobile-optimized** (viewport + responsive CSS)

## Staff Login (Demo)
- **Username:** `admin`  **Password:** `admin123`

## Run locally
```bash
# open a terminal INSIDE this folder
python -m http.server 5500
# then open in your browser:
http://localhost:5500/index.html
```
