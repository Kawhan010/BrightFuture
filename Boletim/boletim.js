"use strict";
const user = window.BrightAuth.user;
const students = JSON.parse(localStorage.getItem("brightfuture.alunos.v2") || "[]");
const records = JSON.parse(localStorage.getItem("brightfuture.notas-frequencia.v2") || "{}");
const student = students.find(s => s.id === user.alunoId);
const periods = ["1º trimestre", "2º trimestre", "3º trimestre"];
function format(number) { return number === null ? "—" : number.toFixed(1).replace(".", ","); }
function getAttendance(period) {
    let present = 0, absent = 0;
    const prefix = student.turma + "|" + period + "|";
    Object.keys(records).forEach(k => {
        if (!k.startsWith(prefix)) return;
        const status = records[k]?.[student.id]?.status;
        if (status === "present") present++;
        if (status === "absent") absent++;
    });
    return {present, absent};
}
if (student) {
    document.querySelector("#studentName").textContent = student.nome;
    document.querySelector("#studentClass").textContent = student.turma + " · Colégio BrightFuture";
    const allGrades = []; let totalPresent = 0, totalAbsent = 0;
    const body = document.querySelector("#bulletinBody");
    periods.forEach(period => {
        const value = records[student.turma + "|" + period]?.[student.id]?.nota;
        const parsed = value === undefined || value === "" ? null : Number(String(value).replace(",", "."));
        const grade = Number.isFinite(parsed) ? parsed : null;
        if (grade !== null) allGrades.push(grade);
        const {present, absent} = getAttendance(period);
        totalPresent += present; totalAbsent += absent;
        const tr = document.createElement("tr");
        const values = [period, format(grade), present, absent, present + absent ? Math.round(100 * present / (present + absent)) + "%" : "—"];
        values.forEach(value => { const td = document.createElement("td"); td.textContent = value; tr.append(td); });
        body.append(tr);
    });
    const average = allGrades.length ? allGrades.reduce((a,b) => a+b,0) / allGrades.length : null;
    const frequency = totalPresent + totalAbsent ? 100 * totalPresent / (totalPresent + totalAbsent) : null;
    document.querySelector("#bulletinAverage").textContent = format(average);
    document.querySelector("#bulletinAttendance").textContent = frequency === null ? "—" : Math.round(frequency) + "%";
    document.querySelector("#bulletinStatus").textContent = average === null || frequency === null ? "Em acompanhamento" : average >= 7 && frequency >= 75 ? "Em dia" : "Acompanhar";
} else {
    document.querySelector("#studentName").textContent = "Matrícula não encontrada";
    document.querySelector("#studentClass").textContent = "Procure a secretaria para atualizar o vínculo desta conta.";
}
