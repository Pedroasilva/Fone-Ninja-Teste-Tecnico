# Especificação — Design e UX

## Princípios

- **Funcionalidade acima de tudo** — é um sistema interno, não um produto de consumo
- **Clareza** — dados numéricos (preços, estoque, lucro) devem ser legíveis à primeira vista
- **Feedback imediato** — toda ação do usuário recebe resposta visual em < 200ms
- **Sem frameworks CSS externos** — CSS puro para evitar dependências desnecessárias

---

## Paleta de Cores

```
Primária   — #2563EB  (azul)      → botões principais, links ativos
Sucesso    — #16A34A  (verde)     → mensagens positivas, status ativo
Erro       — #DC2626  (vermelho)  → mensagens de erro, status cancelado
Aviso      — #D97706  (âmbar)     → alertas, estoque baixo (diferencial)
Neutro     — #6B7280  (cinza)     → textos secundários, bordas

Fundo base          — #F9FAFB  (cinza muito claro)
Fundo cartão/form   — #FFFFFF  (branco)
Fundo navbar        — #1E3A5F  (azul escuro)
Texto principal     — #111827  (quase preto)
Texto secundário    — #6B7280  (cinza)
Borda               — #E5E7EB  (cinza claro)
```

---

## Tipografia

```
Fonte: system-ui, -apple-system, sans-serif
  (sem importar fonte externa — usa a do sistema operacional)

Tamanhos:
  h1 (título de página)  — 1.5rem  (24px), font-weight: 700
  h2 (subtítulo seção)   — 1.25rem (20px), font-weight: 600
  Body                   — 1rem    (16px), font-weight: 400
  Label/caption          — 0.875rem(14px), font-weight: 500
  Texto tabela           — 0.875rem(14px), font-weight: 400
```

---

## Layout Geral

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR  [ERP Estoque]   Produtos | Compras | Vendas         │  56px, fundo #1E3A5F
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CONTEÚDO DA VIEW                                    │   │  max-width: 960px
│  │                                                      │   │  margin: 0 auto
│  │  [Formulário]                                        │   │  padding: 24px 16px
│  │                                                      │   │
│  │  [Tabela de histórico / lista]                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**`max-width: 960px`** garante legibilidade em monitores grandes sem esticar a tabela.

---

## Navbar

```css
nav {
  background: #1E3A5F;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 32px;
}

nav a {
  color: #CBD5E1;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

nav a.router-link-active {
  color: #FFFFFF;
  border-bottom-color: #60A5FA;
}

nav a:hover {
  color: #FFFFFF;
}

.nav-brand {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1.125rem;
  margin-right: auto;  /* empurra links para a direita */
}
```

---

## Formulários

### Campos de Input

```css
input, select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.9375rem;
  color: #111827;
  background: #FFFFFF;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input:focus, select:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

input.erro, select.erro {
  border-color: #DC2626;
}
```

### Labels

```css
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}
```

### Mensagem de erro inline

```css
.erro-campo {
  font-size: 0.8125rem;
  color: #DC2626;
  margin-top: 4px;
}
```

### Grupo de campo (label + input + erro)

```css
.campo {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}
```

---

## Botões

```css
/* Primário */
.btn-primario {
  background: #2563EB;
  color: #FFFFFF;
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primario:hover  { background: #1D4ED8; }
.btn-primario:active { background: #1E40AF; }
.btn-primario:disabled {
  background: #93C5FD;
  cursor: not-allowed;
}

/* Secundário (Adicionar item) */
.btn-secundario {
  background: transparent;
  color: #2563EB;
  padding: 6px 14px;
  border: 1px solid #2563EB;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secundario:hover { background: #EFF6FF; }

/* Perigo (remover item) */
.btn-perigo {
  background: transparent;
  color: #DC2626;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-perigo:hover { background: #FEF2F2; }
```

---

## Cards / Caixas

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 32px;
}

.card-titulo {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F3F4F6;
}
```

---

## Mensagens de Feedback (Alert)

```css
.alerta {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9375rem;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.alerta-sucesso {
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  color: #166534;
}

.alerta-erro {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
}
```

**Comportamento:**
- Exibir no topo do formulário, acima do primeiro campo
- Sumir automaticamente após 5 segundos (sucesso)
- Permanecer até nova ação (erro)

---

## Tabelas

```css
.tabela-wrapper {
  overflow-x: auto;             /* scroll horizontal em telas pequenas */
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

thead th {
  background: #F9FAFB;
  color: #6B7280;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #E5E7EB;
}

tbody td {
  padding: 12px 12px;
  color: #111827;
  border-bottom: 1px solid #F3F4F6;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #F9FAFB;
}
```

### Alinhamento de colunas em tabela

| Tipo de dado    | Alinhamento |
|-----------------|-------------|
| ID              | centro      |
| Texto (nome)    | esquerda    |
| Moeda (R$)      | direita     |
| Número (qtd)    | centro      |
| Status          | centro      |
| Data            | esquerda    |

---

## Lista de Itens Dinâmica (Compras/Vendas)

```css
.linha-item {
  display: grid;
  grid-template-columns: 2fr 80px 120px 40px;
  gap: 8px;
  align-items: start;
  margin-bottom: 8px;
}

/* Em telas < 600px empilhar verticalmente */
@media (max-width: 600px) {
  .linha-item {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  .linha-item .btn-perigo {
    grid-column: 2;
    justify-self: end;
  }
}
```

---

## Painel de Resumo (VendasView)

```css
.resumo-venda {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0;
  display: flex;
  gap: 32px;
}

.resumo-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resumo-label {
  font-size: 0.8125rem;
  color: #6B7280;
  font-weight: 500;
}

.resumo-valor {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1E3A5F;
}

.resumo-valor.lucro-positivo { color: #15803D; }
.resumo-valor.lucro-negativo { color: #DC2626; }
```

Lucro positivo = verde, lucro negativo (venda abaixo do custo) = vermelho.

---

## Estado de Carregamento

**Botão com loading:**

```html
<button :disabled="carregando">
  {{ carregando ? 'Aguarde...' : 'Cadastrar' }}
</button>
```

**Tabela carregando:**

```html
<tbody v-if="carregando">
  <tr><td colspan="5" style="text-align:center; padding: 24px; color: #9CA3AF;">
    Carregando...
  </td></tr>
</tbody>
```

**Tabela vazia:**

```html
<tbody v-else-if="lista.length === 0">
  <tr><td colspan="5" style="text-align:center; padding: 24px; color: #9CA3AF;">
    Nenhum registro encontrado.
  </td></tr>
</tbody>
```

---

## Responsividade

| Breakpoint | Comportamento                                        |
|------------|------------------------------------------------------|
| > 960px    | Layout padrão, max-width centrado                    |
| 600–960px  | Padding reduzido, tabela com scroll horizontal       |
| < 600px    | Linha de item empilhada, nav com scroll ou hamburguer|

---

## Status de Venda na Tabela

```html
<span :class="venda.cancelada ? 'badge-cancelada' : 'badge-ativa'">
  {{ venda.cancelada ? 'Cancelada' : 'Ativa' }}
</span>
```

```css
.badge-ativa {
  background: #DCFCE7;
  color: #15803D;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-cancelada {
  background: #FEE2E2;
  color: #991B1B;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
```
