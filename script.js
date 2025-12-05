// storage key
const STORAGE_KEY = 'fsd1_students_v1';

// small helpers
function uid() { return 'id-' + Math.random().toString(36).slice(2,9); }
function saveStudents(list) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(e){} }
function loadStudents() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }

// app state
let students = [];
let currentId = null;

// DOM refs
const studentForm = document.getElementById('studentForm');
const studentSelect = document.getElementById('studentSelect');
const studentError = document.getElementById('studentError');
const studentTitle = document.getElementById('studentTitle');
const studentMeta = document.getElementById('studentMeta');

const cgpaForm = document.getElementById('cgpaForm');
const cgpaBody = document.getElementById('cgpaBody');
const overallEl = document.getElementById('overallCgpa');
const errorEl = document.getElementById('error');
const clearStudentBtn = document.getElementById('clearStudent');

const themeToggle = document.getElementById('themeToggle');

// initialize
document.addEventListener('DOMContentLoaded', () => {
  students = loadStudents();

  // if no students yet, seed one sample (optional)
  if (students.length === 0) {
    const sample = {
      id: uid(),
      name: 'Siva Sai',
      college: 'Narasaraopet Engineering College',
      branch: 'CSE - AI',
      batch: '2024 - 2028',
      semesters: [{sem:1, cgpa:6.8}]
    };
    students.push(sample); saveStudents(students);
  }

  populateStudentSelect();
  // set current to first if none selected
  currentId = students[0] ? students[0].id : null;
  studentSelect.value = currentId;
  renderCurrentStudent();

  // restore theme
  try {
    const saved = localStorage.getItem('darkMode');
    if (saved === '1') applyTheme(true);
    else applyTheme(false);
  } catch(e){}
});

// populate dropdown
function populateStudentSelect() {
  studentSelect.innerHTML = '';
  students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' — ' + s.branch;
    studentSelect.appendChild(opt);
  });
  // add "New student" last action? (we use the form)
}

// render for current
function renderCurrentStudent() {
  const s = students.find(x => x.id === currentId);
  if (!s) {
    studentTitle.textContent = 'Semester CGPA';
    studentMeta.textContent = '';
    cgpaBody.innerHTML = '';
    overallEl.textContent = '0.00';
    return;
  }

  studentTitle.textContent = s.name + ' — CGPA';
  studentMeta.textContent = `${s.college} • ${s.branch} • ${s.batch}`;

  // render table
  cgpaBody.innerHTML = '';
  s.semesters.sort((a,b)=>a.sem - b.sem).forEach(row => {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td'); td1.textContent = row.sem;
    const td2 = document.createElement('td'); td2.textContent = parseFloat(row.cgpa).toFixed(2);
    tr.appendChild(td1); tr.appendChild(td2);
    cgpaBody.appendChild(tr);
  });
  calculateOverallCgpa();
}

// calculate overall for current
function calculateOverallCgpa() {
  const s = students.find(x => x.id === currentId);
  if (!s || !s.semesters.length) { overallEl.textContent = '0.00'; return; }
  let sum = 0, cnt = 0;
  s.semesters.forEach(r => { const v = parseFloat(r.cgpa); if (!isNaN(v)){ sum += v; cnt++; }});
  overallEl.textContent = cnt ? (sum / cnt).toFixed(2) : '0.00';
}

// add student
studentForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const college = document.getElementById('college').value.trim();
  const branch = document.getElementById('branch').value.trim();
  const batch = document.getElementById('batch').value.trim();

  if (!name || !college || !branch || !batch) {
    studentError.textContent = 'Please fill all student fields.';
    return;
  }
  studentError.textContent = '';

  const newStudent = { id: uid(), name, college, branch, batch, semesters: [] };
  students.push(newStudent);
  saveStudents(students);
  populateStudentSelect();

  // select new
  currentId = newStudent.id;
  studentSelect.value = currentId;
  renderCurrentStudent();

  // clear form fields
  studentForm.reset();
});

// switch student
studentSelect.addEventListener('change', () => {
  currentId = studentSelect.value;
  renderCurrentStudent();
});

// add semester entry for current student
cgpaForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!currentId) { errorEl.textContent = 'Please add or select a student first.'; return; }

  const sem = document.getElementById('semester').value.trim();
  const cgpa = document.getElementById('cgpa').value.trim();
  if (!sem || !cgpa) { errorEl.textContent = 'Please fill semester and CGPA.'; return; }

  const semNum = parseInt(sem,10), cgpaNum = parseFloat(cgpa);
  if (isNaN(semNum) || semNum <= 0) { errorEl.textContent = 'Invalid semester number.'; return; }
  if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) { errorEl.textContent = 'CGPA must be 0–10.'; return; }

  errorEl.textContent = '';

  const s = students.find(x => x.id === currentId);
  // if semester exists, replace; else push
  const existing = s.semesters.find(x => x.sem === semNum);
  if (existing) existing.cgpa = cgpaNum;
  else s.semesters.push({sem: semNum, cgpa: cgpaNum});

  saveStudents(students);
  renderCurrentStudent();

  // small animation for last row
  const last = cgpaBody.lastElementChild;
  if (last) { last.style.opacity = 0; last.animate([{opacity:0},{opacity:1}], {duration:300, fill:'forwards'}); }

  cgpaForm.reset();
});

// clear selected student data (confirm)
clearStudentBtn.addEventListener('click', () => {
  if (!currentId) return;
  if (!confirm('Clear all semester data for this student?')) return;
  const s = students.find(x => x.id === currentId);
  s.semesters = [];
  saveStudents(students);
  renderCurrentStudent();
});

// THEME toggle
function applyTheme(dark) {
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  themeToggle.textContent = dark ? '☀️' : '🌙';
  try { localStorage.setItem('darkMode', dark ? '1' : '0'); } catch(e){}
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  applyTheme(isDark);
});
