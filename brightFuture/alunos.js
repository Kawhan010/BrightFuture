"use strict";

const STORAGE_KEY = "brightfuture.alunos.v1";
const CLASSES_STORAGE_KEY = "brightfuture.turmas.v1";

const form = document.querySelector("#studentForm");
const nameInput = document.querySelector("#studentName");
const classInput = document.querySelector("#studentClass");
const contactInput = document.querySelector("#guardianContact");
const formTitle = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveStudentButton");
const cancelButton = document.querySelector("#cancelStudentEdit");
const searchInput = document.querySelector("#studentSearch");
const tableBody = document.querySelector("#studentsTableBody");
const emptyState = document.querySelector("#studentsEmptyState");
const count = document.querySelector("#studentCount");
const message = document.querySelector("#studentMessage");

let students = [];
let registeredClasses = [];
let availableClasses = [];
let editingId = null;
let storageReady = true;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `student-message${type ? ` ${type}` : ""}`;
}

function isStudent(student) {
    return student !== null
        && typeof student === "object"
        && typeof student.id === "string"
        && typeof student.nome === "string"
        && typeof student.turma === "string"
        && typeof student.contato === "string";
}

function loadStudents() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
        return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isStudent)) {
        throw new Error("Os dados salvos dos alunos têm um formato inválido.");
    }
    return parsed;
}

function loadRegisteredClasses() {
    const saved = localStorage.getItem(CLASSES_STORAGE_KEY);
    if (saved === null) {
        return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(name => typeof name === "string" && name.trim())) {
        throw new Error("Os dados salvos das turmas têm um formato inválido.");
    }
    return parsed.map(name => name.trim());
}

function populateClassOptions(selectedValue = "") {
    const seen = new Set();
    availableClasses = [];

    [...registeredClasses, ...students.map(student => student.turma)]
        .map(name => name.trim())
        .filter(Boolean)
        .forEach(name => {
            const key = name.toLocaleLowerCase("pt-BR");
            if (!seen.has(key)) {
                seen.add(key);
                availableClasses.push(name);
            }
        });

    classInput.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = availableClasses.length ? "Selecione uma turma" : "Cadastre uma turma primeiro";
    placeholder.disabled = true;
    placeholder.selected = true;
    classInput.append(placeholder);

    availableClasses.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        classInput.append(option);
    });

    if (selectedValue && !availableClasses.includes(selectedValue)) {
        const currentOption = document.createElement("option");
        currentOption.value = selectedValue;
        currentOption.textContent = selectedValue;
        classInput.append(currentOption);
    }

    classInput.disabled = availableClasses.length === 0;
    saveButton.disabled = availableClasses.length === 0 || !storageReady;
    classInput.value = selectedValue;
}

function saveStudents(nextStudents) {
    if (!storageReady) {
        showMessage("O armazenamento não está disponível. Os dados não foram alterados.", "error");
        return false;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStudents));
        return true;
    } catch (error) {
        showMessage("Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente.", "error");
        return false;
    }
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function makeActionButton(label, action, id, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `student-action-button${extraClass ? ` ${extraClass}` : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = id;
    return button;
}

function renderStudents() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const visibleStudents = students.filter(student => [
        student.nome,
        student.turma,
        student.contato
    ].join(" ").toLocaleLowerCase("pt-BR").includes(query));

    tableBody.replaceChildren();
    visibleStudents.forEach(student => {
        const row = document.createElement("tr");
        row.append(
            makeCell(student.nome),
            makeCell(student.turma),
            makeCell(student.contato)
        );

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "student-row-actions";
        actions.append(
            makeActionButton("Editar", "edit", student.id),
            makeActionButton("Excluir", "delete", student.id, "delete")
        );
        actionsCell.append(actions);
        row.append(actionsCell);
        tableBody.append(row);
    });

    count.textContent = String(students.length);
    emptyState.hidden = visibleStudents.length > 0;
    emptyState.textContent = students.length === 0
        ? "Nenhum aluno cadastrado."
        : "Nenhum aluno encontrado para essa busca.";
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Novo aluno";
    saveButton.textContent = "Cadastrar aluno";
    cancelButton.hidden = true;
}

function editStudent(student) {
    editingId = student.id;
    nameInput.value = student.nome;
    populateClassOptions(student.turma);
    classInput.value = student.turma;
    contactInput.value = student.contato;
    formTitle.textContent = "Editar aluno";
    saveButton.textContent = "Salvar alterações";
    cancelButton.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    nameInput.focus();
}

form.addEventListener("submit", event => {
    event.preventDefault();
    nameInput.value = nameInput.value.trim();
    contactInput.value = contactInput.value.trim();

    if (!classInput.value) {
        showMessage("Cadastre ou selecione uma turma antes de salvar o aluno.", "error");
        return;
    }

    if (!form.reportValidity()) {
        return;
    }

    const studentData = {
        nome: nameInput.value,
        turma: classInput.value,
        contato: contactInput.value
    };
    const wasEditing = Boolean(editingId);

    if (wasEditing && !students.some(student => student.id === editingId)) {
        showMessage("Este aluno não foi encontrado. Atualize a página e tente novamente.", "error");
        return;
    }

    const nextStudents = wasEditing
        ? students.map(student => student.id === editingId ? { ...student, ...studentData } : student)
        : [...students, { id: createId(), ...studentData, ativo: true }];

    if (!saveStudents(nextStudents)) {
        return;
    }

    students = nextStudents;
    resetForm();
    renderStudents();
    showMessage(wasEditing ? "Aluno atualizado com sucesso." : "Aluno cadastrado com sucesso.", "success");
});

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edição cancelada.");
});

searchInput.addEventListener("input", renderStudents);

tableBody.addEventListener("click", event => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const student = students.find(item => item.id === button.dataset.id);
    if (!student) {
        showMessage("Este aluno não foi encontrado. Atualize a página e tente novamente.", "error");
        return;
    }

    if (button.dataset.action === "edit") {
        editStudent(student);
        return;
    }

    if (button.dataset.action === "delete" && window.confirm(`Excluir o cadastro de ${student.nome}?`)) {
        const nextStudents = students.filter(item => item.id !== student.id);
        if (!saveStudents(nextStudents)) {
            return;
        }

        students = nextStudents;
        if (editingId === student.id) {
            resetForm();
        }
        renderStudents();
        showMessage("Aluno excluído com sucesso.", "success");
    }
});

try {
    students = loadStudents();
    registeredClasses = loadRegisteredClasses();
    populateClassOptions();
} catch (error) {
    storageReady = false;
    form.querySelectorAll("input, button").forEach(control => {
        control.disabled = true;
    });
    classInput.disabled = true;
    searchInput.disabled = true;
    showMessage("Não foi possível ler os alunos ou as turmas salvos. Os dados foram preservados e a edição está desativada.", "error");
}

renderStudents();
