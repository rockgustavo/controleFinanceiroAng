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
│   │   └── auth.interceptor.ts    ← injeta Authorization: Bearer em toda requisição
│   ├── http/
│   │   ├── unwrap.ts              ← operadores RxJS que desempacotam o envelope ApiResponse
│   │   └── api-error.ts           ← extrai a mensagem de erro padronizada da API
│   └── services/
│       └── theme.service.ts       ← dark/light mode — localStorage + data-bs-theme
│
├── shared/                ← Reutilizável entre features
│   ├── components/
│   │   └── navbar/        ← Navbar responsiva com toggle de tema e menu colapsável
│   └── pipes/
│       ├── currency-br.pipe.ts    ← formata valores em BRL (pt-BR)
│       ├── percent-br.pipe.ts     ← formata percentuais em pt-BR
│       └── date-br.pipe.ts        ← formata datas ISO em pt-BR
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
- Escrita restrita a ADMIN em duas camadas: a UI esconde as ações de criação/edição via `keycloak.isAdmin()` e o backend garante com `@PreAuthorize('ADMIN')`
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

### Build

```bash
# Produção (Vercel / Cloud-IAM) — configuração padrão
ng build

# Docker Compose (Nginx + Keycloak local)
ng build --configuration docker
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

> Esses usuários são provisionados automaticamente pelo Keycloak na primeira subida (`--import-realm`) — sem cadastro manual. O frontend usa o client `financeiro-frontend` e fala com o Keycloak em `http://localhost:8180` (dev e Docker).

---

## Deploy em Produção (Free Tier)

Em produção o frontend roda na **Vercel** (build + CDN), separado da topologia local do `docker compose`. O `vercel.json` reescreve `/api/*` para o backend no Render (server-side, sem CORS); o login OIDC vai direto ao Keycloak gerenciado no Cloud-IAM.

### Infraestrutura

| Camada | Serviço | Plano | Papel |
|---|---|---|---|
| Frontend | Vercel | Hobby | Build do Angular + CDN; proxy `/api/*` → Render |
| Backend | Render | Free | API Spring Boot ([repo](https://github.com/rockgustavo/controleFinanceiroSpring)) |
| Identity Provider | Cloud-IAM | Freemium | Keycloak gerenciado — login OIDC |

### URLs de produção

| Serviço | URL |
|---|---|
| Frontend | https://controle-financeiro-ang.vercel.app |
| API / Swagger | https://controlefinanceirospring.onrender.com/docs |

> Para testar a API diretamente: acesse o **Swagger UI** acima, clique em **Authorize** e faça login com suas credenciais do Keycloak. O token é injetado automaticamente em todas as chamadas.

### Três ambientes de build

Cada ambiente troca o `environment.*.ts` via `angular.json`, mantendo dev, Docker e produção funcionais ao mesmo tempo:

| Ambiente | Comando | Keycloak | API |
|---|---|---|---|
| **dev** | `ng serve` | `http://localhost:8180` | `http://localhost:8088/api` |
| **docker** | `ng build --configuration docker` | `http://localhost:8180` | `/api` (Nginx) |
| **production** | `ng build` (padrão — usado na Vercel) | Cloud-IAM (HTTPS) | `/api` (Vercel → Render) |

---

## Testes

```bash
# Unitários — modo watch (desenvolvimento)
ng test

# Execução única headless (CI)
ng test --watch=false --browsers=ChromeHeadless
```

**Cobertura:** 44 testes · 0 falhas

Camadas cobertas:

- Pipes (`CurrencyBrPipe`, `PercentBrPipe`, `DateBrPipe`) — formatação de valores nulos, zero, negativos, decimais customizados e datas ISO
- Services de todas as features (`patrimonio`, `rendimento`, `projecao`, `historico`, `mercado`) — GET, POST, PATCH, DELETE com `HttpTestingController`
- `AuthInterceptor` — injeção do token Bearer e logout automático no `401`
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
