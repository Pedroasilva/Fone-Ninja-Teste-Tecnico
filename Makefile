.DEFAULT_GOAL := help

# ─── Containers ──────────────────────────────────────────────────────────────

up: ## Sobe todos os serviços em background
	docker compose up -d

up-build: ## Reconstrói as imagens e sobe os serviços
	docker compose up -d --build

down: ## Para e remove os containers
	docker compose down

restart: ## Reinicia todos os serviços
	docker compose restart

logs: ## Exibe logs de todos os serviços (Ctrl+C para sair)
	docker compose logs -f

logs-backend: ## Exibe logs apenas do backend
	docker compose logs -f backend

logs-frontend: ## Exibe logs apenas do frontend
	docker compose logs -f frontend

ps: ## Lista os containers em execução
	docker compose ps

# ─── Testes ──────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Roda todos os testes

test-backend: ## Roda os testes do backend (PHPUnit)
	docker compose exec backend php artisan test

test-backend-unit: ## Roda apenas os testes unitários do backend
	docker compose exec backend php artisan test --testsuite=Unit

test-backend-feature: ## Roda apenas os testes de feature do backend
	docker compose exec backend php artisan test --testsuite=Feature

test-frontend: ## Roda os testes do frontend (Vitest)
	docker compose exec frontend npm run test

# ─── Backend ─────────────────────────────────────────────────────────────────

migrate: ## Executa as migrations do banco
	docker compose exec backend php artisan migrate

migrate-fresh: ## Recria o banco do zero e executa as migrations
	docker compose exec backend php artisan migrate:fresh

tinker: ## Abre o tinker (REPL do Laravel)
	docker compose exec backend php artisan tinker

shell-backend: ## Abre um shell no container do backend
	docker compose exec backend bash

# ─── Frontend ────────────────────────────────────────────────────────────────

shell-frontend: ## Abre um shell no container do frontend
	docker compose exec frontend sh

npm-install: ## Instala dependências do frontend
	docker compose exec frontend npm install

# ─── Utilitários ─────────────────────────────────────────────────────────────

help: ## Lista todos os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

.PHONY: up up-build down restart logs logs-backend logs-frontend ps \
        test test-backend test-backend-unit test-backend-feature test-frontend \
        migrate migrate-fresh tinker shell-backend shell-frontend npm-install help
