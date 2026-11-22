"use strict";

const STUDENT_KEY = "brightfuture.alunos.v2";
const CLASS_KEY = "brightfuture.turmas.v2";
const GRADE_KEY = "brightfuture.notas-frequencia.v2";

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

const auth = window.BrightAuth;
const students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]")
    .filter(student => !student.arquivado && auth.canSeeStudent(student));
const classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
const gradeRecords = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");

function getClassNames() {
    const names = [...classes, ...students.map(student => student.turma)];
    return [...new Set(names.filter(name => name && auth.canSeeClass(name)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function getGrade(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
}

function getAttendance(className, period, studentId) {
    const prefix = `${className}|${period}|`;
    let present = 0;
    let total = 0;
    Object.keys(gradeRecords).forEach(key => {
        if (!key.startsWith(prefix)) return;
        const status = gradeRecords[key][studentId]?.status;
        if (status === "present" || status === "absent") {
            total++;
            if (status === "present") present++;
        }
    });
    return total ? (100 * present / total) : null;
}

function formatNumber(value) {
    return value === null ? "—" : value.toFixed(1).replace(".", ",");
}

function averageOf(numbers) {
    return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
}

function getStatus(classAverage, classAttendance) {
    if (classAverage === null && classAttendance === null) return ["Pendente", "revision"];
    if (classAverage !== null && classAverage < 7) return ["Revisão", "revision"];
    if (classAttendance !== null && classAttendance < 75) return ["Revisão", "revision"];
    return ["No percurso", "approved"];
}

function renderReport() {
    const selectedClass = classFilter.value;
    const period = periodFilter.value;
    const visibleStudents = selectedClass ? students.filter(item => item.turma === selectedClass) : students;
    const names = selectedClass ? [selectedClass] : getClassNames();
    const allGrades = [];
    const allAttendances = [];
    const attentionStudents = [];
    let savedStudents = 0;

    tableBody.replaceChildren();
    names.forEach(name => {
        const classStudents = visibleStudents.filter(student => student.turma === name);
        if (classStudents.length === 0) return;
        const grades = [];
        const frequencies = [];
        const periodGrades = gradeRecords[`${name}|${period}`] || {};

        classStudents.forEach(student => {
            const grade = getGrade(periodGrades[student.id]?.nota);
            const frequency = getAttendance(name, period, student.id);
            if (grade !== null) { grades.push(grade); allGrades.push(grade); }
            if (frequency !== null) { frequencies.push(frequency); allAttendances.push(frequency); }
            if (grade !== null || frequency !== null) savedStudents++;

            if ((grade !== null && grade < 7) || (frequency !== null && frequency < 75)) {
                const reasons = [];
                if (grade !== null && grade < 7) reasons.push("nota " + formatNumber(grade));
                if (frequency !== null && frequency < 75) reasons.push("frequência " + frequency.toFixed(0) + "%");
                attentionStudents.push({name: student.nome, className: name, reason: reasons.join(" • ")});
            }
        });

        const classAverage = averageOf(grades);
        const classFrequency = averageOf(frequencies);
        const [status, type] = getStatus(classAverage, classFrequency);
        const tr = document.createElement("tr");
        for (let i = 0; i < 5; i++) tr.append(document.createElement("td"));
        tr.children[0].textContent = name;
        tr.children[1].textContent = String(classStudents.length);
        tr.children[2].textContent = formatNumber(classAverage);
        tr.children[3].textContent = classFrequency === null ? "—" : classFrequency.toFixed(0) + "%";
        const badge = document.createElement("span");
        badge.className = `report-status ${type}`;
        badge.textContent = status;
        tr.children[4].append(badge);
        tableBody.append(tr);
    });

    studentCount.textContent = String(visibleStudents.length);
    classCount.textContent = String(tableBody.children.length);
    average.textContent = formatNumber(averageOf(allGrades));
    const averageFrequency = averageOf(allAttendances);
    attendance.textContent = averageFrequency === null ? "—" : averageFrequency.toFixed(0) + "%";
    recordCount.textContent = `${savedStudents} ${savedStudents === 1 ? "aluno com registro" : "alunos com registros"}`;
    message.textContent = savedStudents ? `Dados do ${period}.` : "Ainda não há notas ou chamadas neste período.";
    tableEmpty.hidden = tableBody.children.length > 0;

    attentionList.replaceChildren();
    attentionStudents.forEach(item => {
        const div = document.createElement("div");
        div.className = "attention-item";
        const name = document.createElement("strong");
        name.textContent = item.name;
        const className = document.createElement("span");
        className.textContent = item.className;
        const reason = document.createElement("span");
        reason.className = "attention-reason";
        reason.textContent = item.reason;
        div.append(name, className, reason);
        attentionList.append(div);
    });
    attentionEmpty.hidden = attentionStudents.length > 0;
}

getClassNames().forEach(name => classFilter.add(new Option(name, name)));
const month = new Date().getMonth();
periodFilter.value = month < 4 ? "1º trimestre" : month < 8 ? "2º trimestre" : "3º trimestre";
classFilter.addEventListener("change", renderReport);
periodFilter.addEventListener("change", renderReport);
printButton.addEventListener("click", () => window.print());
renderReport();
