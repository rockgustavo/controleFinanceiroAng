# Controle Financeiro — Frontend Angular

Protótipo - painel de controle financeiro para acompanhamento de patrimônio, rendimentos históricos e projeções.

**Stack:** Angular 19 · Bootstrap 5 · Keycloak 24 · TypeScript 5

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 22 |
| npm | 10 |
| Docker + Docker Compose | 24 |

> **Windows:** recomendado rodar com WSL 2 para melhor compatibilidade com Docker.

---

## Rodando localmente (desenvolvimento)

O front depende do backend + Keycloak. Suba a infraestrutura antes:

```bash
# No repositório do backend
docker compose up -d postgres keycloak rabbitmq
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Depois, no frontend:

```bash
npm install
npm start          # http://localhost:4200
```

---

## Credenciais de desenvolvimento

| Usuário | Senha | Role |
|---|---|---|
| `admin@financeiro.dev` | `admin123` | ADMIN — cria e edita |
| `viewer@financeiro.dev` | `viewer123` | VIEWER — somente leitura |

Login é gerenciado pelo Keycloak em `http://localhost:8180`.

---

## Rodando com Docker (produção)

O sistema completo sobe com um único comando a partir do repositório do backend:

```bash
docker compose up --build
```

Acesso: `http://localhost` (Nginx serve o front e faz proxy `/api/` → backend).

Para rodar apenas o container do frontend isolado:

```bash
docker build -t controle-financeiro-front .
docker run -p 80:80 controle-financeiro-front
```

---

## Testes

```bash
npm test                                      # modo watch (desenvolvimento)
npm test -- --watch=false --browsers=ChromeHeadless   # CI / uma única passagem
```

**Suíte atual:** 42 specs — pipes, services (HTTP), interceptor, guard, AppComponent.

---

## Build de produção

```bash
npm run build -- --configuration production
```

Artefatos em `dist/controle-financeiro/browser/`. O Nginx no Docker serve esse diretório com compressão gzip e fallback para SPA (`try_files`).

---

## Estrutura do projeto

```
src/app/
  core/
    auth/           # KeycloakService, AuthInterceptor, AuthGuard
    models/         # Interfaces TypeScript (Asset, Snapshot, Returns, Market)
  shared/
    pipes/          # CurrencyBrPipe, PercentBrPipe
    components/     # NavbarComponent
  features/
    patrimonio/     # Gestão de ativos (lista + formulário)
    historico/      # Snapshots (lista + detalhe)
    rendimento/     # Retornos simple/CAGR + alocação
    mercado/        # Indicadores ao vivo + Tesouro Direto
    projecao/       # Projeção de crescimento composto
```

---

## Variáveis de ambiente Angular

Configuradas em `src/environments/`:

| Arquivo | Uso |
|---|---|
| `environment.ts` | Dev local (`apiUrl: http://localhost:8080/api`) |
| `environment.prod.ts` | Produção (`apiUrl: /api` via Nginx proxy) |
