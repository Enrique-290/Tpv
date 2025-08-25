
// --- Estado y utilidades ---
const STORE_KEY = 'tpv_demo_state_v1';
const DEFAULT_STATE = {
  products: [
    { id:'007', name:'BARRA MUCLE SANDWICH', unit:'PIEZA', price:35.00, stock:2,  min:5 },
    { id:'758104001972', name:'BONAFONT 2LT', unit:'PIEZA', price:20.00, stock:14, min:5 },
    { id:'001', name:'BONAFONT 1LT', unit:'PIEZA', price:14.00, stock:23, min:5 },
    { id:'BONA600', name:'BONAFONT 600ML', unit:'PIEZA', price:10.00, stock:0,  min:5 },
    { id:'758104000159', name:'BONAFONT 1.5L', unit:'PIEZA', price:16.00, stock:26, min:5 },
    { id:'BOOST', name:'BOOST', unit:'PIEZA', price:28.00, stock:-1, min:5 },
  ],
  sales: [],
  purchases: [],
  providers: [{id:'PROV01', name:'Proveedor Demo', phone:'', email:''}],
  clients: [{id:'C001', name:'Mostrador', phone:'', email:''}],
  config: { business:'DINAMITA GYM', ticket:{footer:'Gracias por tu compra en Dinamita Gym 💥'} }
};

let state = loadState();
function loadState(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || DEFAULT_STATE; } catch { return DEFAULT_STATE; }
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

// --- Drawer ---
const drawer = document.getElementById('drawer');
const btnMenu = document.getElementById('btnMenu');
const backdrop = document.getElementById('backdrop');
btnMenu.addEventListener('click', ()=>{ const isOpen = drawer.classList.toggle('open'); btnMenu.setAttribute('aria-expanded', String(isOpen)); });
backdrop.addEventListener('click', ()=>{ drawer.classList.remove('open'); btnMenu.setAttribute('aria-expanded','false'); });
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ drawer.classList.remove('open'); btnMenu.setAttribute('aria-expanded','false'); } });

// --- Ruteo simple ---
const routes = {
  inventario: renderInventario,
  ventas: renderVentas,
  compras: renderCompras,
  ingresos: renderIngresos,
  rentas: renderStub('Rentas'),
  prestamo: renderStub('Préstamo'),
  reportes: renderReportes,
  empleado: renderStub('Empleado'),
  clientes: renderClientes,
  proveedores: renderProveedores,
  vincular: renderStub('Vincular Web'),
  promocion: renderStub('Promoción'),
  ticket: renderTicket,
  config: renderConfig,
};

const list = document.getElementById('list');
const chipsBar = document.getElementById('chipsBar');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const searchWrap = document.getElementById('searchWrap');

document.getElementById('menu').addEventListener('click', (e)=>{
  const a = e.target.closest('a[data-route]'); if(!a) return;
  const r = a.getAttribute('data-route');
  navigate(r);
  drawer.classList.remove('open'); btnMenu.setAttribute('aria-expanded','false');
});

function navigate(route){
  (routes[route]||renderStub(route))();
  history.replaceState({}, '', '#'+route);
}
window.addEventListener('load', ()=>{
  const route = location.hash.replace('#','') || 'inventario';
  navigate(route);
});

// --- Componentes comunes ---
function stockClass(item){
  if(item.stock <= 0) return 'bad';
  if(item.stock <= item.min) return 'low';
  return 'ok';
}

function clearUI(){
  list.innerHTML = '';
  chipsBar.innerHTML = '';
  searchWrap.style.display = 'none';
}

function chip(label, onClick){
  const b = document.createElement('button'); b.className='chip'; b.textContent = label; b.addEventListener('click', onClick); return b;
}

function inputRow(id,labelTxt,value=''){
  return `<div class="form-col"><label for="${id}">${labelTxt}</label><input id="${id}" value="${value||''}"></div>`;
}

// --- Inventario ---
function renderInventario(){
  clearUI();
  titleEl.textContent = 'Productos';
  subtitleEl.textContent = 'Productos Activos';
  searchWrap.style.display = 'flex';
  const search = document.getElementById('search');
  const chipMin = chip('Cantidad mínima', ()=>{ chipMin.classList.toggle('active'); draw(); });
  const chipMerma = chip('Merma', ()=> openMermaModal());
  chipsBar.append(chip('QR (sim)', ()=>{ const code = prompt('Escanea/Escribe código'); if(code){ search.value = code; draw(); } }), chipMerma, chipMin);

  function openMermaModal(){
    const dlg = document.getElementById('modal'); const body = document.getElementById('modalBody'); const title = document.getElementById('modalTitle');
    title.textContent='Merma de inventario';
    body.innerHTML = inputRow('m_code','Clave / Código') + inputRow('m_qty','Cantidad','1') + inputRow('m_reason','Motivo','Caducidad');
    dlg.showModal();
    document.getElementById('btnOk').onclick = ()=>{
      const code = document.getElementById('m_code').value.trim();
      const qty = parseFloat(document.getElementById('m_qty').value||'0');
      const item = state.products.find(p=>String(p.id)===code);
      if(item && qty>0){ item.stock = Number((item.stock - qty).toFixed(2)); saveState(); draw(); }
      dlg.close();
    };
  }

  function draw(){
    list.innerHTML='';
    const q = (search.value||'').toLowerCase();
    state.products.filter(p=>{
      const matches = !q || p.name.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q);
      const onlyMin = chipsBar.querySelector('.chip.active')?.textContent==='Cantidad mínima';
      return matches && (!onlyMin || p.stock <= p.min);
    }).forEach(p=>{
      const card = document.createElement('article'); card.className='card';
      card.innerHTML = `
        <div class="thumb">${p.name[0]}</div>
        <div class="meta">
          <div class="name">${p.name} <span style="font-size:12px;font-weight:400;color:#555">${p.unit}</span></div>
          <div class="sku">${p.id} <span class="stock ${stockClass(p)}">#${p.stock.toFixed(2)}</span></div>
        </div>
        <div class="price">$${p.price.toFixed(2)}</div>`;
      list.appendChild(card);
    });
  }
  document.getElementById('search').oninput = draw;
  draw();
}

// --- Ventas ---
function renderVentas(){
  clearUI();
  titleEl.textContent = 'Ventas';
  subtitleEl.textContent = 'Carrito demo (decrementa stock)';
  searchWrap.style.display='flex';
  const cart = [];
  chipsBar.append(chip('Vaciar carrito', ()=>{ cart.length=0; draw(); }), chip('Cobrar', ()=> checkout()));
  const search = document.getElementById('search');

  function addToCart(p){ cart.push({id:p.id, price:p.price}); draw(); }
  function checkout(){
    if(!cart.length) return alert('Carrito vacío');
    cart.forEach(it=>{
      const prod = state.products.find(p=>p.id===it.id);
      if(prod){ prod.stock = Number((prod.stock - 1).toFixed(2)); }
    });
    state.sales.push({ id:'S'+Date.now(), date:new Date().toISOString(), items:[...cart] });
    saveState(); cart.length=0; draw();
    alert('Venta registrada ✔');
  }

  function draw(){
    list.innerHTML='';
    const q = (search.value||'').toLowerCase();
    state.products.filter(p=> !q || p.name.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q)).forEach(p=>{
      const card = document.createElement('article'); card.className='card';
      const disabled = p.stock<=0;
      card.innerHTML = `
        <div class="thumb">${p.name[0]}</div>
        <div class="meta">
          <div class="name">${p.name} <span style="font-size:12px;font-weight:400;color:#555">${p.unit}</span></div>
          <div class="sku">${p.id} <span class="stock ${stockClass(p)}">#${p.stock.toFixed(2)}</span></div>
        </div>
        <div class="price">$${p.price.toFixed(2)}</div>
        <button class="icon-btn" ${disabled?'disabled':''} style="margin-left:.5rem" title="Agregar">＋</button>`;
      card.querySelector('button').onclick = ()=> addToCart(p);
      list.appendChild(card);
    });
  }
  search.oninput = draw; draw();
}

// --- Compras ---
function renderCompras(){
  clearUI();
  titleEl.textContent='Compras';
  subtitleEl.textContent='Suma al stock (compra directa)';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row">
      ${inputRow('c_code','Clave / Código')}
      ${inputRow('c_qty','Piezas','1')}
    </div>
    <div class="form-row">
      ${inputRow('c_cost','Costo por pieza','0')}
      ${inputRow('c_provider','Proveedor','PROV01')}
    </div>
    <div class="form-row">
      ${inputRow('c_date','Fecha', new Date().toISOString().slice(0,10))}
      ${inputRow('c_note','Notas','')}
    </div>
    <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem">
      <button id="btnAdd" class="primary">Agregar compra</button>
    </div>`;
  list.appendChild(form);
  document.getElementById('btnAdd').onclick = ()=>{
    const code = document.getElementById('c_code').value.trim();
    const qty = parseFloat(document.getElementById('c_qty').value||'0');
    const cost = parseFloat(document.getElementById('c_cost').value||'0');
    const provider = document.getElementById('c_provider').value;
    const prod = state.products.find(p=>String(p.id)===code);
    if(!prod) return alert('Producto no encontrado');
    prod.stock = Number((prod.stock + qty).toFixed(2));
    state.purchases.push({code, qty, cost, provider, date:new Date().toISOString()});
    saveState(); alert('Compra registrada ✔');
  };
}

// --- Ingresos / Gastos (registro simple) ---
function renderIngresos(){
  clearUI();
  titleEl.textContent='Ingresos & Gastos';
  subtitleEl.textContent='Registro básico';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row">
      ${inputRow('ig_type','Tipo (ingreso/gasto)','ingreso')}
      ${inputRow('ig_amount','Monto','0')}
    </div>
    ${inputRow('ig_desc','Descripción','')}
    ${inputRow('ig_date','Fecha', new Date().toISOString().slice(0,10))}
    <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem">
      <button class="primary" id="btnIG">Guardar</button>
    </div>`;
  list.appendChild(form);
  document.getElementById('btnIG').onclick = ()=> alert('(Demo) Guardado ✔');
}

// --- Clientes / Proveedores (listas demo) ---
function renderClientes(){
  clearUI(); titleEl.textContent='Clientes'; subtitleEl.textContent='Lista demo';
  state.clients.forEach(c=>{
    const card = document.createElement('article'); card.className='card';
    card.innerHTML = `<div class="thumb">C</div><div class="meta"><div class="name">${c.name}</div><div class="sku">${c.id}</div></div>`;
    list.appendChild(card);
  });
}
function renderProveedores(){
  clearUI(); titleEl.textContent='Proveedores'; subtitleEl.textContent='Lista demo';
  state.providers.forEach(p=>{
    const card = document.createElement('article'); card.className='card';
    card.innerHTML = `<div class="thumb">P</div><div class="meta"><div class="name">${p.name}</div><div class="sku">${p.id}</div></div>`;
    list.appendChild(card);
  });
}

// --- Reportes (CSV) ---
function renderReportes(){
  clearUI(); titleEl.textContent='Reportes'; subtitleEl.textContent='Exportar CSV (inventario/ventas)';
  const btnInv = document.createElement('button'); btnInv.className='primary'; btnInv.textContent='Exportar Inventario CSV';
  const btnVen = document.createElement('button'); btnVen.className='primary'; btnVen.style.marginLeft='.5rem'; btnVen.textContent='Exportar Ventas CSV';
  list.append(btnInv, btnVen);

  btnInv.onclick = ()=> downloadCSV('inventario.csv', [['id','name','unit','price','stock','min'], ...state.products.map(p=>[p.id,p.name,p.unit,p.price,p.stock,p.min])]);
  btnVen.onclick = ()=> downloadCSV('ventas.csv', [['id','date','items','total'], ...state.sales.map(s=>[s.id,s.date, s.items.length, s.items.reduce((a,b)=>a+b.price,0)])]);
}

function downloadCSV(filename, rows){
  const csv = rows.map(r=> r.map(v=> typeof v==='string' && v.includes(',') ? `"${v.replaceAll('"','""')}"` : v).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

// --- Ticket ---
function renderTicket(){
  clearUI(); titleEl.textContent='Recibo / Ticket'; subtitleEl.textContent='Configuración básica';
  const cfg = state.config.ticket || {};
  const form = document.createElement('div');
  form.innerHTML = `${inputRow('t_business','Nombre del negocio', state.config.business)}
  ${inputRow('t_footer','Pie de página', cfg.footer || '')}
  <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem"><button id="btnSaveT" class="primary">Guardar</button></div>`;
  list.appendChild(form);
  document.getElementById('btnSaveT').onclick = ()=>{ state.config.business = document.getElementById('t_business').value; state.config.ticket = {footer: document.getElementById('t_footer').value}; saveState(); alert('Guardado ✔'); };
}

// --- Configuración ---
function renderConfig(){
  clearUI(); titleEl.textContent='Configuración'; subtitleEl.textContent='Roles/tema (demo)';
  list.innerHTML = '<p>Demo de configuración. Próximamente: roles por turno, tema de colores, carpeta de datos.</p>';
}

// --- Stubs ---
function renderStub(name){ return function(){ clearUI(); titleEl.textContent=name; subtitleEl.textContent='Próximamente'; list.innerHTML='<p>Módulo en preparación.</p>'; } }
