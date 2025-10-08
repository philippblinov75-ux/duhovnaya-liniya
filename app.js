/* SPA Router + State (localStorage) */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const LS_KEY = 'dl_state_v1';
const emptyState = {
  parishes: [],
  parishioners: [], // {id, name, parishId, avatar}
  messages: [],
  donations: [],
  candles: [],
};

let state = loadState();

/* дефолтный силуэт */
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#556" offset="0"/><stop stop-color="#334" offset="1"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="64" cy="48" r="24" fill="#cfd4ff"/>
  <rect x="26" y="78" width="76" height="38" rx="19" fill="#cfd4ff"/>
</svg>`);

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.parishioners)) {
        parsed.parishioners = parsed.parishioners.map(p => ({ avatar: null, ...p }));
      }
      return parsed;
    }
  } catch {}
  const s = structuredClone(emptyState);
  saveState(s);
  return s;
}
function saveState(s = state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function uid(){ return Math.random().toString(36).slice(2,10); }
function slugify(str){
  return String(str||'prihod').toLowerCase().replace(/[ё]/g,'e').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

/* Router */
const views = $$('.view');
const navBtns = $$('.nav .nav-btn');
// разбор параметров из location.hash: "#route?x=1&y=2"
function getHashParams() {
  const h = location.hash.slice(1);
  const q = h.includes('?') ? h.split('?')[1] : '';
  return new URLSearchParams(q);
}

function show(route){
  const base = route.split('?')[0]; // игнорируем хвост после '?'
  document.querySelectorAll('.view').forEach(v =>
    v.classList.toggle('active', v.id === `view-${base}`)
  );
  document.querySelectorAll('.nav .nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.route === base)
  );
  // держим hash в чистом виде ("#home", "#register", ...)
  location.hash = base;

  if (base === 'register') updateRegisterUrlPreview();
  if (base === 'moderator') renderModerator();
  if (base === 'priest'){ fillParishSelect($('#priestParishSelect')); renderPriest(); }
  if (base === 'parishioner'){
    fillParishSelect($('#userParishSelect'), true);
    // поддерживаем ?parish= и в hash, и в search (с публичной страницы)
    let params = getHashParams();
    if (!params.size && location.search) params = new URLSearchParams(location.search);
    const pre = params.get('parish');
    if (pre) $('#userParishSelect').value = pre;
    renderUser();
  }
}

(function initRouter(){
  const start = (location.hash.slice(1).split('?')[0]) || 'home';
  show(start);
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.route))
  );
  document.querySelectorAll('[data-route]').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.route))
  );
})();


/* Register */
const priestNameEl = $('#priestName');
const parishNameEl = $('#parishName');
const publicUrlEl = $('#publicUrl');
function updateRegisterUrlPreview(){
  const slug = slugify(parishNameEl.value);
  publicUrlEl.value = `${location.origin}${location.pathname.replace(/[^/]+$/,'')}parish.html?slug=${slug}`;
}
parishNameEl.addEventListener('input', updateRegisterUrlPreview);
updateRegisterUrlPreview();

$('#registerForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const priestName = priestNameEl.value.trim();
  const parishName = parishNameEl.value.trim();
  const locationText = $('#location').value.trim();
  const description = $('#description').value.trim();
  const slug = slugify(parishName)||'prihod';
  const publicUrl = `parish.html?slug=${slug}`;

  let priestAvatar=null, parishPhoto=null;
  try{
    if ($('#priestAvatar').files?.[0]) priestAvatar = await fileToDataUrl($('#priestAvatar').files[0]);
    if ($('#parishPhoto').files?.[0]) parishPhoto = await fileToDataUrl($('#parishPhoto').files[0]);
  }catch(err){ alert('Ошибка загрузки файлов: '+err.message); return; }

  state.parishes.push({ id:uid(), priestName, parishName, location:locationText, description, slug, publicUrl, priestAvatar, parishPhoto, status:'pending', createdAt:Date.now() });
  saveState();
  alert('Заявка отправлена на модерацию.');
  e.target.reset(); updateRegisterUrlPreview();
});

/* helpers */
async function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(new Error('Ошибка чтения файла')); r.readAsDataURL(file); }); }
function el(tag, attrs={}, ...children){
  const node = document.createElement(tag);
  Object.entries(attrs||{}).forEach(([k,v])=>{ if(k==='class') node.className=v; else if(k==='html') node.innerHTML=v; else node.setAttribute(k,v); });
  children.forEach(ch=>{ if(ch==null) return; if(typeof ch==='string') node.appendChild(document.createTextNode(ch)); else node.appendChild(ch); });
  return node;
}
function avatarImg(src, alt='', size='sm'){ const img = el('img', { class:size==='sm'?'avatar-sm':'avatar-md', alt }); img.src = src||DEFAULT_AVATAR; return img; }
function photoThumb(src, alt=''){ const img = el('img', { class:'photo-sm', alt }); img.src = src; return img; }

/* ресайз фото до 128x128 (для аватаров) */
async function resizeImageToDataUrl(file, target=128){
  const dataUrl = await fileToDataUrl(file);
  return new Promise((res)=>{
    const img = new Image();
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      canvas.width = target; canvas.height = target;
      const ctx = canvas.getContext('2d');
      // центрируем кроп в квадрат
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s)/2, sy = (img.height - s)/2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, target, target);
      res(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}

/* Moderator */
function renderModerator(){
  const wrap = $('#modLists'); wrap.innerHTML='';
  const tabs = $('[data-tabs="moderation"]');
  let active = $('.tab.active', tabs)?.dataset.tab || 'pending';
  tabs.onclick = (e)=>{ const t=e.target.closest('.tab'); if(!t) return; $$('.tab',tabs).forEach(x=>x.classList.toggle('active', x===t)); active=t.dataset.tab; renderModerator(); };

  const lists = {
    pending: state.parishes.filter(p=>p.status==='pending'),
    approved: state.parishes.filter(p=>p.status==='approved'),
    declined: state.parishes.filter(p=>p.status==='declined'),
  };
  const arr = lists[active];
  if (!arr.length){ wrap.appendChild(el('div',{class:'muted'},`Нет записей в ${active}.`)); return; }

  arr.sort((a,b)=>b.createdAt-a.createdAt).forEach(p=>{
    const row = el('div',{class:'item'});
    const meta = el('div',{class:'meta'});
    meta.append(
      el('div',{}, `${p.parishName} `, el('span',{class:`badge ${p.status}`}, p.status)),
      el('div',{class:'kv'}, `О.${p.priestName} — ${p.location}`),
      el('div',{class:'kv'}, `slug: ${p.slug}`),
      el('div',{class:'kv'}, p.description||'')
    );
    row.appendChild(meta);

    const actions = el('div',{class:'actions'});
    if (p.parishPhoto){ actions.appendChild(photoThumb(p.parishPhoto, p.parishName)); }
    if (p.status!=='approved') actions.appendChild(btn('Approve','success',()=>{ p.status='approved'; saveState(); renderModerator(); }));
    if (p.status!=='declined') actions.appendChild(btn('Decline','danger',()=>{ p.status='declined'; saveState(); renderModerator(); }));
    actions.appendChild(aBtn('Открыть публичную страницу', ()=>window.open(`parish.html?slug=${p.slug}`,'_blank')));
    row.appendChild(actions);
    wrap.appendChild(row);
  });
}
function btn(t,v,cb){ const b=el('button',{class:`btn ${v||''}`},t); b.onclick=cb; return b; }
function aBtn(t,cb){ const b=el('button',{class:'btn ghost'},t); b.onclick=cb; return b; }

/* Selects */
function fillParishSelect(selectEl, onlyApproved=true){
  const list = onlyApproved ? state.parishes.filter(p=>p.status==='approved') : state.parishes;
  selectEl.innerHTML='';
  if (!list.length){ selectEl.appendChild(el('option',{value:''},'— пока нет одобренных приходов —')); return; }
  list.forEach(p=> selectEl.appendChild(el('option',{value:p.id},`${p.parishName} — ${p.location}`)));
}

/* Priest */
function renderPriest(){
  const parishId = $('#priestParishSelect').value || state.parishes.find(p=>p.status==='approved')?.id || '';
  $('#priestParishSelect').value = parishId;
  const wrap = $('#priestTabContent'); wrap.innerHTML='';

  const tabs = $('[data-tabs="priest"]');
  let active = $('.tab.active', tabs)?.dataset.tab || 'dialogs';
  tabs.onclick = (e)=>{ const t=e.target.closest('.tab'); if(!t) return; $$('.tab',tabs).forEach(x=>x.classList.toggle('active', x===t)); active=t.dataset.tab; renderPriest(); };

  if (!parishId){ wrap.appendChild(el('div',{class:'muted'},'Нет выбранного прихода.')); return; }

  if (active==='dialogs'){
    const users = state.parishioners.filter(x=>x.parishId===parishId);
    wrap.appendChild(el('div',{class:'muted'},`Прихожан: ${users.length}`));

    // ----- ТОЛЬКО чекбоксы (без второго списка) -----
    const picks = el('div',{class:'picklist'});
    const head = el('div',{class:'picklist-head'});
    const chkAll = el('input',{type:'checkbox',id:'pickAll'});
    head.append(chkAll, el('label',{for:'pickAll'},'Выбрать всех'));
    picks.appendChild(head);

    const body = el('div',{class:'picklist-body'});
    users.forEach(u=>{
      const row = el('label',{class:'pick'});
      const cb = el('input',{type:'checkbox',name:'pick',value:u.id});
      row.append(cb, avatarImg(u.avatar||DEFAULT_AVATAR, u.name, 'sm'), el('span',{class:'pick-name'},u.name));
      body.appendChild(row);
    });
    chkAll.addEventListener('change', ()=> { $$('input[name="pick"]', body).forEach(c=>c.checked = chkAll.checked); });
    picks.appendChild(body);
    wrap.appendChild(picks);

    // поле сообщения
    const ctrl = el('div',{class:'controls'});
    const text = el('input',{type:'text',placeholder:'Сообщение прихожанам…'});
    const rec  = el('button',{class:'rec',type:'button'},'🎙 Записать голос');
    let audioBlob=null, mediaRec=null, chunks=[];
    rec.onclick = async ()=>{
      try{
        if (mediaRec && mediaRec.state==='recording'){ mediaRec.stop(); return; }
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        mediaRec = new MediaRecorder(stream); chunks=[];
        mediaRec.ondataavailable = e=>chunks.push(e.data);
        mediaRec.onstop = ()=>{ audioBlob = new Blob(chunks,{type:'audio/webm'}); rec.classList.remove('rec-on'); rec.textContent='🎙 Записано'; };
        mediaRec.start(); rec.classList.add('rec-on'); rec.textContent='⏺ Запись… Нажми ещё раз чтобы остановить';
      }catch(e){ alert('Ошибка доступа к микрофону: '+e.message); }
    };
    const sendBtn = btn('Отправить','primary',()=>{
      const checked = $$('input[name="pick"]:checked', body).map(c=>c.value);
      const targets = checked.length ? checked : users.map(u=>u.id);
      if (!text.value && !audioBlob){ alert('Введите текст или запишите голос.'); return; }
      targets.forEach(tid=> state.messages.push({
        id:uid(), parishId, from:'priest', to:tid,
        authorName: state.parishes.find(p=>p.id===parishId).priestName,
        text: text.value||'', audio: audioBlob?URL.createObjectURL(audioBlob):null, ts:Date.now()
      }));
      saveState(); text.value=''; audioBlob=null; rec.textContent='🎙 Записать голос';
      renderPriest();
    });
    ctrl.append(text, rec, sendBtn);
    wrap.appendChild(ctrl);
  }

  if (active==='donations'){
    const list = state.donations.filter(d=>d.parishId===parishId).sort((a,b)=>b.ts-a.ts);
    const total = list.reduce((s,x)=>s+Number(x.amount||0),0);
    wrap.appendChild(el('div',{class:'kv'},`Всего пожертвований: <strong>${total.toFixed(2)}</strong>`));
    list.forEach(d=>{
      const user = state.parishioners.find(u=>u.id===d.parishionerId);
      const item = el('div',{class:'item'});
      item.appendChild(avatarImg(user?.avatar||DEFAULT_AVATAR, user?.name||'', 'sm'));
      item.appendChild(el('div',{class:'meta'}, el('strong',{},user?.name||'—'), el('span',{class:'kv'},`Сумма: <strong>${Number(d.amount).toFixed(2)}</strong>`), el('span',{class:'muted'},new Date(d.ts).toLocaleString())));
      wrap.appendChild(item);
    });
  }

  if (active==='candles'){
    const list = state.candles.filter(c=>c.parishId===parishId).sort((a,b)=>b.ts-a.ts);
    const total = list.reduce((s,x)=>s+Number(x.amount||0),0);
    wrap.appendChild(el('div',{class:'kv'},`Продано свечей на: <strong>${total.toFixed(2)}</strong>`));
    list.forEach(c=>{
      const user = state.parishioners.find(u=>u.id===c.parishionerId);
      const item = el('div',{class:'item'});
      item.appendChild(avatarImg(user?.avatar||DEFAULT_AVATAR, user?.name||'', 'sm'));
      item.appendChild(el('div',{class:'meta'},
        el('strong',{},user?.name||'—'),
        el('span',{class:'kv'},`Свечей: <strong>${c.count}</strong>`),
        el('span',{class:'kv'},`Имена: ${c.dedications.join(', ')}`),
        el('span',{class:'kv'},`Сумма: <strong>${Number(c.amount).toFixed(2)}</strong>`),
        el('span',{class:'muted'},new Date(c.ts).toLocaleString())
      ));
      wrap.appendChild(item);
    });
  }
}

/* Chat */
function openChat(parishId, parishionerId, inPriestCabinet=false){
  const wrap = inPriestCabinet ? $('#priestTabContent') : $('#userTabContent');
  wrap.innerHTML='';
  const parish = state.parishes.find(p=>p.id===parishId);
  const user   = state.parishioners.find(u=>u.id===parishionerId);

  // Заголовок
  const head = el('div',{class:'chat-head'});
  if (inPriestCabinet){
    head.appendChild(avatarImg(user?.avatar||DEFAULT_AVATAR, user?.name||'', 'sm'));
    head.appendChild(el('div',{class:'meta'},
      el('strong',{},user?.name||'—'),
      el('span',{class:'kv'}, parish?.parishName||'')
    ));
  } else {
    head.appendChild(avatarImg(parish?.priestAvatar||DEFAULT_AVATAR, parish?.priestName||'', 'sm'));
    head.appendChild(el('div',{class:'meta'},
      el('strong',{},parish?.priestName||'Батюшка'),
      el('span',{class:'kv'}, parish?.parishName||'')
    ));
  }
  wrap.appendChild(head);

  const chatBox = el('div',{class:'chat'}); wrap.appendChild(chatBox);

  // Показываем:
  //  - все сообщения батюшки конкретному прихожанину
  //  - все сообщения этого прихожанина батюшке
  const msgs = state.messages
    .filter(m => m.parishId===parishId &&
      ((m.from==='priest'      && m.to===parishionerId) ||
       (m.from==='parishioner' && m.to==='priest' && (m.authorId===parishionerId || m.authorName===user?.name))))
    .sort((a,b)=>a.ts-b.ts);

  msgs.forEach(m=>{
    const mine = (inPriestCabinet ? m.from==='priest' : m.from==='parishioner');
    const bubble = el('div',{class:`msg ${mine?'me':'other'}`});
    if (m.text) bubble.appendChild(el('div',{},m.text));
    if (m.audio){ const a=el('audio',{controls:true}); a.src=m.audio; bubble.appendChild(a); }
    bubble.appendChild(el('small',{class:'muted',style:'display:block;margin-top:4px;font-size:11px;'},
      new Date(m.ts).toLocaleTimeString()
    ));
    chatBox.appendChild(bubble);
  });
  chatBox.scrollTop = chatBox.scrollHeight;

  // Отправка
  const ctrl = el('div',{class:'controls'});
  const input = el('input',{type:'text',placeholder:'Напишите сообщение…'});
  const rec = el('button',{class:'rec',type:'button'},'🎙 Записать голос');
  let audioBlob=null, mediaRec=null, chunks=[];
  rec.onclick = async ()=>{
    try{
      if (mediaRec && mediaRec.state==='recording'){ mediaRec.stop(); return; }
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRec = new MediaRecorder(stream); chunks=[];
      mediaRec.ondataavailable = e=>chunks.push(e.data);
      mediaRec.onstop = ()=>{ audioBlob=new Blob(chunks,{type:'audio/webm'}); rec.classList.remove('rec-on'); rec.textContent='🎙 Записано'; };
      mediaRec.start(); rec.classList.add('rec-on'); rec.textContent='⏺ Запись… нажмите ещё раз чтобы остановить';
    }catch(e){ alert('Ошибка доступа к микрофону: '+e.message); }
  };
  const send = btn('Отправить','primary',()=>{
    if (!input.value && !audioBlob){ alert('Введите текст или запишите голос.'); return; }
    state.messages.push({
      id: uid(), parishId,
      from: inPriestCabinet ? 'priest' : 'parishioner',
      to:   inPriestCabinet ? parishionerId : 'priest',
      authorId: inPriestCabinet ? 'priest' : user.id,   // ← добавили ID автора
      authorName: inPriestCabinet ? parish.priestName : user.name,
      text: input.value || '',
      audio: audioBlob ? URL.createObjectURL(audioBlob) : null,
      ts: Date.now()
    });
    saveState(); openChat(parishId, parishionerId, inPriestCabinet);
  });
  ctrl.append(input, rec, send); wrap.appendChild(ctrl);
}

/* Parishioner */
function renderUser(){
  const name = $('#userName').value.trim() || 'Иван';
  const parishId = $('#userParishSelect').value || state.parishes.find(p=>p.status==='approved')?.id || '';
  $('#userParishSelect').value = parishId;

  let me = state.parishioners.find(u=>u.name===name && u.parishId===parishId);
  if (parishId && !me){ me = { id:uid(), name, parishId, avatar:null }; state.parishioners.push(me); saveState(); }

  const tabs = $('[data-tabs="user"]');
  let active = $('.tab.active', tabs)?.dataset.tab || 'u-dialogs';
  tabs.onclick = (e)=>{ const t=e.target.closest('.tab'); if(!t) return; $$('.tab',tabs).forEach(x=>x.classList.toggle('active', x===t)); active=t.dataset.tab; renderUser(); };

  const wrap = $('#userTabContent'); wrap.innerHTML='';
  if (!parishId){ wrap.appendChild(el('div',{class:'muted'},'Нет одобренных приходов.')); return; }

  const parish = state.parishes.find(p=>p.id===parishId);

  // мини-фото батюшки и храма
  const mini = el('div',{class:'mini-row'});
  mini.append(
    el('div',{class:'avatar-block'}, avatarImg(parish?.priestAvatar||DEFAULT_AVATAR, parish?.priestName||'Батюшка','sm'), el('div',{class:'caption'}, parish?.priestName||'Батюшка')),
    el('div',{class:'avatar-block'}, parish?.parishPhoto?photoThumb(parish.parishPhoto, parish?.parishName||'Храм'):photoThumb(DEFAULT_AVATAR,'Храм'), el('div',{class:'caption'}, parish?.parishName||'Храм'))
  );
  wrap.appendChild(mini);

  // загрузка аватара прихожанина: кнопка «Сохранить фото»
  const avatarForm = el('div',{class:'controls'});
  const label = el('label',{class:'kv'},'Фото прихожанина (jpg/png):');
  const input = el('input',{type:'file', accept:'image/*'});
  const saveBtn = btn('Сохранить фото','primary', async ()=>{
    if (!input.files?.[0]){ alert('Выберите файл с фото.'); return; }
    const resized = await resizeImageToDataUrl(input.files[0], 128);
    const idx = state.parishioners.findIndex(u=>u.id===me.id);
    if (idx!==-1){ state.parishioners[idx].avatar = resized; saveState(); }
    myPreview.src = resized;
    alert('Фото сохранено.');
  });
  const myPreview = avatarImg(me?.avatar||DEFAULT_AVATAR, name, 'sm');
  const myBlock = el('div',{class:'avatar-block'}, myPreview, el('div',{class:'caption'}, name));
  avatarForm.append(label, input, saveBtn, myBlock);
  wrap.appendChild(avatarForm);

  if (active==='u-dialogs'){
    wrap.appendChild(aBtn('Открыть диалог с батюшкой', ()=>openChat(parishId, me.id, false)));
  }

  if (active==='u-donations'){
    const form = el('div',{class:'controls'});
    const amount = el('input',{type:'number', step:'0.01', min:'1', placeholder:'Сумма пожертвования'});
    const send = btn('Сделать пожертвование','success', ()=>{
      const a = Number(amount.value); if (!a || a<=0) return alert('Введите сумму.');
      state.donations.push({ id:uid(), parishId, parishionerId: me.id, amount:a, ts:Date.now() });
      saveState(); amount.value=''; renderUser();
    });
    form.append(amount, send); wrap.appendChild(form);

    const list = state.donations.filter(d=>d.parishId===parishId && d.parishionerId===me.id).sort((a,b)=>b.ts-a.ts);
    if (list.length){
      wrap.appendChild(el('div',{class:'kv'},'Ваши пожертвования:'));
      list.forEach(d=> wrap.appendChild(el('div',{class:'item'}, el('div',{class:'meta'}, `Сумма: ${d.amount.toFixed(2)}`, el('span',{class:'muted'}, new Date(d.ts).toLocaleString())))));
    }
  }

  if (active==='u-candles'){
    const form = el('div',{class:'stack'});
    const price = 2.0;
    const ctrl = el('div',{class:'controls'});
    const count = el('input',{type:'number', min:'1', value:'1'});
    const names = el('textarea',{rows:'2', placeholder:'Имена (каждое с новой строки)…'});
    const total = el('div',{class:'kv'}, `Итого: <strong>${price.toFixed(2)}</strong>`);
    function upd(){ const n=Math.max(1,Number(count.value)||1); const k=names.value.split('\n').map(s=>s.trim()).filter(Boolean).length||1; total.innerHTML=`Итого: <strong>${(n*price).toFixed(2)}</strong> (имен: ${k})`; }
    count.addEventListener('input',upd); names.addEventListener('input',upd); upd();
    const buy = btn('Купить свечи','primary',()=>{
      const n=Math.max(1,Number(count.value)||1);
      const ded=names.value.split('\n').map(s=>s.trim()).filter(Boolean);
      const amount=n*price;
      state.candles.push({ id:uid(), parishId, parishionerId: me.id, count:n, dedications: ded.length?ded:['о здравии'], amount, ts:Date.now() });
      saveState(); renderUser();
    });
    ctrl.append(el('span',{},'Кол-во:'), count, total);
    form.append(ctrl, names, buy); wrap.appendChild(form);

    const list = state.candles.filter(c=>c.parishId===parishId && c.parishionerId===me.id).sort((a,b)=>b.ts-a.ts);
    if (list.length){
      wrap.appendChild(el('div',{class:'kv'},'Ваши свечи:'));
      list.forEach(c => wrap.appendChild(el('div',{class:'item'}, el('div',{class:'meta'}, `Свечей: ${c.count}`, `Имена: ${c.dedications.join(', ')}`, `Сумма: ${c.amount.toFixed(2)}`, el('span',{class:'muted'}, new Date(c.ts).toLocaleString())))));
    }
  }
}

/* hooks */
$('#parishName').addEventListener('input', () => updateRegisterUrlPreview());
fillParishSelect($('#priestParishSelect'));
fillParishSelect($('#userParishSelect'), true);
/* parish public page logic in parish.html */
