(async()=>{
const role=location.pathname.slice(1);let me,sk,charts={},orders=[];
try{me=await api('/api/me')}catch{return}
if(me.role!==role)return location.replace('/'+me.role);
$('#who').textContent=`${me.name} (${me.role})`;
$('#logout').addEventListener('click',async()=>{await api('/api/logout',{method:'POST'});location.replace('/login.html')});
const TABS={kasir:[['orders',ICON('orders'),'Pesanan Masuk']],admin:[['menu',ICON('menu'),'Menu & Kategori'],['tables',ICON('table'),'Meja & QR Code'],['users',ICON('users'),'Pengguna']],owner:[['report',ICON('chart'),'Laporan Penjualan'],['forecast',ICON('trend'),'Prediksi Penjualan'],['history',ICON('clock'),'Riwayat Transaksi']]}[role];
const HERO={kasir:'Pesanan masuk ditampilkan secara real-time.',admin:'Kelola menu, meja, QR Code, dan akun pengguna.',owner:'Pantau penjualan dan rencanakan persediaan.'};
const V=$('#view'),dd=n=>new Date(Date.now()+9*36e5+n*864e5).toISOString().slice(0,10);
const fail=e=>toast(e.message),go=async(p,m,b)=>{try{await api(p,{method:m,body:b});return true}catch(e){fail(e);return false}};
const empty=t=>`<div class="empty"><p>${t}</p></div>`;
const setHero=(t,x='')=>$('#hero').innerHTML=`<div class="hero"><div><h2>Selamat datang, ${esc(me.name)}</h2><p>${esc(HERO[role])}</p>${x}</div></div>`;
function chart(id,cfg){charts[id]?.destroy();charts[id]=new Chart($('#'+id),{...cfg,options:{responsive:true,maintainAspectRatio:false,...cfg.options}})}
const C={teal:'#2A8C8C',coral:'#F2705A',ink:'#14394F',pale:'#F6DFA4'};
function show(n){$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===n));Object.values(charts).forEach(c=>c.destroy());charts={};setHero();V.innerHTML='<p class="muted">Memuat…</p>';VIEW[n]().catch(e=>V.innerHTML=`<div class="err">${esc(e.message)}</div>`)}
$('#nav').innerHTML=TABS.map(([k,i,l])=>`<button data-t="${k}"><span class="ic">${i}</span>${l}</button>`).join('');
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(b.dataset.t)});
const beep=()=>{try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.18)}catch{}};
const VIEW={
async orders(){orders=await api('/api/staff/orders');drawOrders();
  if(!sk){sk=io();sk.on('order:new',()=>{beep();toast('Pesanan baru masuk!');VIEW.orders()});sk.on('order:update',()=>VIEW.orders())}},
async menu(){
  const [cs,ms]=await Promise.all([api('/api/admin/categories'),api('/api/admin/menu')]);
  V.innerHTML=`<h2>Kategori</h2><div class="row"><div><label for="cn">Kategori baru</label><input id="cn" maxlength="40"></div><button class="btn" id="addc">Tambah</button></div>
  <p>${cs.map(c=>`<span class="chip" style="margin:0 .4rem .4rem 0">${esc(c.name)} (${c.n}) <button class="btn sm ghost" data-rc="${c.id}" data-n="${esc(c.name)}">Ubah</button> <button class="btn sm ghost" data-dc="${c.id}">Hapus</button></span>`).join('')}</p>
  <h2 style="margin-top:1.4rem">Menu</h2><form id="mf" class="card"><input type="hidden" id="mid"><div class="row"><div><label for="mn">Nama menu</label><input id="mn" required maxlength="80"></div><div><label for="mc">Kategori</label><select id="mc">${cs.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div><label for="mp">Harga (Rp)</label><input id="mp" type="number" min="0" step="500" required></div></div>
  <label for="md">Deskripsi (opsional)</label><input id="md" maxlength="200"><label style="display:flex;gap:.5rem;align-items:center"><input id="ma" type="checkbox" checked style="width:auto"> Tersedia untuk dipesan</label><p><button class="btn">Simpan menu</button> <button type="button" class="btn ghost" id="mr">Batal ubah</button></p></form>
  <div class="scroll" style="margin-top:1rem"><table><tr><th>Menu</th><th>Kategori</th><th>Harga</th><th>Status</th><th></th></tr>${ms.map(m=>`<tr><td><img class="tm" src="${imgFor(m.name)}" alt="">${esc(m.name)}</td><td>${esc(m.category)}</td><td style="white-space:nowrap">${rp(m.price)}</td><td>${m.available?'<span class="badge ok">Tersedia</span>':'<span class="badge warn">Habis</span>'}</td><td style="white-space:nowrap"><button class="btn sm ghost" data-em='${esc(JSON.stringify(m))}'>Ubah</button> <button class="btn sm ghost" data-dm="${m.id}">Hapus</button></td></tr>`).join('')}</table></div>`;
  V.onclick=async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.id==='addc'){if(await go('/api/admin/categories','POST',{name:$('#cn').value}))VIEW.menu()}
    else if(t.dataset.rc){const n=prompt('Nama kategori baru:',t.dataset.n);if(n&&await go('/api/admin/categories/'+t.dataset.rc,'PUT',{name:n}))VIEW.menu()}
    else if(t.dataset.dc){if(confirm('Hapus kategori ini?')&&await go('/api/admin/categories/'+t.dataset.dc,'DELETE'))VIEW.menu()}
    else if(t.dataset.dm){if(confirm('Hapus menu ini?')&&await go('/api/admin/menu/'+t.dataset.dm,'DELETE'))VIEW.menu()}
    else if(t.dataset.em){const m=JSON.parse(t.dataset.em);$('#mid').value=m.id;$('#mn').value=m.name;$('#mc').value=m.category_id;$('#mp').value=m.price;$('#md').value=m.description||'';$('#ma').checked=!!m.available;$('#mn').focus()}
    else if(t.id==='mr'){$('#mf').reset();$('#mid').value=''}};
  $('#mf').addEventListener('submit',async e=>{e.preventDefault();const id=$('#mid').value,b={name:$('#mn').value,category_id:+$('#mc').value,price:+$('#mp').value,description:$('#md').value,available:$('#ma').checked};
    if(await go(id?'/api/admin/menu/'+id:'/api/admin/menu',id?'PUT':'POST',b)){toast('Menu disimpan');VIEW.menu()}});
},
async tables(){
  const ts=await api('/api/admin/tables');
  V.innerHTML=`<h2>Meja & QR Code</h2><div class="row noprint"><div><label for="tn">Tambah nomor meja</label><input id="tn" type="number" min="1" max="999"></div><button class="btn" id="addt">Tambah meja</button><button class="btn ghost" id="pall">Cetak semua QR</button><button class="btn ghost" id="dall">Unduh semua (PNG)</button></div>
  <p class="muted noprint">Setiap QR berisi tautan menu beserta nomor meja. Cetak dan tempel di meja.</p>
  <div class="tgrid" id="tg">${ts.map(t=>`<div class="card tcard" data-id="${t.id}"><h3>Meja ${t.number}</h3><img src="/api/admin/tables/${t.id}/qr.png" alt="QR Code Meja ${t.number}" loading="lazy"><p class="muted">Scan untuk memesan</p><p class="noprint"><a class="btn sm" download href="/api/admin/tables/${t.id}/qr.png?dl=1">Unduh PNG</a> <button class="btn sm ghost" data-pr="${t.id}">Cetak</button> <button class="btn sm ghost" data-et="${t.id}" data-n="${t.number}">Ubah</button> <button class="btn sm ghost" data-dt="${t.id}">Hapus</button></p></div>`).join('')}</div>`;
  V.onclick=async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.id==='addt'){if(await go('/api/admin/tables','POST',{number:$('#tn').value}))VIEW.tables()}
    else if(t.dataset.et){const n=prompt('Nomor meja baru:',t.dataset.n);if(n&&await go('/api/admin/tables/'+t.dataset.et,'PUT',{number:n}))VIEW.tables()}
    else if(t.dataset.dt){if(confirm('Hapus meja ini? QR lama tidak akan berlaku lagi.')&&await go('/api/admin/tables/'+t.dataset.dt,'DELETE'))VIEW.tables()}
    else if(t.id==='pall'){document.body.classList.remove('print-one');print()}
    else if(t.dataset.pr){const c=t.closest('.tcard');c.classList.add('only');document.body.classList.add('print-one');print();c.classList.remove('only');document.body.classList.remove('print-one')}
    else if(t.id==='dall'){for(const x of ts){const a=document.createElement('a');a.href=`/api/admin/tables/${x.id}/qr.png?dl=1`;a.download=`QR-Meja-${x.number}.png`;document.body.append(a);a.click();a.remove();await new Promise(r=>setTimeout(r,500))}}};
},
async users(){
  const us=await api('/api/admin/users');
  V.innerHTML=`<h2>Pengguna</h2><form id="uf" class="card"><div class="row"><div><label for="un">Username</label><input id="un" required maxlength="30"></div><div><label for="nn">Nama</label><input id="nn" required maxlength="60"></div><div><label for="up">Password (min. 8)</label><input id="up" type="password" required minlength="8" autocomplete="new-password"></div><div><label for="ur">Peran</label><select id="ur"><option value="kasir">Kasir</option><option value="admin">Admin</option></select></div><button class="btn">Tambah</button></div></form>
  <div class="scroll"><table style="margin-top:1rem"><tr><th>Username</th><th>Nama</th><th>Peran</th><th>Status</th><th></th></tr>${us.map(u=>`<tr><td>${esc(u.username)}</td><td>${esc(u.name)}</td><td>${u.role}</td><td>${u.active?'<span class="badge ok">Aktif</span>':'<span class="badge warn">Nonaktif</span>'}</td><td>${u.role==='owner'?'<span class="muted">—</span>':`<button class="btn sm ghost" data-pw="${u.id}">Reset password</button> <button class="btn sm ghost" data-ac="${u.id}" data-a="${u.active}">${u.active?'Nonaktifkan':'Aktifkan'}</button> ${u.id===me.id?'':`<button class="btn sm ghost" data-du="${u.id}">Hapus</button>`}`}</td></tr>`).join('')}</table></div>`;
  $('#uf').addEventListener('submit',async e=>{e.preventDefault();if(await go('/api/admin/users','POST',{username:$('#un').value,name:$('#nn').value,password:$('#up').value,role:$('#ur').value})){toast('Pengguna ditambahkan');VIEW.users()}});
  V.onclick=async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.dataset.pw){const p=prompt('Password baru (min. 8 karakter):');if(p&&await go('/api/admin/users/'+t.dataset.pw,'PUT',{password:p}))toast('Password diganti')}
    else if(t.dataset.ac){if(await go('/api/admin/users/'+t.dataset.ac,'PUT',{active:t.dataset.a!=='1'}))VIEW.users()}
    else if(t.dataset.du){if(confirm('Hapus pengguna ini?')&&await go('/api/admin/users/'+t.dataset.du,'DELETE'))VIEW.users()}};
},
async report(){
  V.innerHTML=`<h2>Laporan Penjualan</h2><div class="row"><div><label for="f">Dari</label><input id="f" type="date" value="${dd(-29)}"></div><div><label for="t">Sampai</label><input id="t" type="date" value="${dd(0)}"></div><button class="btn" id="go">Tampilkan</button></div><div id="out"></div>`;
  const run=async()=>{const r=await api(`/api/owner/report?from=${$('#f').value}&to=${$('#t').value}`),avg=r.summary.orders?Math.round(r.summary.revenue/r.summary.orders):0;
    if(!r.summary.orders){$('#out').innerHTML=empty('Belum ada transaksi pada periode ini.');return}
    $('#out').innerHTML=`<div class="grid"><div class="card stat"><span class="ic">${ICON('cash')}</span><div>Pendapatan<b>${rp(r.summary.revenue)}</b></div></div><div class="card stat"><span class="ic">${ICON('orders')}</span><div>Transaksi lunas<b>${r.summary.orders}</b></div></div><div class="card stat"><span class="ic">${ICON('menu')}</span><div>Rata-rata/transaksi<b>${rp(avg)}</b></div></div></div>
    <p>${r.method.map(m=>`<span class="chip" style="margin-right:.4rem">${PMI[m.m]} ${PM[m.m]}: ${m.orders} (${rp(m.revenue)})</span>`).join('')}</p>
    <h3>Menu terlaris</h3><div class="pod">${r.top.slice(0,3).map((d,i)=>`<div class="card"><span class="rk">${i+1}</span><img src="${imgFor(d.name)}" alt=""><br><b>${esc(d.name)}</b><br><span class="muted">${d.qty} porsi · ${rp(d.revenue)}</span></div>`).join('')}</div>
    <h3>Pendapatan per hari</h3><div class="chartbox"><canvas id="c1"></canvas></div><h3>10 menu terlaris</h3><div class="chartbox"><canvas id="c2"></canvas></div><h3>⏰ Jam ramai (WIT)</h3><div class="chartbox"><canvas id="c3"></canvas></div>`;
    chart('c1',{type:'line',data:{labels:r.daily.map(d=>d.d.slice(5)),datasets:[{label:'Pendapatan (Rp)',data:r.daily.map(d=>+d.revenue),borderColor:C.teal,backgroundColor:'rgba(42,140,140,.15)',fill:true,tension:.3}]}});
    chart('c2',{type:'bar',data:{labels:r.top.map(d=>d.name),datasets:[{label:'Porsi terjual',data:r.top.map(d=>+d.qty),backgroundColor:C.coral,borderRadius:8}]},options:{indexAxis:'y'}});
    chart('c3',{type:'bar',data:{labels:r.peak.map(d=>d.h+':00'),datasets:[{label:'Jumlah pesanan',data:r.peak.map(d=>d.orders),backgroundColor:C.ink,borderRadius:8}]}})};
  $('#go').addEventListener('click',()=>run().catch(fail));run();
},
async forecast(){
  const r=await api('/api/owner/forecast');
  V.innerHTML=`<h2>Prediksi Penjualan 7 Hari</h2><div class="grid"><div class="card stat"><span class="ic">${ICON('trend')}</span><div>Perkiraan 7 hari ke depan<b>${rp(r.total)}</b></div></div><div class="card stat"><span class="ic">${ICON('trend')}</span><div>Tren 2 minggu terakhir<b>${r.trend>0?'+':''}${r.trend}%</b></div></div></div>
  <p class="muted">Metode: rata-rata penjualan per hari dalam seminggu (8 minggu terakhir) disesuaikan dengan tren 14 hari terakhir.</p>
  <div class="chartbox"><canvas id="fc"></canvas></div><h3>Rekomendasi stok 7 hari ke depan</h3><div class="scroll"><table><tr><th>Menu</th><th>Rata-rata/hari</th><th>Perkiraan kebutuhan</th></tr>${r.stock.map(s=>`<tr><td><img class="tm" src="${imgFor(s.name)}" alt="">${esc(s.name)}</td><td>${s.daily}</td><td><b>${s.need}</b> porsi</td></tr>`).join('')}</table></div><p class="muted">Kebutuhan sudah ditambah cadangan 10%. Gunakan sebagai acuan belanja bahan.</p>`;
  const L=[...r.history,...r.forecast].map(x=>x.d.slice(5)),h=r.history.map(x=>x.r);
  chart('fc',{type:'line',data:{labels:L,datasets:[{label:'Aktual',data:[...h,...r.forecast.map(()=>null)],borderColor:C.teal,backgroundColor:C.teal,tension:.25},{label:'Prediksi',data:[...h.map((v,i)=>i===h.length-1?v:null),...r.forecast.map(x=>x.r)],borderColor:C.coral,backgroundColor:C.coral,borderDash:[6,4],tension:.25}]}});
},
async history(){
  V.innerHTML=`<h2>Riwayat Transaksi</h2><div class="row"><div><label for="f">Dari</label><input id="f" type="date" value="${dd(-6)}"></div><div><label for="t">Sampai</label><input id="t" type="date" value="${dd(0)}"></div><button class="btn" id="go">Tampilkan</button></div><div class="scroll" id="out"></div>`;
  const run=async()=>{const h=await api(`/api/owner/history?from=${$('#f').value}&to=${$('#t').value}`);
    $('#out').innerHTML=h.length?`<table><tr><th>Kode</th><th>Waktu</th><th>Meja</th><th>Pelanggan</th><th>Bayar</th><th>Status</th><th>Total</th></tr>${h.map(o=>`<tr><td>${o.payment_status==='lunas'?`<a href="/invoice.html?code=${esc(o.code)}" target="_blank" rel="noopener">${esc(o.code)}</a>`:esc(o.code)}</td><td>${fdt(o.created_at)}</td><td>${o.table_number}</td><td>${esc(o.customer_name)}</td><td>${PMI[o.payment_method]} ${PM[o.payment_method]} ${o.payment_status==='lunas'?'Lunas':'Belum'}</td><td>${ST[o.status]}</td><td style="white-space:nowrap">${rp(o.total)}</td></tr>`).join('')}</table><p class="muted">Menampilkan maksimal 300 transaksi terbaru.</p>`:empty('Tidak ada transaksi pada periode ini.')};
  $('#go').addEventListener('click',()=>run().catch(fail));run();
}};
function drawOrders(){
  const cols=[['menunggu','⏳ Menunggu'],['diterima','Diterima'],['diproses','Diproses'],['selesai','Selesai hari ini']],nx={menunggu:['diterima','Terima'],diterima:['diproses','Proses'],diproses:['selesai','Selesai']};
  const w=orders.filter(o=>o.status==='menunggu').length;setHero('',w?`<span class="chip" style="margin-top:.4rem">${w} pesanan menunggu</span>`:'');
  V.innerHTML=`<div class="board">${cols.map(([k,l])=>{const L=orders.filter(o=>o.status===k);return`<section class="col"><h3>${l} (${L.length})</h3>${L.map(o=>`<div class="card"><b>Meja ${o.table_number}</b> · ${esc(o.customer_name)} <span class="muted">${o.code}</span>
  <div class="thumbs">${o.items.slice(0,6).map(i=>`<img src="${imgFor(i.name)}" alt="" title="${esc(i.name)}">`).join('')}</div>${o.items.map(i=>`${i.qty}× ${esc(i.name)}${i.note?` <i>(${esc(i.note)})</i>`:''}`).join('<br>')}
  <p><b>${rp(o.total)}</b> <span class="badge ${o.payment_status==='lunas'?'ok':'warn'}">${o.payment_status==='lunas'?'Lunas':'Belum bayar'}</span> <span class="badge">${PMI[o.payment_method]} ${PM[o.payment_method]}</span>${o.payment_ref?` <span class="muted">ref. ${esc(o.payment_ref)}</span>`:''}</p>
  <div class="act">${o.payment_status==='belum'&&o.payment_method==='tunai'?`<button class="btn sm coral" data-off="${o.id}" data-m="tunai">Konfirmasi tunai</button>`:''}${o.payment_status==='belum'&&o.payment_method==='debit'?`<button class="btn sm coral" data-off="${o.id}" data-m="debit">Konfirmasi debit</button>`:''}${nx[k]?`<button class="btn sm" data-st="${o.id}" data-to="${nx[k][0]}">${nx[k][1]}</button>`:''}${k==='menunggu'&&o.payment_status==='belum'?`<button class="btn sm ghost" data-st="${o.id}" data-to="dibatalkan">Batalkan</button>`:''}${o.payment_status==='lunas'?`<a class="btn sm ghost" href="/invoice.html?code=${o.code}" target="_blank" rel="noopener">Invoice</a>`:''}</div></div>`).join('')||empty('Kosong')}</section>`}).join('')}</div>`;
  V.onclick=async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.dataset.off){let ref;if(t.dataset.m==='debit'){ref=prompt('Pembayaran debit: masukkan kode approval dari struk mesin EDC (min. 4 karakter):');if(!ref)return}
      if(await go(`/api/staff/orders/${t.dataset.off}/pay-offline`,'POST',{ref}))toast('Pembayaran dikonfirmasi')}
    else if(t.dataset.st)await go(`/api/staff/orders/${t.dataset.st}/status`,'PATCH',{status:t.dataset.to})};
}
show(TABS[0][0]);
})();
