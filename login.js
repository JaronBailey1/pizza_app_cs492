// Hardcoded demo credentials
const DEMO_USER = { username: "admin", password: "pizza123" };
const TOKEN_KEY = "authToken";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const result = document.getElementById("loginResult");

  // If already logged in, redirect to admin
  if(localStorage.getItem(TOKEN_KEY)){
    location.href = "./admin.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if(username === DEMO_USER.username && password === DEMO_USER.password){
      // Simple token simulation
      localStorage.setItem(TOKEN_KEY, Math.random().toString(36).slice(2));
      result.innerHTML = `<span style="color:green">Login successful! Redirecting…</span>`;
      setTimeout(()=> location.href = "./admin.html", 800);
    } else {
      result.innerHTML = `<span style="color:#fca5a5">Invalid username or password.</span>`;
    }
  });
});
