# BrightFuture — Secretaria escolar

Sistema de Informações do Aluno para o Colégio BrightFuture, baseado no **Estudo de Caso 5 — BrightFuture** (Atividade de POO).

## Como abrir

1. Extraia a pasta e abra-a no VS Code.
2. Abra `index.html` com a extensão **Live Server**.
3. Utilize o menu **Visão geral, Alunos, Turmas, Notas e frequência, Relatórios**.

O perfil exibido é **Secretaria**. A secretaria possui acesso às funcionalidades para facilitar a apresentação. Não é necessário criar contas ou logar.

## Conteúdo da secretaria

- **Visão geral:** alunos ativos, turmas, médias das notas cadastradas e frequência do mês.
- **Alunos:** matrícula, listagem, filtro, busca, edição, arquivamento, restauração e exclusão.
- **Turmas:** cadastro, consulta, busca e exclusão quando não há alunos vinculados.
- **Notas e frequência:** nota por trimestre, chamada por data, justificativa e frequência acumulada.
- **Relatórios:** médias e frequência por turma, alunos que precisam de atenção e impressão.

## Roteiro sugerido (2 a 4 minutos)

1. Mostre **Visão geral** e os indicadores calculados.
2. Vá em **Alunos**, pesquise por **Alice**, abra **Editar** e altere um contato; salve.
3. Em **Turmas**, veja o agrupamento dos alunos. Cadastre uma turma, por exemplo, `9º ano B`.
4. Em **Alunos**, cadastre um novo aluno nessa turma com informações inventadas.
5. Em **Notas e frequência**, selecione `8º ano A`, confira as notas e registre uma chamada de hoje.
6. Em **Relatórios**, confira o trimestre atual e veja os estudantes que precisam de atenção.
7. Em **Alunos**, arquive um registro e utilize o filtro **Arquivados** para restaurá-lo.

## Operações CRUD

- **Criar:** matricular alunos e cadastrar turmas.
- **Ler:** consultar alunos, turmas, notas, frequência e relatórios.
- **Atualizar:** alterar dados da matrícula, lançar notas e chamadas; restaurar alunos.
- **Excluir:** arquivar ou remover registro de aluno; excluir turma vazia.

## Tecnologias e orientação a objetos

- HTML, CSS e JavaScript, sem frameworks.
- A classe `Aluno` em `Alunos/alunos.js` reúne os atributos da matrícula e os métodos `arquivar()` e `restaurar()`, exemplo básico de POO.
- O `localStorage` guarda registros no navegador. O arquivo `dados-iniciais.js` preenche a primeira abertura com **dados completamente inventados** para apresentar o sistema sem tabelas vazias. Não altera dados já cadastrados.

## Observações importantes

O Colégio BrightFuture e os registros incluídos são fictícios, conforme o estudo de caso. Esta é uma implementação acadêmica, sem autenticação, banco de dados compartilhado ou proteção de dados adequada ao uso real com menores de idade. **Não utilize informações pessoais verdadeiras.**

Se você já utilizou versões anteriores do projeto no mesmo endereço do Live Server, o navegador preservará os dados antigos. Para abrir com os registros originais desta versão, utilize uma janela anônima nova ou limpe apenas o armazenamento local desse site (isso apaga os registros salvos anteriormente naquele navegador).
