function calculateOverallCgpa() {
    const rows = document.querySelectorAll("#cgpaBody tr");
    let sum = 0;
    let count = 0;

    rows.forEach(row => {
        const cgpa = parseFloat(row.cells[1].textContent);
        if (!isNaN(cgpa)) {
            sum += cgpa;
            count++;
        }
    });

    const overall = count > 0 ? (sum / count).toFixed(2) : "0.00";
    document.getElementById("overallCgpa").textContent = overall;
}

document.getElementById("cgpaForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const semInput = document.getElementById("semester");
    const cgpaInput = document.getElementById("cgpa");
    const errorEl = document.getElementById("error");

    const sem = semInput.value.trim();
    const cgpa = cgpaInput.value.trim();

    if (sem === "" || cgpa === "") {
        errorEl.textContent = "Please fill all fields.";
        return;
    }

    const semNum = parseInt(sem);
    const cgpaNum = parseFloat(cgpa);

    if (semNum <= 0) {
        errorEl.textContent = "Semester number must be positive.";
        return;
    }

    if (cgpaNum < 0 || cgpaNum > 10) {
        errorEl.textContent = "CGPA must be between 0 and 10.";
        return;
    }

    errorEl.textContent = "";

    const tbody = document.getElementById("cgpaBody");
    const newRow = document.createElement("tr");

    const semCell = document.createElement("td");
    const cgpaCell = document.createElement("td");

    semCell.textContent = semNum;
    cgpaCell.textContent = cgpaNum.toFixed(2);

    newRow.appendChild(semCell);
    newRow.appendChild(cgpaCell);
    tbody.appendChild(newRow);

    calculateOverallCgpa();

    semInput.value = "";
    cgpaInput.value = "";
});

// initial calculation
calculateOverallCgpa();