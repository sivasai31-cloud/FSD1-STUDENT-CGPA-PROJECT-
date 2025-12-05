/* Modern multi-student CGPA manager with Chart.js + tsParticles + interactions */

const STORAGE_KEY = 'fsd1_students_v3';
let students = [];
let currentId = null;
let chart = null;

// DOM refs
let studentSelect, studentForm, cgpaForm, cgpaBody, overallEl, studentPreview;
let deleteBtn, exportBtn, clearBtn, themeToggle;

// tiny helper
const uid = () => 'id-' + Math.random().toString(36).slice(2,9);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } };

// ------ tsParticles init (confetti-like burst) ------
function particlesBurst(x=null,y=null) {
  if (!window.tsParticles) return;
  // emit a short burst at given position (screen coords)
  const emitterOptions = {
    particles: { size: { value: { min: 3, max: 7 } }, move: { speed: { min: 4, max: 8 }, decay: 0.05 }, life: { duration: { sync: false, value: 0.8 } } },
    emitters: [{ life: { count: 1, duration: 0.25 }, rate: { delay: 0, quantity: 12 } }]
  };
  // use tsparticles to load a temporary container
  const id = 'tmp-emitter-' + Date.now();
  const div = document.createElement('div'); div.id = id; div.style.position='fixed'; div.style.left='0'; div.style.top='0'; div.style.width='100%'; div.style.height='100%'; div.style.pointerEvents='none';
  document.body.appendChild(div);
  tsParticles.load(id, {
    fpsLimit: 60,
    background: { color: 'transparent' },
    particles: { color: {value: ['#ffd166','#06d6a0','#118ab2','#ef476f'] }, number: { value: 0 }, move: { direction: 'none', outModes: 'destroy' } },
    emitters: { direction: 'none', position: { x: x===null?50:(x/window.innerWidth*100), y: y===null?50:(y/window.innerHeight*100) }, rate: { quantity: 12, delay: 0 }, size: { width: 0, height: 0 } }
  }).then(container => {
    setTimeout(()=>{ container.destroy(); div.remove(); }, 900);
  });
}

// ------ init UI & app ------
document.addEventListener('DOMContentLoaded', () => {
  studentSelect = document.getElementById('studentSelect');
  studentForm = document.getElementById('studentForm');
  cgpaForm = document.getElementById('cgpaForm');
  cgpaBody = document.getElementById('cgpaBody');
  overallEl = document.getElementById('overallCgpa');
  studentPreview = document.getElementById('studentPreview');

  deleteBtn = document.getElementById('deleteStudent');
  exportBtn = document.getElementById('exportCsv');
  clearBtn = document.getElementById('clearStudent');
  themeToggle = document.getElementById('themeToggle');

  students = load();
  if (students.length === 0) {
    students = [{ id: uid(), name:'Siva Sai', college:'Narasaraopet Engineering College', branch:'CSE - AI', batch:'2024 - 2028', semesters:[{sem:1,cgpa:6.8}] }];
    save();
  }

  currentId = students[0].id;
  populateStudentSelect();
  initChart();
  renderCurrent();

  // restore theme
  try { if (localStorage.getItem('darkMode') === '1') document.documentElement.classList.add('dark'); } catch(e){}

  // listeners
  studentForm.addEventListener('submit', handleStudentForm);
  studentSelect.addEventListener('change', () => { currentId = studentSelect.value; renderCurrent(); });
  cgpaForm.addEventListener('submit', handleCgpaForm);
  deleteBtn.addEventListener('click', handleDeleteStudent);
  exportBtn.addEventListener('click', handleExportCsv);
  clearBtn.addEventListener('click', handleClearStudent);
  themeToggle.addEventListener('click', toggleTheme);

  // ripple effect for buttons (pure CSS handles visual scale, but make ripple center)
  document.body.addEventListener('pointerdown', (ev) => {
    const t = ev.target.closest('.ripple');
    if (!t) return;
    const rect = t.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const span = document.createElement('span');
    span.style.position='absolute'; span.style.left = x+'px'; span.style.top = y+'px';
    span.style.width = span.style.height = Math.max(rect.width,rect.height)*1.5 + 'px';
    span.style.background='rgba(255,255,255,0.18)'; span.style.borderRadius='50%'; span.style.transform='translate(-50%,-50%) scale(0)';
    span.style.transition='transform .5s, opacity .6s'; t.appendChild(span);
    requestAnimationFrame(()=> span.style.transform='translate(-50%,-50%) scale(1)');
    setTimeout(()=>{ span.style.opacity='0'; setTimeout(()=>span.remove(),600); },650);
  }, {passive:true});
});

// --- populate select
function populateStudentSelect(){
  studentSelect.innerHTML='';
  students.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name + ' — ' + s.branch;
    studentSelect.appendChild(o);
  });
  studentSelect.value = currentId;
}

// --- render
function renderCurrent() {
  const s = students.find(x => x.id === currentId);
  if (!s) return;
  studentPreview.innerHTML = `<strong>${s.name}</strong><div class="muted">${s.college} • ${s.branch} • ${s.batch}</div>`;

  // table
  cgpaBody.innerHTML = '';
  s.semesters.sort((a,b)=>a.sem-b.sem).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.sem}</td><td>${parseFloat(row.cgpa).toFixed(2)}</td>`;
    tr.style.opacity = 0; tr.style.transform = 'translateY(6px)';
    cgpaBody.appendChild(tr);
    requestAnimationFrame(()=> { tr.style.transition = 'opacity .32s, transform .32s'; tr.style.opacity=1; tr.style.transform='translateY(0)'; });
  });

  const avg = s.semesters.length ? s.semesters.reduce((a,b)=>a+parseFloat(b.cgpa),0)/s.semesters.length : 0;
  overallEl.textContent = avg ? avg.toFixed(2) : '0.00';
  updateChart(s);

  // fill form
  document.getElementById('name').value = s.name;
  document.getElementById('college').value = s.college;
  document.getElementById('branch').value = s.branch;
  document.getElementById('batch').value = s.batch;
}

// --- student form
function handleStudentForm(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const college = document.getElementById('college').value.trim();
  const branch = document.getElementById('branch').value.trim();
  const batch = document.getElementById('batch').value.trim();
  if (!name||!college||!branch||!batch) { document.getElementById('studentError').textContent='Fill all fields'; return; }
  document.getElementById('studentError').textContent='';

  let s = students.find(x=>x.id===currentId);
  if (s) { s.name=name; s.college=college; s.branch=branch; s.batch=batch; }
  else { const n={id:uid(),name,college,branch,batch,semesters:[]}; students.push(n); currentId=n.id; }

  save(); populateStudentSelect(); renderCurrent(); flash('Student saved');
}

// --- cgpa form
function handleCgpaForm(e) {
  e.preventDefault();
  const sem = parseInt(document.getElementById('semester').value,10);
  const cg = parseFloat(document.getElementById('cgpa').value);
  const err = document.getElementById('error');
  if (isNaN(sem)||isNaN(cg)) { err.textContent='Enter valid values'; return; }
  if (cg<0||cg>10) { err.textContent='CGPA 0-10'; return; }
  err.textContent='';

  const s = students.find(x => x.id===currentId);
  const existing = s.semesters.find(x=>x.sem===sem);
  if (existing) existing.cgpa = cg; else s.semesters.push({sem,cgpa:cg});
  save(); renderCurrent();

  // particle burst near pointer center
  particlesBurst(); // center burst
  flash('CGPA added');

  cgpaForm.reset();
}

// --- delete student
function handleDeleteStudent(){
  if (!confirm('Delete student and data?')) return;
  students = students.filter(x=>x.id!==currentId);
  if (students.length===0) { students=[{id:uid(),name:'Siva Sai',college:'Narasaraopet Engineering College',branch:'CSE - AI',batch:'2024 - 2028',semesters:[{sem:1,cgpa:6.8}]}]; }
  currentId = students[0].id; save(); populateStudentSelect(); renderCurrent(); flash('Student deleted');
}

// --- clear data
function handleClearStudent(){
  if (!confirm('Clear semester data for this student?')) return;
  const s = students.find(x=>x.id===currentId); s.semesters=[]; save(); renderCurrent(); flash('Cleared');
}

// --- export CSV
function handleExportCsv(){
  const s = students.find(x=>x.id===currentId);
  let csv = 'Semester,CGPA\n';
  s.semesters.sort((a,b)=>a.sem-b.sem).forEach(r=> csv += `${r.sem},${parseFloat(r.cgpa).toFixed(2)}\n`);
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = `${s.name.replace(/\s+/g,'_')}_cgpa.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  flash('CSV downloaded');
}

// --- small toast
function flash(text){
  const d = document.createElement('div'); d.textContent=text; d.style.position='fixed'; d.style.right='16px'; d.style.bottom='18px'; d.style.background='rgba(2,6,23,0.8)'; d.style.color='white'; d.style.padding='8px 12px'; d.style.borderRadius='8px'; d.style.zIndex=9999; document.body.appendChild(d);
  setTimeout(()=> d.animate([{opacity:1},{opacity:0}],{duration:600}).onfinish = ()=> d.remove(), 900);
}

// --- Chart.js
function initChart(){
  const ctx = document.getElementById('cgpaChart').getContext('2d');
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[{ label:'CGPA', data:[], borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.12)', tension:0.3, pointRadius:4, pointBackgroundColor:'#ffffff', borderWidth:2 }]},
    options:{ responsive:true, scales:{ y:{ min:0, max:10, ticks:{stepSize:1} } }, plugins:{ legend:{display:false} } }
  });
  return chart;
}
function updateChart(student){
  if (!chart) return;
  const rows = student.semesters.slice().sort((a,b)=>a.sem-b.sem);
  chart.data.labels = rows.map(r=>'S'+r.sem);
  chart.data.datasets[0].data = rows.map(r=>parseFloat(r.cgpa));
  chart.update();
}

// --- theme toggle
function toggleTheme(){
  const isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('darkMode', isDark?'1':'0'); } catch(e){}
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}
