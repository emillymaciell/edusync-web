# EduSync

Plataforma educacional para professores particulares que reúne gestão de alunos, organização de aulas e inteligência artificial em um só lugar.

🔗 **[Acessar a plataforma](https://edusync-web-lac.vercel.app/)**  
🧪 **[Explorar a demonstração](https://edusync-demo.vercel.app/)**

## Sobre o projeto

O EduSync foi desenvolvido como Trabalho de Conclusão de Curso (TCC) do programa **Ford &lt;Enter&gt;**, com o objetivo de simplificar a rotina de professores particulares e apoiar o acompanhamento individual dos alunos.

A plataforma funciona como um **CRM educacional**, centralizando alunos, aulas, tarefas e informações de progresso. A integração com o **Google Gemini** auxilia na preparação de materiais e na análise do desempenho dos estudantes.

O projeto segue o modelo **SaaS B2B2C**: o professor utiliza a plataforma para gerenciar seu trabalho e oferece aos alunos um ambiente para acessar atividades, acompanhar resultados e participar das aulas.

## Funcionalidades

### Administrador

- Aprovar o cadastro de professores.
- Cadastrar e gerenciar matérias.
- Consultar métricas globais da plataforma.

### Professor

- Cadastrar e acompanhar alunos.
- Agendar aulas ao vivo e disponibilizar links de acesso.
- Criar tarefas, acompanhar entregas e liberar correções.
- Utilizar a **Fábrica de Aulas** para gerar materiais personalizados com IA.
- Gerar exercícios conforme o assunto e o nível do aluno.
- Consultar **Insights de IA** com análises de progresso e recomendações pedagógicas.
- Exportar aulas em PDF.

### Aluno

- Acompanhar progresso, módulos e conquistas.
- Consultar e entregar tarefas.
- Acessar os links das aulas ao vivo.
- Trocar a senha padrão no primeiro acesso.
- Visualizar notas após a liberação da correção pelo professor.

## Como abrir

O EduSync está disponível online, sem necessidade de instalação.

### Aplicação principal

Acesse **[edusync-web-lac.vercel.app](https://edusync-web-lac.vercel.app/)**.

- **Professor:** solicite acesso pelo cadastro e aguarde a aprovação do administrador.
- **Aluno:** utilize as credenciais fornecidas pelo professor.
- **Administrador:** entre com sua conta administrativa.

### Demonstração pública

Para conhecer os recursos sem criar uma conta, acesse **[edusync-demo.vercel.app](https://edusync-demo.vercel.app/)**.

Também é possível abrir a demonstração pela página inicial da aplicação principal, no bloco **“Quer conhecer o EduSync na prática?”**, clicando em **“Explorar demonstração”**.

Na demo, você pode:

- Entrar rapidamente como administrador, professora ou aluna.
- Explorar a plataforma com dados fictícios.
- Experimentar os recursos de inteligência artificial.
- Reiniciar a experiência pelo menu de demonstração.

As alterações da demo ficam em memória e não afetam os dados da aplicação principal. Os recursos de IA utilizam o backend real e estão sujeitos a limites de uso.

> O backend utiliza uma instância gratuita no Render. Após um período sem uso, a primeira resposta pode demorar enquanto o serviço é iniciado.

## Tecnologias utilizadas

### Front-end

- **Angular 20** — construção da interface.
- **TypeScript 5.8** — desenvolvimento da aplicação.
- **Angular Router** — navegação entre páginas.
- **RxJS** — operações assíncronas e fluxos de dados.
- **SCSS** — estilização e layout responsivo.
- **html2pdf.js** — exportação de aulas em PDF.
- **Jasmine e Karma** — ferramentas de teste.

### Back-end

- **Java 21** e **Spring Boot 3.3.4** — desenvolvimento da API.
- **Spring Web** — endpoints REST.
- **Spring Data JPA e Hibernate** — persistência de dados.
- **PostgreSQL** — banco de dados relacional.
- **Spring Security, JWT e BCrypt** — autenticação e controle de acesso.
- **Bean Validation** — validação dos dados recebidos.
- **WebClient** — comunicação com o Google Gemini.
- **Springdoc OpenAPI e Swagger UI** — documentação da API.
- **Maven** — gerenciamento de dependências e build.

### Inteligência artificial e hospedagem

- **Google Gemini** — geração de aulas, exercícios e análises pedagógicas.
- **Vercel** — hospedagem da aplicação principal e da demonstração.
- **Render** — hospedagem do backend.
- **Docker** — empacotamento do backend.

## Organização dos repositórios

O projeto é dividido em dois repositórios:

- **[edusync-web](https://github.com/emillymaciell/edusync-web):** interface utilizada por administradores, professores e alunos.
- **[edusync-api](https://github.com/emillymaciell/edusync-api):** API responsável pelas regras de negócio, autenticação, persistência e integração com IA.

A aplicação principal e a demonstração utilizam o mesmo código do front-end, com configurações de build separadas e projetos independentes na Vercel.

As chamadas ao Gemini são realizadas pelo backend, mantendo a chave de acesso à IA fora do navegador.

## Objetivo

Reduzir o tempo dedicado à organização e à preparação de materiais, oferecendo ao professor ferramentas para acompanhar cada aluno e personalizar o ensino.
