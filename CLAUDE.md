# CLAUDE.md

> Documento de referência técnica e de negócio.
> **Parte I** é infraestrutura reutilizável para qualquer projeto.
> **Parte II** são as regras de negócio deste projeto específico.
> Leia ambas antes de qualquer implementação.

---

# PARTE I — TEMPLATE DE INFRAESTRUTURA

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 25 · Spring Boot 3 · Maven |
| Persistência (Command) | Spring Data JPA · Flyway |
| Consulta (Query) | JdbcTemplate (SQL nativo) |
| Mensageria | RabbitMQ (publisher) |
| Segurança | Spring Security 6 · OAuth2 Resource Server · Keycloak 24 |
| Banco | PostgreSQL 16 |
| Documentação | SpringDoc OpenAPI 2 (Swagger) |
| Frontend | Angular 19 · Bootstrap 5 · TypeScript 5 |
| Infra | Docker · Docker Compose · Nginx |
| Utilitários | Lombok |
| Testes | JUnit 5 · Mockito · Testcontainers |

---

## Arquitetura — Hexagonal + Clean + CQRS

Separação **Command/Query**: escrita via JPA, leitura via JDBC (SQL otimizado, sem overhead de entidades).

```
infrastructure/
  adapter/
    in/rest/
      command/          ← Controllers de escrita: POST, PATCH, DELETE
      query/            ← Controllers de leitura: GET
    out/
      persistence/      ← JPA Adapters (Command) — entities + repositories
      query/            ← JDBC Adapters (Query) — JdbcTemplate + RowMapper
      messaging/        ← RabbitMQ publisher
      external/         ← Clients HTTP externos
  config/               ← SecurityConfig, SwaggerConfig, RabbitConfig
  exception/            ← GlobalExceptionHandler

application/
  usecase/
    command/            ← Casos de uso de escrita (orquestram domínio + JPA)
    query/              ← Casos de uso de leitura (chamam JDBC adapters)
  dto/request/
  dto/response/         ← records com factory method estático `from(...)`

domain/
  model/                ← Entidades e Value Objects (puro Java)
  event/                ← Domain Events (ex: AssetChangedEvent)
  port/in/
    command/            ← Input Ports de escrita
    query/              ← Input Ports de leitura
  port/out/
    command/            ← Output Ports de escrita (repositórios JPA)
    query/              ← Output Ports de leitura (consultas JDBC)
    messaging/          ← Output Port de publicação de eventos
  service/              ← Domain Services
  exception/            ← Domain Exceptions
```

**Regras de ouro:**
- `domain/` não importa Spring, JPA, JDBC nem framework algum.
- **Command** (escrita): Controller → CommandUseCase → JPA Adapter. Usa transação e dirty checking.
- **Query** (leitura): Controller → QueryUseCase → JDBC Adapter. SQL nativo retornando direto o DTO de resposta.
- Entidades JPA ficam em `out/persistence/entity/` — nunca no `domain/model/`.

---

## Mapeamento — Factory Method (sem MapStruct)

Mapeamento explícito e transparente. DTOs de resposta são `record` com factory estático na borda.

```java
public record AssetResponse(
    UUID id, String name, String type, String ticker, String notes
) {
    public static AssetResponse from(Asset asset) {
        return new AssetResponse(
            asset.getId(), asset.getName(),
            asset.getType().name(), asset.getTicker(), asset.getNotes()
        );
    }
}
```

- Queries JDBC mapeiam direto via `RowMapper` para o `record` de resposta — sem passar pelo domínio.
- Requests (`CreateAssetRequest`) convertem para o domínio dentro do Use Case, não no controller.

---

## CQRS na prática

**Command side (escrita):**
```java
@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetCommandController {
    private final CreateAssetPort createAsset;   // input port command

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssetResponse>> create(@Valid @RequestBody CreateAssetRequest req) {
        var asset = createAsset.execute(req);
        return ResponseEntity.status(CREATED).body(ApiResponse.ok(AssetResponse.from(asset), "Ativo criado"));
    }
}
```

**Query side (leitura) — JDBC puro:**
```java
@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetQueryController {
    private final ListAssetsPort listAssets;     // input port query

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VIEWER')")
    public ResponseEntity<ApiResponse<List<AssetResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(listAssets.execute()));
    }
}

// Adapter JDBC
@Component
@RequiredArgsConstructor
public class AssetJdbcQueryAdapter implements ListAssetsQueryPort {
    private final JdbcTemplate jdbc;

    private static final String SQL = """
        SELECT id, name, type, ticker, notes
        FROM assets
        WHERE deleted_at IS NULL
        ORDER BY name
        """;

    @Override
    public List<AssetResponse> findAllActive() {
        return jdbc.query(SQL, (rs, i) -> new AssetResponse(
            UUID.fromString(rs.getString("id")), rs.getString("name"),
            rs.getString("type"), rs.getString("ticker"), rs.getString("notes")
        ));
    }
}
```

> Decisão técnica: leitura não carrega entidades JPA. SQL controla joins, projeções e índices — performance previsível.

---

## Padrões de Projeto

Aplicados ao domínio — não como decoração, mas onde resolvem um problema real.

---

### Factory — Seleção de validador por tipo de ativo

**Quando usar:** criação condicional de objetos onde o tipo determina o comportamento.
**Aqui:** cada `AssetType` exige regras de validação diferentes (ex: RENDA_VARIAVEL exige ticker).

```java
// domain/service/validator/AssetValidator.java
public interface AssetValidator {
    void validate(Asset asset);
}

// domain/service/factory/AssetValidatorFactory.java
public class AssetValidatorFactory {
    public static AssetValidator forType(AssetType type) {
        return switch (type) {
            case RENDA_VARIAVEL, FII, ETF -> new TickerRequiredValidator();
            case RENDA_FIXA               -> new RendaFixaValidator();
        };
    }
}

// uso no Use Case de criação:
AssetValidatorFactory.forType(asset.getType()).validate(asset);
```

---

### Strategy — Algoritmo de cálculo de rendimento intercambiável

**Quando usar:** múltiplas implementações de um mesmo comportamento, selecionáveis em runtime.
**Aqui:** cálculo de retorno pode ser simples (período a período) ou CAGR (taxa anualizada).

```java
// domain/service/strategy/ReturnCalculationStrategy.java
public interface ReturnCalculationStrategy {
    BigDecimal calculate(BigDecimal previous, BigDecimal current, int months);
}

// Implementações:
public class SimpleReturnStrategy implements ReturnCalculationStrategy {
    public BigDecimal calculate(BigDecimal previous, BigDecimal current, int months) {
        return current.divide(previous, 4, HALF_UP).subtract(ONE).multiply(new BigDecimal("100"));
    }
}

public class CagrStrategy implements ReturnCalculationStrategy {
    public BigDecimal calculate(BigDecimal previous, BigDecimal current, int months) {
        // (current/previous)^(12/months) - 1
        double ratio = current.divide(previous, 8, HALF_UP).doubleValue();
        return BigDecimal.valueOf(Math.pow(ratio, 12.0 / months) - 1).multiply(new BigDecimal("100"));
    }
}

// uso no Query Use Case — estratégia injetada via query param:
ReturnCalculationStrategy strategy = "cagr".equals(mode) ? new CagrStrategy() : new SimpleReturnStrategy();
BigDecimal result = strategy.calculate(previous, current, months);
```

---

### Builder — Montagem do agregado Snapshot

**Quando usar:** objetos com muitos campos opcionais ou construídos em etapas distintas.
**Aqui:** Snapshot é criado com posições obrigatórias e market data opcional (pode falhar sem bloquear).

```java
// domain/model/snapshot/Snapshot.java
public class Snapshot {
    // campos privados...

    private Snapshot() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private LocalDate date;
        private String notes;
        private List<Position> positions = new ArrayList<>();
        private MarketData marketData;   // opcional

        public Builder date(LocalDate date)             { this.date = date; return this; }
        public Builder notes(String notes)              { this.notes = notes; return this; }
        public Builder position(Position p)             { this.positions.add(p); return this; }
        public Builder marketData(MarketData md)        { this.marketData = md; return this; }

        public Snapshot build() {
            Objects.requireNonNull(date, "Data do snapshot é obrigatória");
            if (positions.isEmpty()) throw new ValidationException("Snapshot deve ter ao menos uma posição");
            var s = new Snapshot();
            s.date = this.date;
            s.notes = this.notes;
            s.positions = List.copyOf(this.positions);
            s.marketData = this.marketData;
            return s;
        }
    }
}

// uso no Use Case:
var snapshot = Snapshot.builder()
    .date(request.date())
    .notes(request.notes())
    .position(Position.of(asset, qty, price, totalNet, rate))
    .marketData(marketDataOptional.orElse(null))   // não bloqueia se falhar
    .build();
```

---

### Command — Value object imutável de entrada do Use Case

**Quando usar:** encapsular a intenção de uma operação como objeto — parametrizável, auditável, serializável.
**Aqui:** `CreateAssetCommand` carrega dados validados do request e entra no use case. Alinha com CQRS.

```java
// application/usecase/command/asset/CreateAssetCommand.java
public record CreateAssetCommand(
    String name, AssetType type, String ticker, String notes
) {
    // Validação de negócio no próprio command — antes de chegar ao domínio
    public CreateAssetCommand {
        Objects.requireNonNull(name, "Nome é obrigatório");
        if ((type == RENDA_VARIAVEL || type == FII || type == ETF) && (ticker == null || ticker.isBlank()))
            throw new ValidationException("Ticker obrigatório para " + type);
    }

    // Factory a partir do DTO de request
    public static CreateAssetCommand from(CreateAssetRequest req) {
        return new CreateAssetCommand(req.name(), req.type(), req.ticker(), req.notes());
    }
}

// uso no Controller:
var command = CreateAssetCommand.from(request);  // valida aqui
var asset   = createAssetPort.execute(command);   // domínio já recebe dado consistente
```

---

### Chain of Responsibility — Cadeia de validações antes de criar Snapshot

**Quando usar:** uma requisição deve passar por múltiplas verificações independentes, cada uma podendo barrar ou passar adiante.
**Aqui:** criação de Snapshot valida: data única → ativos existem → nenhum ativo arquivado → posições sem duplicatas.

```java
// domain/service/validation/SnapshotValidationHandler.java
public abstract class SnapshotValidationHandler {
    private SnapshotValidationHandler next;

    public SnapshotValidationHandler then(SnapshotValidationHandler next) {
        this.next = next;
        return next;  // permite encadeamento fluente
    }

    public final void handle(CreateSnapshotCommand cmd) {
        validate(cmd);           // cada handler lança exceção se inválido
        if (next != null) next.handle(cmd);
    }

    protected abstract void validate(CreateSnapshotCommand cmd);
}

// Implementações:
public class UniqueDateHandler extends SnapshotValidationHandler {
    protected void validate(CreateSnapshotCommand cmd) {
        if (snapshotRepo.existsByDate(cmd.date()))
            throw new ConflictException("Já existe snapshot para " + cmd.date(), "SNAPSHOT_ALREADY_EXISTS");
    }
}

public class ActiveAssetsHandler extends SnapshotValidationHandler {
    protected void validate(CreateSnapshotCommand cmd) {
        cmd.positions().forEach(p -> {
            var asset = assetRepo.findById(p.assetId()).orElseThrow(() -> new NotFoundException(...));
            if (asset.isArchived())
                throw new DomainException("Ativo arquivado não pode compor snapshot", "ARCHIVED_ASSET");
        });
    }
}

// montagem e uso no Use Case:
var chain = new UniqueDateHandler();
chain.then(new ActiveAssetsHandler())
     .then(new NoDuplicatePositionsHandler());
chain.handle(command);   // executa a cadeia — qualquer handler pode lançar exceção
```

---

Publicação de eventos de domínio ao criar/alterar recursos. Demonstra desacoplamento. Sem consumidor neste projeto.

```java
// domain/event/AssetChangedEvent.java — evento de domínio (puro Java)
public record AssetChangedEvent(UUID assetId, String action, Instant occurredAt) {
    public static AssetChangedEvent created(UUID id) { return new AssetChangedEvent(id, "CREATED", Instant.now()); }
    public static AssetChangedEvent updated(UUID id) { return new AssetChangedEvent(id, "UPDATED", Instant.now()); }
}

// domain/port/out/messaging/EventPublisherPort.java — output port
public interface EventPublisherPort {
    void publish(AssetChangedEvent event);
}

// infrastructure/adapter/out/messaging/RabbitEventPublisher.java
@Component
@RequiredArgsConstructor
public class RabbitEventPublisher implements EventPublisherPort {
    private final RabbitTemplate rabbit;

    @Override
    public void publish(AssetChangedEvent event) {
        rabbit.convertAndSend("financeiro.exchange", "asset.changed", event);
    }
}
```

- O Use Case de escrita chama `eventPublisher.publish(...)` após persistir.
- Exchange: `financeiro.exchange` (topic). Routing key: `asset.changed`.
- Falha de publicação **não** quebra a transação principal (publicar é fire-and-forget, logado).
- RabbitMQ sobe via Docker com painel de gestão em `:15672`.

---

## Padrão de Resposta REST

Toda rota retorna `ApiResponse<T>`. Sem exceção.

```java
// Sucesso
{ "success": true, "data": { ... }, "message": "opcional" }

// Erro
{ "success": false, "error": { "code": "ASSET_NOT_FOUND", "message": "...", "statusCode": 404, "path": "...", "timestamp": "..." } }
```

| Status | Quando |
|---|---|
| 200 | GET, PATCH, PUT bem-sucedidos |
| 201 | POST com recurso criado |
| 204 | DELETE sem corpo |
| 400 | Bean Validation falhou |
| 401 | Sem token ou token inválido |
| 403 | Token válido, role insuficiente |
| 404 | Recurso não encontrado |
| 409 | Violação de unicidade |
| 422 | Violação de regra de negócio |
| 500 | Erro inesperado |

---

## Hierarquia de Exceções

```
RuntimeException
└── DomainException(message, errorCode)       → 422 padrão
    ├── NotFoundException                      → 404
    └── ConflictException                      → 409

└── ApplicationException(message, errorCode)  → 400 padrão
    └── ValidationException                   → 400
```

- `GlobalExceptionHandler` (@RestControllerAdvice) centraliza todo tratamento.
- Controllers não têm try/catch.
- Erros de Bean Validation (`MethodArgumentNotValidException`) tratados no handler global.
- Em `prod`, stack trace nunca aparece na resposta.

---

## Segurança — Keycloak + OAuth2

**Fluxo:** Angular → Keycloak (login) → JWT → Spring Boot (valida JWT via JWKS).

```
Rotas públicas:  GET /api/health · GET /docs/** · GET /v3/api-docs/**
Rotas VIEWER:    GET /api/**
Rotas ADMIN:     POST · PATCH · DELETE /api/**
```

- Spring Boot é Resource Server — nunca gerencia senhas.
- Roles extraídas de `realm_access.roles` no JWT com prefixo `ROLE_`.
- Use `@PreAuthorize("hasRole('ADMIN')")` nos controllers de Command.
- Keycloak sobe via Docker com `realm-export.json` versionado no repositório.

```yaml
spring.security.oauth2.resourceserver.jwt:
  issuer-uri: ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}
  jwk-set-uri: ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs
```

---

## Banco de Dados — Padrões

- Flyway: `resources/db/migration/V{N}__{descricao}.sql`.
- IDs: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- Timestamps: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- Soft delete: coluna `deleted_at` — nunca `DELETE` físico de registros de negócio.
- Unicidade com soft delete: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.
- Índices pensados para as queries JDBC — projeção e filtro alinhados ao SQL de leitura.

---

## Ambientes — Dev vs Prod

Profiles Spring + environments Angular totalmente separados.

**Backend — Spring Profiles:**

| Aspecto | `dev` (`application-dev.yml`) | `prod` (`application-prod.yml`) |
|---|---|---|
| Banco | Docker local / localhost:5432 | Variáveis de ambiente (Neon/servidor) |
| `ddl-auto` | `validate` | `validate` (schema só via Flyway) |
| Logs SQL | `show-sql: true` | `false` |
| Log level | `DEBUG` | `INFO` |
| Erro na resposta | stack trace completo | mensagem genérica |
| CORS | `http://localhost:4200` | domínio de produção |
| Keycloak | `http://localhost:8180` | URL pública HTTPS |
| RabbitMQ | `localhost:5672` | host do broker |

```yaml
# application.yml (base — comum)
spring:
  profiles:
    active: ${SPRING_PROFILE:dev}
  application:
    name: financeiro
```

Ativação: `SPRING_PROFILE=prod` no container; `dev` é o default local.

**Frontend — Angular environments:**
- `environment.ts` (dev): `apiUrl: http://localhost:8080/api`, Keycloak local.
- `environment.prod.ts`: `apiUrl: /api` (via Nginx proxy), Keycloak HTTPS.
- Build de produção: `ng build --configuration production`.

---

## Docker — Estrutura Padrão

```yaml
services:
  postgres:   image: postgres:16-alpine            porta 5432
  rabbitmq:   image: rabbitmq:3-management-alpine   portas 5672, 15672
  keycloak:   image: keycloak/keycloak:24.0         porta 8180   depende: postgres
  backend:    build: ./backend                      porta 8080   depende: postgres, keycloak, rabbitmq
  frontend:   build: ./frontend                     porta 80     depende: backend
```

- Todos os serviços com `healthcheck` + `condition: service_healthy`.
- Backend: Dockerfile multi-stage (Maven build → JRE runtime, usuário não-root).
- Frontend: Dockerfile multi-stage (Node build → Nginx serve).
- Nginx serve o build Angular e faz proxy `/api/` → backend (sem CORS em produção).
- RabbitMQ Management UI em `:15672` (guest/guest em dev).
- Variáveis sensíveis: só via `.env` (gitignored). Repositório tem `.env.example`.

---

## Frontend — Padrões Angular

**MVC aplicado:**
- **Model** = Services (`*.service.ts`) — estado e chamadas HTTP.
- **View** = Templates (`*.component.html`) — Bootstrap Mobile First.
- **Controller** = Components container (`*.component.ts`).

**Estrutura:**
```
core/          ← AuthGuard, Interceptor, serviços singleton
shared/        ← Componentes e modelos reutilizáveis
features/      ← Módulos de funcionalidade (lazy loaded)
  └── {feature}/ { views/ components/ services/ }
```

**Auth:** Keycloak JS Adapter — token em memória, interceptor injeta `Authorization: Bearer`.

---

## Steps de Implementação (ordem obrigatória)

Seguir nesta sequência. Validar cada step antes de avançar.

```
STEP 1  Classes base: ApiResponse, ErrorDetail, exceções, GlobalExceptionHandler
STEP 2  Schema do banco (migrations Flyway V1..VN)
STEP 3  Domain: entidades, value objects, events, ports (in/out command+query), domain services
         ↳ incluir: AssetValidatorFactory, ReturnCalculationStrategy, SnapshotValidationChain
STEP 4  Application command: Commands (records imutáveis) + use cases de escrita
         ↳ incluir: CreateAssetCommand, CreateSnapshotCommand com validação embutida
STEP 5  Application query: use cases de leitura + DTOs response (records com from())
STEP 6  Domain builder: Snapshot.Builder para montagem do agregado
STEP 7  Infra out persistence: JPA entities, repositories, command adapters
STEP 8  Infra out query: JdbcTemplate adapters + RowMappers
STEP 9  Infra out messaging: RabbitConfig + RabbitEventPublisher
STEP 10 Infra in rest: command controllers + query controllers (Swagger anotado)
STEP 11 Security: SecurityConfig + Keycloak + realm-export.json
STEP 12 Docker: compose + Dockerfiles + nginx.conf + profiles dev/prod
STEP 13 Frontend: Guard, Interceptor, Services, Components
STEP 14 Testes: unit (domain, use cases, validations) + integration (controllers via Testcontainers)
```

---

# PARTE II — REGRAS DE NEGÓCIO

> Esta seção descreve **o que o sistema faz**. Sem referências a frameworks.
> Cada épico é uma unidade implementável completa (backend + frontend + banco).

---

## Contexto do Domínio

**Sistema:** Painel de Controle Financeiro Pessoal
**Propósito:** Acompanhamento de patrimônio, rendimentos históricos e projeções.
**Perfis:** `ADMIN` (cria e edita), `VIEWER` (somente leitura).

---

## Épico 1 — Gestão de Ativos

**Objetivo:** Manter o cadastro de ativos financeiros do portfólio.

**Regras:**
- Tipos válidos: `RENDA_FIXA`, `RENDA_VARIAVEL`, `FII`, `ETF`.
- Ticker obrigatório para `RENDA_VARIAVEL`, `FII` e `ETF`.
- Não pode haver dois ativos ativos com o mesmo ticker.
- Arquivamento é lógico (soft delete) — histórico preservado.
- Ativo arquivado some da listagem, mas permanece nos snapshots históricos.
- **Evento:** ao criar ou atualizar, publica `AssetChangedEvent` no RabbitMQ.

**Rotas:**

| Método | Controller | Rota | Role | Retorno |
|---|---|---|---|---|
| GET | Query | `/api/assets` | VIEWER | Lista ativos não arquivados (JDBC) |
| GET | Query | `/api/assets/{id}` | VIEWER | Ativo por ID (JDBC) |
| POST | Command | `/api/assets` | ADMIN | 201 + ativo criado → publica evento |
| PATCH | Command | `/api/assets/{id}` | ADMIN | 200 + ativo atualizado → publica evento |
| DELETE | Command | `/api/assets/{id}` | ADMIN | 204 (soft delete) |

**Tabela:**
```sql
CREATE TABLE assets (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(20)  NOT NULL CHECK (type IN ('RENDA_FIXA','RENDA_VARIAVEL','FII','ETF')),
    ticker     VARCHAR(10),
    notes      TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_assets_ticker ON assets (ticker) WHERE deleted_at IS NULL AND ticker IS NOT NULL;
CREATE INDEX idx_assets_type ON assets (type) WHERE deleted_at IS NULL;
```

---

## Épico 2 — Snapshots de Portfólio

**Objetivo:** Registrar fotografias mensais do portfólio para construir histórico.

**Regras:**
- Apenas um snapshot por data — unicidade estrita.
- Um snapshot contém N posições (um ativo por posição).
- Snapshots são imutáveis após criação — sem edição, sem exclusão.
- Criação falha (422) se qualquer ativo referenciado estiver arquivado.
- `total_gross = quantity × unit_price` — calculado pelo backend, valor do cliente é ignorado.
- `total_net` é informado pelo usuário (estimado após IR/taxas).
- **Evento:** ao criar, publica `SnapshotCreatedEvent` no RabbitMQ.

**Rotas:**

| Método | Controller | Rota | Role | Retorno |
|---|---|---|---|---|
| GET | Query | `/api/snapshots` | VIEWER | Lista resumida (JDBC) |
| GET | Query | `/api/snapshots/latest` | VIEWER | Snapshot mais recente completo (JDBC) |
| GET | Query | `/api/snapshots/{id}` | VIEWER | Snapshot completo por ID (JDBC) |
| POST | Command | `/api/snapshots` | ADMIN | 201 + snapshot criado → publica evento |

**Tabelas:**
```sql
CREATE TABLE snapshots (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    date       DATE        NOT NULL UNIQUE,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE positions (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID           NOT NULL REFERENCES snapshots(id),
    asset_id    UUID           NOT NULL REFERENCES assets(id),
    quantity    NUMERIC(18,8)  NOT NULL,
    unit_price  NUMERIC(18,4)  NOT NULL,
    total_gross NUMERIC(18,4)  NOT NULL,
    total_net   NUMERIC(18,4)  NOT NULL,
    rate        VARCHAR(50),
    CONSTRAINT uq_position_snapshot_asset UNIQUE (snapshot_id, asset_id)
);
CREATE INDEX idx_positions_snapshot ON positions (snapshot_id);
```

---

## Épico 3 — Dados de Mercado

**Objetivo:** Enriquecer snapshots com indicadores econômicos do momento.

**Regras:**
- Um registro por snapshot (1:1).
- Campos: `selic` (% a.a.), `usd_brl`, `ibovespa`, `ivvb11`, `ipca`.
- Dados de API externa (BRAPI). Se indisponível, snapshot é criado sem eles — nunca bloqueia.
- Sem `BRAPI_TOKEN`: ibovespa e ivvb11 ficam nulos; demais preenchíveis manualmente.

**Rotas:**

| Método | Controller | Rota | Role | Retorno |
|---|---|---|---|---|
| GET | Query | `/api/market` | VIEWER | Indicadores ao vivo |
| GET | Query | `/api/market/tesouro` | VIEWER | Taxas Tesouro Direto |

**Tabela:**
```sql
CREATE TABLE market_data (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID          NOT NULL UNIQUE REFERENCES snapshots(id),
    selic       NUMERIC(6,2),
    usd_brl     NUMERIC(8,4),
    ibovespa    NUMERIC(12,2),
    ivvb11      NUMERIC(10,4),
    ipca        NUMERIC(6,2),
    fetched_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## Épico 4 — Cálculos e Projeções

**Objetivo:** Derivar métricas do portfólio a partir dos snapshots — sem persistência.

**Regras (calculados on-the-fly via Query/JDBC):**
- **Rendimento absoluto:** `total_net_atual - total_net_anterior`
- **Rendimento percentual:** `(total_net_atual / total_net_anterior - 1) × 100`
- **Concentração por tipo:** `total_net_tipo / total_net_portfólio × 100`
- **Projeção:** crescimento composto com taxa e prazo (meses) informados pelo usuário.
- Projeção não é salva — calculada sob demanda via query param.

**Rotas (sem tabela nova):**

| Método | Controller | Rota | Role |
|---|---|---|---|
| GET | Query | `/api/snapshots/{id}/returns` | VIEWER |
| GET | Query | `/api/snapshots/{id}/allocation` | VIEWER |
| GET | Query | `/api/snapshots/latest/projection?rate=X&months=Y` | VIEWER |

---

## Épico 5 — Autenticação e Perfis

**Objetivo:** Controlar acesso via Identity Provider externo.

**Regras:**
- Usuários gerenciados exclusivamente no Keycloak — sistema não tem cadastro de usuários.
- Roles: `ADMIN` (CRUD completo) e `VIEWER` (somente leitura).
- Mesma mensagem para credenciais inválidas (evita enumeração de usuários).
- Rate limit: 100 req/15min global · 10 tentativas de login/15min por IP.

**Usuários de desenvolvimento (realm-export.json):**

| Usuário | Senha | Role |
|---|---|---|
| `admin@financeiro.dev` | `admin123` | ADMIN |
| `viewer@financeiro.dev` | `viewer123` | VIEWER |

---

## Critérios de Aceite Globais

- [ ] `GET /api/health` retorna 200 sem token
- [ ] Qualquer rota `/api/assets` sem token retorna 401
- [ ] VIEWER fazendo POST retorna 403
- [ ] Snapshot com data duplicada retorna 409
- [ ] Snapshot com ativo arquivado retorna 422
- [ ] `total_gross` calculado pelo backend — valor do cliente ignorado
- [ ] GET de ativos/snapshots usa JDBC (não JPA)
- [ ] POST/PATCH de ativo publica evento no RabbitMQ (visível no painel `:15672`)
- [ ] Falha no RabbitMQ não quebra a transação de escrita
- [ ] Todos os erros seguem o envelope `ApiResponse` com `success: false`
- [ ] Profile `dev` mostra SQL e stack trace; `prod` oculta ambos
- [ ] `docker compose up` sobe o projeto completo do zero sem configuração manual
