// 🔐 PROTECCIÓN LOGIN (OBLIGATORIO)
if (sessionStorage.getItem("adminAuth") !== "ok") {
  window.location.replace("login.html");
}

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= LOGOUT ================= */
document.getElementById("logout")?.addEventListener("click", () => {
  sessionStorage.removeItem("adminAuth");
  window.location.replace("login.html");
});

/* ================= TABS ================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

/* ======= TODO TU CÓDIGO ORIGINAL SIGUE IGUAL AQUÍ ======= */
/* NO SE MODIFICÓ NADA MÁS */

/* ================= PRODUCTOS ================= */
const listaProductos = document.getElementById("listaProductos");
const guardar = document.getElementById("guardar");
const idProducto = document.getElementById("idProducto");

const nombre = document.getElementById("nombre");
const marca = document.getElementById("marca");
const categoria = document.getElementById("categoria");
const año = document.getElementById("año");
const precio = document.getElementById("precio");
const stock = document.getElementById("stock");
const imagen = document.getElementById("imagen");
const filtroProductos = document.getElementById("filtroProductos");

function validarRangoAños(valor) {
  if (!valor) return false;
  return /^(\d{4})(-(\d{4}))?$/.test(valor);
}

async function cargarProductos() {
  const snap = await getDocs(collection(db, "productos"));
  listaProductos.innerHTML = "";

  snap.forEach(d => {
    const p = d.data();
    listaProductos.innerHTML += `
      <tr>
        <td><img src="imagenes/${p.imagen}" width="50"></td>
        <td>${p.nombre}</td>
        <td>${p.marca}</td>
        <td>${p.categoria}</td>
        <td>${p.año}</td>
        <td>$${p.precio}</td>
        <td>${p.stock}</td>
        <td>
          <button onclick="editarProducto('${d.id}','${p.nombre}','${p.marca}','${p.categoria}','${p.año}',${p.precio},${p.stock},'${p.imagen}')">✏️</button>
          <button onclick="eliminarProducto('${d.id}')">🗑</button>
        </td>
      </tr>`;
  });
}

window.editarProducto = (id,n,m,c,a,p,s,i) => {
  idProducto.value=id;
  nombre.value=n;
  marca.value=m;
  categoria.value=c;
  año.value=a;
  precio.value=p;
  stock.value=s;
  imagen.value=i;
};

window.eliminarProducto = async id => {
  if(!confirm("¿Eliminar producto?")) return;
  await deleteDoc(doc(db,"productos",id));
  cargarProductos();
};

guardar.addEventListener("click", async () => {
  if(!nombre.value || !precio.value || !stock.value || !año.value)
    return alert("Campos obligatorios");

  if(!validarRangoAños(año.value))
    return alert("Año inválido");

  const data = {
    nombre: nombre.value,
    marca: marca.value,
    categoria: categoria.value,
    año: año.value,
    precio: Number(precio.value),
    stock: Number(stock.value),
    imagen: imagen.value
  };

  if(idProducto.value){
    await updateDoc(doc(db,"productos",idProducto.value),data);
    idProducto.value="";
  } else {
    await addDoc(collection(db,"productos"),data);
  }

  nombre.value = marca.value = categoria.value =
  año.value = precio.value = stock.value = imagen.value = "";

  cargarProductos();
});

filtroProductos.addEventListener("input", () => {
  const f = filtroProductos.value.toLowerCase();
  document.querySelectorAll("#tablaProductos tbody tr").forEach(row => {
    row.style.display =
      row.cells[1].textContent.toLowerCase().includes(f) ||
      row.cells[3].textContent.toLowerCase().includes(f)
      ? "" : "none";
  });
});

/* ================= VENTAS ================= */
const mesSeleccionado = document.getElementById("mesSeleccionado");
const listaVentas = document.getElementById("listaVentas");
const totalMes = document.getElementById("totalMes");
const cantidadVentas = document.getElementById("cantidadVentas");

function escucharVentasPorMes(valor){
  const [anio, mes] = valor.split("-").map(Number);
  const q = query(
  collection(db,"ventas"),
  orderBy("fecha","desc"),
  limit(15)
);


  onSnapshot(q, snap => {
    let total=0, cant=0;
    listaVentas.innerHTML="";

    snap.forEach(d => {
      const v = d.data();
      if(!v.fecha) return;
      const f = v.fecha.toDate();

      if(f.getFullYear()===anio && f.getMonth()+1===mes){
        total+=v.total;
        cant++;
        listaVentas.innerHTML+=`
          <div class="venta-item">
            <p>📅 ${f.toLocaleDateString()}</p>
            <p>💰 $${v.total}</p>
            <p>📦 ${v.items.length}</p>
          </div>`;
      }
    });

    totalMes.textContent=`$${total}`;
    cantidadVentas.textContent=cant;
    if(!cant) listaVentas.innerHTML="<p>No hay ventas</p>";
  });
}

/* ================= PEDIDOS ================= */
const listaPedidos = document.getElementById("listaPedidos");

const qPedidos = query(
  collection(db,"pedidos"),
  orderBy("fecha","desc"),
  limit(20)
);

onSnapshot(qPedidos, snap => {
  listaPedidos.innerHTML="";

  if(snap.empty){
    listaPedidos.innerHTML="<p>No hay pedidos</p>";
    return;
  }

  snap.forEach(d => {
    const p = d.data();
    const fecha = p.fecha?.toDate().toLocaleString() || "";

    const productosHTML = p.items.map((item, index) => `
      <div class="pedido-item">
        <span>${item.nombre}</span>

        <input
          type="number"
          min="1"
          value="${item.cantidad}"
          ${p.estado !== "pendiente" ? "disabled" : ""}
          onchange="actualizarCantidad('${d.id}',${index},this.value)"
        >

        <span>$${item.precio * item.cantidad}</span>

        ${p.estado==="pendiente"
          ? `<button onclick="eliminarItem('${d.id}',${index})">🗑</button>`
          : ""}
      </div>
    `).join("");

    listaPedidos.innerHTML+=`
      <div class="pedido-card ${p.estado}">
        <div class="pedido-header">
          <h3>🧾 Pedido</h3>
          <span class="estado ${p.estado}">${p.estado.toUpperCase()}</span>
        </div>

        <p>👤 ${p.cliente || "Cliente web"}</p>
        <p>📅 ${fecha}</p>

        <div class="pedido-productos">${productosHTML}</div>

        <div class="pedido-total">
          Total: <strong>$${p.total}</strong>
        </div>

        ${p.estado==="pendiente" ? `
          <div class="pedido-acciones">
            <button class="btn-entregar" onclick="entregarPedido('${d.id}')">✔ Entregar</button>
            <button class="btn-cancelar" onclick="cancelarPedido('${d.id}')">✖ Cancelar</button>
          </div>
        ` : ""}
      </div>`;
  });
});

/* ================= EDITAR PEDIDO ================= */
window.actualizarCantidad = async (pedidoId,index,nuevaCantidad) => {
  nuevaCantidad = Number(nuevaCantidad);
  if(nuevaCantidad < 1) return;

  const pedidoRef = doc(db,"pedidos",pedidoId);
  const snap = await getDoc(pedidoRef);
  const pedido = snap.data();

  pedido.items[index].cantidad = nuevaCantidad;
  pedido.total = pedido.items.reduce((s,i)=>s+i.precio*i.cantidad,0);

  await updateDoc(pedidoRef,{
    items: pedido.items,
    total: pedido.total
  });
};

window.eliminarItem = async (pedidoId,index) => {
  if(!confirm("¿Eliminar producto del pedido?")) return;

  const pedidoRef = doc(db,"pedidos",pedidoId);
  const snap = await getDoc(pedidoRef);
  const pedido = snap.data();

  pedido.items.splice(index,1);

  if(pedido.items.length===0){
    await updateDoc(pedidoRef,{ estado:"cancelado" });
    return;
  }

  pedido.total = pedido.items.reduce((s,i)=>s+i.precio*i.cantidad,0);

  await updateDoc(pedidoRef,{
    items: pedido.items,
    total: pedido.total
  });
};

/* ================= ENTREGAR PEDIDO (FIX FINAL) ================= */
window.entregarPedido = async pedidoId => {
  if(!confirm("¿Entregar pedido y registrar venta?")) return;

  const pedidoRef = doc(db,"pedidos",pedidoId);
  const snap = await getDoc(pedidoRef);

  if(!snap.exists()) return alert("Pedido no encontrado");

  const pedido = snap.data();
  if(pedido.estado !== "pendiente") return;

  for(const item of pedido.items){
    const prodRef = doc(db,"productos", item.productoId); // ✅ CLAVE
    const prodSnap = await getDoc(prodRef);

    if(!prodSnap.exists())
      return alert(`Producto no encontrado: ${item.nombre}`);

    const prod = prodSnap.data();

    if(prod.stock < item.cantidad)
      return alert(`Stock insuficiente: ${item.nombre}`);

    await updateDoc(prodRef,{
      stock: prod.stock - item.cantidad
    });
  }

  await addDoc(collection(db,"ventas"),{
    fecha: serverTimestamp(),
    total: pedido.total,
    items: pedido.items,
    cliente: pedido.cliente || "Cliente web"
  });

  await updateDoc(pedidoRef,{
    estado: "entregado",
    fechaEntrega: serverTimestamp()
  });

  alert("✅ Pedido entregado correctamente");
};

/* ================= CANCELAR PEDIDO ================= */
window.cancelarPedido = async id => {
  if(!confirm("¿Cancelar pedido?")) return;
  await updateDoc(doc(db,"pedidos",id),{ estado:"cancelado" });
};

/* ================= INIT ================= */
mesSeleccionado.value = new Date().toISOString().slice(0,7);
mesSeleccionado.addEventListener("change",()=>escucharVentasPorMes(mesSeleccionado.value));

cargarProductos();
escucharVentasPorMes(mesSeleccionado.value);
