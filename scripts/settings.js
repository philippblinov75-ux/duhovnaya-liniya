const roleSelect = document.getElementById('roleSelect');
const user = JSON.parse(localStorage.getItem('dl.user') || 'null');
if(!user){ window.location.href='index.html'; }
roleSelect.value = user.role;
document.getElementById('saveRole').addEventListener('click', ()=>{
  user.role = roleSelect.value;
  localStorage.setItem('dl.user', JSON.stringify(user));
  alert('Роль сохранена');
});
document.getElementById('logout').addEventListener('click', ()=>{
  localStorage.removeItem('dl.user');
  window.location.href='index.html';
});