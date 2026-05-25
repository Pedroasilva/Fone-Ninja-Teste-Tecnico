# /setup-docker

Cria toda a infraestrutura Docker do projeto: Dockerfiles para backend e frontend e o docker-compose.yml raiz.

## O que fazer

### 1. `docker-compose.yml` (raiz do projeto)

Criar o arquivo com três serviços: `backend`, `frontend` e `db`.

```yaml
version: "3.9"

services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: erp_estoque
      MYSQL_USER: erp
      MYSQL_PASSWORD: secret
      MYSQL_ROOT_PASSWORD: root
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      APP_ENV: local
      APP_KEY: ""          # gerado no entrypoint
      APP_DEBUG: "true"
      DB_CONNECTION: mysql
      DB_HOST: db
      DB_PORT: 3306
      DB_DATABASE: erp_estoque
      DB_USERNAME: erp
      DB_PASSWORD: secret
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/var/www/html
      - /var/www/html/vendor  # vendor isolado no container

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules  # node_modules isolado no container

volumes:
  db_data:
```

---

### 2. `backend/Dockerfile`

Imagem PHP 8.4-CLI com Laravel rodando em `php artisan serve`.

```dockerfile
FROM php:8.4-cli

WORKDIR /var/www/html

# Dependências do sistema
RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql zip mbstring exif pcntl bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
```

---

### 3. `backend/entrypoint.sh`

Script que garante APP_KEY, roda migrações e sobe o servidor.

```bash
#!/bin/bash
set -e

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
  php artisan key:generate --force
fi

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
```

---

### 4. `frontend/Dockerfile`

Imagem Node 22-alpine com Vite dev server exposto.

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## Verificação

Após criar os arquivos, confirme:

- `docker-compose.yml` na raiz do projeto
- `backend/Dockerfile` e `backend/entrypoint.sh`
- `frontend/Dockerfile`

Para subir: `docker compose up --build`
