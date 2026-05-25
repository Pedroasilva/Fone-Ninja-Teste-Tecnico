# Especificação — Banco de Dados

## Diagrama de Entidades

```
┌──────────────┐        ┌─────────────────────┐        ┌──────────────┐
│   produtos   │        │   compra_produto     │        │   compras    │
│──────────────│        │─────────────────────│        │──────────────│
│ id           │◄───────│ produto_id (FK)      │────────│ id           │
│ nome         │        │ compra_id (FK)       │        │ fornecedor   │
│ preco_venda  │        │ quantidade           │        │ total        │
│ custo_medio  │        │ preco_unitario       │        │ created_at   │
│ estoque      │        └─────────────────────┘        │ updated_at   │
│ created_at   │                                        └──────────────┘
│ updated_at   │
│              │        ┌─────────────────────┐        ┌──────────────┐
│              │        │   venda_produto      │        │   vendas     │
│              │        │─────────────────────│        │──────────────│
│              │◄───────│ produto_id (FK)      │────────│ id           │
└──────────────┘        │ venda_id (FK)        │        │ cliente      │
                        │ quantidade           │        │ total        │
                        │ preco_unitario       │        │ lucro        │
                        │ custo_medio_snapshot │        │ cancelada    │
                        └─────────────────────┘        │ created_at   │
                                                        │ updated_at   │
                                                        └──────────────┘
```

---

## Tabelas

### `produtos`

| Coluna       | Tipo            | Restrições                  | Descrição                              |
|--------------|-----------------|-----------------------------|----------------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT          | Identificador único                    |
| nome         | VARCHAR(255)    | NOT NULL                    | Nome do produto (mínimo 3 caracteres)  |
| preco_venda  | DECIMAL(10,2)   | NOT NULL, >= 0              | Preço de venda ao cliente              |
| custo_medio  | DECIMAL(10,2)   | NOT NULL, DEFAULT 0.00      | Custo médio ponderado atual            |
| estoque      | INT             | NOT NULL, DEFAULT 0         | Quantidade atual em estoque            |
| created_at   | TIMESTAMP       | NULLABLE                    | Data de criação                        |
| updated_at   | TIMESTAMP       | NULLABLE                    | Data de última atualização             |

**Índices:**
- PRIMARY KEY (`id`)

**Regras de negócio:**
- `custo_medio` começa em 0 e é recalculado a cada compra
- `estoque` é gerenciado exclusivamente via compras e vendas, nunca editado diretamente
- `preco_venda` pode ser alterado a qualquer momento sem afetar vendas anteriores

---

### `compras`

| Coluna     | Tipo            | Restrições         | Descrição                        |
|------------|-----------------|--------------------|----------------------------------|
| id         | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identificador único              |
| fornecedor | VARCHAR(255)    | NOT NULL           | Nome do fornecedor               |
| total      | DECIMAL(10,2)   | NOT NULL           | Soma de todos os itens da compra |
| created_at | TIMESTAMP       | NULLABLE           | Data de criação                  |
| updated_at | TIMESTAMP       | NULLABLE           | Data de última atualização       |

**Cálculo de `total`:** `SUM(quantidade * preco_unitario)` para todos os itens da compra

---

### `compra_produto` (pivot)

| Coluna          | Tipo            | Restrições              | Descrição                              |
|-----------------|-----------------|-------------------------|----------------------------------------|
| compra_id       | BIGINT UNSIGNED | FK → compras.id CASCADE | Referência à compra                    |
| produto_id      | BIGINT UNSIGNED | FK → produtos.id CASCADE | Referência ao produto                  |
| quantidade      | INT             | NOT NULL, >= 1          | Quantidade comprada                    |
| preco_unitario  | DECIMAL(10,2)   | NOT NULL, >= 0          | Preço pago por unidade nessa compra    |

**Índices:**
- PRIMARY KEY (`compra_id`, `produto_id`)
- INDEX (`produto_id`)

**Nota:** Sem `timestamps` nessa tabela pivot — o horário da compra fica em `compras.created_at`.

---

### `vendas`

| Coluna     | Tipo            | Restrições                  | Descrição                         |
|------------|-----------------|-----------------------------|-----------------------------------|
| id         | BIGINT UNSIGNED | PK, AUTO_INCREMENT          | Identificador único               |
| cliente    | VARCHAR(255)    | NOT NULL                    | Nome do cliente                   |
| total      | DECIMAL(10,2)   | NOT NULL                    | Valor total da venda              |
| lucro      | DECIMAL(10,2)   | NOT NULL                    | Lucro total calculado no momento  |
| cancelada  | BOOLEAN         | NOT NULL, DEFAULT FALSE     | Flag de cancelamento              |
| created_at | TIMESTAMP       | NULLABLE                    | Data de criação                   |
| updated_at | TIMESTAMP       | NULLABLE                    | Data de última atualização        |

**Cálculo de `total`:** `SUM(quantidade * preco_unitario)` de cada item

**Cálculo de `lucro`:** `SUM((preco_unitario - custo_medio_snapshot) * quantidade)` de cada item

---

### `venda_produto` (pivot)

| Coluna               | Tipo            | Restrições                | Descrição                                    |
|----------------------|-----------------|---------------------------|----------------------------------------------|
| venda_id             | BIGINT UNSIGNED | FK → vendas.id CASCADE    | Referência à venda                           |
| produto_id           | BIGINT UNSIGNED | FK → produtos.id CASCADE  | Referência ao produto                        |
| quantidade           | INT             | NOT NULL, >= 1            | Quantidade vendida                           |
| preco_unitario       | DECIMAL(10,2)   | NOT NULL, >= 0            | Preço de venda por unidade                   |
| custo_medio_snapshot | DECIMAL(10,2)   | NOT NULL                  | Custo médio no momento da venda (imutável)   |

**Índices:**
- PRIMARY KEY (`venda_id`, `produto_id`)
- INDEX (`produto_id`)

**Por que `custo_medio_snapshot`?** O `custo_medio` do produto muda a cada compra. Para calcular lucro de vendas históricas corretamente, o custo vigente no momento da venda precisa ser gravado e nunca alterado.

---

## Lógica de Custo Médio Ponderado

**Fórmula aplicada a cada item na compra:**

```
novo_custo_medio = (estoque_atual * custo_medio_atual + quantidade_comprada * preco_unitario_compra)
                  ÷ (estoque_atual + quantidade_comprada)
```

**Exemplo:**
- Estoque: 10 unidades, custo médio: R$ 5,00
- Compra: 5 unidades a R$ 8,00
- Novo custo médio: (10 × 5 + 5 × 8) ÷ (10 + 5) = (50 + 40) ÷ 15 = **R$ 6,00**

**Caso especial — estoque zerado:**
- `estoque = 0` e `custo_medio = 0`
- Fórmula simplifica para: `novo_custo_medio = preco_unitario_compra`

---

## Fluxo de Estoque

```
Compra registrada
    └─► para cada produto no array "produtos":
            1. Busca produto por ID (lock pessimista recomendado)
            2. Calcula novo custo médio ponderado
            3. produto.estoque += quantidade
            4. produto.custo_medio = novo_custo_medio
            5. Salva produto
            6. Insere pivot compra_produto

Venda registrada
    └─► para cada produto no array "produtos":
            1. Busca produto por ID (lock pessimista recomendado)
            2. Verifica: produto.estoque >= quantidade → 422 se falhar
            3. Snapshot: custo_medio_snapshot = produto.custo_medio
            4. produto.estoque -= quantidade
            5. Salva produto
            6. Insere pivot venda_produto com custo_medio_snapshot

Venda cancelada (opcional)
    └─► para cada pivot venda_produto:
            1. produto.estoque += quantidade (devolve ao estoque)
            2. venda.cancelada = true
            (NÃO recalcula custo médio — operação unidirecional)
```

---

## Migrations — Ordem de Execução

As migrations devem ser criadas e executadas nessa ordem (FK dependencies):

1. `create_produtos_table`
2. `create_compras_table`
3. `create_compra_produto_table` — depende de produtos e compras
4. `create_vendas_table`
5. `create_venda_produto_table` — depende de vendas e produtos
