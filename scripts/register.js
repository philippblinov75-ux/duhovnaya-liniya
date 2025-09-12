const role = localStorage.getItem('dl.role') || 'parishioner';
document.getElementById('roleLabel').textContent = 'Роль: ' + (role==='priest'?'Батюшка':'Прихожанин');
const form = document.getElementById('registerForm');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  // TODO: заменить на Firebase Auth createUserWithEmailAndPassword
  const uid = 'local_' + Math.random().toString(36).slice(2);
  const user = { uid, role, displayName: data.displayName, email: data.email };
  localStorage.setItem('dl.user', JSON.stringify(user));
  // TODO: создать профиль в Firestore
  window.location.href = 'home.html';
});