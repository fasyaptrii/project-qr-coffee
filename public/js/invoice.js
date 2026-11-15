(async()=>{
  $('#pr').addEventListener('click',()=>print());
  try{const o=await api('/api/invoice/'+encodeURIComponent(new URLSearchParams(location.search).get('code')||''));
    $('#box').innerHTML=`<img src="/img/logo.svg" alt="" width="44" height="44" style="display:block;margin:0 auto .6rem"><h2 style="text-align:center">Fajar Timur Coffee</h2><p class="muted">Invoice ${esc(o.code)} · Meja ${o.table_number}<br>${fdt(o.paid_at)}<br>Pelanggan: ${esc(o.customer_name)}</p>
    <table>${o.items.map(i=>`<tr><td>${i.qty}× ${esc(i.name)}</td><td class="r">${rp(i.price*i.qty)}</td></tr>`).join('')}
    <tr><th>Total</th><th class="r">${rp(o.total)}</th></tr></table>
    <p>Pembayaran: ${PM[o.payment_method]}${o.payment_ref?' (ref. '+esc(o.payment_ref)+')':''} — <b>LUNAS</b></p><p class="muted">Terima kasih sudah berkunjung.</p>`}
  catch(e){$('#box').innerHTML=`<div class="err">${esc(e.message)}</div>`}
})();
