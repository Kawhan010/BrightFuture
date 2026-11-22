"use strict";

const STUDENT_KEY = "brightfuture.alunos.v2";
const CLASS_KEY = "brightfuture.turmas.v2";

const form = document.querySelector("#classForm");
const classNameInput = document.querySelector("#className");
const searchInput = document.querySelector("#classSearch");
const container = document.querySelector("#classesContainer");
const emptyState = document.querySelector("#classesEmptyState");
const message = document.querySelector("#classMessage");
const studentCount = document.querySelector("#studentCount");
const classCount = document.querySelector("#classCount");

const auth = window.BrightAuth;
const canEdit = auth.canManageClasses();
let students = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]").filter(student => auth.canSeeStudent(student));
let classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `class-message ${type}`;
}

function saveClasses() {
    localStorage.setItem(CLASS_KEY, JSON.stringify(classes));
}

function getClassNames() {
    const names = [...classes];
    students.forEach(student => names.push(student.turma));

    return [...new Set(names
        .filter(name => typeof name === "string" && name.trim() && auth.canSeeClass(name))
        .map(name => name.trim()))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function renderClasses() {
    const search = searchInput.value.trim().toLowerCase();
    const names = getClassNames();
    const filteredNames = names.filter(name =>
        name.toLowerCase().includes(search)
    );

    container.replaceChildren();

    filteredNames.forEach(name => {
        const total = students.filter(student =>
            student.turma.toLowerCase() === name.toLowerCase() && !student.arquivado
        ).length;

        const card = document.createElement("article");
        card.className = "class-card";
        card.innerHTML = `
            <header class="class-card-header">
                <h3></h3>
                <div class="class-card-actions">
                    <span></span>
                    <button type="button" class="class-delete-button">Excluir</button>
                </div>
            </header>
        `;
        card.querySelector("h3").textContent = name;
        card.querySelector("span").textContent =
            `${total} ${total === 1 ? "aluno" : "alunos"}`;
        card.querySelector(".class-delete-button").dataset.className = name;
        if (!canEdit) card.querySelector(".class-delete-button").hidden = true;
        container.append(card);
    });

    studentCount.textContent = String(students.filter(student => !student.arquivado).length);
    classCount.textContent = String(filteredNames.length);
    emptyState.hidden = filteredNames.length > 0;
}

form.addEventListener("submit", event => {
    event.preventDefault();
    if (!canEdit) return;

    const name = classNameInput.value.trim();
    if (!name) {
        showMessage("Digite o nome da turma.", "error");
        return;
    }

    const alreadyExists = getClassNames().some(item =>
        item.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
        showMessage("Essa turma já está cadastrada.", "error");
        return;
    }

    classes.push(name);
    saveClasses();
    form.reset();
    renderClasses();
    showMessage("Turma criada com sucesso!", "success");
});

searchInput.addEventListener("input", renderClasses);

container.addEventListener("click", event => {
    const button = event.target.closest(".class-delete-button");
    if (!button || !canEdit) {
        return;
    }

    const name = button.dataset.className;
    const hasStudents = students.some(student =>
        student.turma.toLowerCase() === name.toLowerCase()
    );

    if (hasStudents) {
        showMessage("Não é possível excluir esta turma porque existem alunos matriculados nela.", "error");
        return;
    }

    if (!confirm(`Excluir a turma ${name}?`)) {
        return;
    }

    classes = classes.filter(className =>
        className.toLowerCase() !== name.toLowerCase()
    );
    saveClasses();
    renderClasses();
    showMessage("Turma excluída com sucesso.", "success");
});

if (!canEdit) {
    form.hidden = true;
    const note = document.createElement("p");
    note.className = "role-note";
    note.textContent = "Consulte as turmas cadastradas. O cadastro e a exclusão de turmas são feitos pela secretaria.";
    form.before(note);
}
renderClasses();
