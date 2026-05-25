# ERP de Estoque — Laravel + Vue

Sistema ERP de estoque desacoplado: API REST em Laravel (backend) + SPA em Vue 3 (frontend), orquestrados via Docker Compose com banco MySQL 8.

---

## Arquitetura

```text
/
├── docker-compose.yml
├── backend/          # API Laravel 13 (PHP 8.4)
│   ├── Dockerfile
│   ├── app/
│   │   ├── Http/Controllers/   # Controladores finos — só delegam
│   │   ├── Http/Requests/      # Form Requests com validação e msgs em PT-BR
│   │   ├── Services/           # Regras de negócio (custo médio, estoque, lucro)
│   │   ├── Repositories/       # Acesso a dados isolado atrás de interfaces
│   │   └── Models/             # Eloquent ORM
│   └── tests/
│       ├── Unit/               # Testes de serviços com mocks (sem DB)
│       └── Feature/            # Testes de endpoints HTTP com SQLite in-memory
└── frontend/         # SPA Vue 3.5 (Vite 6)
    ├── Dockerfile
    └── src/
        ├── views/              # ProdutosView, ComprasView, VendasView
        ├── router/             # Vue Router 5
        ├── api.js              # Axios configurado via VITE_API_URL
        └── __tests__/          # Vitest + @vue/test-utils
```

### Princípios SOLID aplicados

| Princípio | Onde |
| --------- | ---- |
| **S** — Single Responsibility | `CustoMedioCalculator` é responsável apenas pelo cálculo do custo médio ponderado |
| **O** — Open/Closed | Repositórios e serviços implementam interfaces; novas implementações não alteram o código existente |
| **L** — Liskov Substitution | Qualquer implementação das interfaces de repositório pode substituir outra |
| **I** — Interface Segregation | Interfaces separadas por entidade (`ProdutoRepositoryInterface`, `CompraRepositoryInterface`, `VendaRepositoryInterface`) |
| **D** — Dependency Inversion | Controllers e Services recebem dependências pelo construtor; `AppServiceProvider` resolve os bindings |

### Fluxo de dados

```text
HTTP Request
    → Form Request (validação)
    → Controller (delega)
    → Service (regra de negócio, DB::transaction)
    → Repository (persistência via Eloquent)
    → Response JSON
```

### Regras de negócio principais

- **Custo médio ponderado** (atualizado a cada compra):  
  `(estoque_atual × custo_médio + quantidade × preço_unitário) / (estoque_atual + quantidade)`

- **Lucro por venda** (calculado com snapshot do custo no momento da venda):  
  `(preço_unitário_venda − custo_médio_snapshot) × quantidade`

- **Estoque**: validado com `lockForUpdate()` dentro de transação para evitar race conditions; retorna 422 se insuficiente.

- **Cancelamento de venda**: reverte o estoque e marca `cancelada = true`; idempotente (lança 422 se já cancelada).

---

## Uso de IA

Este projeto foi implementado com auxílio do **Claude Code** (Anthropic) via VSCode Extension.

A IA foi utilizada para:

- Scaffolding completo do projeto Laravel e Vue com base nas especificações definidas em `.claude/specs/`
- Geração de migrations, models, repositories, services e controllers seguindo a arquitetura Controller → Service → Repository com SOLID
- Escrita da suíte de testes (PHPUnit unit + feature, Vitest + vue/test-utils)
- Configuração do Docker Compose, Dockerfiles e entrypoint
- Resolução de bugs de compatibilidade (PHPUnit mock de métodos `void`, `createPartialMock` para evitar chamadas ao DB, tipos intersection no PHP 8.4)

As especificações técnicas foram definidas manualmente pelo desenvolvedor em `.claude/specs/` (database, backend, frontend, design, tests) antes da geração do código.

---

## Testes

### Backend (PHPUnit)

| Suíte | Qtd | Estratégia |
| ----- | --- | ---------- |
| Unit — `CustoMedioCalculatorTest` | 3 | Matemática pura, sem framework |
| Unit — `ProdutoServiceTest` | 2 | Mock do repositório, sem DB |
| Unit — `CompraServiceTest` | 1 | Mock do repositório + `createPartialMock` para Eloquent |
| Unit — `VendaServiceTest` | 3 | Idem, inclui testes de exceção de estoque e venda já cancelada |
| Feature — `ProdutoTest` | 3 | HTTP contra SQLite in-memory (`RefreshDatabase`) |
| Feature — `CompraTest` | 4 | Idem, valida custo médio após compra |
| Feature — `VendaTest` | 6 | Idem, inclui cancelamento e rollback de estoque |

**Rodar localmente (dentro do container):**

```bash
docker compose exec backend php artisan test
# Apenas unitários (sem SQLite no host):
docker compose exec backend php artisan test --testsuite=Unit
```

### Frontend (Vitest)

| Arquivo | Qtd | O que testa |
| ------- | --- | ----------- |
| `format.test.js` | 4 | `formatarMoeda` — formatação pt-BR |
| `ProdutosView.test.js` | 3 | Listagem, cadastro e erro de API |
| `ComprasView.test.js` | 5 | Adicionar/remover itens, registrar compra |
| `VendasView.test.js` | 3 | Cálculo de total/lucro em tempo real, sucesso e erro de estoque |

**Rodar:**

```bash
docker compose exec frontend npm run test
```

---

## Como clonar e subir o projeto

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2+

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/pedrosilva46/Fone-Ninja-Teste-Tecnico.git
cd Fone-Ninja-Teste-Tecnico

# 2. Subir todos os serviços (build automático na primeira vez)
docker compose up --build
```

Aguarde o backend exibir `INFO  Server running on [http://0.0.0.0:8000]`.  
As migrations são executadas automaticamente pelo `entrypoint.sh`.

- **Frontend (Vue):** [http://localhost:5173](http://localhost:5173)
- **Backend (API):** [http://localhost:8000/api](http://localhost:8000/api)
- **Banco (MySQL):** `localhost:3306`

### Variáveis de ambiente

O frontend já vem configurado com `VITE_API_URL=http://localhost:8000` via `docker-compose.yml`.  
Para sobrescrever, crie `frontend/.env.local`:

```env
VITE_API_URL=http://seu-host:8000
```

### Endpoints disponíveis

```
GET  /api/produtos          Lista produtos
POST /api/produtos          Cadastra produto

GET  /api/compras           Lista compras com produtos
POST /api/compras           Registra compra (atualiza estoque e custo médio)

GET  /api/vendas            Lista vendas com produtos
POST /api/vendas            Registra venda (valida estoque, calcula lucro)
DELETE /api/vendas/{id}     Cancela venda (reverte estoque)
```
