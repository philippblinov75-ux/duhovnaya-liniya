function selectRole(role){
  localStorage.setItem('dl.role', role);
  window.location.href = 'register.html';
}