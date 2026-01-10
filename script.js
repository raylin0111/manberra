import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================== WHATSAPP ================== */
const NUMERO_WHATSAPP = "18492143712"; // 👈 CAMBIA SOLO EL NÚMERO

/* ================== ELEMENTOS DOM ================== */
const contenedor = document.getElementById("productos");
const filtroMarca = document.getElementById("filtroMarca");
const filtroCategoria = document.getElementById("filtroCategoria");
const buscarProducto = document.getElementById("buscarProducto");

const listaCarrito = document.getElementById("listaCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const toggleCarritoBtn = document.getElementById("toggleCarrito");
const carritoDesplegable = document.getElementById("carritoDesplegable");
const btnComprar = document.getElementById("btnComprar");
const cerrarCarritoBtn = document.getElementById("cerrarCarrito");

/* MODAL */
const modal = document.getElementById("modalLeerMas");
const cerrarModal = document.getElementById("cerrarModal");
const detalleProducto = document.getElementById("detalleProducto");

/* ================== ESTADO ================== */
let productos = [];
let carrito = [];
let usandoFiltros = false;

/* ================== CARGAR PRODUCTOS ================== */
async function cargarProductos() {
  const snap = await getDocs(collection(db, "productos"));
  productos = [];
  snap.forEach(d => productos.push({ id: d.id, ...d.data() }));

  if (!usandoFiltros) mostrarProductos(productos);
  cargarFiltros();
}

/* ================== MOSTRAR PRODUCTOS ================== */
function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  lista.forEach(p => {
    contenedor.innerHTML += `
      <div class="producto">
        <div class="img-box">
          <img src="imagenes/${p.imagen}" alt="${p.nombre}">
        </div>

        <h3>${p.nombre}</h3>
        <div class="marca-año">
          <p>${p.marca}</p>
          <p>${p.año}</p>
        </div>
        <h4>$${p.precio}</h4>
        <p>Stock: ${p.stock}</p>

        <button onclick="agregarAlCarrito('${p.id}')">Agregar 🛒</button>
        <button onclick="leerMas('${p.id}')">Leer más</button>
      </div>
    `;
  });
}

/* ================== FILTROS ================== */
[filtroMarca, filtroCategoria, buscarProducto].forEach(el =>
  el.addEventListener("input", aplicarFiltros)
);

function aplicarFiltros() {
  usandoFiltros = true;

  const marca = filtroMarca.value.toLowerCase();
  const categoria = filtroCategoria.value.toLowerCase();
  const busqueda = buscarProducto.value.toLowerCase();

  const filtrados = productos.filter(p =>
    (marca === "" || p.marca.toLowerCase().includes(marca)) &&
    (categoria === "" || p.categoria.toLowerCase().includes(categoria)) &&
    p.nombre.toLowerCase().includes(busqueda)
  );

  mostrarProductos(filtrados);
}

/* ================== FILTROS SELECT ================== */
function cargarFiltros() {
  const marcas = [...new Set(productos.map(p => p.marca))].sort();
  const categorias = [...new Set(productos.map(p => p.categoria))].sort();

  filtroMarca.innerHTML = '<option value="">Todas las marcas</option>';
  marcas.forEach(m => filtroMarca.innerHTML += `<option value="${m}">${m}</option>`);

  filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';
  categorias.forEach(c => filtroCategoria.innerHTML += `<option value="${c}">${c}</option>`);
}

/* ================== CARRITO ================== */
window.agregarAlCarrito = id => {
  const producto = productos.find(p => p.id === id);
  if (!producto || producto.stock === 0) return;

  const item = carrito.find(p => p.id === id);
  if (item) {
    if (item.cantidad < producto.stock) item.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  actualizarCarrito();
};

window.quitarDelCarrito = id => {
  carrito = carrito.filter(p => p.id !== id);
  actualizarCarrito();
};

function actualizarCarrito() {
  listaCarrito.innerHTML = "";
  let total = 0;

  carrito.forEach(p => {
    listaCarrito.innerHTML += `
      <div class="item-carrito">
        <span>${p.nombre} x${p.cantidad}</span>
        <span>$${p.precio * p.cantidad}</span>
        <button onclick="quitarDelCarrito('${p.id}')">❌</button>
      </div>
    `;
    total += p.precio * p.cantidad;
  });

  totalCarrito.textContent = `Total: $${total}`;
  contadorCarrito.textContent = carrito.length;
  contadorCarrito.style.display = carrito.length ? "flex" : "none";

  localStorage.setItem("carrito", JSON.stringify(carrito));
}

/* ================== CARRITO LOCAL ================== */
function cargarCarritoLocal() {
  const data = localStorage.getItem("carrito");
  if (data) {
    carrito = JSON.parse(data);
    actualizarCarrito();
  }
}

/* ================== WHATSAPP ================== */
function generarMensajeWhatsApp(carrito) {
  let mensaje = "🛒 *NUEVO PEDIDO*\n\n";

  carrito.forEach(p => {
    mensaje += `• ${p.nombre}\n`;
    mensaje += `Cantidad: ${p.cantidad}\n`;
    mensaje += `Precio: $${p.precio}\n`;
    mensaje += `Subtotal: $${p.precio * p.cantidad}\n\n`;
  });

  const total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
  mensaje += `💰 *TOTAL: $${total}*`;

  return encodeURIComponent(mensaje);
}

/* ================== COMPRAR (iPHONE FIX) ================== */
btnComprar.addEventListener("click", async () => {
  if (!carrito.length) {
    alert("El carrito está vacío");
    return;
  }

  // 🔹 PREPARAR Y ABRIR WHATSAPP (OBLIGATORIO PRIMERO EN iOS)
  const mensaje = generarMensajeWhatsApp(carrito);
  const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`;
  window.location.href = urlWhatsApp;

  // 🔹 GUARDAR PEDIDO
  const totalPedido = carrito.reduce(
    (s, p) => s + p.precio * p.cantidad,
    0
  );

  await addDoc(collection(db, "pedidos"), {
    estado: "pendiente",
    total: totalPedido,
    items: carrito.map(p => ({
      productoId: p.id,
      nombre: p.nombre,
      precio: p.precio,
      cantidad: p.cantidad
    })),
    fecha: serverTimestamp()
  });

  carrito = [];
  localStorage.removeItem("carrito");
  actualizarCarrito();
  carritoDesplegable.classList.remove("visible");
});

/* ================== MODAL ================== */
window.leerMas = id => {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  detalleProducto.innerHTML = `
    <img src="imagenes/${p.imagen}">
    <h2>${p.nombre}</h2>
    <p class="precio">$${p.precio}</p>
    <p><strong>Marca:</strong> ${p.marca}</p>
    <p><strong>Stock:</strong> ${p.stock}</p>
    <p>${p.descripcion || "No hay descripción disponible."}</p>
  `;

  modal.classList.add("visible");
};

cerrarModal.addEventListener("click", () => {
  modal.classList.remove("visible");
});

/* ================== CARRITO TOGGLE ================== */
toggleCarritoBtn.addEventListener("click", e => {
  e.stopPropagation();
  carritoDesplegable.classList.toggle("visible");
});

cerrarCarritoBtn.addEventListener("click", e => {
  e.stopPropagation();
  carritoDesplegable.classList.remove("visible");
});

carritoDesplegable.addEventListener("click", e => e.stopPropagation());

document.addEventListener("click", () => {
  carritoDesplegable.classList.remove("visible");
});

/* ================== INIT ================== */
await cargarProductos();
cargarCarritoLocal();
