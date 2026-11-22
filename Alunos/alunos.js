"use strict";

// Dados salvos no navegador com localStorage.
const STUDENT_KEY = "brightfuture.alunos.v2";
const CLASS_KEY = "brightfuture.turmas.v2";
const GRADE_KEY = "brightfuture.notas-frequencia.v2";

const form = document.querySelector("#studentForm");
const nameInput = document.querySelector("#studentName");
const cpfInput = document.querySelector("#studentCpf");
const birthInput = document.querySelector("#studentBirthDate");
const classInput = document.querySelector("#studentClass");
const guardianInput = document.querySelector("#guardianName");
const guardianCpfInput = document.querySelector("#guardianCpf");
const relationshipInput = document.querySelector("#guardianRelationship");
const contactInput = document.querySelector("#guardianContact");
const addressInput = document.querySelector("#studentAddress");
const classFilter = document.querySelector("#studentClassFilter");
const statusFilter = document.querySelector("#studentStatusFilter");
const searchInput = document.querySelector("#studentSearch");
const tableBody = document.querySelector("#studentsTableBody");
const emptyState = document.querySelector("#studentsEmptyState");
const studentCount = document.querySelector("#studentCount");
const formTitle = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveStudentButton");
const cancelButton = document.querySelector("#cancelStudentEdit");
const message = document.querySelector("#studentMessage");

// A classe Aluno reúne os dados e ações de cada matrícula.
class Aluno {
    constructor(dados) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.cpfAluno = dados.cpfAluno;
        this.nascimento = dados.nascimento;
        this.turma = dados.turma;
        this.responsavel = dados.responsavel;
        this.cpfResponsavel = dados.cpfResponsavel;
        this.parentesco = dados.parentesco;
        this.contato = dados.contato;
        this.endereco = dados.endereco;
        this.arquivado = Boolean(dados.arquivado);
    }

    arquivar() { this.arquivado = true; }
    restaurar() { this.arquivado = false; }
}

// Ao carregar JSON, recriamos os objetos da classe Aluno.
const auth = window.BrightAuth;
const canEdit = auth.canManageStudents();
let students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]").map(dados => new Aluno(dados)).filter(student => auth.canSeeStudent(student));
let classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
let editingId = null;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `student-message ${type}`;
}

function saveStudents() {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(students));
}

function createId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + String(Math.floor(Math.random() * 10000));
}

function formatCpf(value) {
    return value.replace(/\D/g, "").slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function calculateAge(value) {
    if (!value) return "—";
    const birth = new Date(value + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age + " anos" : "—";
}

function getClassNames() {
    const names = [...classes];
    students.forEach(student => names.push(student.turma));
    return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function fillClassOptions() {
    const formValue = classInput.value;
    const filterValue = classFilter.value;
    const names = getClassNames();

    classInput.replaceChildren();
    classInput.add(new Option("Selecione uma turma", ""));
    names.forEach(name => classInput.add(new Option(name, name)));
    classInput.value = names.includes(formValue) ? formValue : "";

    classFilter.replaceChildren();
    classFilter.add(new Option("Todas as turmas", ""));
    names.forEach(name => classFilter.add(new Option(name, name)));
    classFilter.value = names.includes(filterValue) ? filterValue : "";

    classInput.disabled = names.length === 0;
    saveButton.disabled = names.length === 0;
}

function createAction(text, action, id, style = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `student-action-button ${style}`;
    button.textContent = text;
    button.dataset.action = action;
    button.dataset.id = id;
    return button;
}

function renderStudents() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedClass = classFilter.value;
    const archived = statusFilter.value === "archived";
    const visible = students.filter(student => {
        const sameStatus = Boolean(student.arquivado) === archived;
        const sameClass = !selectedClass || student.turma === selectedClass;
        const searchText = `${student.nome} ${student.cpfAluno} ${student.responsavel} ${student.contato}`.toLowerCase();
        return sameStatus && sameClass && searchText.includes(search);
    });

    tableBody.replaceChildren();
    visible.forEach(student => {
        const row = document.createElement("tr");
        for (let i = 0; i < 7; i++) row.append(document.createElement("td"));
        row.children[0].textContent = student.nome;
        row.children[1].textContent = student.cpfAluno || "—";
        row.children[2].textContent = calculateAge(student.nascimento);
        row.children[3].textContent = student.turma;
        row.children[4].textContent = student.responsavel || "—";
        row.children[5].textContent = student.contato || "—";
        if (auth.user.papel === "professor") [1, 4, 5].forEach(i => row.children[i].hidden = true);

        const actions = document.createElement("div");
        actions.className = "student-row-actions";
        if (canEdit) {
            if (archived) {
                actions.append(createAction("Restaurar", "restore", student.id, "restore"));
            } else {
                actions.append(createAction("Editar", "edit", student.id));
                actions.append(createAction("Arquivar", "archive", student.id, "archive"));
            }
            actions.append(createAction("Excluir", "delete", student.id, "delete"));
        } else {
            actions.textContent = "Consulta";
        }
        row.children[6].append(actions);
        tableBody.append(row);
    });

    studentCount.textContent = String(visible.length);
    emptyState.hidden = visible.length > 0;
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Novo aluno";
    saveButton.textContent = "Cadastrar aluno";
    cancelButton.hidden = true;
}

cpfInput.addEventListener("input", () => cpfInput.value = formatCpf(cpfInput.value));
guardianCpfInput.addEventListener("input", () => guardianCpfInput.value = formatCpf(guardianCpfInput.value));

form.addEventListener("submit", event => {
    event.preventDefault();
    if (!canEdit) return;
    const student = new Aluno({
        id: editingId || createId(),
        nome: nameInput.value.trim(),
        cpfAluno: cpfInput.value.trim(),
        nascimento: birthInput.value,
        turma: classInput.value,
        responsavel: guardianInput.value.trim(),
        cpfResponsavel: guardianCpfInput.value.trim(),
        parentesco: relationshipInput.value,
        contato: contactInput.value.trim(),
        endereco: addressInput.value.trim(),
        arquivado: false
    });

    if (!student.nome || !student.turma || !student.responsavel || !student.parentesco || !student.contato ||
        student.cpfAluno.replace(/\D/g, "").length !== 11 ||
        student.cpfResponsavel.replace(/\D/g, "").length !== 11) {
        showMessage("Preencha todos os dados obrigatórios da matrícula e confira os CPFs.", "error");
        return;
    }
    if (!student.nascimento || new Date(student.nascimento + "T00:00:00") > new Date()) {
        showMessage("Informe uma data de nascimento válida.", "error");
        return;
    }
    if (students.some(item => item.id !== editingId && item.cpfAluno.replace(/\D/g, "") === student.cpfAluno.replace(/\D/g, ""))) {
        showMessage("Já existe um aluno com esse CPF.", "error");
        return;
    }

    if (editingId) {
        students = students.map(item => item.id === editingId ? student : item);
        showMessage("Cadastro atualizado com sucesso!", "success");
    } else {
        students.push(student);
        showMessage("Matrícula concluída! Aluno cadastrado.", "success");
    }
    saveStudents();
    resetForm();
    statusFilter.value = "active";
    fillClassOptions();
    renderStudents();
});

tableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || !canEdit) return;
    const student = students.find(item => item.id === button.dataset.id);
    if (!student) return;

    if (button.dataset.action === "edit") {
        editingId = student.id;
        nameInput.value = student.nome;
        cpfInput.value = student.cpfAluno || "";
        birthInput.value = student.nascimento || "";
        guardianInput.value = student.responsavel || "";
        guardianCpfInput.value = student.cpfResponsavel || "";
        relationshipInput.value = student.parentesco || "";
        contactInput.value = student.contato || "";
        addressInput.value = student.endereco || "";
        fillClassOptions();
        classInput.value = student.turma;
        formTitle.textContent = "Editar aluno";
        saveButton.textContent = "Salvar alterações";
        cancelButton.hidden = false;
        form.scrollIntoView({behavior: "smooth", block: "start"});
        nameInput.focus();
    }

    if (button.dataset.action === "archive" && confirm(`Arquivar ${student.nome}? Os dados poderão ser restaurados.`)) {
        student.arquivar();
        saveStudents();
        resetForm();
        renderStudents();
        showMessage("Aluno arquivado. Consulte a lista de arquivados para restaurar.", "success");
    }

    if (button.dataset.action === "restore") {
        student.restaurar();
        saveStudents();
        statusFilter.value = "active";
        renderStudents();
        showMessage("Aluno restaurado para os matriculados.", "success");
    }

    if (button.dataset.action === "delete" && confirm(`Excluir definitivamente ${student.nome} e seus registros de notas e chamadas?`)) {
        students = students.filter(item => item.id !== student.id);
        const records = JSON.parse(localStorage.getItem(GRADE_KEY) || "{}");
        Object.keys(records).forEach(key => delete records[key][student.id]);
        localStorage.setItem(GRADE_KEY, JSON.stringify(records));
        saveStudents();
        resetForm();
        fillClassOptions();
        renderStudents();
        showMessage("Aluno excluído definitivamente.", "success");
    }
});

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edição cancelada.");
});
searchInput.addEventListener("input", renderStudents);
classFilter.addEventListener("change", renderStudents);
statusFilter.addEventListener("change", renderStudents);
fillClassOptions();
if (!canEdit) {
    form.hidden = true;
    if (auth.user.papel === "professor") {
        statusFilter.closest("label").hidden = true;
        document.querySelectorAll(".students-table th:nth-child(2), .students-table th:nth-child(5), .students-table th:nth-child(6)")
            .forEach(cell => cell.hidden = true);
    }
    const note = document.createElement("p");
    note.className = "role-note";
    note.textContent = auth.user.papel === "professor" ? "Consulte os alunos das suas turmas. As matrículas são administradas pela secretaria." :
        "Consulta de matrículas e contatos. Alterações cadastrais são feitas pela secretaria.";
    form.before(note);
}
renderStudents();
