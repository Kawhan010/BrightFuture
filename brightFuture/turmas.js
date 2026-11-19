"use strict";

const STUDENTS_STORAGE_KEY = "brightfuture.alunos.v1";
const CLASSES_STORAGE_KEY = "brightfuture.turmas.v1";

const form = document.querySelector("#classForm");
const classNameInput = document.querySelector("#className");
const searchInput = document.querySelector("#classSearch");
const classesContainer = document.querySelector("#classesContainer");
const emptyState = document.querySelector("#classesEmptyState");
const message = document.querySelector("#classMessage");
const studentCount = document.querySelector("#studentCount");
const classCount = document.querySelector("#classCount");

let students = [];
let classes = [];
let studentLoadError = false;
let classStorageReady = true;

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `class-message${type ? ` ${type}` : ""}`;
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
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (saved === null) {
        return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isStudent)) {
        throw new Error("Os dados salvos dos alunos têm um formato inválido.");
    }
    return parsed;
}

function loadClasses() {
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

function saveClasses(nextClasses) {
    if (!classStorageReady) {
        showMessage("O armazenamento das turmas não está disponível. Os dados não foram alterados.", "error");
        return false;
    }

    try {
        localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(nextClasses));
        return true;
    } catch (error) {
        showMessage("Não foi possível salvar a turma. Verifique o armazenamento do navegador e tente novamente.", "error");
        return false;
    }
}

function createStudentRow(student) {
    const item = document.createElement("li");
    item.className = "class-student";

    const name = document.createElement("strong");
    name.textContent = student.nome.trim() || "Aluno sem nome";

    const contact = document.createElement("span");
    contact.textContent = student.contato.trim() || "Contato não informado";

    item.append(name, contact);
    return item;
}

function createClassCard(className, classStudents) {
    const card = document.createElement("article");
    card.className = "class-card";

    const header = document.createElement("header");
    header.className = "class-card-header";

    const title = document.createElement("h3");
    title.textContent = className;

    const count = document.createElement("span");
    count.textContent = `${classStudents.length} ${classStudents.length === 1 ? "aluno" : "alunos"}`;
    header.append(title, count);

    const list = document.createElement("ul");
    list.className = "class-student-list";
    if (classStudents.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "class-student";
        emptyItem.textContent = "Nenhum aluno nesta turma ainda.";
        list.append(emptyItem);
    } else {
        classStudents.forEach(student => list.append(createStudentRow(student)));
    }

    card.append(header, list);
    return card;
}

function renderClasses() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const groups = new Map();
    const addClass = name => {
        const className = name.trim() || "Sem turma definida";
        const classKey = className.toLocaleLowerCase("pt-BR");
        if (!groups.has(classKey)) {
            groups.set(classKey, { name: className, students: [] });
        }
        return groups.get(classKey);
    };

    classes.forEach(className => addClass(className));
    students.forEach(student => {
        addClass(student.turma).students.push(student);
    });

    const visibleGroups = Array.from(groups.values()).map(group => {
        const classMatches = group.name.toLocaleLowerCase("pt-BR").includes(query);
        const matchingStudents = query === "" || classMatches
            ? group.students
            : group.students.filter(student => [
                student.nome,
                student.contato
            ].join(" ").toLocaleLowerCase("pt-BR").includes(query));

        return { ...group, visibleStudents: matchingStudents, matches: query === "" || classMatches || matchingStudents.length > 0 };
    }).filter(group => group.matches);

    visibleGroups.sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { numeric: true, sensitivity: "base" })
    );

    classesContainer.replaceChildren();
    visibleGroups.forEach(group => {
        group.visibleStudents.sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        classesContainer.append(createClassCard(group.name, group.visibleStudents));
    });

    const visibleStudentCount = visibleGroups.reduce((total, group) => total + group.visibleStudents.length, 0);
    studentCount.textContent = String(visibleStudentCount);
    classCount.textContent = String(visibleGroups.length);
    emptyState.hidden = visibleGroups.length > 0;
    if (studentLoadError) {
        emptyState.textContent = "Os alunos salvos não puderam ser carregados.";
    } else if (query !== "") {
        emptyState.textContent = "Nenhuma turma ou aluno encontrado para essa busca.";
    } else {
        emptyState.textContent = "Nenhuma turma ou aluno cadastrado.";
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();
    classNameInput.value = classNameInput.value.trim();

    if (!form.reportValidity()) {
        return;
    }

    const normalizedName = classNameInput.value.toLocaleLowerCase("pt-BR");
    const nameAlreadyExists = classes.some(name => name.toLocaleLowerCase("pt-BR") === normalizedName)
        || students.some(student => student.turma.trim().toLocaleLowerCase("pt-BR") === normalizedName);
    if (nameAlreadyExists) {
        showMessage("Essa turma já está cadastrada ou já possui alunos.", "error");
        return;
    }

    const nextClasses = [...classes, classNameInput.value];
    if (!saveClasses(nextClasses)) {
        return;
    }

    classes = nextClasses;
    form.reset();
    renderClasses();
    showMessage("Turma cadastrada com sucesso.", "success");
});

searchInput.addEventListener("input", renderClasses);

const loadingMessages = [];
try {
    students = loadStudents();
} catch (error) {
    studentLoadError = true;
    loadingMessages.push("Não foi possível ler os alunos salvos; os dados foram preservados.");
}

try {
    classes = loadClasses();
} catch (error) {
    classStorageReady = false;
    form.querySelectorAll("input, button").forEach(control => {
        control.disabled = true;
    });
    loadingMessages.push("Não foi possível ler as turmas salvas; o cadastro está desativado.");
}

if (loadingMessages.length > 0) {
    showMessage(loadingMessages.join(" "), "error");
}

renderClasses();
