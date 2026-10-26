document.addEventListener('DOMContentLoaded', () => {
  try {
    const receipt = JSON.parse(sessionStorage.getItem('kd_receipt'));
    const session = JSON.parse(localStorage.getItem('kd_student_session'));
    const name = receipt?.fullName || session?.fullName;
    if (name) {
      document.querySelectorAll('[data-student-name]').forEach(el => el.textContent = name);
    }
  } catch {}
});
