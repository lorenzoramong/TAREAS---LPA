async function cargarUsuarios() {
  const response = await fetch("../data/users.json");
  return await response.json();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("loginMessage");

  const usuarios = await cargarUsuarios();
  const usuario = usuarios.find(u => u.usuario === username && u.contraseña === password);

  if (usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
    message.textContent = "Bienvenido " + usuario.nombre + "!";
    message.style.color = "green";
    setTimeout(() => {
      if (usuario.rol === "super_admin" || usuario.rol === "admin") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "tareas.html";
      }
    }, 800);
  } else {
    message.textContent = "Usuario o contraseña incorrectos.";
    message.style.color = "red";
  }
});

