# ERP de Estoque – Desafio Técnico Laravel + Vue

## Visão Geral

Sistema ERP de estoque desacoplado: API Laravel (backend) + Vue (frontend), orquestrados via Docker Compose com banco MySQL.

## Estrutura do Projeto

```text
/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   └── (projeto Vue)
└── backend/
    ├── Dockerfile
    └── (projeto Laravel)
```

## Stack

- **Backend:** Laravel 13, PHP 8.4, MySQL 8.0
- **Frontend:** Vue 3.5.34, Vite 8.0, Vue Router 5, Axios 1.16
- **Infraestrutura:** Docker, Docker Compose, Node 22 LTS

## Regras Gerais

- Backend expõe apenas endpoints REST (`/api/*`); nunca serve views
- Frontend consome a API via variável de ambiente `VITE_API_URL`
- Custo médio é recalculado a cada compra: `(estoque_atual * custo_medio + quantidade * preco_unitario) / (estoque_atual + quantidade)`
- Venda valida estoque antes de baixar; retorna erro 422 se insuficiente
- Lucro por venda: `(preco_unitario_venda - custo_medio) * quantidade` por item

## Commands disponíveis

- `/build-backend`  — scaffolda o projeto Laravel completo
- `/build-frontend` — scaffolda o projeto Vue completo
- `/setup-docker`   — cria Dockerfiles e docker-compose.yml
- `/build-all`      — executa tudo em sequência

## Especificações Detalhadas

@.claude/specs/database.md
@.claude/specs/backend.md
@.claude/specs/frontend.md
@.claude/specs/design.md
@.claude/specs/tests.md
