// CREDENCIALES
const USER = "Admin";
const PASS = "1234";

// Si ya está logueado
if (sessionStorage.getItem("adminAuth") === "ok") {
  window.location.replace("admin.html");
}

document.getElementById("login").addEventListener("click", () => {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const error = document.getElementById("error");

  if (user === USER && pass === PASS) {
    sessionStorage.setItem("adminAuth", "ok");
    window.location.replace("admin.html");
  } else {
    error.textContent = "Usuario o contraseña incorrectos";
  }
});
