"use strict";

const STUDENT_KEY = "brightfuture.alunos.v2";
const CLASS_KEY = "brightfuture.turmas.v2";
const GRADE_KEY = "brightfuture.notas-frequencia.v2";

const studentCount = document.querySelector("#dashboardStudentCount");
const classCount = document.querySelector("#dashboardClassCount");
const average = document.querySelector("#dashboardAverage");
const attendance = document.querySelector("#dashboardAttendance");
const greeting = document.querySelector("#welcomeGreeting");

const auth = window.BrightAuth;
const currentUser = auth.user;
const isFamily = ["aluno", "responsavel"].includes(currentUser.papel);
const students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]").filter(student => !student.arquivado && auth.canSeeStudent(student));
const classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]").filter(name => auth.canSeeClass(name));
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
            if (parts.length !== 3) return;
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
    if (isFamily) {
        const student = students[0];
        document.querySelector(".page-header h1").textContent = currentUser.papel === "aluno" ? "Área do aluno" : "Área do responsável";
        document.querySelector("#inicio-title").textContent = student ? `Acompanhamento de ${student.nome}` : "Acompanhamento escolar";
        document.querySelector(".welcome-copy p:last-child").textContent = "Consulte notas e frequência no boletim da escola, sempre que precisar.";
        const cards = document.querySelectorAll(".dashboard-card");
        cards[0].querySelector("span").textContent = "Aluno";
        cards[0].querySelector("strong").textContent = student ? student.nome.split(" ")[0] : "—";
        cards[0].querySelector("small").textContent = "Matrícula vinculada";
        cards[1].querySelector("span").textContent = "Turma";
        cards[1].querySelector("strong").textContent = student?.turma || "—";
        cards[1].querySelector("small").textContent = "Ano letivo de 2026";
        cards[2].querySelector("span").textContent = "Média geral";
        cards[3].querySelector("span").textContent = "Frequência do mês";
        const link = document.createElement("a");
        link.className = "portal-link";
        link.href = "Boletim/boletim.html";
        link.textContent = "Consultar meu boletim →";
        document.querySelector(".dashboard-grid").after(link);
        if (student) {
            let p = 0, t = 0;
            Object.keys(records).forEach(key => {
                if (!key.startsWith(student.turma + "|") || key.split("|").length !== 3) return;
                const st = records[key]?.[student.id]?.status;
                if (st === "present" || st === "absent") { t++; if (st === "present") p++; }
            });
            cards[3].querySelector("span").textContent = "Frequência geral";
            attendance.textContent = t ? Math.round(100 * p / t) + "%" : "—";
        }
    } else if (currentUser.papel === "professor") {
        document.querySelector(".page-header h1").textContent = "Área do professor";
        document.querySelector(".dashboard-card:nth-child(2) span").textContent = "Minhas turmas";
        document.querySelector(".welcome-copy p:last-child").textContent = "Acompanhe suas turmas, registre notas e realize a chamada dos alunos.";
    } else if (currentUser.papel === "coordenacao") {
        document.querySelector(".page-header h1").textContent = "Coordenação pedagógica";
        document.querySelector(".welcome-copy p:last-child").textContent = "Acompanhe os indicadores, os boletins e os estudantes que precisam de atenção.";
    }
}

const hour = new Date().getHours();
const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
greeting.textContent = `${hello}, ${currentUser.nome.split(" ")[0]}! Boas-vindas à BrightFuture`;
renderDashboard();
