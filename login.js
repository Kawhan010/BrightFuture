"use strict";
const form = document.querySelector("#loginForm");
const userInput = document.querySelector("#loginUser");
const passInput = document.querySelector("#loginPassword");
const error = document.querySelector("#loginError");
form.addEventListener("submit", event => {
    event.preventDefault();
    error.textContent = "";
    if (!userInput.value.trim() || !passInput.value) {
        error.textContent = "Informe seu usuário e sua senha.";
        return;
    }
    if (!window.BrightAuth.login(userInput.value, passInput.value)) {
        error.textContent = "Usuário ou senha incorretos. Confira os dados e tente novamente.";
        passInput.value = "";
        passInput.focus();
    }
});
document.querySelector("#togglePassword").addEventListener("click", e => {
    const showing = passInput.type === "text";
    passInput.type = showing ? "password" : "text";
    e.currentTarget.textContent = showing ? "Mostrar" : "Ocultar";
    e.currentTarget.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
});
