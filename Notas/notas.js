"use strict";

const STUDENT_KEY = "brightfuture.alunos.v2";
const CLASS_KEY = "brightfuture.turmas.v2";
const GRADE_KEY = "brightfuture.notas-frequencia.v2";

const classFilter = document.querySelector("#classFilter");
const periodFilter = document.querySelector("#periodFilter");
const attendanceDate = document.querySelector("#attendanceDate");
const tableBody = document.querySelector("#gradesTableBody");
const emptyState = document.querySelector("#gradesEmptyState");
const saveButton = document.querySelector("#saveGradesButton");
const message = document.querySelector("#gradesMessage");
const classAverage = document.querySelector("#classAverage");
const classAttendance = document.querySelector("#classAttendance");
const evaluatedCount = document.querySelector("#evaluatedCount");
const presentCount = document.querySelector("#presentCount");
const absentCount = document.querySelector("#absentCount");
const attentionCount = document.querySelector("#attentionCount");
const markAllPresent = document.querySelector("#markAllPresent");
const markAllAbsent = document.querySelector("#markAllAbsent");

const auth = window.BrightAuth;
const canEdit = auth.canEditGrades();
const students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]").filter(student => auth.canSeeStudent(student));
const classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
let gradeRecords = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");

function periodKey() {
    return `${classFilter.value}|${periodFilter.value}`;
}

function dayKey() {
    return `${periodKey()}|${attendanceDate.value}`;
}

function getGrade(value) {
    if (value === "" || value === undefined || value === null) return null;
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
}

function formatGrade(number) {
    return number === null ? "" : number.toFixed(1).replace(".", ",");
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `grades-message ${type}`;
}

function getAttendance(studentId, currentStatus) {
    const prefix = periodKey() + "|";
    let present = 0;
    let absent = 0;
    let foundToday = false;

    Object.keys(gradeRecords).forEach(key => {
        if (!key.startsWith(prefix)) return;
        const record = gradeRecords[key][studentId];
        let status = record ? record.status : "";
        if (key === dayKey() && currentStatus !== undefined) {
            status = currentStatus;
            foundToday = true;
        }
        if (status === "present") present++;
        if (status === "absent") absent++;
    });

    if (!foundToday && currentStatus === "present") present++;
    if (!foundToday && currentStatus === "absent") absent++;
    return {present, absent, percentage: present + absent ? 100 * present / (present + absent) : null};
}

function getStatus(grade, percentage) {
    if (grade === null || percentage === null) return ["Pendente", "revision"];
    if (grade >= 7 && percentage >= 75) return ["Aprovado", "approved"];
    if (grade < 5 || percentage < 75) return ["Reprovado", "reproved"];
    return ["Revisar", "revision"];
}

function updateSummary() {
    const grades = [];
    const frequencies = [];
    let present = 0;
    let absent = 0;
    let attention = 0;

    tableBody.querySelectorAll("tr").forEach(row => {
        const studentId = row.dataset.studentId;
        const grade = getGrade(row.querySelector(".grade-input").value);
        const status = row.querySelector(".attendance-status").value;
        const data = getAttendance(studentId, status);
        if (grade !== null) grades.push(grade);
        if (data.percentage !== null) frequencies.push(data.percentage);
        if (status === "present") present++;
        if (status === "absent") absent++;
        if ((grade !== null && grade < 7) || (data.percentage !== null && data.percentage < 75)) attention++;
    });

    classAverage.textContent = grades.length
        ? formatGrade(grades.reduce((a, b) => a + b, 0) / grades.length) : "—";
    classAttendance.textContent = frequencies.length
        ? (frequencies.reduce((a, b) => a + b, 0) / frequencies.length).toFixed(0) + "%" : "—";
    evaluatedCount.textContent = String(grades.length);
    presentCount.textContent = String(present);
    absentCount.textContent = String(absent);
    attentionCount.textContent = String(attention);
}

function updateRow(row) {
    const gradeInput = row.querySelector(".grade-input");
    const status = row.querySelector(".attendance-status").value;
    const grade = getGrade(gradeInput.value);
    const data = getAttendance(row.dataset.studentId, status);
    row.querySelector(".attendance-value").textContent = data.percentage === null
        ? "—" : data.percentage.toFixed(0) + "%";
    row.querySelector(".attendance-count").textContent = `Faltas no trimestre: ${data.absent}`;
    const [label, type] = getStatus(grade, data.percentage);
    const badge = row.querySelector(".status-badge");
    badge.textContent = label;
    badge.className = `status-badge ${type}`;
    row.querySelector(".attendance-toggle-button.present").classList.toggle("active", status === "present");
    row.querySelector(".attendance-toggle-button.absent").classList.toggle("active", status === "absent");
    updateSummary();
}

function renderGrades() {
    const activeStudents = students.filter(student =>
        !student.arquivado && student.turma === classFilter.value
    );
    const grades = gradeRecords[periodKey()] || {};
    const savedDay = gradeRecords[dayKey()] || {};

    tableBody.replaceChildren();
    activeStudents.forEach(student => {
        const grade = getGrade(grades[student.id]?.nota);
        const call = savedDay[student.id] || {};
        const row = document.createElement("tr");
        row.dataset.studentId = student.id;
        row.innerHTML = `
            <td></td>
            <td><input class="grade-input" type="text" inputmode="decimal" maxlength="4" placeholder="0,0"></td>
            <td>
                <input class="attendance-status" type="hidden">
                <div class="attendance-toggle">
                    <button type="button" class="attendance-toggle-button present" data-status="present">Presente</button>
                    <button type="button" class="attendance-toggle-button absent" data-status="absent">Falta</button>
                </div>
                <span class="attendance-count"></span>
            </td>
            <td><input class="justification-input" type="text" maxlength="120" placeholder="Ex.: consulta médica"></td>
            <td class="attendance-value">—</td>
            <td><span class="status-badge revision">Pendente</span></td>
        `;
        row.children[0].textContent = student.nome;
        row.querySelector(".grade-input").value = formatGrade(grade);
        row.querySelector(".grade-input").setAttribute("aria-label", `Nota trimestral de ${student.nome}`);
        row.querySelector(".attendance-status").value = call.status || "";
        row.querySelector(".justification-input").value = call.justificativa || "";
        row.querySelector(".justification-input").setAttribute("aria-label", `Justificativa de ${student.nome}`);
        if (!canEdit) {
            row.querySelector(".grade-input").readOnly = true;
            row.querySelector(".justification-input").readOnly = true;
            row.querySelectorAll(".attendance-toggle-button").forEach(button => button.disabled = true);
        }

        const gradeInput = row.querySelector(".grade-input");
        gradeInput.addEventListener("input", () => {
            gradeInput.value = gradeInput.value.replace(".", ",").replace(/[^\d,]/g, "");
            updateRow(row);
        });
        gradeInput.addEventListener("blur", () => {
            if (getGrade(gradeInput.value) !== null) gradeInput.value = formatGrade(getGrade(gradeInput.value));
            updateRow(row);
        });

        row.querySelectorAll(".attendance-toggle-button").forEach(button => {
            button.addEventListener("click", () => {
                const current = row.querySelector(".attendance-status");
                current.value = current.value === button.dataset.status ? "" : button.dataset.status;
                updateRow(row);
            });
        });
        tableBody.append(row);
        updateRow(row);
    });

    emptyState.textContent = classFilter.value ? "Esta turma não tem alunos matriculados." : "Selecione uma turma para visualizar os alunos.";
    emptyState.hidden = activeStudents.length > 0;
    saveButton.disabled = !canEdit || activeStudents.length === 0;
    markAllPresent.disabled = !canEdit || activeStudents.length === 0;
    markAllAbsent.disabled = !canEdit || activeStudents.length === 0;
    updateSummary();
}

saveButton.addEventListener("click", () => {
    if (!canEdit || !auth.canSeeClass(classFilter.value)) return;
    if (!classFilter.value || !attendanceDate.value) {
        showMessage("Selecione a turma e o dia da chamada.", "error");
        return;
    }

    const grades = {...(gradeRecords[periodKey()] || {})};
    const dailyCalls = {...(gradeRecords[dayKey()] || {})};
    let invalid = false;
    tableBody.querySelectorAll("tr").forEach(row => {
        const studentId = row.dataset.studentId;
        const gradeText = row.querySelector(".grade-input").value.trim();
        const grade = getGrade(gradeText);
        if (gradeText !== "" && grade === null) invalid = true;

        if (grade === null) delete grades[studentId];
        else grades[studentId] = {nota: formatGrade(grade)};

        const status = row.querySelector(".attendance-status").value;
        const justification = row.querySelector(".justification-input").value.trim();
        if (status || justification) dailyCalls[studentId] = {status, justificativa: justification};
        else delete dailyCalls[studentId];
    });

    if (invalid) {
        showMessage("Digite notas entre 0 e 10. Exemplo: 8,5.", "error");
        return;
    }
    gradeRecords[periodKey()] = grades;
    if (Object.keys(dailyCalls).length) gradeRecords[dayKey()] = dailyCalls;
    else delete gradeRecords[dayKey()];
    localStorage.setItem(GRADE_KEY, JSON.stringify(gradeRecords));
    showMessage("Notas do trimestre e chamada do dia salvas!", "success");
    renderGrades();
});

const classNames = [...new Set([...classes, ...students.map(student => student.turma)].filter(Boolean))];
classNames.sort((a, b) => a.localeCompare(b, "pt-BR"));
classNames.filter(name => auth.canSeeClass(name)).forEach(name => classFilter.add(new Option(name, name)));

const today = new Date();
periodFilter.value = today.getMonth() < 4 ? "1º trimestre" : today.getMonth() < 8 ? "2º trimestre" : "3º trimestre";
attendanceDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

classFilter.addEventListener("change", () => { showMessage(""); renderGrades(); });
periodFilter.addEventListener("change", () => { showMessage(""); renderGrades(); });
attendanceDate.addEventListener("change", () => { showMessage(""); renderGrades(); });

markAllPresent.addEventListener("click", () => {
    if (!canEdit) return;
    tableBody.querySelectorAll("tr").forEach(row => {
        row.querySelector(".attendance-status").value = "present";
        updateRow(row);
    });
    showMessage("Chamada preenchida com todos presentes. Clique em salvar para registrar.");
});
markAllAbsent.addEventListener("click", () => {
    if (!canEdit) return;
    tableBody.querySelectorAll("tr").forEach(row => {
        row.querySelector(".attendance-status").value = "absent";
        updateRow(row);
    });
    showMessage("Chamada preenchida com faltas. Clique em salvar para registrar.");
});

if (!canEdit) {
    document.querySelector(".attendance-toolbar").hidden = true;
    document.querySelector(".grades-actions").hidden = true;
    const note = document.createElement("p");
    note.className = "role-note";
    note.textContent = "Consulta de notas e frequência. Os lançamentos são feitos pelos professores e pela secretaria.";
    document.querySelector(".grades-filters").before(note);
}
renderGrades();
