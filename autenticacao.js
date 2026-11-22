"use strict";
(function () {
    const SESSION_KEY = "brightfuture.sessao.v1";
    const USERS = [
        {login: "helena.secretaria", senha: "Helena@2026", nome: "Helena Almeida", papel: "secretaria", cargo: "Secretaria escolar"},
        {login: "andre.professor", senha: "Andre@2026", nome: "André Ribeiro", papel: "professor", cargo: "Professor de Matemática", turmas: ["8º ano A", "2º ano EM A"]},
        {login: "juliana.coordenacao", senha: "Juliana@2026", nome: "Juliana Costa", papel: "coordenacao", cargo: "Coordenação pedagógica"},
        {login: "alice.aluna", senha: "Alice@2026", nome: "Alice Martins", papel: "aluno", cargo: "Aluna", alunoId: "bf-aluno-1"},
        {login: "mariana.responsavel", senha: "Mariana@2026", nome: "Mariana Martins", papel: "responsavel", cargo: "Responsável", alunoId: "bf-aluno-1"}
    ];
    const STAFF = ["secretaria", "professor", "coordenacao"];
    const getUser = () => USERS.find(u => u.login === sessionStorage.getItem(SESSION_KEY)) || null;
    const user = getUser();
    const base = new URL(".", document.currentScript.src);
    const home = new URL("index.html", base).href;
    const loginPage = new URL("login.html", base).href;
    const page = location.pathname.split("/").pop().toLowerCase() || "index.html";
    const inStaff = user && STAFF.includes(user.papel);
    const permitted = page === "index.html" || (inStaff && ["alunos.html", "turmas.html", "notas.html", "relatorios.html"].includes(page)) ||
        (user && ["aluno", "responsavel"].includes(user.papel) && page === "boletim.html");

    if (page === "login.html") {
        if (user) location.replace(home);
    } else if (!user || !permitted) {
        document.documentElement.style.visibility = "hidden";
        location.replace(user ? home : loginPage);
    }

    window.BrightAuth = {
        user,
        login(login, senha) {
            const account = USERS.find(u => u.login === String(login).trim().toLowerCase() && u.senha === senha);
            if (!account) return false;
            sessionStorage.setItem(SESSION_KEY, account.login);
            location.replace(home);
            return true;
        },
        logout() {
            sessionStorage.removeItem(SESSION_KEY);
            location.replace(loginPage);
        },
        canManageStudents: () => user?.papel === "secretaria",
        canManageClasses: () => user?.papel === "secretaria",
        canEditGrades: () => user && ["secretaria", "professor"].includes(user.papel),
        canSeeStudent(student) {
            if (!user || !student) return false;
            if (user.papel === "professor") return user.turmas.includes(student.turma) && !student.arquivado;
            if (STAFF.includes(user.papel)) return true;
            return user.alunoId === student.id;
        },
        canSeeClass(name) { return user?.papel !== "professor" || user.turmas.includes(name); },
        isStaff: () => !!user && STAFF.includes(user.papel)
    };
})();
