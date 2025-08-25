
const drawer = document.getElementById('drawer');
const btnMenu = document.getElementById('btnMenu');
const backdrop = document.getElementById('backdrop');
btnMenu.addEventListener('click', ()=>{
  const isOpen = drawer.classList.toggle('open');
  btnMenu.setAttribute('aria-expanded', String(isOpen));
});
backdrop.addEventListener('click', ()=>{
  drawer.classList.remove('open');
  btnMenu.setAttribute('aria-expanded','false');
});
window.addEventListener('keydown', (e)=>{
  if(e.key==='Escape') { drawer.classList.remove('open'); btnMenu.setAttribute('aria-expanded','false'); }
});
const DATA = [
  { id:'007', name:'BARRA MUCLE SANDWICH', unit:'PIEZA', price:35.00, stock:2,  min:5 },
  { id:'758104001972', name:'BONAFONT 2LT', unit:'PIEZA', price:20.00, stock:14, min:5 },
  { id:'001', name:'BONAFONT 1LT', unit:'PIEZA', price:14.00, stock:23, min:5 },
  { id:'BONA600', name:'BONAFONT 600ML', unit:'PIEZA', price:10.00, stock:0,  min:5 },
  { id:'758104000159', name:'BONAFONT 1.5L', unit:'PIEZA', price:16.00, stock:26, min:5 },
  { id:'BOOST', name:'BOOST', unit:'PIEZA', price:28.00, stock:-1, min:5 },
];
const list = document.getElementById('list');
function stockClass(item){
  if(item.stock <= 0) return 'bad';
  if(item.stock <= item.min) return 'low';
  return 'ok';
}
function render(){
  list.innerHTML = '';
  DATA.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb">${p.name[0]}</div>
      <div class="meta">
        <div class="name">${p.name} <span style="font-size:12px;font-weight:400;color:#555">${p.unit}</span></div>
        <div class="sku">${p.id} <span class="stock ${stockClass(p)}">#${p.stock.toFixed(2)}</span></div>
      </div>
      <div class="price">$${p.price.toFixed(2)}</div>
    `;
    list.appendChild(card);
  });
}
render();
