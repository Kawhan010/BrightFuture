"use strict";

const STUDENT_KEY = "brightfuture.alunos.v1";
const CLASS_KEY = "brightfuture.turmas.v1";
const GRADE_KEY = "brightfuture.notas-frequencia.v1";

const studentCount = document.querySelector("#dashboardStudentCount");
const classCount = document.querySelector("#dashboardClassCount");
const average = document.querySelector("#dashboardAverage");
const attendance = document.querySelector("#dashboardAttendance");
const greeting = document.querySelector("#welcomeGreeting");

const students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]").filter(student => !student.arquivado);
const classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
const records = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");

function getGrade(value) {
    if (value === "" || value === null || value === undefined) return null;
    const grade = Number(String(value).replace(",", "."));
    return Number.isFinite(grade) && grade >= 0 && grade <= 10 ? grade : null;
}

function renderDashboard() {
    const names = [...new Set([...classes, ...students.map(student => student.turma)].filter(Boolean))];
    const grades = [];
    let present = 0;
    let totalCalls = 0;

    students.forEach(student => {
        ["1º trimestre", "2º trimestre", "3º trimestre"].forEach(period => {
            const value = records[`${student.turma}|${period}`]?.[student.id]?.nota;
            const grade = getGrade(value);
            if (grade !== null) grades.push(grade);
        });
        Object.keys(records).forEach(key => {
            if (!key.startsWith(student.turma + "|")) return;
            const parts = key.split("|");
            if (parts.length !== 3) return; // Somente registros por dia
            const date = parts[2];
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            if (!date.startsWith(currentMonth)) return;
            const status = records[key][student.id]?.status;
            if (status === "present" || status === "absent") {
                totalCalls++;
                if (status === "present") present++;
            }
        });
    });

    studentCount.textContent = String(students.length);
    classCount.textContent = String(names.length);
    average.textContent = grades.length
        ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1).replace(".", ",") : "—";
    attendance.textContent = totalCalls ? (100 * present / totalCalls).toFixed(0) + "%" : "—";
}

const hour = new Date().getHours();
const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
greeting.textContent = `${hello}! Boas-vindas à Bright Future`;
renderDashboard();
