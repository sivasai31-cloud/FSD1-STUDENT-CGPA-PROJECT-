/* Multi-student CGPA Manager with Chart + UI interactions
   - localStorage persistence
   - add/update students
   - add/update semester CGPA (same semester overwrites)
   - delete student, export CSV
   - live Chart.js graph
   - dark mode saved
*/

// storage key
const STORAGE_KEY = 'fsd1_students_v2';

// state
let students = [];
let currentId = null;

// DOM refs
let studentSelect, studentForm, cgpaForm, cgpaBody, overallEl, studentPreview;
let deleteBtn, exportBtn, clearBtn, themeToggle, chart;

// helpers
const uid = () => 'id-' + Math.random().toString(36).slice(2,9);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e){ return []; }
};

// init on DOM ready
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

  // load
  students = load();

  // seed sample if empty
  if (students.length === 0) {
    students = [{
      id: uid(),
      name: 'Siva Sai',
      college: 'Narasaraopet Engineering College',
      branch: 'CSE - AI',
      batch: '2024 - 2028',
      semesters: [{sem:1, cgpa:6.8}]
    }];
    save();
  }

  // set current
  currentId = students[0].id;

  populateStudentSelect();
  renderCurrent();

  // restore theme
  try {
    const saved = localStorage.getItem('darkMode');
    if (saved === '1') document.documentElement.classList.add('dark');
  } catch(e){}

  // chart init
  chart = initChart();

  // listeners
  studentForm.addEventListener('submit', handleStudentForm);
  studentSelect.addEventListener('change', () => {
    currentId = studentSelect.value;
    renderCurrent();
  });
  cgpaForm.addEventListener('submit', handleCgpaForm);
  deleteBtn.addEventListener('click', handleDeleteStudent);
  exportBtn.addEventListener('click', handleExportCsv);
  clearBtn.addEventListener('click', handleClearStudent);
  themeToggle.addEventListener('click', toggleTheme);
});

// populate dropdown
function populateStudentSelect() {
  studentSelect.innerHTML = '';
  students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name + ' — ' + s.branch;
    studentSelect.appendChild(opt);
  });
  studentSelect.value = currentId;
}

// render current student UI
function renderCurrent() {
  const s = students.find(x => x.id === currentId);
  if (!s) return;
  // preview
  studentPreview.innerHTML = `<strong>${s.name}</strong><div class="muted">${s.college} • ${s.branch} • ${s.batch}</div>`;

  // table
  cgpaBody.innerHTML = '';
  s.semesters.sort((a,b) => a.sem - b.sem).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.sem}</td><td>${parseFloat(row.cgpa).toFixed(2)}</td>`;
    cgpaBody.appendChild(tr);
  });

  // overall
  const avg = s.semesters.length ? (s.semesters.reduce((a,b)=>a+parseFloat(b.cgpa),0)/s.semesters.length) : 0;
  overallEl.textContent = avg ? avg.toFixed(2) : '0.00';

  // update chart
  updateChart(s);

  // fill student form with current (for quick edit)
  document.getElementById('name').value = s.name;
  document.getElementById('college').value = s.college;
  document.getElementById('branch').value = s.branch;
  document.getElementById('batch').value = s.batch;
}

// add / update student
function handleStudentForm(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const college = document.getElementById('college').value.trim();
  const branch = document.getElementById('branch').value.trim();
  const batch = document.getElementById('batch').value.trim();

  if (!name || !college || !branch || !batch) {
    document.getElementById('studentError').textContent = 'Fill all fields.';
    return;
  }
  document.getElementById('studentError').textContent = '';

  // if current exists, update it; else add new
  let s = students.find(x => x.id === currentId);
  if (s) {
    s.name = name; s.college = college; s.branch = branch; s.batch = batch;
  } else {
    const newS = { id: uid(), name, college, branch, batch, semesters: [] };
    students.push(newS); currentId = newS.id;
  }

  save();
  populateStudentSelect();
  renderCurrent();
  // small success animation
  flashMessage('Student saved');
}

// add/update semester CGPA
function handleCgpaForm(e) {
  e.preventDefault();
  const semVal = parseInt(document.getElementById('semester').value,10);
  const cgVal = parseFloat(document.getElementById('cgpa').value);
  const err = document.getElementById('error');

  if (isNaN(semVal) || isNaN(cgVal)) { err.textContent = 'Enter valid values'; return; }
  if (cgVal < 0 || cgVal > 10) { err.textContent = 'CGPA must be 0-10'; return; }
  err.textContent = '';

  const s = students.find(x => x.id === currentId);
  const existing = s.semesters.find(x => x.sem === semVal);
  if (existing) existing.cgpa = cgVal;
  else s.semesters.push({sem: semVal, cgpa: cgVal});

  save();
  renderCurrent();

  // animate last row
  const last = cgpaBody.lastElementChild;
  if (last) { last.style.opacity = 0; last.animate([{opacity:0},{opacity:1}],{duration:300,fill:'forwards'}); }

  cgpaForm.reset();
  flashMessage('CGPA updated');
}

// delete student
function handleDeleteStudent() {
  if (!confirm('Delete this student and data?')) return;
  students = students.filter(s => s.id !== currentId);
  if (students.length === 0) {
    // re-seed
    students = [{
      id: uid(), name: 'Siva Sai', college: 'Narasaraopet Engineering College',
      branch: 'CSE - AI', batch: '2024 - 2028', semesters: [{sem:1,cgpa:6.8}]
    }];
  }
  currentId = students[0].id;
  save();
  populateStudentSelect();
  renderCurrent();
  flashMessage('Student deleted');
}

// clear selected student semester data
function handleClearStudent() {
  if (!confirm('Clear semester data for this student?')) return;
  const s = students.find(x => x.id === currentId);
  s.semesters = [];
  save();
  renderCurrent();
  flashMessage('Student data cleared');
}

// export CSV
function handleExportCsv() {
  const s = students.find(x => x.id === currentId);
  let csv = 'Semester,CGPA\n';
  s.semesters.sort((a,b)=>a.sem-b.sem).forEach(r => csv += `${r.sem},${parseFloat(r.cgpa).toFixed(2)}\n`);
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${s.name.replace(/\s+/g,'_')}_cgpa.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  flashMessage('CSV exported');
}

// chart helpers
function initChart() {
  const ctx = document.getElementById('cgpaChart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'CGPA', data: [], tension:0.3, fill:false, borderWidth:2, pointRadius:4 }] },
    options: {
      responsive:true,
      scales: {
        y: { min:0, max:10, ticks:{stepSize:1} }
      },
      plugins: { legend:{display:false} }
    }
  });
}

function updateChart(student) {
  const rows = student.semesters.slice().sort((a,b)=>a.sem-b.sem);
  chart.data.labels = rows.map(r => 'S' + r.sem);
  chart.data.datasets[0].data = rows.map(r => parseFloat(r.cgpa));
  chart.update();
}

// small UI message
function flashMessage(text) {
  const el = document.createElement('div');
  el.textContent = text; el.style.position='fixed'; el.style.right='16px'; el.style.bottom='18px';
  el.style.background='rgba(0,0,0,0.75)'; el.style.color='white'; el.style.padding='8px 12px'; el.style.borderRadius='8px';
  el.style.zIndex=9999; el.style.fontSize='13px'; document.body.appendChild(el);
  setTimeout(()=>{ el.animate([{opacity:1},{opacity:0}],{duration:600}); setTimeout(()=>el.remove(),600); },900);
}

// theme
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('darkMode', isDark ? '1' : '0'); } catch(e){}
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}
