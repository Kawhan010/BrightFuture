"use strict";

const STUDENTS_STORAGE_KEY = "brightfuture.alunos.v1";
const CLASSES_STORAGE_KEY = "brightfuture.turmas.v1";

const studentCount = document.querySelector("#dashboardStudentCount");
const classCount = document.querySelector("#dashboardClassCount");
const welcomeGreeting = document.querySelector("#welcomeGreeting");

function loadArray(key) {
    const saved = localStorage.getItem(key);
    if (saved === null) {
        return [];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
}

function setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    welcomeGreeting.textContent = `${greeting}! Boas-vindas à Bright Future`;
}

try {
    const students = loadArray(STUDENTS_STORAGE_KEY);
    const savedClasses = loadArray(CLASSES_STORAGE_KEY);
    const studentClasses = students
        .map(student => typeof student === "object" && student !== null ? student.turma : "")
        .filter(turma => typeof turma === "string" && turma.trim());

    const classNames = [...savedClasses, ...studentClasses]
        .filter(turma => typeof turma === "string" && turma.trim())
        .map(turma => turma.trim());

    const uniqueClasses = new Set(
        classNames.map(turma => turma.toLocaleLowerCase("pt-BR"))
    );

    studentCount.textContent = String(students.length);
    classCount.textContent = String(uniqueClasses.size);
} catch (error) {
    studentCount.textContent = "0";
    classCount.textContent = "0";
}

setGreeting();