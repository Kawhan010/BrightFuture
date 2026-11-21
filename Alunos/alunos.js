"use strict";

const STUDENT_KEY = "brightfuture.alunos.v1";
const CLASS_KEY = "brightfuture.turmas.v1";

const form = document.querySelector("#studentForm");
const nameInput = document.querySelector("#studentName");
const cpfInput = document.querySelector("#studentCpf");
const birthDateInput = document.querySelector("#studentBirthDate");
const classInput = document.querySelector("#studentClass");
const guardianNameInput = document.querySelector("#guardianName");
const guardianCpfInput = document.querySelector("#guardianCpf");
const guardianRelationshipInput = document.querySelector("#guardianRelationship");
const contactInput = document.querySelector("#guardianContact");
const addressInput = document.querySelector("#studentAddress");
const classFilter = document.querySelector("#studentClassFilter");
const searchInput = document.querySelector("#studentSearch");
const tableBody = document.querySelector("#studentsTableBody");
const emptyState = document.querySelector("#studentsEmptyState");
const studentCount = document.querySelector("#studentCount");
const formTitle = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveStudentButton");
const cancelButton = document.querySelector("#cancelStudentEdit");
const message = document.querySelector("#studentMessage");

let students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]");
let classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
let editingId = null;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `student-message ${type}`;
}

function createId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return String(Date.now());
}

function saveStudents() {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(students));
}

function formatCpf(value) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function cleanCpf(value) {
    return value.replace(/\D/g, "");
}

function calculateAge(birthDate) {
    if (!birthDate) {
        return "—";
    }

    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) {
        return "—";
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= 0 ? `${age} anos` : "—";
}

cpfInput.addEventListener("input", () => {
    cpfInput.value = formatCpf(cpfInput.value);
});

guardianCpfInput.addEventListener("input", () => {
    guardianCpfInput.value = formatCpf(guardianCpfInput.value);
});

function getClassNames() {
    const names = [...classes];
    students.forEach(student => names.push(student.turma));

    return [...new Set(names
        .filter(name => typeof name === "string" && name.trim())
        .map(name => name.trim()))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function fillClassOptions() {
    const names = getClassNames();
    const selectedFormClass = classInput.value;
    const selectedFilter = classFilter.value;

    classInput.replaceChildren();
    names.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        classInput.append(option);
    });

    if (selectedFormClass) {
        classInput.value = selectedFormClass;
    }

    classFilter.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todas as turmas";
    classFilter.append(allOption);

    names.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        classFilter.append(option);
    });

    if (selectedFilter) {
        classFilter.value = selectedFilter;
    }

    classInput.disabled = names.length === 0;
    saveButton.disabled = names.length === 0;
}

function renderStudents() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedClass = classFilter.value;

    const filtered = students.filter(student => {
        const isInClass = !selectedClass || student.turma === selectedClass;
        const text = `${student.nome} ${student.cpfAluno || ""} ${student.responsavel || ""} ${student.contato || ""}`.toLowerCase();
        return isInClass && text.includes(search);
    });

    tableBody.replaceChildren();

    filtered.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>
                <div class="student-row-actions">
                    <button type="button" class="student-action-button" data-action="edit" data-id="${student.id}">Editar</button>
                    <button type="button" class="student-action-button delete" data-action="delete" data-id="${student.id}">Excluir</button>
                </div>
            </td>
        `;
        row.children[0].textContent = student.nome;
        row.children[1].textContent = student.cpfAluno || "—";
        row.children[2].textContent = calculateAge(student.nascimento);
        row.children[3].textContent = student.turma;
        row.children[4].textContent = student.responsavel || "—";
        row.children[5].textContent = student.contato || "—";
        tableBody.append(row);
    });

    studentCount.textContent = String(filtered.length);
    emptyState.hidden = filtered.length > 0;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Novo aluno";
    saveButton.textContent = "Cadastrar aluno";
    cancelButton.hidden = true;
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const student = {
        id: editingId || createId(),
        nome: nameInput.value.trim(),
        cpfAluno: cpfInput.value.trim(),
        nascimento: birthDateInput.value,
        turma: classInput.value,
        responsavel: guardianNameInput.value.trim(),
        cpfResponsavel: guardianCpfInput.value.trim(),
        parentesco: guardianRelationshipInput.value,
        contato: contactInput.value.trim(),
        endereco: addressInput.value.trim()
    };

    if (!student.nome || !student.cpfAluno || !student.nascimento ||
        !student.turma || !student.responsavel || !student.cpfResponsavel ||
        !student.parentesco || !student.contato) {
        showMessage("Preencha todos os dados obrigatórios da matrícula.", "error");
        return;
    }

    if (cleanCpf(student.cpfAluno).length !== 11 ||
        cleanCpf(student.cpfResponsavel).length !== 11) {
        showMessage("Informe os CPF completos, com 11 números.", "error");
        return;
    }

    if (editingId) {
        students = students.map(item => item.id === editingId ? student : item);
        showMessage("Dados atualizados! Tudo certo com o cadastro.", "success");
    } else {
        students.push(student);
        showMessage("Matrícula concluída! Aluno cadastrado com sucesso.", "success");
    }

    saveStudents();
    resetForm();
    fillClassOptions();
    renderStudents();
});

tableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const student = students.find(item => item.id === button.dataset.id);
    if (!student) {
        return;
    }

    if (button.dataset.action === "edit") {
        editingId = student.id;
        nameInput.value = student.nome;
        cpfInput.value = student.cpfAluno || "";
        birthDateInput.value = student.nascimento || "";
        contactInput.value = student.contato;
        guardianNameInput.value = student.responsavel || "";
        guardianCpfInput.value = student.cpfResponsavel || "";
        guardianRelationshipInput.value = student.parentesco || "";
        addressInput.value = student.endereco || "";
        fillClassOptions();
        classInput.value = student.turma;
        formTitle.textContent = "Editar aluno";
        saveButton.textContent = "Salvar alterações";
        cancelButton.hidden = false;
        nameInput.focus();
    }

    if (button.dataset.action === "delete" && confirm(`Excluir ${student.nome}?`)) {
        students = students.filter(item => item.id !== student.id);
        saveStudents();
        resetForm();
        fillClassOptions();
        renderStudents();
        showMessage("Aluno excluído com sucesso.", "success");
    }
});

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edição cancelada.");
});

searchInput.addEventListener("input", renderStudents);
classFilter.addEventListener("change", renderStudents);

fillClassOptions();
renderStudents();
