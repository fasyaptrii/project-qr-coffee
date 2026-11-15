const ICONS={qr:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',orders:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>',menu:'<path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',table:'<path d="M3 9h18M5 9v10M19 9v10M7 5h10l2 4H5z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.500 2.700-6 6-6s6 2.500 6 6M16 5a3.500 3.500 0 0 1 0 7M18 14c2 .8 3 2.800 3 6"/>',chart:'<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const ICON=n=>`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fdt=s=>s?new Date(s.replace(' ','T')+'Z').toLocaleString('id-ID',{timeZone:'Asia/Jayapura',dateStyle:'medium',timeStyle:'short'})+' WIT':'-';
const ST={menunggu:'Menunggu',diterima:'Diterima',diproses:'Diproses',selesai:'Selesai',dibatalkan:'Dibatalkan'};
const PM={qris:'QRIS',debit:'Kartu Debit',tunai:'Tunai'},PMI={qris:ICON('qr'),debit:ICON('card'),tunai:ICON('cash')};
const KNOWN='espresso americano cafe-latte cappuccino kopi-susu-gula-aren caramel-macchiato mocha chocolate matcha-latte red-velvet-latte thai-tea nasi-goreng-spesial nasi-ayam-teriyaki mie-goreng-seafood chicken-katsu-rice kentang-goreng pisang-goreng-keju chicken-wings-5-pcs dimsum-ayam-4-pcs roti-bakar-coklat-keju'.split(' ');
const imgFor=n=>{const s=String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return`/img/menu/${KNOWN.includes(s)?s:'_umum'}.svg`};
async function api(p,o={}){
  const r=await fetch(p,{method:o.method||'GET',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:o.body?JSON.stringify(o.body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){if(r.status===401&&/^\/api\/(staff|admin|owner|me)/.test(p))location.replace('/login.html?expired=1');throw Object.assign(new Error(j.error||'Terjadi kesalahan. Coba lagi.'),{status:r.status})}
  return j;
}
function toast(m){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)}
