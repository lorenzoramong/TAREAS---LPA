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

/* =========================================================
   EXPORTAR REPORTE DE TAREAS (CSV / EXCEL)
   ========================================================= */

function exportarTareasCSV() {
  const tareas = JSON.parse(localStorage.getItem("tareas")) || [];

  if (tareas.length === 0) {
    alert("No hay tareas registradas para exportar.");
    return;
  }

  // Armar encabezado y filas
  const encabezados = [
    "ID",
    "Título",
    "Descripción",
    "Asignado a",
    "Creado por",
    "Fecha límite",
    "Estado",
    "Aprobado"
  ];

  const filas = tareas.map(t => [
    t.id,
    `"${t.titulo}"`,
    `"${t.descripcion}"`,
    t.asignado,
    t.creado_por,
    t.fecha_limite,
    t.estado,
    t.aprobado ? "Sí" : "No"
  ]);

  const csvContenido = [
    encabezados.join(","),
    ...filas.map(f => f.join(","))
  ].join("\n");

  // Crear blob y descargar
  const blob = new Blob([csvContenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // Nombre del archivo (ejemplo: tareas_LPA_2025-11-04.csv)
  const fecha = new Date().toISOString().split("T")[0];
  link.download = `tareas_LPA_${fecha}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =========================================================
// Insertar botón en el dashboard (solo super_admin y admin)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (usuarioActual.rol === "super_admin" || usuarioActual.rol === "admin") {
    const btnExportar = document.createElement("button");
    btnExportar.textContent = "📤 Exportar Reporte (.CSV)";
    btnExportar.style.backgroundColor = "#c4332a";
    btnExportar.style.color = "white";
    btnExportar.style.padding = "10px 16px";
    btnExportar.style.border = "none";
    btnExportar.style.borderRadius = "10px";
    btnExportar.style.cursor = "pointer";
    btnExportar.style.marginBottom = "1rem";
    btnExportar.onclick = exportarTareasCSV;

    const header = document.querySelector(".dashboard-header");
    header.appendChild(btnExportar);
  }
});

/* =========================================================
   NOTIFICACIONES AUTOMÁTICAS (locales)
   ========================================================= */

// Pedir permiso para notificaciones del navegador
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// =========================================================
// Función para verificar tareas próximas a vencer
// =========================================================
function verificarTareasProximas() {
  const tareas = JSON.parse(localStorage.getItem("tareas")) || [];
  const hoy = new Date();

  tareas.forEach((t) => {
    if (t.asignado === usuarioActual.usuario && t.estado === "Pendiente" && t.aprobado) {
      const fechaLimite = new Date(t.fecha_limite);
      const diffDias = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));

      if (diffDias === 2) {
        mostrarNotificacion(
          `⏰ Recordatorio: "${t.titulo}" vence en 2 días.`,
          "No olvides completarla antes del plazo límite."
        );
      } else if (diffDias === 1) {
        mostrarNotificacion(
          `⚠️ Último día para "${t.titulo}"`,
          "Hoy es el último día para completar esta tarea."
        );
      } else if (diffDias === 0) {
        mostrarNotificacion(
          `❌ Tarea vencida: "${t.titulo}"`,
          "Esta tarea ya llegó a su fecha límite."
        );
      }
    }
  });
}

// =========================================================
// Mostrar notificación visual + en el sistema
// =========================================================
function mostrarNotificacion(titulo, mensaje) {
  // Notificación nativa (si el usuario la permite)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(titulo, {
      body: mensaje,
      icon: "assets/icon.png",
    });
  }

  // Notificación visual dentro de la app
  const aviso = document.createElement("div");
  aviso.classList.add("notificacion");
  aviso.innerHTML = `
    <strong>${titulo}</strong><br>
    <small>${mensaje}</small>
  `;
  document.body.appendChild(aviso);

  setTimeout(() => aviso.remove(), 6000);
}

// =========================================================
// Estilo visual para alertas dentro de la app
// =========================================================
const estiloNotificaciones = document.createElement("style");
estiloNotificaciones.textContent = `
.notificacion {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #c4332a;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 9999;
  font-size: 0.9rem;
  animation: aparecer 0.4s ease-out;
}
@keyframes aparecer {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(estiloNotificaciones);

// =========================================================
// Ejecutar verificación automática al cargar
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  verificarTareasProximas();
  // Verificar cada 3 horas mientras la app esté abierta
  setInterval(verificarTareasProximas, 3 * 60 * 60 * 1000);
});
