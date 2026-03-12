/* ══════════════════════════════════
   MOCK AUTH — offline / no backend
   sessionStorage = sesi aktif (login)
   localStorage   = daftar akun tersimpan
══════════════════════════════════ */

/* ── Storage helpers ── */
const PM_ACCOUNTS_KEY = 'pm_accounts'; // array semua akun yang pernah signup

function getAccounts() {
  try { return JSON.parse(localStorage.getItem(PM_ACCOUNTS_KEY)) || []; }
  catch { return []; }
}

function saveAccounts(accounts) {
  localStorage.setItem(PM_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function findAccount(email) {
  return getAccounts().find(a => a.email.toLowerCase() === email.toLowerCase());
}

function registerAccount(name, email) {
  const accounts = getAccounts();
  // Kalau email sudah ada, update nama-nya (upsert)
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
  const record = { name, email, createdAt: new Date().toISOString() };
  if (idx >= 0) accounts[idx] = record;
  else accounts.push(record);
  saveAccounts(accounts);
  return record;
}

// Cek kalau udah "login" → langsung ke dashboard
(function checkSession() {
  const session = sessionStorage.getItem('pm_user');
  const onDash  = window.location.pathname.includes('dashboard');
  const onLogin = window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
  if (session && onLogin)  window.location.href = 'dashboard.html';
  if (!session && onDash)  window.location.href = 'index.html';
})();

/* ── State ── */
let termsAgreed = false;

/* ══════════════════════════════════
   TAB SWITCHING
══════════════════════════════════ */
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const idx = tab === 'login' ? 0 : 1;
  document.querySelectorAll('.auth-tab')[idx].classList.add('active');
  document.getElementById(tab === 'login' ? 'loginForm' : 'signupForm').classList.add('active');
  hideAlert('loginAlert');
  hideAlert('signupAlert');
}

/* ══════════════════════════════════
   UI HELPERS
══════════════════════════════════ */
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
  el.className = `alert ${type} show`;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function setLoading(btnId, loading, defaultHTML) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> Loading...`;
  } else {
    btn.disabled = false;
    if (defaultHTML) btn.innerHTML = defaultHTML;
  }
}

function togglePassword(id, icon) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  icon.style.color = inp.type === 'text' ? 'var(--blue)' : 'var(--text-light)';
}

function toggleTerms() {
  termsAgreed = !termsAgreed;
  document.getElementById('termsCheck').classList.toggle('checked', termsAgreed);
}

function checkStrength(val) {
  const wrap  = document.getElementById('strengthWrap');
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!wrap) return;
  if (!val) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: '25%',  c: '#EF4444', t: 'Weak' },
    { w: '50%',  c: '#F59E0B', t: 'Fair' },
    { w: '75%',  c: '#3B82F6', t: 'Good' },
    { w: '100%', c: '#10B981', t: 'Strong 💪' },
  ];
  const l = levels[score - 1] || levels[0];
  fill.style.width      = l.w;
  fill.style.background = l.c;
  label.textContent     = l.t;
  label.style.color     = l.c;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ══════════════════════════════════
   LOGIN
══════════════════════════════════ */
const LOGIN_BTN_HTML = `Log In <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

function handleLogin() {
  hideAlert('loginAlert');
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAlert('loginAlert', 'Please fill in email and password.');
    return;
  }
  if (!isValidEmail(email)) {
    showAlert('loginAlert', 'Please enter a valid email address.');
    return;
  }

  setLoading('loginBtn', true);
  setTimeout(() => {
    // Cek apakah email ada di localStorage (pernah signup)
    const account = findAccount(email);
    let name;
    if (account) {
      // User yang sudah pernah signup → pakai nama dari localStorage
      name = account.name;
    } else {
      // User baru login tanpa signup → generate nama dari email
      name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      // Simpan ke localStorage juga supaya konsisten
      registerAccount(name, email);
    }
    sessionStorage.setItem('pm_user', JSON.stringify({ email, name }));
    window.location.href = 'dashboard.html';
  }, 700);
}

/* ══════════════════════════════════
   SIGN UP
══════════════════════════════════ */
const SIGNUP_BTN_HTML = `Create My Portfolio — Free <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

function handleSignup() {
  hideAlert('signupAlert');
  const first    = document.getElementById('signupFirst').value.trim();
  const last     = document.getElementById('signupLast').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  // Validasi field wajib
  if (!first || !email || !password) {
    showAlert('signupAlert', 'Please fill in all required fields.');
    return;
  }
  if (!isValidEmail(email)) {
    showAlert('signupAlert', 'Please enter a valid email address.');
    return;
  }
  if (password.length < 8) {
    showAlert('signupAlert', 'Password must be at least 8 characters.');
    return;
  }
  if (!termsAgreed) {
    showAlert('signupAlert', 'Please agree to the Terms of Service.');
    return;
  }

  setLoading('signupBtn', true);

  setTimeout(() => {
    const name = `${first} ${last}`.trim();

    // 1. Simpan akun ke localStorage (persisten)
    registerAccount(name, email);

    // 2. Set sesi aktif di sessionStorage
    sessionStorage.setItem('pm_user', JSON.stringify({ email, name }));

    // 3. Redirect ke dashboard
    window.location.href = 'dashboard.html';
  }, 700);
}

/* ══════════════════════════════════
   FORGOT PASSWORD (mock)
══════════════════════════════════ */
function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) {
    showAlert('loginAlert', 'Enter your email address first, then click Forgot password.');
    return;
  }
  if (!isValidEmail(email)) {
    showAlert('loginAlert', 'Please enter a valid email address first.');
    return;
  }
  showAlert('loginAlert', `Password reset link sent to ${email}!`, 'success');
}

/* ── Enter key support ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (!loginForm) return;
  if (loginForm.classList.contains('active'))  handleLogin();
  if (signupForm && signupForm.classList.contains('active')) handleSignup();
});


/* ══════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════ */
function initDashboard() {
  if (!document.querySelector('.app-shell')) return;

  const raw = sessionStorage.getItem('pm_user');
  if (!raw) { window.location.href = 'index.html'; return; }

  const user     = JSON.parse(raw);
  const name     = user.name || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.sidebar-user-av').forEach(el => el.textContent = initials);

  const greetingName = document.querySelector('.welcome-name');
  if (greetingName) greetingName.textContent = name;

  const greetingEl = document.querySelector('.welcome-greeting');
  if (greetingEl) {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    greetingEl.innerHTML = `<span>👋</span> ${greet},`;
  }

  document.querySelectorAll('.b-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.b-avatar').forEach(el => el.textContent = initials);

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  document.querySelectorAll('.browser-url').forEach(el => {
    const icon = el.querySelector('svg');
    el.innerHTML = '';
    if (icon) el.appendChild(icon);
    el.insertAdjacentText('beforeend', `portomaker.app/u/${slug}`);
  });
  document.querySelectorAll('.port-link-box').forEach(el => {
    el.textContent = `portomaker.app/u/${slug}`;
  });

  updateChart(7);
}

/* ── Logout ── */
function handleLogout() {
  sessionStorage.removeItem('pm_user');
  window.location.href = 'index.html';
}

/* ── Toast ── */
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── Copy link ── */
function copyLink() {
  const linkBox = document.querySelector('.port-link-box');
  const text = linkBox ? linkBox.textContent : 'portomaker.app/u/me';
  navigator.clipboard?.writeText(text).catch(() => {});
  showToast('Link copied to clipboard!');
}

/* ── Sidebar active ── */
function setActive(el) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  if (window.innerWidth <= 900) toggleSidebar();
}

/* ── Hamburger / sidebar drawer ── */
function toggleSidebar() {
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('show', isOpen);
  hamburger.innerHTML = isOpen
    ? `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    : `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar?.classList.contains('open')) toggleSidebar();
  }
});

/* ── Bar chart ── */
function updateChart(days) {
  const container = document.getElementById('chartBars');
  if (!container) return;
  const seed = [12, 8, 22, 17, 35, 28, 42, 19, 31, 25, 38, 44, 29, 36,
                16, 41, 27, 33, 48, 21, 39, 53, 45, 18, 30, 37, 52, 43, 26, 55];
  const data = seed.slice(0, parseInt(days));
  const max  = Math.max(...data);
  container.innerHTML = data.map(v => {
    const pct  = Math.max(8, (v / max) * 100);
    const peak = v === max ? 'peak' : '';
    return `<div class="chart-bar-item ${peak}" style="height:${pct}%" title="${v} views"></div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initDashboard);


/* ══════════════════════════════════════════════════════
   PORTFOLIO EDITOR  (editor.html)
══════════════════════════════════════════════════════ */
/* ════════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════════ */
const LS_KEY = 'portomaker_data';

function saveToLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ S, sections }));
  } catch(e) {
    console.error('localStorage save error:', e);
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (saved.S) {
      Object.keys(saved.S).forEach(k => {
        if (S[k] !== undefined) {
          if (Array.isArray(saved.S[k])) S[k] = saved.S[k];
          else if (typeof saved.S[k] === 'object') Object.assign(S[k], saved.S[k]);
          else S[k] = saved.S[k];
        }
      });
    }
    if (saved.sections && Array.isArray(saved.sections)) sections = saved.sections;
    return true;
  } catch(e) {
    console.error('localStorage load error:', e);
    return false;
  }
}

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
const S = {
  profile:{ name:'Novita Anggraini', headline:'UI/UX Designer · Fresh Graduate', location:'Jakarta, Indonesia', openToWork:true, photo:null },
  about:{ bio:"I'm a fresh UI/UX design graduate passionate about creating human-centered digital products. I led design for a campus mobile app and interned at Tokopedia where I redesigned the seller onboarding flow." },
  nav:{ logo:'Novita', links:[{label:'Home',url:'#'},{label:'About',url:'#'},{label:'Projects',url:'#'},{label:'Contact',url:'#'}], cta:{ label:'Hire Me', url:'#' } },
  experience:[
    { id:'e1', title:'UX Design Intern', company:'Tokopedia', startM:'6', startY:'2024', endM:'8', endY:'2024', present:false, ctx:"Seller onboarding had a 40% drop-off in the first step.", con:'Conducted 12 user interviews and produced 3 Figma iterations.', imp:'Reduced drop-off by 18%, onboarding 2,400 more sellers.', color:'blue' },
    { id:'e2', title:'VP of Design, Student Senate', company:'Universitas Indonesia', startM:'1', startY:'2023', endM:'12', endY:'2023', present:false, ctx:'Student senate lacked a consistent visual identity.', con:'Led 6 designers to rebrand the entire visual identity.', imp:'Produced all event materials and mobile app UI for 40,000 students.', color:'purple' },
  ],
  projects:[
    { id:'p1', name:'Tokopedia Seller Onboarding', tags:['UX Research','Figma','Prototyping'], url:'', caseStudy:'', cover:null },
    { id:'p2', name:'UI Senate Mobile App', tags:['Mobile','Design System'], url:'', caseStudy:'', cover:null },
  ],
  skills:['Figma','User Research','Prototyping','Design Systems','Usability Testing','Storytelling'],
  testimonials:[
    { id:'t1', quote:"Novita's attention to detail was exceptional. She quickly became a key contributor to our product team.", author:'Andi Pratama', role:'Product Manager · Tokopedia', color:'blue' },
  ],
  gallery:[], // { id, src, caption }
  education:[
    { id:'ed1', degree:'S1 Desain Komunikasi Visual', institution:'Universitas Indonesia', from:'2020', to:'2024', gpa:'3.8' },
  ],
  certifications:[
    { id:'c1', name:'Google UX Design Certificate', issuer:'Google · Coursera', year:'2023', url:'' },
  ],
  awards:[
    { id:'a1', title:'Best UI Design', org:'UI Hackathon 2023', year:'2023' },
  ],
  resume:{ file:null, filename:'', link:'', label:'Download CV' },
  contact:{ email:'novita@email.com', linkedin:'', github:'', dribbble:'', behance:'', website:'', whatsapp:'' },
  design:{ theme:'#3B82F6', font:'Bricolage Grotesque', layout:'minimal' },
};

const ALL_SECTIONS = [
  { id:'nav',           label:'Navigation',       icon:'🧭', meta:'Logo, links, CTA' },
  { id:'hero',          label:'Profile & Bio',    icon:'🧑‍💼', meta:'Name, headline, photo' },
  { id:'about',         label:'About Me',          icon:'👤', meta:'Bio paragraph' },
  { id:'experience',    label:'Experience',        icon:'💼', meta:'' },
  { id:'projects',      label:'Projects',          icon:'🚀', meta:'' },
  { id:'skills',        label:'Skills & Tools',    icon:'⚡', meta:'' },
  { id:'testimonials',  label:'Testimonials',      icon:'⭐', meta:'' },
  { id:'gallery',       label:'Gallery',           icon:'🖼️', meta:'' },
  { id:'education',     label:'Education',         icon:'🎓', meta:'' },
  { id:'certifications',label:'Certifications',    icon:'🏅', meta:'' },
  { id:'awards',        label:'Awards',            icon:'🏆', meta:'' },
  { id:'resume',        label:'Resume / CV',       icon:'📄', meta:'PDF or link' },
  { id:'contact',       label:'Contact & Links',   icon:'📬', meta:'Email, socials' },
];

let sections = [
  { id:'nav', active:true }, { id:'hero', active:true }, { id:'about', active:true },
  { id:'experience', active:true }, { id:'projects', active:true }, { id:'skills', active:true },
  { id:'testimonials', active:true }, { id:'contact', active:true },
];

const pages = [
  { id:'home', label:'Home', icon:'🏠', active:true },
  { id:'about-page', label:'About', icon:'👤', active:false },
  { id:'projects-page', label:'Projects', icon:'🚀', active:false },
  { id:'contact-page', label:'Contact', icon:'📬', active:false },
];

let activeEp = null;
let editExpId = null;
let editProjId = null;
let editTestiId = null;
let editEduId = null;
let editCertId = null;
let editAwardId = null;
let dragSrc = null;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ════════════════════════════════════════
   MONTH PICKER HELPERS
════════════════════════════════════════ */
function populateMonthPickers() {
  ['efStartM','efEndM'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">Month</option>` + MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
  });
  const yr = new Date().getFullYear();
  ['efStartY','efEndY'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">Year</option>`;
    for(let y=yr;y>=yr-40;y--) sel.innerHTML += `<option value="${y}">${y}</option>`;
  });
}

function togglePresent(cb){
  const endM = document.getElementById("efEndM");
  const endY = document.getElementById("efEndY");

  if(cb.checked){
    const now = new Date();
    endM.value = now.getMonth() + 1;
    endY.value = now.getFullYear();
    endM.disabled = true;
    endY.disabled = true;
  } else {
    endM.disabled = false;
    endY.disabled = false;
  }
}

function formatMonthYear(m, y) {
  if (!m || !y) return '';
  return MONTHS[parseInt(m)-1].slice(0,3) + ' ' + y;
}

/* ════════════════════════════════════════
   SECTION META UPDATE
════════════════════════════════════════ */
function secMeta(id) {
  switch(id) {
    case 'experience':   return S.experience.length + (S.experience.length===1?' entry':' entries');
    case 'projects':     return S.projects.length + (S.projects.length===1?' project':' projects');
    case 'skills':       return S.skills.length + ' skills';
    case 'testimonials': return S.testimonials.length + (S.testimonials.length===1?' entry':' entries');
    case 'gallery':      return S.gallery.length + ' images';
    case 'education':    return S.education.length + (S.education.length===1?' entry':' entries');
    case 'certifications':return S.certifications.length + (S.certifications.length===1?' cert':' certs');
    case 'awards':       return S.awards.length + (S.awards.length===1?' award':' awards');
    default: return ALL_SECTIONS.find(s=>s.id===id)?.meta || '';
  }
}

/* ════════════════════════════════════════
   RENDER SECTIONS LIST
════════════════════════════════════════ */
function renderSecList(containerId) {
  const html = sections.map((s,i) => {
    const def = ALL_SECTIONS.find(d=>d.id===s.id);
    if (!def) return '';
    return `<div class="si${s.id===activeEp?' on':''}"
      data-i="${i}" onclick="openEp('${s.id}')"
      draggable="true"
      ondragstart="dStart(event,${i})"
      ondragover="dOver(event,${i})"
      ondrop="dDrop(event,${i})"
      ondragleave="dLeave(event)">
      <span class="drag-h"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></span>
      <div class="si-icon">${def.icon}</div>
      <div class="si-info">
        <div class="si-name">${def.label}</div>
        <div class="si-meta">${secMeta(s.id)}</div>
      </div>
      <div class="si-actions">
        <button class="tog${s.active?' on':''}" onclick="toggleSec(event,${i})"></button>
      </div>
    </div>`;
  }).join('');
  document.getElementById(containerId).innerHTML = html;
}

function renderAll() {
  renderSecList('secList');
  renderSecList('mobSecList');
  renderPreview();
}

/* ════════════════════════════════════════
   DRAG & DROP
════════════════════════════════════════ */
function dStart(e,i){ dragSrc=i; e.target.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; }
function dOver(e,i){ e.preventDefault(); document.querySelectorAll('.si').forEach(el=>el.classList.remove('drag-over')); document.querySelectorAll('#secList .si')[i]?.classList.add('drag-over'); return false; }
function dLeave(e){ e.target.closest('.si')?.classList.remove('drag-over'); }
function dDrop(e,i){
  e.stopPropagation();
  if(dragSrc!==i){ const m=sections.splice(dragSrc,1)[0]; sections.splice(i,0,m); renderAll(); autoSave(); toast('Sections reordered'); }
  document.querySelectorAll('.si').forEach(el=>el.classList.remove('dragging','drag-over'));
  return false;
}

function toggleSec(e,i){
  e.stopPropagation();
  sections[i].active=!sections[i].active;
  renderAll(); autoSave();
  toast(sections[i].active ? ALL_SECTIONS.find(d=>d.id===sections[i].id)?.label+' shown' : ALL_SECTIONS.find(d=>d.id===sections[i].id)?.label+' hidden');
}

/* ════════════════════════════════════════
   EDIT PANELS
════════════════════════════════════════ */
function openEp(id) {
  activeEp = id;
  document.querySelectorAll('.ep').forEach(p=>p.classList.remove('on'));
  (document.getElementById('ep-'+id)||document.getElementById('ep-default')).classList.add('on');
  renderSecList('secList');
  populateEp(id);
  // mobile
  if(window.innerWidth<=900){
    document.getElementById('mobRTitle').textContent = ALL_SECTIONS.find(s=>s.id===id)?.label||'Edit';
    openMob('r');
  }
}

function closeEp() {
  activeEp = null;
  document.querySelectorAll('.ep').forEach(p=>p.classList.remove('on'));
  document.getElementById('ep-default').classList.add('on');
  renderSecList('secList');
}

function populateEp(id) {
  const p = S.profile;
  if(id==='hero'){
    document.getElementById('heroName').value = p.name;
    document.getElementById('heroHeadline').value = p.headline;
    document.getElementById('heroLoc').value = p.location;
    document.getElementById('heroOtw').value = p.openToWork ? '1' : '0';
    if(p.photo){ document.getElementById('heroPhotoPreview').style.display='flex'; document.getElementById('heroPhotoImg').src=p.photo; document.getElementById('heroPhotoZone').style.display='none'; }
    else{ document.getElementById('heroPhotoPreview').style.display='none'; document.getElementById('heroPhotoZone').style.display='block'; }
  }
  if(id==='about'){
    document.getElementById('aboutBio').value = S.about.bio;
    document.getElementById('bioCount').textContent = S.about.bio.length + ' / 500';
  }
  if(id==='nav'){
    document.getElementById('navLogo').value = S.nav.logo;
    document.getElementById('navCtaLabel').value = S.nav.cta.label;
    document.getElementById('navCtaUrl').value = S.nav.cta.url;
    renderNavLinks();
  }
  if(id==='contact'){
    const c = S.contact;
    document.getElementById('cEmail').value = c.email;
    document.getElementById('cLinkedIn').value = c.linkedin;
    document.getElementById('cGitHub').value = c.github;
    document.getElementById('cDribbble').value = c.dribbble||'';
    document.getElementById('cBehance').value = c.behance||'';
    document.getElementById('cWebsite').value = c.website;
    document.getElementById('cWA').value = c.whatsapp;
  }
  if(id==='experience') renderExpList();
  if(id==='projects') renderProjList();
  if(id==='skills') renderSkillTags();
  if(id==='testimonials') renderTestiPanel();
  if(id==='gallery') renderGalPanel();
  if(id==='education') renderEduList();
  if(id==='certifications') renderCertList();
  if(id==='awards') renderAwardList();
  if(id==='resume'){
    document.getElementById('resumeLink').value = S.resume.link;
    document.getElementById('resumeLabel').value = S.resume.label;
    if(S.resume.filename){ document.getElementById('resumeFileInfo').style.display='flex'; document.getElementById('resumeFileName').textContent=S.resume.filename; }
  }
}

/* ════════════════════════════════════════
   LIVE SYNC
════════════════════════════════════════ */
function liveSync(id) {
  if(id==='hero'){
    S.profile.name = document.getElementById('heroName').value;
    S.profile.headline = document.getElementById('heroHeadline').value;
    S.profile.location = document.getElementById('heroLoc').value;
    S.profile.openToWork = document.getElementById('heroOtw').value==='1';
  }
  if(id==='about') S.about.bio = document.getElementById('aboutBio').value;
  if(id==='nav'){
    S.nav.logo = document.getElementById('navLogo').value;
    S.nav.cta.label = document.getElementById('navCtaLabel').value;
    S.nav.cta.url = document.getElementById('navCtaUrl').value;
    syncNavLinks();
  }
  if(id==='contact'){
    S.contact.email = document.getElementById('cEmail').value;
    S.contact.linkedin = document.getElementById('cLinkedIn').value;
    S.contact.github = document.getElementById('cGitHub').value;
    S.contact.dribbble = document.getElementById('cDribbble').value;
    S.contact.behance = document.getElementById('cBehance').value;
    S.contact.website = document.getElementById('cWebsite').value;
    S.contact.whatsapp = document.getElementById('cWA').value;
  }
  if(id==='resume'){
    S.resume.link = document.getElementById('resumeLink').value;
    S.resume.label = document.getElementById('resumeLabel').value;
  }
  renderPreview(); autoSave();
}

function saveEp(name) { autoSave(); renderAll(); toast(name+' saved ✓','g'); }

/* ════════════════════════════════════════
   NAV LINKS
════════════════════════════════════════ */
function renderNavLinks() {
  document.getElementById('navLinksList').innerHTML = S.nav.links.map((l,i)=>`
    <div class="nl-item">
      <input class="fi" type="text" value="${esc(l.label)}" placeholder="Label" oninput="S.nav.links[${i}].label=this.value;liveSync('nav')" style="flex:1">
      <input class="fi" type="url" value="${esc(l.url)}" placeholder="URL" oninput="S.nav.links[${i}].url=this.value;liveSync('nav')" style="flex:1.2">
      <button class="nl-del" onclick="delNavLink(${i})">×</button>
    </div>`).join('');
}
function syncNavLinks() {
  const items = document.querySelectorAll('#navLinksList .nl-item');
  S.nav.links = [...items].map(item=>({ label:item.querySelectorAll('input')[0].value, url:item.querySelectorAll('input')[1].value }));
}
function addNavLink() {
  S.nav.links.push({ label:'New Link', url:'#' });
  renderNavLinks(); liveSync('nav');
}
function delNavLink(i) {
  S.nav.links.splice(i,1);
  renderNavLinks(); liveSync('nav');
}

/* ════════════════════════════════════════
   EXPERIENCE CRUD
════════════════════════════════════════ */
function renderExpList() {
  const dotColors = { blue:'var(--blue)', purple:'var(--purple)', green:'var(--green)', orange:'var(--orange)' };
  document.getElementById('expList').innerHTML = S.experience.map(e=>`
    <div class="ci" onclick="editExp('${e.id}')">
      <div style="width:7px;height:7px;border-radius:50%;background:${dotColors[e.color]||'var(--blue)'};flex-shrink:0;margin-top:5px"></div>
      <div class="ci-body">
        <div class="ci-title">${esc(e.title)}</div>
        <div class="ci-sub">${esc(e.company)} · ${fmtPeriod(e.startM,e.startY,e.endM,e.endY,e.present)}</div>
      </div>
      <button class="ci-del" onclick="delExp(event,'${e.id}')">×</button>
    </div>`).join('');
}
function openExpForm(){ editExpId=null; document.getElementById('expFormTitle').textContent='Add Experience'; clearExpForm(); document.getElementById('expForm').classList.add('open'); }
function closeExpForm(){ document.getElementById('expForm').classList.remove('open'); editExpId=null; }
function clearExpForm(){
  ['efTitle','efCompany','efCtx','efCon','efImp'].forEach(id=>document.getElementById(id).value='');
  ['efStartM','efStartY','efEndM','efEndY'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('efPresent').checked=false;
  document.getElementById('efEndM').disabled=false;
  document.getElementById('efEndY').disabled=false;
}
function editExp(id){
  const e = S.experience.find(x=>x.id===id); if(!e)return;
  editExpId=id; document.getElementById('expFormTitle').textContent='Edit Experience';
  document.getElementById('efTitle').value=e.title;
  document.getElementById('efCompany').value=e.company;
  document.getElementById('efStartM').value=e.startM||'';
  document.getElementById('efStartY').value=e.startY||'';
  document.getElementById('efEndM').value=e.endM||'';
  document.getElementById('efEndY').value=e.endY||'';
  document.getElementById('efPresent').checked=!!e.present;
  document.getElementById('efEndM').disabled=!!e.present;
  document.getElementById('efEndY').disabled=!!e.present;
  document.getElementById('efCtx').value=e.ctx||'';
  document.getElementById('efCon').value=e.con||'';
  document.getElementById('efImp').value=e.imp||'';
  document.getElementById('expForm').classList.add('open');
}
function saveExpItem(){
  const title=document.getElementById('efTitle').value.trim();
  const company=document.getElementById('efCompany').value.trim();
  if(!title||!company){ toast('Please enter title and company'); return; }
  const data={
    title, company,
    startM:document.getElementById('efStartM').value,
    startY:document.getElementById('efStartY').value,
    endM:document.getElementById('efEndM').value,
    endY:document.getElementById('efEndY').value,
    present:document.getElementById('efPresent').checked,
    ctx:document.getElementById('efCtx').value,
    con:document.getElementById('efCon').value,
    imp:document.getElementById('efImp').value,
    color:'blue',
  };
  if(editExpId){ const idx=S.experience.findIndex(x=>x.id===editExpId); S.experience[idx]={id:editExpId,...data}; }
  else{ data.id='e'+Date.now(); S.experience.push(data); }
  closeExpForm(); renderExpList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Experience saved ✓','g');
}
function delExp(e,id){ e.stopPropagation(); S.experience=S.experience.filter(x=>x.id!==id); renderExpList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   PROJECTS CRUD
════════════════════════════════════════ */
function renderProjList(){
  document.getElementById('projList').innerHTML = S.projects.map(p=>`
    <div class="ci" onclick="editProj('${p.id}')">
      ${p.cover?`<img src="${p.cover}" style="width:30px;height:30px;border-radius:6px;object-fit:cover;flex-shrink:0">`:'<div style="width:30px;height:30px;border-radius:6px;background:var(--blue-xl);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.8rem">🚀</div>'}
      <div class="ci-body">
        <div class="ci-title">${esc(p.name)}</div>
        <div class="ci-tags">${p.tags.map(t=>`<span class="pv-proj-tag">${esc(t)}</span>`).join('')}</div>
      </div>
      <button class="ci-del" onclick="delProj(event,'${p.id}')">×</button>
    </div>`).join('');
}
function openProjForm(){ editProjId=null; document.getElementById('projFormTitle').textContent='Add Project'; clearProjForm(); document.getElementById('projForm').classList.add('open'); }
function closeProjForm(){ document.getElementById('projForm').classList.remove('open'); editProjId=null; }
function clearProjForm(){
  document.getElementById('pfName').value=''; document.getElementById('pfUrl').value=''; document.getElementById('pfCase').value='';
  document.getElementById('pfTagsWrap').querySelectorAll('.tc').forEach(c=>c.remove());
  document.getElementById('pfCoverPreview').style.display='none'; document.getElementById('pfCoverZone').style.display='block';
}
function editProj(id){
  const p=S.projects.find(x=>x.id===id); if(!p)return;
  editProjId=id; document.getElementById('projFormTitle').textContent='Edit Project';
  document.getElementById('pfName').value=p.name;
  document.getElementById('pfUrl').value=p.url||'';
  document.getElementById('pfCase').value=p.caseStudy||'';
  const wrap=document.getElementById('pfTagsWrap');
  wrap.querySelectorAll('.tc').forEach(c=>c.remove());
  p.tags.forEach(t=>{ const c=document.createElement('span'); c.className='tc'; c.innerHTML=`${esc(t)}<button class="tc-x" onclick="rmTag(this)">×</button>`; wrap.insertBefore(c,wrap.querySelector('input')); });
  if(p.cover){ document.getElementById('pfCoverPreview').style.display='flex'; document.getElementById('pfCoverImg').src=p.cover; document.getElementById('pfCoverZone').style.display='none'; }
  else{ document.getElementById('pfCoverPreview').style.display='none'; document.getElementById('pfCoverZone').style.display='block'; }
  document.getElementById('projForm').classList.add('open');
}
function saveProjItem(){
  const name=document.getElementById('pfName').value.trim();
  if(!name){ toast('Enter a project name'); return; }
  const wrap=document.getElementById('pfTagsWrap');
  const tags=[...wrap.querySelectorAll('.tc')].map(c=>c.textContent.replace('×','').trim());
  const data={ name, tags, url:document.getElementById('pfUrl').value, caseStudy:document.getElementById('pfCase').value, cover:editProjId?S.projects.find(p=>p.id===editProjId)?.cover||null:null };
  if(editProjId){ const idx=S.projects.findIndex(p=>p.id===editProjId); S.projects[idx]={id:editProjId,...data}; }
  else{ data.id='p'+Date.now(); S.projects.push(data); }
  closeProjForm(); renderProjList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Project saved ✓','g');
}
function delProj(e,id){ e.stopPropagation(); S.projects=S.projects.filter(p=>p.id!==id); renderProjList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   SKILLS
════════════════════════════════════════ */
function renderSkillTags(){
  const wrap=document.getElementById('skillsWrap');
  wrap.querySelectorAll('.tc').forEach(c=>c.remove());
  S.skills.forEach(s=>{ const c=document.createElement('span'); c.className='tc'; c.innerHTML=`${esc(s)}<button class="tc-x" onclick="rmTag(this);syncSkills();renderPreview()">×</button>`; wrap.insertBefore(c,wrap.querySelector('input')); });
}
function syncSkills(){
  const wrap=document.getElementById('skillsWrap');
  S.skills=[...wrap.querySelectorAll('.tc')].map(c=>c.textContent.replace('×','').trim());
  renderSecList('secList');
}

/* ════════════════════════════════════════
   TESTIMONIALS CRUD
════════════════════════════════════════ */
function renderTestiPanel(){
  const dotColors={blue:'var(--blue)',purple:'var(--purple)',green:'var(--green)'};
  document.getElementById('testiList').innerHTML=S.testimonials.map(t=>`
    <div class="ci" onclick="editTesti('${t.id}')">
      <div style="width:26px;height:26px;border-radius:7px;background:${dotColors[t.color]||'var(--blue)'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:800;color:white">
        ${t.author.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div class="ci-body">
        <div class="ci-title">${esc(t.author)}</div>
        <div class="ci-sub">${esc(t.role)}</div>
      </div>
      <button class="ci-del" onclick="delTesti(event,'${t.id}')">×</button>
    </div>`).join('');
}
function openTestiForm(){ editTestiId=null; document.getElementById('testiFormTitle').textContent='Add Testimonial'; ['tfQuote','tfAuthor','tfRole'].forEach(id=>document.getElementById(id).value=''); document.getElementById('testiForm').classList.add('open'); }
function closeTestiForm(){ document.getElementById('testiForm').classList.remove('open'); editTestiId=null; }
function editTesti(id){
  const t=S.testimonials.find(x=>x.id===id); if(!t)return;
  editTestiId=id; document.getElementById('testiFormTitle').textContent='Edit Testimonial';
  document.getElementById('tfQuote').value=t.quote; document.getElementById('tfAuthor').value=t.author; document.getElementById('tfRole').value=t.role;
  document.getElementById('testiForm').classList.add('open');
}
function saveTestiItem(){
  const quote=document.getElementById('tfQuote').value.trim(); const author=document.getElementById('tfAuthor').value.trim();
  if(!quote||!author){ toast('Enter quote and author name'); return; }
  const data={quote,author,role:document.getElementById('tfRole').value,color:'blue'};
  if(editTestiId){ const idx=S.testimonials.findIndex(x=>x.id===editTestiId); S.testimonials[idx]={id:editTestiId,...data}; }
  else{ data.id='t'+Date.now(); S.testimonials.push(data); }
  closeTestiForm(); renderTestiPanel(); renderPreview(); autoSave(); renderSecList('secList'); toast('Testimonial saved ✓','g');
}
function delTesti(e,id){ e.stopPropagation(); S.testimonials=S.testimonials.filter(x=>x.id!==id); renderTestiPanel(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   GALLERY CRUD
════════════════════════════════════════ */
function renderGalPanel(){
  const grid=document.getElementById('galGrid');
  grid.innerHTML=S.gallery.map((g,i)=>`
    <div class="gal-thumb">
      <img src="${g.src}" alt="${esc(g.caption||'')}">
      <button class="gal-thumb-del" onclick="delGal(${i})">×</button>
    </div>`).join('');
  if(!S.gallery.length) grid.innerHTML='<div style="grid-column:1/-1;font-size:.68rem;color:var(--faint);text-align:center;padding:14px">No images yet</div>';
}
function handleGalUpload(input){
  const files=[...input.files];
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{ S.gallery.push({id:'g'+Date.now()+Math.random(),src:e.target.result,caption:''}); renderGalPanel(); renderPreview(); autoSave(); renderSecList('secList'); };
    reader.readAsDataURL(file);
  });
  input.value='';
}
function addGalUrl(){
  const url=document.getElementById('galUrlInput').value.trim();
  if(!url){ toast('Enter an image URL'); return; }
  S.gallery.push({id:'g'+Date.now(),src:url,caption:''});
  document.getElementById('galUrlInput').value='';
  renderGalPanel(); renderPreview(); autoSave(); renderSecList('secList'); toast('Image added','g');
}
function delGal(i){ S.gallery.splice(i,1); renderGalPanel(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   EDUCATION CRUD
════════════════════════════════════════ */
function renderEduList(){
  document.getElementById('eduList').innerHTML=S.education.map(e=>`
    <div class="ci" onclick="editEdu('${e.id}')">
      <div class="ci-body">
        <div class="ci-title">${esc(e.degree)}</div>
        <div class="ci-sub">${esc(e.institution)} · ${e.from}–${e.to}</div>
      </div>
      <button class="ci-del" onclick="delEdu(event,'${e.id}')">×</button>
    </div>`).join('');
}
function openEduForm(){ editEduId=null; document.getElementById('eduFormTitle').textContent='Add Education'; ['edDeg','edInst','edFrom','edTo','edGpa'].forEach(id=>document.getElementById(id).value=''); document.getElementById('eduForm').classList.add('open'); }
function closeEduForm(){ document.getElementById('eduForm').classList.remove('open'); editEduId=null; }
function editEdu(id){
  const e=S.education.find(x=>x.id===id); if(!e)return;
  editEduId=id; document.getElementById('eduFormTitle').textContent='Edit Education';
  document.getElementById('edDeg').value=e.degree; document.getElementById('edInst').value=e.institution;
  document.getElementById('edFrom').value=e.from; document.getElementById('edTo').value=e.to; document.getElementById('edGpa').value=e.gpa||'';
  document.getElementById('eduForm').classList.add('open');
}
function saveEduItem(){
  const degree=document.getElementById('edDeg').value.trim(); const inst=document.getElementById('edInst').value.trim();
  if(!degree||!inst){ toast('Enter degree and institution'); return; }
  const data={degree,institution:inst,from:document.getElementById('edFrom').value,to:document.getElementById('edTo').value,gpa:document.getElementById('edGpa').value};
  if(editEduId){ const idx=S.education.findIndex(x=>x.id===editEduId); S.education[idx]={id:editEduId,...data}; }
  else{ data.id='ed'+Date.now(); S.education.push(data); }
  closeEduForm(); renderEduList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Education saved ✓','g');
}
function delEdu(e,id){ e.stopPropagation(); S.education=S.education.filter(x=>x.id!==id); renderEduList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   CERTIFICATIONS CRUD
════════════════════════════════════════ */
function renderCertList(){
  document.getElementById('certList').innerHTML=S.certifications.map(c=>`
    <div class="ci" onclick="editCert('${c.id}')">
      <div class="ci-body">
        <div class="ci-title">${esc(c.name)}</div>
        <div class="ci-sub">${esc(c.issuer)} · ${c.year}</div>
      </div>
      <button class="ci-del" onclick="delCert(event,'${c.id}')">×</button>
    </div>`).join('');
}
function openCertForm(){ editCertId=null; document.getElementById('certFormTitle').textContent='Add Certification'; ['ctName','ctIssuer','ctYear','ctUrl'].forEach(id=>document.getElementById(id).value=''); document.getElementById('certForm').classList.add('open'); }
function closeCertForm(){ document.getElementById('certForm').classList.remove('open'); editCertId=null; }
function editCert(id){
  const c=S.certifications.find(x=>x.id===id); if(!c)return;
  editCertId=id; document.getElementById('certFormTitle').textContent='Edit Certification';
  document.getElementById('ctName').value=c.name; document.getElementById('ctIssuer').value=c.issuer; document.getElementById('ctYear').value=c.year; document.getElementById('ctUrl').value=c.url||'';
  document.getElementById('certForm').classList.add('open');
}
function saveCertItem(){
  const name=document.getElementById('ctName').value.trim(); const issuer=document.getElementById('ctIssuer').value.trim();
  if(!name||!issuer){ toast('Enter name and issuer'); return; }
  const data={name,issuer,year:document.getElementById('ctYear').value,url:document.getElementById('ctUrl').value};
  if(editCertId){ const idx=S.certifications.findIndex(x=>x.id===editCertId); S.certifications[idx]={id:editCertId,...data}; }
  else{ data.id='c'+Date.now(); S.certifications.push(data); }
  closeCertForm(); renderCertList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Certification saved ✓','g');
}
function delCert(e,id){ e.stopPropagation(); S.certifications=S.certifications.filter(x=>x.id!==id); renderCertList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   AWARDS CRUD
════════════════════════════════════════ */
function renderAwardList(){
  document.getElementById('awardList').innerHTML=S.awards.map(a=>`
    <div class="ci" onclick="editAward('${a.id}')">
      <div class="ci-body">
        <div class="ci-title">${esc(a.title)}</div>
        <div class="ci-sub">${esc(a.org)} · ${a.year}</div>
      </div>
      <button class="ci-del" onclick="delAward(event,'${a.id}')">×</button>
    </div>`).join('');
}
function openAwardForm(){ editAwardId=null; document.getElementById('awardFormTitle').textContent='Add Award'; ['awTitle','awOrg','awYear'].forEach(id=>document.getElementById(id).value=''); document.getElementById('awardForm').classList.add('open'); }
function closeAwardForm(){ document.getElementById('awardForm').classList.remove('open'); editAwardId=null; }
function editAward(id){
  const a=S.awards.find(x=>x.id===id); if(!a)return;
  editAwardId=id; document.getElementById('awardFormTitle').textContent='Edit Award';
  document.getElementById('awTitle').value=a.title; document.getElementById('awOrg').value=a.org; document.getElementById('awYear').value=a.year;
  document.getElementById('awardForm').classList.add('open');
}
function saveAwardItem(){
  const title=document.getElementById('awTitle').value.trim(); const org=document.getElementById('awOrg').value.trim();
  if(!title){ toast('Enter award title'); return; }
  const data={title,org,year:document.getElementById('awYear').value};
  if(editAwardId){ const idx=S.awards.findIndex(x=>x.id===editAwardId); S.awards[idx]={id:editAwardId,...data}; }
  else{ data.id='a'+Date.now(); S.awards.push(data); }
  closeAwardForm(); renderAwardList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Award saved ✓','g');
}
function delAward(e,id){ e.stopPropagation(); S.awards=S.awards.filter(x=>x.id!==id); renderAwardList(); renderPreview(); autoSave(); renderSecList('secList'); toast('Removed'); }

/* ════════════════════════════════════════
   PHOTO / FILE HANDLERS
════════════════════════════════════════ */
function triggerUpload(id){ document.getElementById(id).click(); }
function handleHeroPhoto(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{ S.profile.photo=e.target.result; document.getElementById('heroPhotoImg').src=e.target.result; document.getElementById('heroPhotoPreview').style.display='flex'; document.getElementById('heroPhotoZone').style.display='none'; renderPreview(); autoSave(); toast('Photo uploaded','g'); };
  reader.readAsDataURL(file); input.value='';
}
function removeHeroPhoto(){ S.profile.photo=null; document.getElementById('heroPhotoPreview').style.display='none'; document.getElementById('heroPhotoZone').style.display='block'; renderPreview(); autoSave(); }
function handleProjCover(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{ document.getElementById('pfCoverImg').src=e.target.result; document.getElementById('pfCoverPreview').style.display='flex'; document.getElementById('pfCoverZone').style.display='none'; if(editProjId){ const p=S.projects.find(x=>x.id===editProjId); if(p)p.cover=e.target.result; } };
  reader.readAsDataURL(file); input.value='';
}
function removeProjCover(){ document.getElementById('pfCoverPreview').style.display='none'; document.getElementById('pfCoverZone').style.display='block'; if(editProjId){ const p=S.projects.find(x=>x.id===editProjId); if(p)p.cover=null; } }
function handleResumeUpload(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{ S.resume.file=e.target.result; S.resume.filename=file.name; document.getElementById('resumeFileName').textContent=file.name; document.getElementById('resumeFileInfo').style.display='flex'; renderPreview(); autoSave(); toast('Resume uploaded','g'); };
  reader.readAsDataURL(file); input.value='';
}
function removeResume(){ S.resume.file=null; S.resume.filename=''; document.getElementById('resumeFileInfo').style.display='none'; renderPreview(); autoSave(); }

/* ════════════════════════════════════════
   TAGS INPUT
════════════════════════════════════════ */
function handleTag(e,wrapId){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const inp=e.target, val=inp.value.trim().replace(/,$/,'');
    if(!val)return;
    const wrap=document.getElementById(wrapId);
    const c=document.createElement('span'); c.className='tc';
    const extraClick = wrapId==='skillsWrap'?';syncSkills();renderPreview()':'';
    c.innerHTML=`${esc(val)}<button class="tc-x" onclick="rmTag(this)${extraClick}">×</button>`;
    wrap.insertBefore(c,inp); inp.value='';
    if(wrapId==='skillsWrap'){ syncSkills(); renderPreview(); }
    autoSave();
  }
}
function rmTag(btn){ btn.parentElement.remove(); autoSave(); }
function addSugg(text,wrapId){
  const wrap=document.getElementById(wrapId), inp=wrap.querySelector('.tag-i');
  const c=document.createElement('span'); c.className='tc';
  const extraClick = wrapId==='skillsWrap'?';syncSkills();renderPreview()':'';
  c.innerHTML=`${esc(text)}<button class="tc-x" onclick="rmTag(this)${extraClick}">×</button>`;
  wrap.insertBefore(c,inp);
  if(wrapId==='skillsWrap'){ syncSkills(); renderPreview(); }
  autoSave();
}

/* ════════════════════════════════════════
   ADD SECTION
════════════════════════════════════════ */
function openAddSec(){
  const active=new Set(sections.map(s=>s.id));
  const tiles=ALL_SECTIONS.filter(d=>!active.has(d.id)).map(d=>`
    <div class="tile" onclick="addSec('${d.id}')">
      <div class="t-ic">${d.icon}</div>
      <div class="t-n">${d.label}</div>
    </div>`).join('');
  document.getElementById('addSecTiles').innerHTML = tiles || '<div style="font-size:.78rem;color:var(--muted);text-align:center;padding:12px">All sections are already added!</div>';
  openModal('addSecModal');
}
function addSec(id){
  const def=ALL_SECTIONS.find(d=>d.id===id); if(!def)return;
  sections.push({id,active:true});
  closeModal('addSecModal');
  renderAll();
  openEp(id);
  autoSave();
  toast(def.label+' added ✓','g');
}

/* ════════════════════════════════════════
   PAGES
════════════════════════════════════════ */
function renderPageList(){
  document.getElementById('pageList').innerHTML=pages.map((p,i)=>`
    <div class="si${p.active?' on':''}">
      <div class="si-icon">${p.icon}</div>
      <div class="si-info"><div class="si-name">${p.label}</div><div class="si-meta">${p.active?'Active':'Draft'}</div></div>
      <div class="si-actions"><button class="tog${p.active?' on':''}" onclick="togglePage(${i})"></button></div>
    </div>`).join('');
}
function togglePage(i){ pages[i].active=!pages[i].active; renderPageList(); autoSave(); }
function addPage(){
  const label=prompt('Page name:'); if(!label)return;
  pages.push({id:'pg'+Date.now(),label,icon:'📄',active:false});
  renderPageList(); autoSave(); toast(label+' page added','g');
}

/* ════════════════════════════════════════
   DESIGN
════════════════════════════════════════ */
function setTheme(el,color){ document.querySelectorAll('.sw').forEach(s=>s.classList.remove('on')); el.classList.add('on'); S.design.theme=color; renderPreview(); autoSave(); }
function setFont(el,font){ document.querySelectorAll('.font-opt').forEach(b=>b.classList.remove('on')); el.classList.add('on'); S.design.font=font; renderPreview(); autoSave(); }
function setLayout(layout){
  ['minimal','bold'].forEach(l=>{ const el=document.getElementById('ly-'+l); el.style.borderColor=l===layout?'var(--blue)':'var(--g200)'; el.style.background=l===layout?'var(--blue-xl)':'var(--g50)'; el.querySelector('div:last-child').style.color=l===layout?'var(--blue)':'var(--muted)'; });
  S.design.layout=layout; autoSave();
}

/* ════════════════════════════════════════
   DEVICE SWITCHER
════════════════════════════════════════ */
function setDev(dev,btn){ document.querySelectorAll('.dev-btn').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); const f=document.getElementById('prevFrame'); f.classList.remove('tablet','mobile'); if(dev==='tablet')f.classList.add('tablet'); if(dev==='mobile')f.classList.add('mobile'); }

/* ════════════════════════════════════════
   PREVIEW RENDERER
════════════════════════════════════════ */
function renderPreview(){
  const t=S.design.theme, f=S.design.font;
  document.documentElement.style.setProperty('--pt',t);
  const html=sections.filter(s=>s.active).map(s=>{
    let inner='';
    switch(s.id){
      case 'nav':          inner=pvNav(); break;
      case 'hero':         inner=pvHero(); break;
      case 'about':        inner=pvAbout(); break;
      case 'experience':   inner=pvExp(); break;
      case 'projects':     inner=pvProj(); break;
      case 'skills':       inner=pvSkills(); break;
      case 'testimonials': inner=pvTesti(); break;
      case 'gallery':      inner=pvGallery(); break;
      case 'education':    inner=pvEdu(); break;
      case 'certifications':inner=pvCert(); break;
      case 'awards':       inner=pvAwards(); break;
      case 'resume':       inner=pvResume(); break;
      case 'contact':      inner=pvContact(); break;
      default: return '';
    }
    return `<div class="ps" onclick="openEp('${s.id}')"><div class="ps-hl"></div><button class="ps-btn">Edit</button>${inner}</div>`;
  }).join('');
  document.getElementById('prevContent').innerHTML=html;
}

function pvNav(){
  const n=S.nav, t=S.design.theme;
  const links=n.links.map(l=>`<span class="pv-nav-link">${esc(l.label)}</span>`).join('');
  const cta=n.cta.label?`<span class="pv-nav-cta" style="background:${t}">${esc(n.cta.label)}</span>`:'';
  return `<div class="pv-nav"><div class="pv-nav-logo" style="color:${t}">${esc(n.logo)}</div><div class="pv-nav-links">${links}</div>${cta}</div>`;
}
function pvHero(){
  const p=S.profile, t=S.design.theme, f=S.design.font;
  const initials=p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const av=p.photo?`<div class="pv-av"><img src="${p.photo}" alt="${esc(p.name)}"></div>`:`<div class="pv-av" style="background:linear-gradient(135deg,${t},${darken(t)})">${initials}</div>`;
  return `<div class="pv-hero">${av}<div class="pv-name" style="font-family:'${f}',sans-serif">${esc(p.name)}</div><div class="pv-role">${esc(p.headline)}</div><div class="pv-tags">${p.location?`<span class="pv-tag">📍 ${esc(p.location)}</span>`:''}${p.openToWork?`<span class="pv-tag otw">✓ Open to Work</span>`:''}</div></div>`;
}
function pvAbout(){ if(!S.about.bio)return''; return `<div class="pv-sec"><div class="pv-sec-title">About Me</div><div class="pv-bio">${esc(S.about.bio)}</div></div>`; }
function pvExp(){
  if(!S.experience.length)return`<div class="pv-sec"><div class="pv-sec-title">Experience</div><div style="font-size:.72rem;color:var(--faint);text-align:center;padding:10px 0">No experience added yet</div></div>`;
  const dc={blue:'var(--blue)',purple:'var(--purple)',green:'var(--green)',orange:'var(--orange)'};
  const items=S.experience.map((e,i)=>`
    <div class="pv-exp-item">
      <div class="pv-exp-dot-col"><div class="pv-exp-dot" style="background:${dc[e.color]||'var(--pt)'}"></div>${i<S.experience.length-1?'<div class="pv-exp-line"></div>':''}</div>
      <div class="pv-exp-body">
        <div class="pv-exp-title">${esc(e.title)}</div>
        <div class="pv-exp-company" style="color:var(--pt)">${esc(e.company)}</div>
        <div class="pv-exp-period">${fmtPeriod(e.startM,e.startY,e.endM,e.endY,e.present)}</div>
        <div class="pv-exp-desc">${esc([e.ctx,e.con,e.imp].filter(Boolean).join(' '))}</div>
      </div>
    </div>`).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Experience</div><div class="pv-exp-list">${items}</div></div>`;
}
function pvProj(){
  if(!S.projects.length)return`<div class="pv-sec"><div class="pv-sec-title">Projects</div><div style="font-size:.72rem;color:var(--faint);text-align:center;padding:10px 0">No projects added yet</div></div>`;
  const gs=['linear-gradient(135deg,#EFF6FF,#DBEAFE)','linear-gradient(135deg,#EDE9FE,#DDD6FE)','linear-gradient(135deg,#D1FAE5,#A7F3D0)','linear-gradient(135deg,#FEF3C7,#FDE68A)'];
  const cards=S.projects.map((p,i)=>{
    const href = p.caseStudy || p.url || null;
    const tag = href ? `a href="${esc(href)}" target="_blank" rel="noopener"` : 'div';
    const closeTag = href ? 'a' : 'div';
    return `
    <${tag} class="pv-proj-card" style="text-decoration:none;color:inherit;display:block;cursor:${href?'pointer':'default'}">
      <div class="pv-proj-thumb" style="${p.cover?`background:url(${p.cover}) center/cover`:`background:${gs[i%gs.length]}`}"></div>
      <div class="pv-proj-body">
        <div class="pv-proj-name">${esc(p.name)}</div>
        <div class="pv-proj-tags">${p.tags.map(t=>`<span class="pv-proj-tag">${esc(t)}</span>`).join('')}</div>
        ${href?`<div style="margin-top:6px;font-size:.62rem;font-weight:700;color:var(--pt);opacity:.8">→ ${p.caseStudy?'Case Study':'Live Demo'}</div>`:''}
      </div>
    </${closeTag}>`;
  }).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Projects</div><div class="pv-proj-grid">${cards}</div></div>`;
}
function pvSkills(){
  if(!S.skills.length)return`<div class="pv-sec"><div class="pv-sec-title">Skills & Tools</div><div style="font-size:.72rem;color:var(--faint)">No skills added yet</div></div>`;
  const cs=['c0','c0','c0','c1','c1','c2','c2','c3'];
  return `<div class="pv-sec"><div class="pv-sec-title">Skills & Tools</div><div class="pv-skills">${S.skills.map((s,i)=>`<span class="pv-skill ${cs[i%cs.length]}">${esc(s)}</span>`).join('')}</div></div>`;
}
function pvTesti(){
  if(!S.testimonials.length)return`<div class="pv-sec"><div class="pv-sec-title">Testimonials</div><div style="font-size:.72rem;color:var(--faint)">No testimonials added yet</div></div>`;
  const dc={blue:'var(--blue)',purple:'var(--purple)',green:'var(--green)'};
  const cards=S.testimonials.map(t=>`
    <div class="pv-testi-card">
      <div class="pv-testi-q">"${esc(t.quote)}"</div>
      <div class="pv-testi-auth">
        <div class="pv-testi-av" style="background:${dc[t.color]||'var(--pt)'}}">${t.author.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
        <div><div class="pv-testi-name">${esc(t.author)}</div><div class="pv-testi-role">${esc(t.role)}</div></div>
      </div>
    </div>`).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Testimonials</div><div class="pv-testi-list">${cards}</div></div>`;
}
function pvGallery(){
  const items=S.gallery.length?S.gallery.slice(0,9).map(g=>`<div class="pv-gal-item"><img src="${g.src}" alt="${esc(g.caption||'')}"></div>`).join(''):Array(6).fill(0).map((_,i)=>{const bgs=['#EFF6FF','#EDE9FE','#D1FAE5','#FEF3C7','#FEE2E2','#F0FDF4'];return `<div class="pv-gal-item pv-gal-empty" style="background:${bgs[i]}">📷</div>`;}).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Gallery</div><div class="pv-gallery">${items}</div></div>`;
}
function pvEdu(){
  if(!S.education.length)return`<div class="pv-sec"><div class="pv-sec-title">Education</div><div style="font-size:.72rem;color:var(--faint)">No education added yet</div></div>`;
  const items=S.education.map(e=>`
    <div class="pv-edu-item">
      <div class="pv-edu-icon">🎓</div>
      <div class="pv-edu-body">
        <div class="pv-edu-deg">${esc(e.degree)}</div>
        <div class="pv-edu-inst" style="color:var(--pt)">${esc(e.institution)}</div>
        <div class="pv-edu-year">${e.from}–${e.to}${e.gpa?' · GPA '+e.gpa:''}</div>
      </div>
    </div>`).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Education</div><div class="pv-edu-list">${items}</div></div>`;
}
function pvCert(){
  if(!S.certifications.length)return`<div class="pv-sec"><div class="pv-sec-title">Certifications</div><div style="font-size:.72rem;color:var(--faint)">No certifications added yet</div></div>`;
  const items=S.certifications.map(c=>`
    <div class="pv-cert-item">
      <div class="pv-cert-icon">🏅</div>
      <div class="pv-cert-body"><div class="pv-cert-name">${esc(c.name)}</div><div class="pv-cert-issuer">${esc(c.issuer)} · ${c.year}</div></div>
    </div>`).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Certifications</div><div class="pv-cert-list">${items}</div></div>`;
}
function pvAwards(){
  if(!S.awards.length)return`<div class="pv-sec"><div class="pv-sec-title">Awards</div><div style="font-size:.72rem;color:var(--faint)">No awards added yet</div></div>`;
  const items=S.awards.map(a=>`
    <div class="pv-award-item">
      <div class="pv-award-icon">🏆</div>
      <div><div class="pv-award-title">${esc(a.title)}</div><div class="pv-award-org">${esc(a.org)} · ${a.year}</div></div>
    </div>`).join('');
  return `<div class="pv-sec"><div class="pv-sec-title">Awards</div><div class="pv-award-list">${items}</div></div>`;
}
function pvResume(){
  const r=S.resume, t=S.design.theme;
  const hasFile=r.file||r.link;
  return `<div class="pv-sec"><div class="pv-sec-title">Resume / CV</div>${hasFile?`<a href="${r.link||r.file||'#'}" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:9px;background:${t};color:white;text-decoration:none;font-size:.78rem;font-weight:700">📄 ${esc(r.label||'Download CV')}</a>`:`<div style="font-size:.72rem;color:var(--faint)">Upload your resume to show a download button.</div>`}</div>`;
}
function pvContact(){
  const c=S.contact, t=S.design.theme;
  const chips=[];
  const chipStyle=`display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:8px;background:var(--g50);border:1.5px solid var(--g200);font-size:.7rem;font-weight:600;text-decoration:none;color:var(--ink)`;
  if(c.email)chips.push(`<a href="mailto:${esc(c.email)}" class="pv-contact-chip" style="${chipStyle}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${esc(c.email)}</a>`);
  if(c.linkedin)chips.push(`<a href="${esc(c.linkedin)}" target="_blank" class="pv-contact-chip" style="${chipStyle}"><svg width="11" height="11" viewBox="0 0 24 24" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>LinkedIn</a>`);
  if(c.github)chips.push(`<a href="${esc(c.github)}" target="_blank" class="pv-contact-chip" style="${chipStyle}"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>GitHub</a>`);
  if(c.dribbble)chips.push(`<a href="${esc(c.dribbble)}" target="_blank" class="pv-contact-chip" style="${chipStyle}"><svg width="11" height="11" viewBox="0 0 24 24" fill="#EA4C89"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.39 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-9.777-2.963c.389-.75 2.896-5.285 8.13-6.973.092-.03.184-.062.276-.09-.17-.388-.352-.782-.53-1.17C8.12 11.683 2.498 11.76 2.059 11.76c-.008.135-.013.273-.013.41 0 2.29.868 4.382 2.287 5.976zM3.023 9.498c.448.01 5.69.075 11.213-1.49-.45-.808-.94-1.607-1.447-2.39-3.517 1.05-7.33 1.024-9.77.99-.01.156-.017.316-.017.477 0 .872.01 1.724.021 2.413zm9.61-6.62c.456.773.945 1.57 1.395 2.378 3.34-.99 4.787-2.5 4.95-2.673C17.638 1.43 15.95.624 14.08.166c-1.483.38-3.27 1.025-4.845 1.878l.398 1.834zm8.14.73c-.21.226-1.82 1.857-5.284 2.997.234.493.46 1 .678 1.508.07.167.142.34.213.51 3.41-.43 6.8.26 7.14.325-.016-1.95-.554-3.77-1.46-5.34h-.288z"/></svg>Dribbble</a>`);
  if(c.website)chips.push(`<a href="${esc(c.website)}" target="_blank" class="pv-contact-chip" style="${chipStyle}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Website</a>`);
  if(!chips.length)chips.push(`<span class="pv-contact-chip" style="${chipStyle}">No contact info yet</span>`);
  return `<div class="pv-sec"><div class="pv-sec-title">Get in Touch</div><div class="pv-contact">${chips.join('')}</div></div>`;
}

/* ════════════════════════════════════════
   PUBLISH MODAL
════════════════════════════════════════ */
function openPubModal(){
  const p=S.profile;
  const checks=[
    {ok:!!p.name,text:'Name set',sub:p.name||'Add your name'},
    {ok:!!p.headline,text:'Headline added',sub:p.headline||'Add a headline'},
    {ok:!!S.about.bio,text:'About Me written',sub:S.about.bio?'Looks great!':'Add a bio'},
    {ok:S.projects.length>0,text:'At least 1 project',sub:S.projects.length+' project(s)'},
    {ok:!!S.contact.email,text:'Email set',sub:S.contact.email||'Add email'},
  ];
  document.getElementById('pubChecks').innerHTML=checks.map(c=>`<div class="pub-check"><div class="pub-ic ${c.ok?'p':'f'}">${c.ok?'✓':'!'}</div><div><div class="pub-ct">${c.text}</div><div class="pub-cs">${c.sub}</div></div></div>`).join('');
  const slug=(p.name||'portfolio').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  document.getElementById('pubUrlT').textContent=`portomaker.app/u/${slug}`;
  openModal('pubModal');
}
function confirmPublish(){ closeModal('pubModal'); toast('Portfolio published! 🎉','g'); document.querySelector('.t-pub').innerHTML=`<svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg><span>Published ●</span>`; }

/* ════════════════════════════════════════
   MODAL HELPERS
════════════════════════════════════════ */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

/* ════════════════════════════════════════
   EDITOR TAB SWITCHING
   (renamed dari switchTab → switchEditorTab
   supaya tidak conflict dengan auth switchTab)
════════════════════════════════════════ */
function switchEditorTab(tab, btn){
  document.querySelectorAll('.p-tab').forEach(t=>t.classList.remove('on')); btn.classList.add('on');
  const tabs={sec:'contents',pages:'flex',design:'flex'};
  Object.keys(tabs).forEach(t=>{
    const el=document.getElementById('tab-'+t);
    el.style.display=t===tab?(tabs[t]==='flex'?'flex':'contents'):'none';
    if(t===tab&&tabs[t]==='flex'){ el.style.flexDirection='column'; el.style.flex='1'; el.style.overflow='hidden'; }
  });
  if(tab==='pages') renderPageList();
}

/* ════════════════════════════════════════
   MOBILE PANELS
════════════════════════════════════════ */
function openMob(side){ document.getElementById('mobOv').classList.add('open'); document.getElementById(side==='l'?'mobPanelL':'mobPanelR').classList.add('open'); }
function closeMob(){ document.getElementById('mobOv').classList.remove('open'); document.getElementById('mobPanelL').classList.remove('open'); document.getElementById('mobPanelR').classList.remove('open'); }

/* ════════════════════════════════════════
   PREVIEW & SHARE
════════════════════════════════════════ */
function openPreviewTab(){
  const t = S.design.theme;
  const f = S.design.font;

  const bodySections = sections
    .filter(s => s.active)
    .map(s => {
      switch(s.id){
        case 'nav':           return pvNav();
        case 'hero':          return pvHero();
        case 'about':         return pvAbout();
        case 'experience':    return pvExp();
        case 'projects':      return pvProj();
        case 'skills':        return pvSkills();
        case 'testimonials':  return pvTesti();
        case 'gallery':       return pvGallery();
        case 'education':     return pvEdu();
        case 'certifications':return pvCert();
        case 'awards':        return pvAwards();
        case 'resume':        return pvResume();
        case 'contact':       return pvContact();
        default: return '';
      }
    }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(S.profile.name || 'Portfolio')} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap" rel="stylesheet">
<style>
  :root {
    --pt: ${t};
    --blue: ${t};
    --blue-d: ${darken(t)};
    --blue-xl: ${t}18;
    --blue-l: ${t}30;
    --purple: #8B5CF6; --purple-l: #EDE9FE;
    --green: #10B981;  --green-l: #D1FAE5;
    --orange: #F59E0B; --orange-l: #FEF3C7;
    --red: #EF4444;    --red-l: #FEE2E2;
    --ink: #0F172A; --muted: #64748B; --faint: #94A3B8;
    --g50: #F8FAFC; --g100: #F1F5F9; --g200: #E2E8F0; --g300: #CBD5E1;
    --white: #fff;
    --r: 10px; --rl: 16px;
    --s1: 0 1px 3px rgba(0,0,0,.06);
    --s2: 0 4px 16px rgba(0,0,0,.08);
    --s3: 0 12px 40px rgba(0,0,0,.12);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--g50); color: var(--ink); line-height: 1.5; font-size: 15px; }
  h1,h2,h3,h4 { font-family: '${f}', 'Bricolage Grotesque', sans-serif; line-height: 1.2; }
  a { color: inherit; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 4px; }

  .portfolio-wrap { max-width: 720px; margin: 0 auto; background: white; min-height: 100vh; box-shadow: var(--s3); }

  /* NAV */
  .pv-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 36px; border-bottom: 1px solid var(--g100); position: sticky; top: 0; background: white; z-index: 100; backdrop-filter: blur(8px); }
  .pv-nav-logo { font-family: '${f}', sans-serif; font-weight: 800; font-size: 1.05rem; }
  .pv-nav-links { display: flex; gap: 22px; }
  .pv-nav-link { font-size: .82rem; font-weight: 600; color: var(--muted); text-decoration: none; transition: color .15s; }
  .pv-nav-link:hover { color: var(--pt); }
  .pv-nav-cta { padding: 7px 16px; border-radius: 8px; font-size: .78rem; font-weight: 700; color: white; text-decoration: none; transition: opacity .15s; }
  .pv-nav-cta:hover { opacity: .85; }

  /* HERO */
  .pv-hero { padding: 52px 36px 36px; }
  .pv-av { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-family: '${f}', sans-serif; font-weight: 800; font-size: 1.2rem; color: white; margin-bottom: 18px; flex-shrink: 0; overflow: hidden; }
  .pv-av img { width: 64px; height: 64px; object-fit: cover; }
  .pv-name { font-size: 2.2rem; font-weight: 800; margin-bottom: 6px; }
  .pv-role { font-size: .95rem; color: var(--muted); margin-bottom: 16px; }
  .pv-tags { display: flex; gap: 8px; flex-wrap: wrap; }
  .pv-tag { padding: 4px 12px; border-radius: 100px; font-size: .74rem; font-weight: 600; background: var(--g100); color: var(--muted); border: 1px solid var(--g200); }
  .pv-tag.otw { background: var(--green-l); color: var(--green); border-color: rgba(16,185,129,.25); }

  /* SECTIONS */
  .pv-sec { padding: 32px 36px; border-top: 1px solid var(--g100); }
  .pv-sec-title { font-size: .65rem; font-weight: 700; color: var(--faint); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 16px; }
  .pv-bio { font-size: .92rem; color: #475569; line-height: 1.8; }

  /* EXPERIENCE */
  .pv-exp-list { display: flex; flex-direction: column; gap: 20px; }
  .pv-exp-item { display: flex; gap: 14px; }
  .pv-exp-dot-col { display: flex; flex-direction: column; align-items: center; padding-top: 5px; }
  .pv-exp-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .pv-exp-line { flex: 1; width: 1px; background: var(--g200); margin-top: 5px; }
  .pv-exp-body { flex: 1; }
  .pv-exp-title { font-size: .88rem; font-weight: 700; }
  .pv-exp-company { font-size: .8rem; font-weight: 600; margin-top: 2px; }
  .pv-exp-period { font-size: .72rem; color: var(--faint); margin: 4px 0 8px; }
  .pv-exp-desc { font-size: .82rem; color: #64748B; line-height: 1.7; }

  /* PROJECTS */
  .pv-proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  .pv-proj-card { border-radius: var(--r); border: 1.5px solid var(--g200); overflow: hidden; transition: all .18s; text-decoration: none; color: inherit; display: block; }
  .pv-proj-card:hover { border-color: var(--pt); box-shadow: var(--s2); transform: translateY(-3px); }
  .pv-proj-thumb { height: 90px; background-size: cover; background-position: center; }
  .pv-proj-body { padding: 10px 12px; }
  .pv-proj-name { font-size: .82rem; font-weight: 700; margin-bottom: 6px; }
  .pv-proj-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .pv-proj-tag { font-size: .64rem; font-weight: 600; padding: 2px 8px; border-radius: 100px; background: var(--blue-xl); color: var(--pt); }

  /* SKILLS */
  .pv-skills { display: flex; flex-wrap: wrap; gap: 8px; }
  .pv-skill { padding: 6px 14px; border-radius: 100px; font-size: .78rem; font-weight: 700; }
  .pv-skill.c0 { background: var(--blue-xl); color: var(--pt); }
  .pv-skill.c1 { background: var(--purple-l); color: var(--purple); }
  .pv-skill.c2 { background: var(--green-l); color: var(--green); }
  .pv-skill.c3 { background: var(--orange-l); color: var(--orange); }

  /* TESTIMONIALS */
  .pv-testi-list { display: flex; flex-direction: column; gap: 14px; }
  .pv-testi-card { background: var(--g50); border: 1.5px solid var(--g200); border-radius: var(--r); padding: 16px; }
  .pv-testi-q { font-size: .86rem; color: #475569; line-height: 1.8; margin-bottom: 12px; font-style: italic; }
  .pv-testi-auth { display: flex; align-items: center; gap: 9px; }
  .pv-testi-av { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 800; color: white; flex-shrink: 0; }
  .pv-testi-name { font-size: .8rem; font-weight: 700; }
  .pv-testi-role { font-size: .68rem; color: var(--muted); }

  /* GALLERY */
  .pv-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .pv-gal-item { aspect-ratio: 1; border-radius: 9px; overflow: hidden; background: var(--g100); }
  .pv-gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
  .pv-gal-item:hover img { transform: scale(1.04); }
  .pv-gal-empty { display: flex; align-items: center; justify-content: center; font-size: .72rem; color: var(--faint); }

  /* EDUCATION */
  .pv-edu-list { display: flex; flex-direction: column; gap: 16px; }
  .pv-edu-item { display: flex; gap: 12px; align-items: flex-start; }
  .pv-edu-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--g100); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .pv-edu-body { flex: 1; }
  .pv-edu-deg { font-size: .88rem; font-weight: 700; }
  .pv-edu-inst { font-size: .78rem; font-weight: 600; margin-top: 2px; }
  .pv-edu-year { font-size: .7rem; color: var(--faint); margin-top: 3px; }

  /* CERT & AWARDS */
  .pv-cert-list, .pv-award-list { display: flex; flex-direction: column; gap: 10px; }
  .pv-cert-item, .pv-award-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r); border: 1.5px solid var(--g200); }
  .pv-award-item { background: var(--g50); }
  .pv-cert-icon, .pv-award-icon { font-size: 1.3rem; flex-shrink: 0; }
  .pv-cert-name, .pv-award-title { font-size: .84rem; font-weight: 700; }
  .pv-cert-issuer, .pv-award-org { font-size: .7rem; color: var(--muted); margin-top: 2px; }

  /* CONTACT */
  .pv-contact { display: flex; flex-wrap: wrap; gap: 8px; }
  .pv-contact-chip { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; background: var(--g50); border: 1.5px solid var(--g200); font-size: .78rem; font-weight: 600; text-decoration: none; color: var(--ink); transition: all .15s; }
  .pv-contact-chip:hover { border-color: var(--pt); color: var(--pt); background: var(--blue-xl); }

  /* FOOTER */
  .pv-footer { padding: 28px 36px; border-top: 1px solid var(--g100); text-align: center; font-size: .7rem; color: var(--faint); }

  @media(max-width: 600px){
    .pv-nav { padding: 14px 20px; }
    .pv-nav-links { display: none; }
    .pv-hero, .pv-sec { padding-left: 20px; padding-right: 20px; }
    .pv-name { font-size: 1.7rem; }
    .pv-proj-grid { grid-template-columns: 1fr 1fr; }
    .pv-gallery { grid-template-columns: repeat(3,1fr); gap: 6px; }
  }
</style>
</head>
<body>
<div class="portfolio-wrap">
${bodySections}
<div class="pv-footer">Made with PortoMaker ✦</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  if (!tab) toast('Pop-up diblokir browser, izinkan dulu ya!', '');
  else toast('Preview dibuka di tab baru ✓', 'g');
}
function copyShareLink(){ if(navigator.clipboard)navigator.clipboard.writeText('https://portomaker.app/u/'+S.profile.name.toLowerCase().replace(/\s+/g,'-')).then(()=>toast('Link copied!','g')); else toast('Link copied!','g'); }

/* ════════════════════════════════════════
   AUTO SAVE → LOCALSTORAGE
════════════════════════════════════════ */
let saveT;
function autoSave(){
  setSavePill('saving');
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    saveToLocal();
    setSavePill('saved');
  }, 600);
}

function setSavePill(state){
  const pill=document.getElementById('savePill'), dot=document.getElementById('saveDot'), txt=document.getElementById('saveText');
  if(!pill) return;
  if(state==='saving'){ pill.className='save-pill saving'; dot.className='save-dot saving'; txt.textContent='Saving...'; }
  if(state==='saved'){  pill.className='save-pill saved';  dot.className='save-dot saved';  txt.textContent='Saved'; }
  if(state==='error'){  pill.className='save-pill saving'; dot.className='save-dot saving'; txt.textContent='Error!'; }
}




/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
let tT;
function toast(msg,c=''){
  const el=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  el.className='toast'+(c?' '+c:'');
  el.classList.add('show');
  clearTimeout(tT); tT=setTimeout(()=>el.classList.remove('show'),2200);
}

/* ════════════════════════════════════════
   HELPERS
════════════════════════════════════════ */
function esc(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function darken(hex){ try{ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`; }catch{ return hex; } }
function fmtPeriod(sm,sy,em,ey,present){
  const f=(m,y)=>{ if(!m||!y)return''; return MONTHS[parseInt(m)-1].slice(0,3)+' '+y; };
  const start=f(sm,sy), end=present?'Present':(em&&ey?f(em,ey):'');
  if(!start)return'';
  const dur=()=>{
    if(!end||end==='Present')return'';
    try{ const s=new Date(sy,sm-1),e=new Date(ey,ey==='Present'?11:em-1); const ms=(e.getFullYear()-s.getFullYear())*12+e.getMonth()-s.getMonth(); if(ms<12)return` · ${ms} mo`; const y=Math.floor(ms/12),r=ms%12; return` · ${y}y${r?' '+r+'m':''}`; }catch{ return''; }
  };
  return start+(end?` – ${end}${dur()}`:'');
}

document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='s'){ e.preventDefault(); autoSave(); toast('Saved ✓','g'); } if(e.key==='Escape'){ closeEp(); closeMob(); ['addSecModal','pubModal'].forEach(closeModal); } });

/* ════════════════════════════════════════
   SEED FROM SESSION (auth → editor)
   sessionStorage SELALU menang —
   nama & email dari login di-apply
   setiap kali editor dibuka, terlepas
   dari apa yang ada di localStorage.
════════════════════════════════════════ */
function seedFromSession() {
  try {
    const raw = sessionStorage.getItem('pm_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    if (!user) return;

    const name  = user.name  || '';
    const email = user.email || '';

    // Nama → selalu override profile & nav logo
    if (name) {
      S.profile.name = name;
      S.nav.logo     = name.split(' ')[0]; // first name buat logo
    }

    // Email → selalu override contact email
    if (email) {
      S.contact.email = email;
    }

    // Update breadcrumb title di topbar
    const tTitle = document.getElementById('tTitle');
    if (tTitle && name) tTitle.textContent = name + "'s Portfolio";

  } catch(e) {
    console.warn('seedFromSession error:', e);
  }
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
populateMonthPickers();
(() => {
  // 1. Load data tersimpan dari localStorage (kalau ada)
  const loaded = loadFromLocal();
  if (loaded) setSavePill('saved');

  // 2. SELALU override nama & email dengan data dari sessionStorage
  //    supaya data login user selalu sinkron dengan editor
  seedFromSession();

  renderAll();
  renderPageList();
  renderPreview();
})();