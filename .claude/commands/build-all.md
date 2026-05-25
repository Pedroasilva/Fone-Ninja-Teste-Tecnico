# /build-all

Executa toda a construção do projeto em sequência: backend Laravel, frontend Vue e infraestrutura Docker.

## Ordem de execução

Execute os commands na seguinte ordem:

1. `/build-backend`  — cria o projeto Laravel com models, migrations, controllers e rotas
2. `/build-frontend` — cria o projeto Vue com as telas de produtos, compras e vendas
3. `/setup-docker`   — cria os Dockerfiles e o docker-compose.yml

---

## Estrutura final esperada

```
/
├── docker-compose.yml
├── .claude/
│   ├── CLAUDE.md
│   └── commands/
│       ├── build-all.md
│       ├── build-backend.md
│       ├── build-frontend.md
│       └── setup-docker.md
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── .env
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── ProdutoController.php
│   │   │   ├── CompraController.php
│   │   │   └── VendaController.php
│   │   └── Models/
│   │       ├── Produto.php
│   │       ├── Compra.php
│   │       └── Venda.php
│   ├── database/migrations/
│   └── routes/api.php
└── frontend/
    ├── Dockerfile
    ├── .env
    ├── vite.config.js
    └── src/
        ├── api.js
        ├── App.vue
        ├── router/index.js
        └── views/
            ├── ProdutosView.vue
            ├── ComprasView.vue
            └── VendasView.vue
```

---

## Como subir o ambiente

Com Docker instalado, a partir da raiz do projeto:

```bash
# Build e start de todos os serviços
docker compose up --build

# Apenas backend e banco (sem rebuildar frontend)
docker compose up backend db

# Ver logs em tempo real
docker compose logs -f

# Parar tudo
docker compose down

# Parar e remover volumes (limpa banco)
docker compose down -v
```

### URLs após subir

| Serviço  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |
| MySQL    | localhost:3306        |

---

## Checklist de validação

- [ ] `GET  http://localhost:8000/api/produtos` retorna `[]`
- [ ] `POST http://localhost:8000/api/produtos` com `{nome, preco_venda}` cria produto
- [ ] `POST http://localhost:8000/api/compras` atualiza estoque e custo médio
- [ ] `POST http://localhost:8000/api/vendas` retorna total e lucro; rejeita se estoque insuficiente
- [ ] Frontend em `http://localhost:5173` renderiza as três telas sem erros de CORS
