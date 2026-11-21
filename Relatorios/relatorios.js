"use strict";

const STUDENT_KEY = "brightfuture.alunos.v1";
const CLASS_KEY = "brightfuture.turmas.v1";
const GRADE_KEY = "brightfuture.notas-frequencia.v1";
const TOTAL_LESSONS = 20;

const classFilter = document.querySelector("#reportClassFilter");
const periodFilter = document.querySelector("#reportPeriodFilter");
const printButton = document.querySelector("#printReportButton");
const message = document.querySelector("#reportsMessage");
const studentCount = document.querySelector("#reportStudentCount");
const classCount = document.querySelector("#reportClassCount");
const average = document.querySelector("#reportAverage");
const attendance = document.querySelector("#reportAttendance");
const tableBody = document.querySelector("#classReportBody");
const tableEmpty = document.querySelector("#classReportEmpty");
const recordCount = document.querySelector("#reportRecordCount");
const attentionList = document.querySelector("#attentionList");
const attentionEmpty = document.querySelector("#attentionEmpty");

const students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]");
const savedClasses = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
const gradeRecords = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");

function getClassNames() {
    const names = [...savedClasses];
    students.forEach(student => names.push(student.turma));
    return [...new Set(names.filter(name => name && name.trim()).map(name => name.trim()))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function getAttendance(absences) {
    if (absences === "" || absences === undefined) {
        return null;
    }

    function getGradeNumber(value) {
        if (value === "" || value === null || value === undefined) {
            return null;
        }
        const grade = Number(String(value).replace(",", "."));
        return Number.isNaN(grade) ? null : grade;
    }
    const value = Number(absences);
    if (Number.isNaN(value)) {
        return null;
    }
    const validAbsences = Math.max(0, Math.min(TOTAL_LESSONS, value));
    return ((TOTAL_LESSONS - validAbsences) / TOTAL_LESSONS) * 100;
}

function getStatus(classAverage, classAttendance) {
    if (classAverage === null && classAttendance === null) {
        return ["Pendente", "revision"];
    }
    if (classAverage !== null && classAverage < 7) {
        return ["Revisão", "revision"];
    }
    if (classAttendance !== null && classAttendance < 75) {
        return ["Revisão", "revision"];
    }
    return ["No percurso", "approved"];
}

function renderReport() {
    const selectedClass = classFilter.value;
    const period = periodFilter.value;
    const visibleNames = selectedClass ? [selectedClass] : getClassNames();
    const visibleStudents = selectedClass
        ? students.filter(student => student.turma === selectedClass)
        : students;

    const allGrades = [];
    const allAttendances = [];
    const attentionStudents = [];
    const reportRows = [];
    let recordsSaved = 0;

    visibleNames.forEach(className => {
        const classStudents = visibleStudents.filter(student =>
            student.turma.toLowerCase() === className.toLowerCase()
        );
        const grades = [];
        const attendances = [];

        classStudents.forEach(student => {
            const record = gradeRecords[`${className}|${period}`]?.[student.id];
            if (!record) {
                return;
            }

            const grade = getGradeNumber(record.nota);
            const studentAttendance = getAttendance(record.faltas);

            if (grade !== null && !Number.isNaN(grade)) {
                grades.push(grade);
                allGrades.push(grade);
                recordsSaved++;
            }
            if (studentAttendance !== null) {
                attendances.push(studentAttendance);
                allAttendances.push(studentAttendance);
            }

            if ((grade !== null && grade < 7) ||
                (studentAttendance !== null && studentAttendance < 75)) {
                const reasons = [];
                if (grade !== null && grade < 7) {
                    reasons.push(`nota ${grade.toFixed(1).replace(".", ",")}`);
                }
                if (studentAttendance !== null && studentAttendance < 75) {
                    reasons.push(`frequência ${studentAttendance.toFixed(0)}%`);
                }
                attentionStudents.push({
                    name: student.nome,
                    className,
                    reason: reasons.join(" • ")
                });
            }
        });

        if (classStudents.length > 0) {
            const classAverage = grades.length
                ? grades.reduce((sum, value) => sum + value, 0) / grades.length
                : null;
            const classAttendance = attendances.length
                ? attendances.reduce((sum, value) => sum + value, 0) / attendances.length
                : null;

            reportRows.push({
                name: className,
                students: classStudents.length,
                average: classAverage,
                attendance: classAttendance
            });
        }
    });

    studentCount.textContent = String(visibleStudents.length);
    classCount.textContent = String(reportRows.length);

    const overallAverage = allGrades.length
        ? allGrades.reduce((sum, value) => sum + value, 0) / allGrades.length
        : null;
    const overallAttendance = allAttendances.length
        ? allAttendances.reduce((sum, value) => sum + value, 0) / allAttendances.length
        : null;

    average.textContent = overallAverage === null
        ? "—"
        : overallAverage.toFixed(1).replace(".", ",");
    attendance.textContent = overallAttendance === null
        ? "—"
        : `${overallAttendance.toFixed(0)}%`;
    recordCount.textContent = `${recordsSaved} ${recordsSaved === 1 ? "registro" : "registros"}`;
    message.textContent = recordsSaved === 0
        ? "Ainda não há notas registradas para este período."
        : `Relatório atualizado para o ${period}.`;

    tableBody.replaceChildren();
    reportRows.forEach(row => {
        const tr = document.createElement("tr");
        const [status, statusType] = getStatus(row.average, row.attendance);
        tr.innerHTML = `
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td><span class="report-status"></span></td>
        `;
        tr.children[0].textContent = row.name;
        tr.children[1].textContent = String(row.students);
        tr.children[2].textContent = row.average === null
            ? "—"
            : row.average.toFixed(1).replace(".", ",");
        tr.children[3].textContent = row.attendance === null
            ? "—"
            : `${row.attendance.toFixed(0)}%`;
        tr.querySelector(".report-status").textContent = status;
        tr.querySelector(".report-status").className = `report-status ${statusType}`;
        tableBody.append(tr);
    });
    tableEmpty.hidden = reportRows.length > 0;

    attentionList.replaceChildren();
    attentionStudents.forEach(item => {
        const element = document.createElement("div");
        element.className = "attention-item";
        element.innerHTML = "<strong></strong><span></span><span class=\"attention-reason\"></span>";
        element.children[0].textContent = item.name;
        element.children[1].textContent = item.className;
        element.children[2].textContent = item.reason;
        attentionList.append(element);
    });
    attentionEmpty.hidden = attentionStudents.length > 0;
}

getClassNames().forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    classFilter.append(option);
});

classFilter.addEventListener("change", renderReport);
periodFilter.addEventListener("change", renderReport);
printButton.addEventListener("click", () => window.print());

renderReport();
