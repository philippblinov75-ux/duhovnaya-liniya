const user = JSON.parse(localStorage.getItem('dl.user') || 'null');
const hello = document.getElementById('hello');
if(!user){ window.location.href='index.html'; }
else {
  hello.textContent = `${user.displayName} — ${user.role==='priest'?'Батюшка':'Прихожанин'}`;
}
// Threads mock
const list = document.getElementById('threadList');
const threads = JSON.parse(localStorage.getItem('dl.threads') || '[]');
if(threads.length===0){
  list.innerHTML = '<li class="tiny">Нет сообщений</li>';
} else {
  list.innerHTML = threads.map(t=>`<li>Сообщение #${t.id} — ${new Date(t.createdAt).toLocaleString()}</li>`).join('');
}