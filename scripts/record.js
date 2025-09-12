let mediaRecorder, chunks=[];
const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const player = document.getElementById('player');
const sendBtn = document.getElementById('sendBtn');

async function getStream(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch(e){
    alert('Нужен доступ к микрофону. Проверьте разрешения.');
    throw e;
  }
}
recordBtn.addEventListener('mousedown', startRec);
recordBtn.addEventListener('touchstart', (e)=>{e.preventDefault(); startRec();});
recordBtn.addEventListener('mouseup', stopRec);
recordBtn.addEventListener('mouseleave', stopRec);
recordBtn.addEventListener('touchend', stopRec);

async function startRec(){
  if(mediaRecorder && mediaRecorder.state==='recording') return;
  const stream = await getStream();
  chunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  mediaRecorder.ondataavailable = (e)=>{ if(e.data.size>0) chunks.push(e.data); };
  mediaRecorder.onstop = ()=>{
    const blob = new Blob(chunks, { type: 'audio/webm' });
    player.src = URL.createObjectURL(blob);
    player.classList.remove('hidden');
    sendBtn.disabled = false;
    statusEl.textContent = `Длительность: ~${Math.round(blob.size/16000)} сек (оценка)`;
  };
  mediaRecorder.start();
  statusEl.textContent = 'Запись… удерживайте кнопку';
}
function stopRec(){
  if(mediaRecorder && mediaRecorder.state==='recording'){
    mediaRecorder.stop();
    statusEl.textContent = 'Обработка…';
  }
}
sendBtn.addEventListener('click', ()=>{
  // TODO: загрузить в Firebase Storage, создать message в Firestore
  const threads = JSON.parse(localStorage.getItem('dl.threads') || '[]');
  const id = threads.length + 1;
  threads.unshift({ id, createdAt: Date.now() });
  localStorage.setItem('dl.threads', JSON.stringify(threads));
  alert('Сообщение отправлено (локально). В Firebase будет пуш батюшке.');
  window.location.href='home.html';
});