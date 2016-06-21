Balanço(receitas e despesas) dos municípios de São Paulo
--

Aplicação para facilitar as despesas e receitas dos municípios de São Paulo usando dados do [portal da transparência do TCE](http://transparencia.tce.sp.gov.br/).

### Estrutura e tecnologias

Utilizamos javascript com node.js e gulp. A estrutura da aplicação é:
* `data`: Contém os dados baixados do portal do TCE;

Baixar e transformar dados não deveria ser necessário, mas caso precise, você pode usar os seguintes scripts:
* `npm run-script transform`: Transforma os CSVs e cria os JSONs usados na aplicação;
