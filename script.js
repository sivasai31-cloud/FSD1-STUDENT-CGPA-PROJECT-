// Load saved students
let students = JSON.parse(localStorage.getItem("students")) || [];
let currentStudentId = null;

// DOM elements
const studentSelect = document.getElementById("studentSelect");
const studentForm = document.getElementById("studentForm");
const cgpaForm = document.getElementById("cgpaForm");
const tableBody = document.getElementById("cgpaBody");
const overallCgpa = document.getElementById("overallCgpa");
const themeToggle = document.getElementById("themeToggle");

// If first time, create default student
if (students.length === 0) {
    const defaultStudent = {
        id: Date.now(),
        name: "Siva Sai",
        college: "Narasaraopet Engineering College",
        branch: "CSE - AI",
        batch: "2024 - 2028",
        semesters: [{ sem: 1, cgpa: 6.8 }]
    };

    students.push(defaultStudent);
    currentStudentId = defaultStudent.id;
    localStorage.setItem("students", JSON.stringify(students));
} else {
    currentStudentId = students[0].id;
}

// Update dropdown with students
function updateStudentList() {
    studentSelect.innerHTML = "";

    students.forEach(s => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.name;
        studentSelect.appendChild(option);
    });

    studentSelect.value = currentStudentId;
}
updateStudentList();


// Render selected student data
function renderStudent() {
    const s = students.find(st => st.id == currentStudentId);

    document.querySelector(".student-info").innerHTML = `
        <h2>Student Details</h2>
        <p><strong>Name:</strong> ${s.name}</p>
        <p><strong>College:</strong> ${s.college}</p>
        <p><strong>Branch:</strong> ${s.branch}</p>
        <p><strong>Batch:</strong> ${s.batch}</p>
    `;

    tableBody.innerHTML = "";
    s.semesters.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.sem}</td><td>${row.cgpa}</td>`;
        tableBody.appendChild(tr);
    });

    const avg =
        s.semesters.reduce((a, b) => a + b.cgpa, 0) / s.semesters.length;

    overallCgpa.textContent = avg.toFixed(2);
}

renderStudent();


// When a different student is selected
studentSelect.addEventListener("change", () => {
    currentStudentId = studentSelect.value;
    renderStudent();
});


// Add new student
studentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newStudent = {
        id: Date.now(),
        name: document.getElementById("name").value,
        college: document.getElementById("college").value,
        branch: document.getElementById("branch").value,
        batch: document.getElementById("batch").value,
        semesters: []
    };

    students.push(newStudent);
    currentStudentId = newStudent.id;

    localStorage.setItem("students", JSON.stringify(students));

    updateStudentList();
    renderStudent();

    studentForm.reset();
});


// Add CGPA for selected student
cgpaForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const sem = parseInt(document.getElementById("semester").value);
    const cg = parseFloat(document.getElementById("cgpa").value);

    const student = students.find(s => s.id == currentStudentId);

    student.semesters.push({ sem, cgpa: cg });

    localStorage.setItem("students", JSON.stringify(students));
    renderStudent();

    cgpaForm.reset();
});


// Dark Mode Toggle
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    // Change icon
    if (document.body.classList.contains("dark")) {
        themeToggle.innerHTML = "🌙";
    } else {
        themeToggle.innerHTML = "☀️";
    }
});
