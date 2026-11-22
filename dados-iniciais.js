"use strict";

// Registros totalmente inventados para a apresentação acadêmica.
// Só são criados na PRIMEIRA execução: nunca substituem os dados cadastrados.
(function iniciarEscola() {
    const alunoKey = "brightfuture.alunos.v1";
    const turmaKey = "brightfuture.turmas.v1";
    const notaKey = "brightfuture.notas-frequencia.v1";
    if (localStorage.getItem(alunoKey) !== null ||
        localStorage.getItem(turmaKey) !== null ||
        localStorage.getItem(notaKey) !== null) return;

    const turmas = ["1º ano A", "5º ano B", "8º ano A", "2º ano EM A"];
    const dados = [
        ["Alice Martins", "2019-04-12", "1º ano A", "Mariana Martins", "Mãe"],
        ["Miguel Ferreira", "2019-08-21", "1º ano A", "Camila Ferreira", "Mãe"],
        ["Sofia Lima", "2019-11-05", "1º ano A", "Renata Lima", "Mãe"],
        ["Laura Ribeiro", "2015-03-13", "5º ano B", "André Ribeiro", "Pai"],
        ["Pedro Henrique Alves", "2015-06-09", "5º ano B", "Patrícia Alves", "Mãe"],
        ["Helena Costa", "2015-10-24", "5º ano B", "Fernanda Costa", "Mãe"],
        ["Arthur Oliveira", "2012-02-18", "8º ano A", "Daniel Oliveira", "Pai"],
        ["Isabela Rocha", "2012-09-30", "8º ano A", "Márcia Rocha", "Mãe"],
        ["Gabriel Santos", "2012-05-27", "8º ano A", "Ricardo Santos", "Pai"],
        ["Beatriz Carvalho", "2009-06-14", "2º ano EM A", "Cláudia Carvalho", "Mãe"],
        ["Lucas Almeida", "2009-12-02", "2º ano EM A", "Fábio Almeida", "Pai"],
        ["Valentina Souza", "2010-04-07", "2º ano EM A", "Juliana Souza", "Mãe"],
        ["Rafael Nunes", "2008-01-15", "2º ano EM A", "Roberto Nunes", "Pai"]
    ];
    // Todos os CPFs abaixo têm dígitos de verificação deliberadamente inválidos.
    const cpfs = ["124.357.689-00", "245.368.791-01", "356.479.812-02", "467.581.923-03",
        "578.692.134-04", "689.713.245-05", "791.824.356-06", "812.935.467-07",
        "923.146.578-08", "134.257.689-09", "245.369.871-10", "356.471.982-11", "467.582.193-12"];
    const guardianCpfs = ["482.193.567-00", "593.214.678-01", "614.325.789-02", "725.436.891-03",
        "836.547.912-04", "947.658.123-05", "158.769.234-06", "269.871.345-07",
        "371.982.456-08", "482.193.578-09", "593.214.689-10", "614.325.791-11", "725.436.812-12"];
    const alunos = dados.map((d, i) => ({
        id: "bf-aluno-" + (i + 1),
        nome: d[0], nascimento: d[1], turma: d[2], responsavel: d[3], parentesco: d[4],
        cpfAluno: cpfs[i], cpfResponsavel: guardianCpfs[i],
        contato: "(41) 90000-" + String(1000 + i),
        endereco: "Rua das Flores, " + (80 + i) + ", Curitiba - PR",
        arquivado: i === 12
    }));

    const registros = {};
    // Notas trimestrais (sem serem sobrescritas ao trocar a data da chamada).
    const notas = [8.8, 7.4, 9.1, 8.2, 6.4, 8.7, 7.9, 5.8, 8.5, 9.2, 7.6, 6.8, 8.0];
    const periodos = ["1º trimestre", "2º trimestre", "3º trimestre"];
    alunos.forEach((aluno, i) => {
        periodos.forEach((periodo, p) => {
            const chave = `${aluno.turma}|${periodo}`;
            if (!registros[chave]) registros[chave] = {};
            const valor = Math.min(10, Math.max(0, notas[i] + (p - 2) * .2));
            registros[chave][aluno.id] = {nota: valor.toFixed(1).replace(".", ",")};
        });
    });

    // Chamada de alguns dias letivos deste mês para médias de frequência coerentes.
    const hoje = new Date();
    const dias = [];
    for (let dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        dia.getMonth() === hoje.getMonth() && dias.length < 9;
        dia.setDate(dia.getDate() - 1)) {
        if (dia.getDay() !== 0 && dia.getDay() !== 6) {
            dias.push(`${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`);
        }
    }
    dias.forEach((dia, d) => {
        alunos.forEach((aluno, i) => {
            if (aluno.arquivado) return;
            const chave = `${aluno.turma}|3º trimestre|${dia}`;
            if (!registros[chave]) registros[chave] = {};
            const falta = (i === 4 && (d % 3 === 0)) || (i === 7 && d % 4 < 2) ||
                (i === 11 && d % 5 === 0) || ((i * 3 + d) % 19 === 0);
            registros[chave][aluno.id] = {
                status: falta ? "absent" : "present",
                justificativa: falta && i === 11 ? "Consulta médica" : ""
            };
        });
    });
    localStorage.setItem(turmaKey, JSON.stringify(turmas));
    localStorage.setItem(alunoKey, JSON.stringify(alunos));
    localStorage.setItem(notaKey, JSON.stringify(registros));
})();
