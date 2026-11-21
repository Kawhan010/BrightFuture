"use strict";

const STUDENT_KEY = "brightfuture.alunos.v1";
const CLASS_KEY = "brightfuture.turmas.v1";
const GRADE_KEY = "brightfuture.notas-frequencia.v1";
const TOTAL_LESSONS = 20;

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

let students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]");
let classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
let gradeRecords = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");

function getClassNames() {
    const names = [...classes];
    students.forEach(student => names.push(student.turma));
    return [...new Set(names.filter(name => name && name.trim()).map(name => name.trim()))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function recordKey() {
    return `${classFilter.value}|${periodFilter.value}|${attendanceDate.value}`;
}

function getAccumulatedAbsences(studentId) {
    const prefix = `${classFilter.value}|${periodFilter.value}|`;
    let total = 0;

    Object.keys(gradeRecords).forEach(key => {
        if (!key.startsWith(prefix)) {
            return;
        }
        const record = gradeRecords[key][studentId];
        if (record && record.status === "absent") {
            total++;
        }
    });

    const legacy = gradeRecords[`${classFilter.value}|${periodFilter.value}`]?.[studentId];
    if (legacy && Number(legacy.faltas) > total) {
        total = Number(legacy.faltas);
    }
    return total;
}

function getGradeNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }
    const grade = Number(String(value).replace(",", "."));
    return Number.isNaN(grade) ? null : grade;
}

function formatGrade(value) {
    const grade = getGradeNumber(value);
    return grade === null ? "" : grade.toFixed(1).replace(".", ",");
}

function limitGradeInput(input) {
    input.value = input.value
        .replace(".", ",")
        .replace(/[^\d,]/g, "")
        .replace(/,{2,}/g, ",");

    let grade = getGradeNumber(input.value);
    if (grade !== null && grade > 10) {
        grade = 10;
        input.value = "10,0";
    }
    if (grade !== null && grade < 0) {
        input.value = "0,0";
    }
}

function attendance(absences) {
    const value = Number(absences);
    if (!absences || Number.isNaN(value)) {
        return null;
    }
    return ((TOTAL_LESSONS - Math.max(0, Math.min(TOTAL_LESSONS, value))) / TOTAL_LESSONS) * 100;
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `grades-message ${type}`;
}

function getStatus(grade, studentAttendance) {
    if (grade === null || studentAttendance === null) {
        return ["Pendente", "revision"];
    }
    if (grade >= 7 && studentAttendance >= 75) {
        return ["Aprovado", "approved"];
    }
    if (grade < 5 || studentAttendance < 75) {
        return ["Reprovado", "reproved"];
    }
    return ["Revisar", "revision"];
}

function updateSummary() {
    const grades = [];
    const attendances = [];
    let present = 0;
    let absent = 0;
    let attention = 0;

    tableBody.querySelectorAll("tr").forEach(row => {
        const gradeInput = row.querySelector(".grade-input");
        const absenceInput = row.querySelector(".absence-input");
        const statusInput = row.querySelector(".attendance-status");
        const grade = getGradeNumber(gradeInput.value);
        const studentAttendance = attendance(absenceInput.value);

        if (grade !== null) {
            grades.push(grade);
        }
        if (studentAttendance !== null) {
            attendances.push(studentAttendance);
        }
        if (statusInput.value === "present") {
            present++;
        } else if (statusInput.value === "absent") {
            absent++;
        }
        if ((grade !== null && grade < 7) ||
            (studentAttendance !== null && studentAttendance < 75)) {
            attention++;
        }
    });

    const average = grades.length
        ? grades.reduce((sum, value) => sum + value, 0) / grades.length
        : null;
    const averageAttendance = attendances.length
        ? attendances.reduce((sum, value) => sum + value, 0) / attendances.length
        : null;

    classAverage.textContent = average === null ? "—" : average.toFixed(1).replace(".", ",");
    classAttendance.textContent = averageAttendance === null ? "—" : `${averageAttendance.toFixed(0)}%`;
    evaluatedCount.textContent = String(grades.length);
    presentCount.textContent = String(present);
    absentCount.textContent = String(absent);
    attentionCount.textContent = String(attention);
}

function updateRow(row) {
    const gradeInput = row.querySelector(".grade-input");
    const absenceInput = row.querySelector(".absence-input");
    const attendanceCell = row.querySelector(".attendance-value");
    const statusBadge = row.querySelector(".status-badge");
    const presentButton = row.querySelector(".attendance-toggle-button.present");
    const absentButton = row.querySelector(".attendance-toggle-button.absent");
    const statusInput = row.querySelector(".attendance-status");
    const absenceCount = row.querySelector(".attendance-count");

    const grade = getGradeNumber(gradeInput.value);
    const studentAttendance = attendance(absenceInput.value);
    attendanceCell.textContent = studentAttendance === null
        ? "—"
        : `${studentAttendance.toFixed(0)}%`;

    const [label, type] = getStatus(grade, studentAttendance);
    statusBadge.textContent = label;
    statusBadge.className = `status-badge ${type}`;
    presentButton.classList.toggle("active", statusInput.value === "present");
    absentButton.classList.toggle("active", statusInput.value === "absent");
    const totalFaltas = Number(absenceInput.value) || 0;
    absenceCount.textContent = `Faltas acumuladas: ${totalFaltas}`;
    updateSummary();
}

function renderGrades() {
    const selectedClass = classFilter.value;
    const filteredStudents = students.filter(student =>
        student.turma.toLowerCase() === selectedClass.toLowerCase()
    );
    const saved = gradeRecords[recordKey()] || {};

    tableBody.replaceChildren();

    filteredStudents.forEach(student => {
        const values = saved[student.id] || { nota: "", faltas: "" };
        const accumulatedAbsences = getAccumulatedAbsences(student.id);
        if (!saved[student.id] && accumulatedAbsences > 0) {
            values.faltas = String(accumulatedAbsences);
        }
        const row = document.createElement("tr");
        row.innerHTML = `
            <td></td>
            <td><input class="grade-input" type="text" inputmode="decimal" maxlength="4" placeholder="0,0" value="${formatGrade(values.nota)}" aria-label="Nota de ${student.nome} entre 0 e 10"></td>
            <td>
                <input class="absence-input" type="hidden" value="${accumulatedAbsences}">
                <input class="attendance-status" type="hidden" value="${values.status || ""}">
                <div class="attendance-toggle">
                    <button type="button" class="attendance-toggle-button present" data-status="present">Presente</button>
                    <button type="button" class="attendance-toggle-button absent" data-status="absent">Falta</button>
                </div>
                <span class="attendance-count">Faltas acumuladas: 0</span>
            </td>
            <td><input class="justification-input" type="text" maxlength="120" placeholder="Ex.: consulta médica" aria-label="Justificativa de ${student.nome}"></td>
            <td class="attendance-value">—</td>
            <td><span class="status-badge revision">Pendente</span></td>
        `;
        row.children[0].textContent = student.nome;
        row.querySelector(".grade-input").dataset.studentId = student.id;
        row.querySelector(".absence-input").dataset.studentId = student.id;
        row.querySelector(".justification-input").value = values.justificativa || "";

        const gradeInput = row.querySelector(".grade-input");
        gradeInput.addEventListener("input", () => {
            limitGradeInput(gradeInput);
            updateRow(row);
        });
        gradeInput.addEventListener("blur", () => {
            limitGradeInput(gradeInput);
            gradeInput.value = gradeInput.value === ""
                ? ""
                : formatGrade(gradeInput.value);
            updateRow(row);
        });

        row.querySelectorAll(".attendance-toggle-button").forEach(button => {
            button.addEventListener("click", () => {
                const absenceInput = row.querySelector(".absence-input");
                const statusInput = row.querySelector(".attendance-status");
                if (button.dataset.status === "present") {
                    statusInput.value = "present";
                } else {
                    if (statusInput.value !== "absent") {
                        const currentAbsences = Number(absenceInput.value) || 0;
                        absenceInput.value = String(currentAbsences + 1);
                    }
                    statusInput.value = "absent";
                }
                updateRow(row);
            });
        });
        tableBody.append(row);
        updateRow(row);
    });

    emptyState.hidden = filteredStudents.length > 0;
    saveButton.disabled = filteredStudents.length === 0;
    markAllPresent.disabled = filteredStudents.length === 0;
    markAllAbsent.disabled = filteredStudents.length === 0;
    updateSummary();
}

saveButton.addEventListener("click", () => {
    if (!attendanceDate.value) {
        showMessage("Selecione o dia da chamada.", "error");
        return;
    }

    const records = {};
    let invalid = false;

    tableBody.querySelectorAll("tr").forEach(row => {
        const gradeInput = row.querySelector(".grade-input");
        const absenceInput = row.querySelector(".absence-input");
        const statusInput = row.querySelector(".attendance-status");
        const justificationInput = row.querySelector(".justification-input");
        const grade = getGradeNumber(gradeInput.value);
        const absences = absenceInput.value === "" ? null : Number(absenceInput.value);

        if ((grade !== null && (grade < 0 || grade > 10)) ||
            (absences !== null && (absences < 0 || absences > 20))) {
            invalid = true;
        }

        records[gradeInput.dataset.studentId] = {
            nota: grade === null ? "" : formatGrade(grade),
            faltas: absenceInput.value,
            status: statusInput.value,
            justificativa: justificationInput.value.trim()
        };
    });

    if (invalid) {
        showMessage("A nota deve ficar entre 0 e 10 e as faltas entre 0 e 20.", "error");
        return;
    }

    gradeRecords[recordKey()] = records;
    gradeRecords[`${classFilter.value}|${periodFilter.value}`] = records;
    localStorage.setItem(GRADE_KEY, JSON.stringify(gradeRecords));
    showMessage("Notas e frequência salvas com sucesso!", "success");
});

getClassNames().forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    classFilter.append(option);
});

const today = new Date();
attendanceDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

classFilter.addEventListener("change", () => {
    showMessage("");
    renderGrades();
});

periodFilter.addEventListener("change", () => {
    showMessage("");
    renderGrades();
});

attendanceDate.addEventListener("change", () => {
    showMessage(attendanceDate.value ? "Chamada carregada para o dia selecionado." : "");
    renderGrades();
});

markAllPresent.addEventListener("click", () => {
    tableBody.querySelectorAll("tr").forEach(row => {
        row.querySelector(".attendance-status").value = "present";
    });
    tableBody.querySelectorAll("tr").forEach(updateRow);
    showMessage("Todos os alunos foram marcados como presentes.", "success");
});

markAllAbsent.addEventListener("click", () => {
    tableBody.querySelectorAll("tr").forEach(row => {
        const statusInput = row.querySelector(".attendance-status");
        if (statusInput.value !== "absent") {
            const absenceInput = row.querySelector(".absence-input");
            absenceInput.value = String((Number(absenceInput.value) || 0) + 1);
            statusInput.value = "absent";
        }
    });
    tableBody.querySelectorAll("tr").forEach(updateRow);
    showMessage("Todos os alunos foram marcados com uma falta.", "success");
});

renderGrades();
