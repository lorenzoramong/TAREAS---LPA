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

/* =========================================================
   GESTIÓN DE TAREAS
   ========================================================= */

const tareasContainerActivas = document.getElementById("listaTareasActivas");
const tareasContainerEnviadas = document.getElementById("listaTareasEnviadas");
const tareasContainerPorConfirmar = document.getElementById("listaTareasPorConfirmar");
const tareasContainerFinalizadas = document.getElementById("listaTareasFinalizadas");
const tareasContainerPendientesAprobacion = document.getElementById("listaPendientesAprobacion");

// Cargar todas las tareas del almacenamiento
function obtenerTareas() {
  return JSON.parse(localStorage.getItem("tareas")) || [];
}

// Guardar tareas en almacenamiento
function guardarTareas(tareas) {
  localStorage.setItem("tareas", JSON.stringify(tareas));
}

// =========================================================
// CREAR NUEVA TAREA
// =========================================================
const formCrearTarea = document.getElementById("crearTareaForm");
formCrearTarea.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const asignado = document.getElementById("asignado").value;
  const fecha = document.getElementById("fecha_limite").value;

  if (!titulo || !descripcion || !asignado || !fecha) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const tareas = obtenerTareas();

  const nuevaTarea = {
    id: Date.now(),
    titulo,
    descripcion,
    asignado,
    fecha_limite: fecha,
    creado_por: usuarioActual.usuario,
    estado: "Pendiente",
    aprobado: usuarioActual.rol === "usuario" ? false : true,
  };

  // Si la crea un usuario, queda pendiente de aprobación
  if (usuarioActual.rol === "usuario") {
    nuevaTarea.estado = "Pendiente de aprobación";
    nuevaTarea.aprobado = false;
  }

  tareas.push(nuevaTarea);
  guardarTareas(tareas);
  formCrearTarea.reset();
  actualizarListas();
  alert("Tarea creada correctamente.");
});

// =========================================================
// MOSTRAR LISTAS DE TAREAS SEGÚN ESTADO Y ROL
// =========================================================
function actualizarListas() {
  const tareas = obtenerTareas();

  // Limpiar contenido anterior
  tareasContainerActivas.innerHTML = "";
  tareasContainerEnviadas.innerHTML = "";
  tareasContainerPorConfirmar.innerHTML = "";
  tareasContainerFinalizadas.innerHTML = "";
  tareasContainerPendientesAprobacion.innerHTML = "";

  tareas.forEach((t) => {
    // =========== Pendientes de aprobación (solo super_admin) ===========
    if (!t.aprobado && usuarioActual.rol === "super_admin" && t.estado === "Pendiente de aprobación") {
      const card = crearCardTarea(t, ["aprobarCreacion", "rechazarCreacion"]);
      tareasContainerPendientesAprobacion.appendChild(card);
    }

    // =========== Mis tareas activas ===========
    if (t.asignado === usuarioActual.usuario && t.estado === "Pendiente" && t.aprobado) {
      const card = crearCardTarea(t, ["finalizar"]);
      tareasContainerActivas.appendChild(card);
    }

    // =========== Tareas asignadas por mí ===========
    if (t.creado_por === usuarioActual.usuario) {
      const card = crearCardTarea(t, []);
      tareasContainerEnviadas.appendChild(card);
    }

    // =========== Tareas por confirmar (cuando otro la marcó finalizada) ===========
    if (t.creado_por === usuarioActual.usuario && t.estado === "Finalizada (por confirmar)") {
      const card = crearCardTarea(t, ["aprobarCierre", "rechazarCierre"]);
      tareasContainerPorConfirmar.appendChild(card);
    }

    // =========== Tareas finalizadas (aprobadas) ===========
    if (t.estado === "Finalizada (aprobada)" && (t.creado_por === usuarioActual.usuario || t.asignado === usuarioActual.usuario)) {
      const card = crearCardTarea(t, []);
      tareasContainerFinalizadas.appendChild(card);
    }
  });

  actualizarGrafico();
}

// =========================================================
// CREAR TARJETA VISUAL DE CADA TAREA
// =========================================================
function crearCardTarea(tarea, acciones = []) {
  const div = document.createElement("div");
  div.classList.add("tarea-item");

  div.innerHTML = `
    <h4>${tarea.titulo}</h4>
    <p>${tarea.descripcion}</p>
    <small><strong>Asignado a:</strong> ${tarea.asignado}</small><br>
    <small><strong>Creado por:</strong> ${tarea.creado_por}</small><br>
    <small><strong>Fecha límite:</strong> ${tarea.fecha_limite}</small><br>
    <small><strong>Estado:</strong> ${tarea.estado}</small>
  `;

  acciones.forEach((accion) => {
    const btn = document.createElement("button");
    switch (accion) {
      case "aprobarCreacion":
        btn.textContent = "Aprobar tarea";
        btn.classList.add("aprobar");
        btn.onclick = () => aprobarCreacion(tarea.id);
        break;
      case "rechazarCreacion":
        btn.textContent = "Rechazar";
        btn.classList.add("rechazar");
        btn.onclick = () => rechazarCreacion(tarea.id);
        break;
      case "finalizar":
        btn.textContent = "Marcar como Finalizada";
        btn.classList.add("finalizar");
        btn.onclick = () => marcarFinalizada(tarea.id);
        break;
      case "aprobarCierre":
        btn.textContent = "Aprobar cierre";
        btn.classList.add("aprobar");
        btn.onclick = () => aprobarCierre(tarea.id);
        break;
      case "rechazarCierre":
        btn.textContent = "Rechazar cierre";
        btn.classList.add("rechazar");
        btn.onclick = () => rechazarCierre(tarea.id);
        break;
    }
    div.appendChild(btn);
  });

  return div;
}

// =========================================================
// FUNCIONES DE ACCIÓN SOBRE TAREAS
// =========================================================

// Aprobación de creación (solo super_admin)
function aprobarCreacion(id) {
  const tareas = obtenerTareas();
  const tarea = tareas.find(t => t.id === id);
  if (tarea) {
    tarea.aprobado = true;
    tarea.estado = "Pendiente";
    guardarTareas(tareas);
    actualizarListas();
    alert("Tarea aprobada y activada.");
  }
}

// Rechazar creación
function rechazarCreacion(id) {
  const tareas = obtenerTareas().filter(t => t.id !== id);
  guardarTareas(tareas);
  actualizarListas();
  alert("Tarea rechazada y eliminada.");
}

// Marcar como finalizada (por confirmar)
function marcarFinalizada(id) {
  const tareas = obtenerTareas();
  const tarea = tareas.find(t => t.id === id);
  if (tarea) {
    tarea.estado = "Finalizada (por confirmar)";
    guardarTareas(tareas);
    actualizarListas();
  }
}

// Aprobar cierre (solo el creador)
function aprobarCierre(id) {
  const tareas = obtenerTareas();
  const tarea = tareas.find(t => t.id === id);
  if (tarea && tarea.creado_por === usuarioActual.usuario) {
    tarea.estado = "Finalizada (aprobada)";
    guardarTareas(tareas);
    actualizarListas();
  }
}

// Rechazar cierre (solo el creador)
function rechazarCierre(id) {
  const tareas = obtenerTareas();
  const tarea = tareas.find(t => t.id === id);
  if (tarea && tarea.creado_por === usuarioActual.usuario) {
    tarea.estado = "Pendiente";
    guardarTareas(tareas);
    actualizarListas();
  }
}

// =========================================================
// CARGAR TODO AL INICIAR
// =========================================================
document.addEventListener("DOMContentLoaded", actualizarListas);

/* =========================================================
   GESTIÓN DE USUARIOS (solo visible para super_admin)
   ========================================================= */

// Referencias a elementos
const formNuevoUsuario = document.getElementById("formNuevoUsuario");
const listaUsuariosDiv = document.getElementById("listaUsuarios");

// Cargar usuarios del almacenamiento
function obtenerUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

// Guardar usuarios
function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// =========================================================
// Mostrar lista de usuarios en el panel
// =========================================================
function actualizarListaUsuarios() {
  if (usuarioActual.rol !== "super_admin") return; // Solo super_admin ve esta sección

  const usuarios = obtenerUsuarios();
  listaUsuariosDiv.innerHTML = "";

  usuarios.forEach((u) => {
    const div = document.createElement("div");
    div.classList.add("usuario-item");
    div.innerHTML = `
      <span>${u.nombre} — <strong>${u.rol.toUpperCase()}</strong></span>
      <button class="eliminar" onclick="eliminarUsuario('${u.usuario}')">Eliminar</button>
    `;
    listaUsuariosDiv.appendChild(div);
  });
}

actualizarListaUsuarios();

// =========================================================
// Crear nuevo usuario
// =========================================================
if (formNuevoUsuario) {
  formNuevoUsuario.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nuevoNombre").value.trim();
    const usuario = document.getElementById("nuevoUsuario").value.trim();
    const password = document.getElementById("nuevoPassword").value.trim();
    const rol = document.getElementById("nuevoRol").value;

    if (!nombre || !usuario || !password || !rol) {
      alert("Por favor completa todos los campos.");
      return;
    }

    let usuarios = obtenerUsuarios();

    // Verificar que no exista el mismo usuario
    if (usuarios.some((u) => u.usuario === usuario)) {
      alert("Ya existe un usuario con ese nombre de usuario.");
      return;
    }

    const nuevoUsuario = { nombre, usuario, contraseña: password, rol };
    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);

    formNuevoUsuario.reset();
    actualizarListaUsuarios();
    cargarOpcionesUsuarios(); // Actualizar selector "Asignar a"
    alert("Usuario agregado correctamente.");
  });
}

// =========================================================
// Eliminar usuario
// =========================================================
function eliminarUsuario(usuario) {
  if (usuarioActual.rol !== "super_admin") {
    alert("No tienes permisos para eliminar usuarios.");
    return;
  }

  if (confirm("¿Seguro que deseas eliminar este usuario?")) {
    let usuarios = obtenerUsuarios();
    usuarios = usuarios.filter((u) => u.usuario !== usuario);
    guardarUsuarios(usuarios);
    actualizarListaUsuarios();
    cargarOpcionesUsuarios();
    alert("Usuario eliminado correctamente.");
  }
}
