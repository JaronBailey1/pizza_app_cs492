// login.js
const VALID_USERS = [
  { u: "admin", p: "pizza123" } // change these as needed
];

function $(id){ return document.getElementById(id); }

document.addEventListener("DOMContentLoaded", () => {
  // If already signed in, redirect straight to admin
  if (localStorage.getItem("authToken")) {
    location.href = "./admin.html";
    return;
  }

  const form = $("loginForm");
  const msg = $("loginResult");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = $("username")?.value.trim();
    const password = $("password")?.value;

    const valid = VALID_USERS.some(u => u.u === username && u.p === password);

    if (!valid) {
      msg.textContent = "Invalid username or password.";
      msg.style.color = "red";
      return;
    }

    // Store a simple local token
    const token = btoa(JSON.stringify({ user: username, ts: Date.now() }));
    localStorage.setItem("authToken", token);

    msg.textContent = "Login successful! Redirecting...";
    msg.style.color = "green";

    setTimeout(() => location.href = "./admin.html", 800);
  });
});
