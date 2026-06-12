# TODO.md — Roadmap de Implementação

> Companion do `CLAUDE.md`. Cada fase é uma unidade de trabalho fechada com critério de conclusão.
> Regra: **não avançar de fase sem todos os checkboxes da fase atual marcados.**
> Ao implementar uma fase, carregar como contexto: `CLAUDE.md` (Parte I completa) + o épico relevante (Parte II).

---

## Visão Geral das Fases

| Fase | Entrega | Épicos envolvidos | Status |
|---|---|---|---|
| 0 | Fundação do projeto (esqueleto + Docker base) | — | ⬜ |
| 1 | Núcleo transversal (resposta, exceções, segurança) | Épico 5 | ⬜ |
| 2 | Gestão de Ativos completa | Épico 1 | ⬜ |
| 3 | Snapshots de Portfólio | Épico 2 | ⬜ |
| 4 | Dados de Mercado | Épico 3 | ⬜ |
| 5 | Cálculos e Projeções | Épico 4 | ⬜ |
| 6 | Frontend Angular | Todos | ⬜ |
| 7 | Hardening + Docker final + README | — | ⬜ |

---

## FASE 0 — Fundação

**Objetivo:** Projeto compila, sobe e conecta no banco. Nada de negócio ainda.

### Backend
- [ ] Criar projeto Spring Boot 3 (Maven, Java 25) com estrutura de pacotes hexagonal do `CLAUDE.md`
- [ ] Configurar `application.yml` base + `application-dev.yml` + `application-prod.yml`
- [ ] Adicionar dependências: web, data-jpa, jdbc, security, oauth2-resource-server, flyway, postgresql, amqp, springdoc, lombok, validation
- [ ] Flyway configurado e rodando migration vazia de teste (V0)
- [ ] `GET /api/health` retornando `{ success: true, data: { status: "ok", db: "ok" } }`

### Infra
- [ ] `docker-compose.yml` com: postgres, keycloak, rabbitmq (somente infra — backend roda local nesta fase)
- [ ] Healthchecks funcionando nos três serviços
- [ ] `.env.example` criado e `.env` no `.gitignore`

### Validação da fase
```bash
docker compose up -d postgres keycloak rabbitmq
mvn spring-boot:run -Dspring-boot.run.profiles=dev
curl http://localhost:8080/api/health   # → 200
```

---

## FASE 1 — Núcleo Transversal

**Objetivo:** Envelope de resposta, exceções e segurança funcionando antes de qualquer regra de negócio.
**Contexto:** `CLAUDE.md` Parte I (Resposta REST, Exceções, Segurança) + Épico 5.

### Resposta e Exceções
- [ ] `ApiResponse<T>` + `ErrorDetail` (records/builders conforme CLAUDE.md)
- [ ] Hierarquia: `DomainException`, `NotFoundException`, `ConflictException`, `ApplicationException`, `ValidationException`
- [ ] `GlobalExceptionHandler` cobrindo: domain exceptions, Bean Validation, JWT inválido, AccessDenied, genérico 500
- [ ] Em `prod`: mensagem genérica no 500; em `dev`: stack trace visível

### Segurança (Épico 5)
- [ ] `realm-export.json` com realm `financeiro`, clients backend/frontend, roles ADMIN/VIEWER, usuários dev
- [ ] Keycloak importando realm automaticamente no `docker compose up`
- [ ] `SecurityConfig`: rotas públicas (health, docs), GET = VIEWER+, escrita = ADMIN
- [ ] Conversor de roles `realm_access.roles` → `ROLE_*`
- [ ] `SwaggerConfig` com botão Authorize (bearer JWT)

### Validação da fase
- [ ] `GET /api/health` → 200 sem token
- [ ] Qualquer rota inexistente sob `/api` com token → 404 no envelope `ApiResponse`
- [ ] Token de `viewer@financeiro.dev` consegue GET, recebe 403 em POST
- [ ] Swagger acessível em `/docs` e autenticável pelo botão Authorize

---

## FASE 2 — Gestão de Ativos (Épico 1)

**Objetivo:** Primeiro épico completo de ponta a ponta — serve de referência para os demais.
**Contexto:** `CLAUDE.md` Parte I completa + Épico 1.

### Banco
- [ ] `V1__create_assets.sql` conforme DDL do épico

### Domain
- [ ] `Asset` (entidade) + `AssetType` (enum)
- [ ] `AssetValidatorFactory` (Factory) com `TickerRequiredValidator` e `RendaFixaValidator`
- [ ] `AssetChangedEvent` (record) com factories `created()` / `updated()`
- [ ] Ports: `CreateAssetPort`, `UpdateAssetPort`, `ArchiveAssetPort` (in/command) · `ListAssetsPort`, `GetAssetPort` (in/query) · `AssetRepositoryPort` (out/command) · `AssetQueryPort` (out/query) · `EventPublisherPort` (out/messaging)

### Application
- [ ] `CreateAssetCommand` (record com validação no construtor — padrão Command)
- [ ] Use cases command: create, update, archive (publicam evento após persistir)
- [ ] Use cases query: list, getById
- [ ] `AssetResponse` (record com `from(Asset)`)

### Infrastructure
- [ ] `AssetEntity` (JPA) + `AssetJpaRepository` + `AssetJpaAdapter`
- [ ] `AssetJdbcQueryAdapter` com SQL nativo (JdbcTemplate + RowMapper)
- [ ] `RabbitConfig` (exchange `financeiro.exchange` topic) + `RabbitEventPublisher`
- [ ] `AssetCommandController` + `AssetQueryController` com Swagger anotado

### Validação da fase
- [ ] POST sem ticker em RENDA_VARIAVEL → 400 com código de validação
- [ ] POST com ticker duplicado → 409
- [ ] DELETE → 204 e ativo some do GET (mas `deleted_at` preenchido no banco)
- [ ] POST/PATCH publicam mensagem visível no RabbitMQ Management (`:15672`)
- [ ] Derrubar o RabbitMQ → POST continua funcionando (falha só logada)
- [ ] GET usa JDBC — verificável por log SQL no profile dev

---

## FASE 3 — Snapshots (Épico 2)

**Objetivo:** Agregado complexo com Builder e Chain of Responsibility.
**Contexto:** `CLAUDE.md` Parte I + Épicos 1 e 2.

### Banco
- [ ] `V2__create_snapshots_and_positions.sql`

### Domain
- [ ] `Snapshot` com `Snapshot.Builder` (padrão Builder — valida no `build()`)
- [ ] `Position` (value object) — `total_gross` calculado internamente
- [ ] `SnapshotValidationHandler` (Chain of Responsibility): `UniqueDateHandler` → `ActiveAssetsHandler` → `NoDuplicatePositionsHandler`
- [ ] `SnapshotCreatedEvent`

### Application + Infrastructure
- [ ] `CreateSnapshotCommand` + use case (monta chain, executa, persiste, publica evento)
- [ ] Query use cases: list (resumo), latest, byId — todos via JDBC com JOIN otimizado
- [ ] Controllers command/query com Swagger

### Validação da fase
- [ ] POST com data duplicada → 409
- [ ] POST com ativo arquivado → 422
- [ ] POST com mesmo ativo duas vezes → 409
- [ ] `total_gross` ignora valor enviado pelo cliente (verificar com valor errado proposital)
- [ ] GET `/api/snapshots/latest` traz posições + market_data em uma única query (verificar log SQL)

---

## FASE 4 — Dados de Mercado (Épico 3)

**Contexto:** `CLAUDE.md` Parte I + Épico 3.

- [ ] `V3__create_market_data.sql`
- [ ] Client HTTP BRAPI em `out/external/` (adapter com port no domínio)
- [ ] Integração no fluxo de criação de snapshot: falha da BRAPI **não** bloqueia (try/catch + log + market_data nulo)
- [ ] `GET /api/market` e `GET /api/market/tesouro` (query controllers)
- [ ] Sem `BRAPI_TOKEN` configurado: campos ibovespa/ivvb11 nulos, sem erro

### Validação da fase
- [ ] Criar snapshot com BRAPI fora do ar → 201 com `market_data: null`
- [ ] `GET /api/market` com token → 200 com indicadores

---

## FASE 5 — Cálculos e Projeções (Épico 4)

**Contexto:** `CLAUDE.md` Parte I (seção Strategy) + Épico 4.

- [ ] `ReturnCalculationStrategy` (Strategy): `SimpleReturnStrategy` + `CagrStrategy`
- [ ] `GET /api/snapshots/{id}/returns?mode=simple|cagr` — seleção de strategy via param
- [ ] `GET /api/snapshots/{id}/allocation` — concentração por tipo (SQL com GROUP BY)
- [ ] `GET /api/snapshots/latest/projection?rate=X&months=Y` — juros compostos
- [ ] Validação de params: rate > 0, months entre 1 e 600 → 400 se inválido

### Validação da fase
- [ ] Snapshot sem anterior → returns retorna 422 com código claro
- [ ] `mode=cagr` e `mode=simple` retornam valores diferentes e corretos (testar com valores conhecidos)
- [ ] Allocation soma 100%

---

## FASE 6 — Frontend Angular

**Contexto:** `CLAUDE.md` Parte I (seção Frontend) + todos os épicos (rotas).

### Core
- [ ] Projeto Angular 19 + Bootstrap 5 instalado
- [ ] `KeycloakService` com init `login-required`
- [ ] `AuthInterceptor` injetando Bearer + logout em 401
- [ ] `AuthGuard` por role (rotas de escrita só ADMIN)
- [ ] Environments dev/prod conforme CLAUDE.md

### Features (uma por vez, nesta ordem)
- [ ] `patrimonio` — lista de ativos + form de criação/edição (ADMIN)
- [ ] `historico` — lista de snapshots + detalhe
- [ ] `rendimento` — returns com toggle simple/CAGR
- [ ] `mercado` — indicadores ao vivo
- [ ] `projecao` — form taxa/meses + gráfico de projeção

### Validação da fase
- [ ] Login redireciona para Keycloak e volta autenticado
- [ ] VIEWER não vê botões de criação/edição
- [ ] Layout funcional em 375px (mobile) e 1440px (desktop)
- [ ] Build de produção sem warnings: `ng build --configuration production`

---

## FASE 7 — Hardening e Entrega

- [ ] Dockerfile multi-stage backend (não-root) + frontend (Nginx)
- [x] Dockerfile multi-stage frontend (Nginx, non-root user)
- [x] `nginx.conf` com proxy `/api/` → backend (gzip, rate limit 7r/m ≈ 100/15min, SPA fallback)
- [ ] `docker compose up` sobe TUDO do zero (incluindo backend e frontend)
- [x] Rate limiting (nginx: 7r/m por IP com burst=20, ≈ 100 req/15min)
- [ ] Testes: unit no domain (validators, strategies, builder, chain) + integration nos controllers (Testcontainers)
- [ ] Cobertura mínima: domain 90%+, use cases 80%+
- [x] `README.md`: pré-requisitos (WSL no Windows), comandos de subida, credenciais dev
- [x] Revisão final front: nenhum secret no Git, `.env`/`.env.*` no `.gitignore`

### Validação final (Definition of Done do projeto)
- [ ] Máquina limpa + `git clone` + `docker compose up` = sistema completo no ar
- [ ] Todos os Critérios de Aceite Globais do `CLAUDE.md` passando
- [ ] Swagger documenta 100% das rotas com exemplos

---

## Como usar este arquivo com o Claude Code

```
Contexto da sessão:
  1. CLAUDE.md (sempre — Parte I completa)
  2. Épico relevante da Parte II
  3. A fase atual deste TODO.md

Prompt padrão:
  "Implemente a FASE N do TODO.md seguindo o CLAUDE.md.
   Ao final, valide cada checkbox da fase e reporte o status de cada um.
   Não avance para a próxima fase."
```

> Marcar os checkboxes neste arquivo a cada fase concluída — ele é o registro de progresso do projeto.
