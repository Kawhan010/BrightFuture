"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const auth = window.BrightAuth;
    const user = auth?.user;
    if (!user) return;
    const isFamily = ["aluno", "responsavel"].includes(user.papel);
    const nav = document.querySelector(".menu");
    const isSub = location.pathname.split("/").filter(Boolean).length > 1 &&
        ["Alunos", "Turmas", "Notas", "Relatorios", "Boletim"].some(d => location.pathname.includes("/" + d + "/"));
    const prefix = isSub ? "../" : "";
    if (nav) {
        if (isFamily) nav.querySelectorAll("a.menu-item").forEach(a => {
            if (!a.getAttribute("href").includes("index.html") && a.getAttribute("href") !== "#inicio") a.hidden = true;
        });
        if (isFamily) {
            const boletim = document.createElement("a");
            boletim.className = "menu-item";
            boletim.href = prefix + "Boletim/boletim.html";
            if (location.pathname.endsWith("/boletim.html")) boletim.classList.add("active");
            boletim.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/></svg><span>Meu boletim</span>';
            nav.append(boletim);
        }
    }
    const avatar = document.querySelector(".user-avatar");
    const info = document.querySelector(".user-info");
    const footer = document.querySelector(".sidebar-footer");
    const label = document.querySelector(".school-label");
    if (label) {
        label.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + user.cargo;
    }
    if (avatar) avatar.textContent = user.nome.split(" ").map(p => p[0]).slice(0, 2).join("");
    if (info) {
        info.querySelector("strong").textContent = user.nome;
        info.querySelector("span").textContent = user.cargo;
    }
    if (footer) {
        const exit = document.createElement("button");
        exit.type = "button";
        exit.className = "logout-button";
        exit.textContent = "Sair";
        exit.setAttribute("aria-label", "Sair da conta");
        exit.addEventListener("click", auth.logout);
        footer.append(exit);
    }
    document.body.dataset.papel = user.papel;
});
