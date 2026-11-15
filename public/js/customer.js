(async()=>{
const qs=new URLSearchParams(location.search);let tb=null,M=qs.get('meja')||sessionStorage.getItem('ft_m'),K=qs.get('k')||sessionStorage.getItem('ft_k');
try{tb=await api(`/api/table?meja=${encodeURIComponent(M)}&k=${encodeURIComponent(K)}`);sessionStorage.setItem('ft_m',M);sessionStorage.setItem('ft_k',K)}catch{}
$('#tbl').textContent=tb?'Meja '+tb.number:'Meja belum terbaca — scan ulang QR di meja Anda';
const sk=io(),cart=new Map();let data={categories:[]},cat=0,nm='',pm='qris',cur=localStorage.getItem('ft_order'),qr=null;
const all=()=>data.categories.flatMap(c=>c.items),sum=()=>[...cart.values()].reduce((a,l)=>a+l.price*l.qty,0),cnt=()=>[...cart.values()].reduce((a,l)=>a+l.qty,0);
const stepper=i=>`<span class="step"><button data-sub="${i.id}" aria-label="Kurangi ${esc(i.name)}">−</button><b>${cart.get(i.id)?.qty||0}</b><button data-add="${i.id}" aria-label="Tambah ${esc(i.name)}">+</button></span>`;
function drawMenu(){
  $('#cats').innerHTML=[['Semua',0],...data.categories.map(c=>[c.name,c.id])].map(([n,id])=>`<button data-cat="${id}" class="${cat===id?'on':''}">${esc(n)}</button>`).join('');
  $('#menu').innerHTML=data.categories.filter(c=>!cat||c.id===cat).map(c=>`<h2 class="cat">${esc(c.name)}</h2>`+c.items.map(i=>`<div class="item"><img src="${imgFor(i.name)}" alt="" width="72" height="72" loading="lazy"><div><div class="line"><b>${esc(i.name)}</b><span class="p">${rp(i.price)}</span></div>${i.description?`<small>${esc(i.description)}</small>`:''}<div class="ctl">${stepper(i)}</div></div></div>`).join('')).join('')||'<div class="empty"><p>Menu belum tersedia.</p></div>';
  $('#cartbar').classList.toggle('hidden',!cnt());$('#openCart').textContent=`Lihat pesanan · ${cnt()} item · ${rp(sum())}`;
}
function change(id,d){const i=all().find(x=>x.id===id);if(!i)return;const l=cart.get(id)||{...i,qty:0,note:''};l.qty+=d;l.qty<=0?cart.delete(id):cart.set(id,l);drawMenu();if(!$('#sheet').classList.contains('hidden'))drawSheet()}
const PMS=[['qris',ICON('qr'),'QRIS','Scan & bayar dari dompet digital / m-banking'],['debit',ICON('card'),'Kartu Debit','Gesek/tap kartu di kasir (mesin EDC)'],['tunai',ICON('cash'),'Tunai','Bayar uang tunai di kasir']];
async function drawSheet(msg=''){
  if(!cnt()){$('#sheet').classList.add('hidden');return}
  $('#sheetBody').innerHTML=`<h2>Pesanan Anda</h2><p class="muted">${tb?'Meja '+tb.number:'Meja belum terbaca'}</p>${msg?`<div class="err" role="alert">${esc(msg)}</div>`:''}
  ${[...cart.values()].map(l=>`<div class="cl"><img src="${imgFor(l.name)}" alt=""><div><div class="line"><b>${esc(l.name)}</b><span class="p">${rp(l.price*l.qty)}</span></div><div style="display:flex;gap:.5rem;align-items:center"><input data-note="${l.id}" placeholder="Catatan (mis. less sugar)" maxlength="120" value="${esc(l.note)}">${stepper(l)}</div></div></div>`).join('')}
  <div id="recs"></div><label for="nm">Nama (opsional)</label><input id="nm" maxlength="40" value="${esc(nm)}" placeholder="Biar kami mudah memanggil Anda">
  <label>Pilih pembayaran</label><div class="pms">${PMS.map(([v,ic,t,d])=>`<label class="pm"><input type="radio" name="pm" value="${v}" ${pm===v?'checked':''}><span class="ic">${ic}</span><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>
  <p class="line" style="margin-top:1rem"><b>Total</b><span class="p">${rp(sum())}</span></p><button id="send" class="btn coral" style="width:100%">Kirim pesanan</button> <button id="closeSheet" class="btn ghost" style="width:100%;margin-top:.6rem">Kembali ke menu</button>`;
  $('#sheet').classList.remove('hidden');
  try{const r=await api('/api/recommend',{method:'POST',body:{ids:[...cart.keys()]}});if(r.length&&$('#recs'))$('#recs').innerHTML=`<h3 style="margin-top:1rem">${r[0].reason==='bersama'?'Sering dipesan bersamaan':'Menu terlaris'}</h3><div class="rec">${r.map(x=>`<div class="card"><img src="${imgFor(x.name)}" alt=""><br><b>${esc(x.name)}</b><br><span class="muted">${rp(x.price)}</span><br><button class="btn sm pale" data-add="${x.id}" style="margin-top:.4rem">+ Tambah</button></div>`).join('')}</div>`}catch{}
}
const STEPS=['menunggu','diterima','diproses','selesai'],SI={menunggu:'1',diterima:'2',diproses:'3',selesai:'4'};
function drawTrack(o){
  const ix=STEPS.indexOf(o.status),paid=o.payment_status==='lunas',done=o.status==='selesai';
  $('#trackBody').innerHTML=`<div class="hello"><div><h2 style="margin:0">${done?'Pesanan selesai':'Pesanan '+esc(o.code)}</h2><p class="muted" style="margin:0">${done?'Pesanan '+esc(o.code)+' · ':''}Meja ${o.table_number} · ${esc(o.customer_name)}</p></div></div>
  ${o.status==='dibatalkan'?'<div class="err">Pesanan dibatalkan.</div>':`<div class="tl" aria-label="Status pesanan">${STEPS.map((s,i)=>`<div class="${i<=ix?'on':''}">${SI[s]}<br>${ST[s]}</div>`).join('')}</div>`}
  <p>Pembayaran: <span class="badge ${paid?'ok':'warn'}">${paid?'Lunas':'Belum dibayar'}</span> ${PMI[o.payment_method]} ${PM[o.payment_method]}${o.payment_ref?` <span class="muted">(ref. ${esc(o.payment_ref)})</span>`:''}</p>
  ${!paid&&o.payment_method==='tunai'&&o.status!=='dibatalkan'?'<div class="card">Silakan bayar tunai ke kasir. Status berubah otomatis setelah dikonfirmasi.</div>':''}
  ${!paid&&o.payment_method==='debit'&&o.status!=='dibatalkan'?'<div class="card">Silakan bayar dengan kartu debit di kasir (mesin EDC). Kasir akan mengonfirmasi, lalu status berubah otomatis.</div>':''}
  ${!paid&&o.payment_method==='qris'&&o.status!=='dibatalkan'?(qr?`<div class="card qrbox"><img src="${qr.image}" alt="Kode QRIS pembayaran"><p><b>${rp(qr.total)}</b><br><span class="muted">Scan dengan aplikasi pembayaran Anda. Status berubah otomatis.</span></p>${qr.simulation?'<button id="sim" class="btn ghost sm">Simulasikan pembayaran (mode uji)</button>':''}</div>`:'<button id="qris" class="btn coral" style="width:100%">Tampilkan QRIS</button>'):''}
  <table style="margin:.8rem 0">${o.items.map(i=>`<tr><td style="width:46px"><img src="${imgFor(i.name)}" alt="" width="40" height="40"></td><td>${i.qty}× ${esc(i.name)}${i.note?`<br><span class="muted">${esc(i.note)}</span>`:''}</td><td style="text-align:right;white-space:nowrap">${rp(i.price*i.qty)}</td></tr>`).join('')}<tr><th colspan="2">Total</th><th style="text-align:right">${rp(o.total)}</th></tr></table>
  ${paid?`<a class="btn" href="/invoice.html?code=${esc(o.code)}" target="_blank" rel="noopener">Lihat invoice</a> `:''}<button id="again" class="btn ghost">${done||o.status==='dibatalkan'?'Pesan lagi':'Tambah pesanan baru'}</button>`;
  $('#track').classList.remove('hidden');
}
async function load(code){try{const o=await api('/api/orders/'+code);drawTrack(o)}catch{localStorage.removeItem('ft_order');cur=null}}
document.addEventListener('click',async e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.cat!==undefined){cat=+t.dataset.cat;drawMenu()}
  else if(t.dataset.add)change(+t.dataset.add,1);else if(t.dataset.sub)change(+t.dataset.sub,-1);
  else if(t.id==='openCart')drawSheet();else if(t.id==='closeSheet')$('#sheet').classList.add('hidden');
  else if(t.id==='send'){
    t.disabled=true;
    try{const r=await api('/api/orders',{method:'POST',body:{meja:M,k:K,customer_name:nm,payment_method:pm,items:[...cart.values()].map(l=>({id:l.id,qty:l.qty,note:l.note}))}});
      cart.clear();qr=null;cur=r.code;localStorage.setItem('ft_order',cur);sk.emit('track',cur);$('#sheet').classList.add('hidden');drawMenu();await load(cur)}
    catch(x){drawSheet(x.message)}}
  else if(t.id==='qris'){t.disabled=true;try{qr=await api(`/api/orders/${cur}/qris`,{method:'POST'});load(cur)}catch(x){toast(x.message);t.disabled=false}}
  else if(t.id==='sim'){await api(`/api/orders/${cur}/simulate-pay`,{method:'POST'})}
  else if(t.id==='again'){$('#track').classList.add('hidden')}
});
document.addEventListener('input',e=>{if(e.target.id==='nm')nm=e.target.value;if(e.target.dataset.note){const l=cart.get(+e.target.dataset.note);if(l)l.note=e.target.value}});
document.addEventListener('change',e=>{if(e.target.name==='pm')pm=e.target.value});
sk.on('order:update',o=>{if(o.code===cur){if(o.payment_status==='lunas')qr=null;drawTrack(o)}});
sk.on('connect',()=>{if(cur){sk.emit('track',cur);load(cur)}});
try{data=await api('/api/menu')}catch(e){$('#menu').innerHTML=`<div class="err">${esc(e.message)}</div>`}
drawMenu();if(cur){sk.emit('track',cur);load(cur)}
})();
