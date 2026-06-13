# Controle Financeiro — Frontend

> Painel para acompanhamento de patrimônio, rendimentos históricos e projeções de crescimento.
> Projeto de portfólio demonstrando boas práticas de arquitetura, componentes e qualidade de código em Angular.

![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat&logo=bootstrap&logoColor=white)
![Keycloak](https://img.shields.io/badge/Keycloak-24-4D4D4D?style=flat&logo=keycloak&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Nginx-2496ED?style=flat&logo=docker&logoColor=white)

---

## Sobre o projeto

SPA Angular que consome a [API REST do backend](https://github.com/rockgustavo/controleFinanceiroSpring) com autenticação federada via Keycloak.

- **Patrimônio** — cadastro de ativos (renda fixa, variável, FIIs, ETFs) com criação, edição e arquivamento
- **Histórico** — snapshots mensais do portfólio com posições e dados de mercado
- **Rendimento** — comparativo entre períodos com cálculo simples ou CAGR
- **Projeção** — crescimento composto configurável por taxa e prazo
- **Mercado** — indicadores ao vivo: Selic, câmbio, Ibovespa, IVVB11, IPCA e Tesouro Direto
- **Dark / Light mode** — alternância de tema com persistência em `localStorage`; muda todo o site via `data-bs-theme`

---

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| Angular | 19 | Framework SPA — componentes standalone, signals |
| TypeScript | 5.x | Linguagem principal |
| Bootstrap | 5.x | Layout Mobile First — dark mode via `data-bs-theme` |
| Keycloak JS Adapter | — | Login OIDC — token em memória, injetado via interceptor |
| Chart.js | — | Gráficos de projeção e concentração de portfólio |
| Karma + Jasmine | — | Testes unitários |
| Nginx | — | Serve o build e faz proxy reverso `/api/` → backend |

---

## Arquitetura

Padrão **MVC por camada**, com separação clara entre estado/HTTP (services), lógica de apresentação (components) e template (HTML).

```
src/app/
├── core/                  ← Singletons — carregados uma vez
│   ├── auth/
│   │   ├── keycloak.service.ts    ← login, logout, token, roles
│   │   ├── auth.guard.ts          ← protege rotas que exigem ADMIN
│   │   └── auth.interceptor.ts    ← injeta Authorization: Bearer em toda requisição
│   └── services/
│       └── theme.service.ts       ← dark/light mode — localStorage + data-bs-theme
│
├── shared/                ← Reutilizável entre features
│   ├── components/
│   │   └── navbar/        ← Navbar responsiva com toggle de tema e menu colapsável
│   └── pipes/
│       ├── currency-br.pipe.ts    ← formata valores em BRL (pt-BR)
│       └── percent-br.pipe.ts     ← formata percentuais em pt-BR
│
└── features/              ← Módulos de funcionalidade (lazy loaded)
    ├── patrimonio/        ← Listagem, criação e edição de ativos
    ├── historico/         ← Snapshots do portfólio
    ├── rendimento/        ← Comparativo de retornos por período
    ├── projecao/          ← Simulação de crescimento composto
    └── mercado/           ← Indicadores econômicos ao vivo
```

---

## Segurança

**Fluxo OAuth2 / OIDC:**

```
Usuário ──login──▶ Keycloak ──JWT──▶ Angular (armazena em memória)
                                      │
                                      └── AuthInterceptor injeta Bearer em toda chamada HTTP
```

- Token **nunca** vai para `localStorage` — fica em memória no `KeycloakService`
- `AuthGuard` bloqueia rotas de escrita para usuários sem role `ADMIN`
- Sessão expirada: interceptor detecta `401` e redireciona para o login do Keycloak

| Role | Acesso |
|---|---|
| `VIEWER` | Leitura — todas as telas e gráficos |
| `ADMIN` | Criação e edição de ativos e snapshots |

---

## Como executar

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10.x |
| Angular CLI | 19.x (`npm i -g @angular/cli`) |
| Backend + Keycloak | rodando (ver repo do backend) |

### Desenvolvimento local

```bash
git clone https://github.com/rockgustavo/controleFinanceiroAng.git
cd controleFinanceiroAng
npm install
ng serve --open
# Acesse http://localhost:4200
```

> O backend e o Keycloak precisam estar no ar. Siga o `README` do [backend](https://github.com/rockgustavo/controleFinanceiroSpring) para subir a infraestrutura com `docker compose`.

### Build de produção

```bash
ng build --configuration production
# Artefatos em dist/ — servidos pelo Nginx no compose completo
```

### Subida completa via Docker Compose

```bash
# No repositório do backend:
docker compose up --build
# Frontend disponível em http://localhost (Nginx)
```

### Credenciais de desenvolvimento

| Usuário | Senha | Role |
|---|---|---|
| `admin@financeiro.dev` | `admin123` | ADMIN — acesso completo |
| `viewer@financeiro.dev` | `viewer123` | VIEWER — somente leitura |

---

## Testes

```bash
# Unitários — modo watch (desenvolvimento)
ng test

# Execução única headless (CI)
ng test --watch=false --browsers=ChromeHeadless
```

**Cobertura:** 42 testes · 0 falhas

Camadas cobertas:

- Pipes (`CurrencyBrPipe`, `PercentBrPipe`) — formatação de valores nulos, zero, negativos e decimais customizados
- Services de todas as features (`patrimonio`, `rendimento`, `projecao`, `historico`, `mercado`) — GET, POST, PATCH, DELETE com `HttpTestingController`
- `AuthInterceptor` — injeção do token Bearer e logout automático no `401`
- `AuthGuard` — bloqueio de rota sem role ADMIN
- `AppComponent` — renderização de navbar e router-outlet

---

## Decisões técnicas

| Decisão | Motivação |
|---|---|
| **Componentes standalone** | Sem NgModules — imports explícitos, tree shaking mais preciso |
| **`inject()` no lugar de construtor** | Menos boilerplate — padrão moderno Angular 14+ |
| **ThemeService com `data-bs-theme`** | Bootstrap 5.3 cuida de todos os componentes nativos; um atributo no `<html>` muda o site inteiro |
| **Token em memória** | Evita XSS com acesso ao `localStorage` — token vive só na instância do `KeycloakService` |
| **Lazy loading por feature** | Cada rota carrega seu bundle só quando acessada — tempo de carregamento inicial menor |
| **Pipes puros para formatação** | Reutilizáveis em qualquer template, cacheados pelo Angular, testáveis isoladamente |
| **Nginx com proxy reverso** | Em produção, frontend e backend no mesmo domínio — sem CORS, sem expor porta do backend |
