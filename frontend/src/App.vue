<template>
  <header>
    <nav>
      <span class="nav-brand">ERP Estoque</span>
      <RouterLink to="/">Produtos</RouterLink>
      <RouterLink to="/compras">Compras</RouterLink>
      <RouterLink to="/vendas">Vendas</RouterLink>
      <RouterLink to="/relatorio">Relatório</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #F9FAFB;
  color: #111827;
  font-size: 1rem;
}

nav {
  background: #1E3A5F;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-brand {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1.125rem;
  margin-right: auto;
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

main {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Formulários */
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

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.campo {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.erro-campo {
  font-size: 0.8125rem;
  color: #DC2626;
  margin-top: 4px;
}

/* Botões */
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

/* Cards */
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

/* Alertas */
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

/* Tabelas */
.tabela-wrapper {
  overflow-x: auto;
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

thead th.center { text-align: center; }
thead th.right  { text-align: right; }

tbody td {
  padding: 12px;
  color: #111827;
  border-bottom: 1px solid #F3F4F6;
}

tbody td.center { text-align: center; }
tbody td.right  { text-align: right; }

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #F9FAFB;
}

/* Linha de item dinâmico */
.linha-item {
  display: grid;
  grid-template-columns: 2fr 80px 120px 40px;
  gap: 8px;
  align-items: start;
  margin-bottom: 8px;
}

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

/* Badges */
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

/* Resumo de venda */
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
</style>
