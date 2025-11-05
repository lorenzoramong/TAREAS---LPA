/* =========================================================
   DASHBOARD.JS - BASE FUNCIONAL INICIAL
   ========================================================= */

// 🧭 1. Verificar sesión
const usuarioActual = JSON.parse(localStorage.getItem("usuario"));

if (!usuarioActual) {
  // Si no hay sesión activa, redirigir al login
  window.location.href = "index.html";
}

// 🧩 2. Mostrar nombre del usuario en el header
document.getElementById("userName").textContent = `${usuarioActual.nombre} (${usuarioActual.rol.toUpperCase()})`;

// 🧨 3. Botón de cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
});

// =========================================================
// 🧱 4. Configurar la visibilidad de las secciones según el rol
// =========================================================
const seccionPendientes = document.getElementById("pendientesAprobacion");
const seccionGestionUsuarios = document.getElementById("gestionUsuarios");
const seccionCrearTarea = document.getElementById("crearTareaSection");

// Ocultar secciones que no correspondan
if (usuarioActual.rol === "usuario") {
  seccionPendientes.style.display = "none"; // usuarios no aprueban creación
  seccionGestionUsuarios.style.display = "none"; // no gestionan usuarios
} else if (usuarioActual.rol === "admin") {
  seccionPendientes.style.display = "none"; // admins no aprueban tareas de creación
  seccionGestionUsuarios.style.display = "none"; // solo super_admin gestiona usuarios
} else if (usuarioActual.rol === "super_admin") {
  // super_admin ve todo
  seccionPendientes.style.display = "block";
  seccionGestionUsuarios.style.display = "block";
}

// =========================================================
// 🎨 5. Inicializar datos locales (si no existen aún)
// =========================================================
if (!localStorage.getItem("tareas")) {
  localStorage.setItem("tareas", JSON.stringify([]));
}
if (!localStorage.getItem("usuarios")) {
  localStorage.setItem("usuarios", JSON.stringify([
    {
      usuario: "lorram",
      contraseña: "1234",
      rol: "super_admin",
      nombre: "Lorenzo Ramón"
    },
    {
      usuario: "guillo",
      contraseña: "5678",
      rol: "super_admin",
      nombre: "Guillermo Mendoza"
    },
    {
      usuario: "david",
      contraseña: "9999",
      rol: "admin",
      nombre: "David Manager"
    }
  ]));
}

// =========================================================
// 🧮 6. Cargar lista de usuarios en el formulario “Asignar tarea”
// =========================================================
const selectAsignado = document.getElementById("asignado");

function cargarOpcionesUsuarios() {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  selectAsignado.innerHTML = "";
  usuarios.forEach(u => {
    const option = document.createElement("option");
    option.value = u.usuario;
    option.textContent = `${u.nombre} (${u.rol})`;
    selectAsignado.appendChild(option);
  });
}

cargarOpcionesUsuarios();

// =========================================================
// 📊 7. Cargar gráfico de progreso inicial
// =========================================================
function actualizarGrafico() {
  const tareas = JSON.parse(localStorage.getItem("tareas")) || [];
  const mias = tareas.filter(t => t.asignado === usuarioActual.usuario);
  const completadas = mias.filter(t => t.estado === "Finalizada (aprobada)").length;

  const ctx = document.getElementById("progressChart").getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completadas", "Pendientes"],
      datasets: [
        {
          data: [completadas, mias.length - completadas],
          backgroundColor: ["#28a745", "#c4332a"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });

  document.getElementById("summaryStats").innerHTML = `
    <strong>Total de tareas:</strong> ${mias.length}<br>
    <strong>Finalizadas:</strong> ${completadas}<br>
    <strong>Pendientes:</strong> ${mias.length - completadas}
  `;
}

actualizarGrafico();

// =========================================================
// 🧱 8. Mensaje de bienvenida en consola (para pruebas)
// =========================================================
console.log(`Bienvenido ${usuarioActual.nombre} (${usuarioActual.rol}) — Sesión activa en TAREAS LPA.`);

