# BrightFuture — Sistema de Informações do Aluno

Projeto acadêmico baseado no **Estudo de Caso 5 — BrightFuture (Atividade de POO)**.

O projeto original de **Secretaria escolar** foi mantido. Agora possui entrada com usuário e senha, perfis de acesso e boletim escolar para aluno e responsável. Toda a interface utiliza HTML, CSS e JavaScript, sem frameworks nem instalações adicionais.

## Como executar

1. Extraia o ZIP e abra a pasta `BrightFuture` no **VS Code**.
2. Clique com o botão direito em **`login.html`** e selecione **Open with Live Server**.
3. Use qualquer login do arquivo **`ACESSOS-PARA-APRESENTACAO.txt`**.
4. Para trocar de perfil, clique em **Sair**, no menu lateral (também aparece no celular).

## Contas

| Perfil | Usuário | Senha |
|---|---|---|
| Secretaria — Helena Almeida | `helena.secretaria` | `Helena@2026` |
| Professor — André Ribeiro | `andre.professor` | `Andre@2026` |
| Coordenação — Juliana Costa | `juliana.coordenacao` | `Juliana@2026` |
| Aluna — Alice Martins | `alice.aluna` | `Alice@2026` |
| Responsável — Mariana Martins | `mariana.responsavel` | `Mariana@2026` |

O estudo de caso apresenta **secretaria, professores e coordenação** como usuários diretos. Alunos e responsáveis são beneficiários indiretos. O portal individual foi incluído para permitir também demonstrar a consulta de boletins.

## O que cada perfil faz

- **Secretaria:** visão da escola, cadastro/edição/arquivamento/exclusão de alunos, cadastro de turmas, notas, frequência e relatórios.
- **Professor:** visualiza apenas as turmas **8º ano A** e **2º ano EM A**, registra notas trimestrais e chamada por data, acompanha alunos e relatórios das suas turmas. Não edita matrículas.
- **Coordenação:** consulta informações da escola, notas, frequência e relatórios sem editar registros.
- **Aluna:** vê sua matrícula e boletim com três trimestres, média e frequência.
- **Responsável:** acompanha as notas e a frequência da aluna vinculada (Alice).

Os acessos são **predefinidos**; não há cadastro público de contas. Uma escola real cria as contas internamente, não permite que qualquer pessoa se registre como professor.

## Dados iniciais

Na primeira abertura, o sistema carrega **4 turmas**, **13 alunos fictícios** (12 ativos, 1 arquivado), **notas em três trimestres** e **chamadas com faltas e justificativas**. Os registros não são números fixos nas telas: os indicadores são calculados a partir dos dados cadastrados.

As alterações são guardadas no `localStorage` do mesmo navegador, e todos os perfis consultam esses registros. Ao lançar uma nota para Alice como secretaria, por exemplo, ela aparece no boletim de Alice e de Mariana ao trocar de conta.

Os dados desta versão usam chaves `brightfuture.*.v2` no navegador, separadas das versões anteriores. Para voltar ao estado inicial, abra em uma janela anônima nova. **Atenção:** fechar a janela anônima remove os dados salvos nela.

## Roteiro rápido (5 minutos)

1. Abra `login.html` e entre como `helena.secretaria`.
2. Mostre as turmas, os alunos cadastrados e os indicadores do painel.
3. Edite o telefone de um responsável; mostre que o registro fica salvo.
4. Acesse **Notas e frequência**, selecione **1º ano A**, altere a nota de Alice no **3º trimestre** e salve.
5. Saia e entre como `alice.aluna`: abra **Meu boletim** e confira a nova nota.
6. Saia e entre como `mariana.responsavel`: mostre que acompanha o mesmo boletim.
7. Entre como `andre.professor`: ele visualiza apenas as turmas atribuídas e pode salvar uma chamada.
8. Entre como `juliana.coordenacao`: mostre os relatórios e que os campos de lançamento não podem ser editados.

## Organização das pastas

- `login.html`, `login.css`, `login.js`: tela de entrada com a logo original.
- `autenticacao.js`: contas, login, sessão e regras simples de acesso.
- `app-ui.js`, `acesso.css`: menu, perfil exibido e botão de sair.
- `dados-iniciais.js`: turmas, alunos, notas e chamadas fictícias da primeira abertura.
- `index.html`, `script.js`, `style.css`: página inicial original, personalizada pelo perfil.
- `Alunos/`, `Turmas/`, `Notas/`, `Relatorios/`: páginas originais da secretaria, com visual preservado.
- `Boletim/`: área de consulta do aluno e do responsável.
- `assets/`: logo original da escola.

## POO e CRUD

A classe `Aluno`, em `Alunos/alunos.js`, contém atributos da matrícula e métodos `arquivar()` e `restaurar()` como exemplo simples de programação orientada a objetos.

O CRUD continua: **Criar** (matricular), **Ler** (consultar), **Atualizar** (editar aluno, nota ou frequência) e **Excluir** (arquivar ou excluir um registro).

## Limites importantes

Esta é uma **simulação acadêmica de login**, não autenticação segura. As senhas e as verificações estão no JavaScript entregue ao navegador, e os dados são salvos localmente, sem servidor, permissões reais ou banco de dados compartilhado. Alguém com acesso às ferramentas de desenvolvedor pode inspecionar ou alterar os registros. **Não use nomes, CPFs, notas ou contatos reais de menores de idade.** Para uma implantação real, seria preciso backend, banco de dados seguro, senhas protegidas, autorização no servidor e adequação à LGPD.
