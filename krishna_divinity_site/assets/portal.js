// Krishna Divinity - Student Portal Controller

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('portal-login-form');
const loginInput = document.getElementById('login-id');
const welcomeNameEl = document.getElementById('student-welcome-name');
const emailDisplayEl = document.getElementById('student-email-display');
const myCoursesListEl = document.getElementById('my-courses-list');
const noCoursesBox = document.getElementById('no-courses-box');
const logoutBtn = document.getElementById('logout-btn');

function getStoredSession() {
  try {
    const raw = localStorage.getItem('kd_student_session') || sessionStorage.getItem('kd_student_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem('kd_student_session', JSON.stringify(session));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem('kd_student_session');
    sessionStorage.removeItem('kd_student_session');
  } catch {}
}

function initPortal() {
  const session = getStoredSession();
  if (session && (session.email || session.whatsapp)) {
    showDashboard(session);
  } else {
    showLogin();
  }

  // Sync latest course data from Google Sheet in background
  if (typeof window.syncCoursesFromGoogleSheet === 'function') {
    window.syncCoursesFromGoogleSheet(() => {
      const activeSession = getStoredSession();
      if (activeSession && (activeSession.email || activeSession.whatsapp)) {
        showDashboard(activeSession);
      }
    });
  }
}

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

function showDashboard(session) {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  welcomeNameEl.textContent = `Hare Krishna, ${session.fullName || 'Seeker'}! 🙏`;
  emailDisplayEl.textContent = session.email || session.whatsapp || '';

  renderEnrolledCourses(session.enrolledCourses || []);
}

function renderEnrolledCourses(enrolledList) {
  myCoursesListEl.innerHTML = '';
  
  // If no courses yet
  if (!enrolledList || enrolledList.length === 0) {
    noCoursesBox.hidden = false;
    return;
  }
  noCoursesBox.hidden = true;

  const today = new Date().toISOString().slice(0, 10);

  enrolledList.forEach(enrollment => {
    const courseMeta = window.KD_COURSES?.[enrollment.courseId] || {
      title: enrollment.courseName || 'Course',
      badge: 'Krishna Divinity',
      instructor: 'Rohini Suta Dasa'
    };

    const isLifetime = enrollment.validity === 'lifetime' || enrollment.validUntil === 'lifetime' || !enrollment.validUntil;
    let isExpired = false;
    let expiryDateDisplay = 'Lifetime Access';

    if (!isLifetime && enrollment.validUntil) {
      isExpired = enrollment.validUntil < today;
      expiryDateDisplay = `Valid until: ${enrollment.validUntil}`;
    }

    const card = document.createElement('div');
    card.className = 'enrolled-card';
    
    let actionBtnHtml = '';
    if (isExpired) {
      actionBtnHtml = `
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:8px;margin-bottom:12px;text-align:center;">
          <strong style="color:#991b1b;font-size:14px;display:block;">⚠️ Your Course Access Expired</strong>
          <p class="note" style="color:#b91c1c;margin:4px 0 10px;">Upgrade your plan to continue learning:</p>
          <a href="registration.html?course=${enrollment.courseId}&plan=ai-1y" class="btn btn-primary btn-block" style="font-size:13px;padding:8px;margin-bottom:6px;">Renew 1 Year — ₹500</a>
          <a href="registration.html?course=${enrollment.courseId}&plan=ai-lifetime" class="btn btn-light btn-block" style="font-size:13px;padding:8px;">Upgrade Lifetime — ₹1,080</a>
        </div>
      `;
    } else {
      actionBtnHtml = `
        <a href="classroom.html?course=${encodeURIComponent(enrollment.courseId)}" class="btn btn-primary btn-block" style="font-size:15px;padding:12px;text-align:center;text-decoration:none;">
          ▶ Go to Classroom (क्लास शुरू करें)
        </a>
      `;
    }

    card.innerHTML = `
      <div>
        <span class="badge" style="background:#fef3c7;color:#92400e;">${courseMeta.badge || 'Course'}</span>
        <h3 style="margin:8px 0 4px;font-size:20px;">${courseMeta.title}</h3>
        <p class="note" style="margin:0 0 8px;">Instructor: ${courseMeta.instructor}</p>
        
        <div>
          <span class="validity-tag ${isExpired ? 'tag-expired' : 'tag-active'}">
            ${isExpired ? 'Expired' : 'Active'} • ${isLifetime ? '✨ Lifetime Access' : expiryDateDisplay}
          </span>
        </div>
        
        <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">
          Includes live Zoom class recordings, organized video lessons, and downloadable PDF study notes.
        </p>
      </div>

      <div>
        ${actionBtnHtml}
      </div>
    `;

    myCoursesListEl.appendChild(card);
  });
}

function switchPortalTab(tabName) {
  const myCoursesTab = document.getElementById('view-my-courses');
  const exploreTab = document.getElementById('view-explore');
  const myCoursesBtn = document.getElementById('tab-my-courses-btn');
  const exploreBtn = document.getElementById('tab-explore-btn');

  if (tabName === 'explore') {
    myCoursesTab.hidden = true;
    exploreTab.hidden = false;
    myCoursesBtn.classList.remove('active');
    exploreBtn.classList.add('active');
  } else {
    myCoursesTab.hidden = false;
    exploreTab.hidden = true;
    myCoursesBtn.classList.add('active');
    exploreBtn.classList.remove('active');
  }
}

function goToAiCheckout() {
  const selectedPlan = document.querySelector('input[name="ai-plan-pick"]:checked')?.value || 'ai-3m';
  window.location.href = `registration.html?course=ai&plan=${encodeURIComponent(selectedPlan)}`;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = loginInput.value.trim();
  if (!val) return;

  // Check if we have receipt or prior registration in storage
  let receipt = null;
  try {
    receipt = JSON.parse(sessionStorage.getItem('kd_receipt'));
  } catch {}

  const enrolled = [];
  if (receipt && receipt.status === 'confirmed') {
    const isAi = receipt.plan?.startsWith('ai');
    enrolled.push({
      courseId: isAi ? 'ai' : 'gita',
      courseName: receipt.name || (isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course'),
      plan: receipt.plan,
      validity: receipt.validity || (receipt.plan === 'ai-3m' ? '3_months' : (receipt.plan === 'ai-1y' ? '1_year' : 'lifetime')),
      validUntil: receipt.validUntil || (receipt.plan === 'ai-3m' ? calculateFutureDate(90) : (receipt.plan === 'ai-1y' ? calculateFutureDate(365) : 'lifetime'))
    });
  } else {
    // Demo auto-enrollment for seeker so they can preview their portal immediately!
    const isEmail = val.includes('@');
    enrolled.push({
      courseId: 'gita',
      courseName: 'Bhagavad Gita Foundation Course',
      plan: 'gita-lifetime',
      validity: 'lifetime',
      validUntil: 'lifetime'
    });
    enrolled.push({
      courseId: 'ai',
      courseName: 'Practical AI Course',
      plan: 'ai-3m',
      validity: '3_months',
      validUntil: calculateFutureDate(90)
    });
  }

  const session = {
    fullName: val.split('@')[0] || 'Seeker',
    email: val.includes('@') ? val : '',
    whatsapp: !val.includes('@') ? val : '',
    enrolledCourses: enrolled
  };

  saveSession(session);
  showDashboard(session);
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  showLogin();
});

function calculateFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Auto-run on load
initPortal();
