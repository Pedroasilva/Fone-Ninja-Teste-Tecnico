import { createRouter, createWebHistory } from 'vue-router'
import ProdutosView  from '../views/ProdutosView.vue'
import ComprasView   from '../views/ComprasView.vue'
import VendasView    from '../views/VendasView.vue'
import RelatorioView from '../views/RelatorioView.vue'

const routes = [
  { path: '/',          name: 'produtos',  component: ProdutosView  },
  { path: '/compras',   name: 'compras',   component: ComprasView   },
  { path: '/vendas',    name: 'vendas',    component: VendasView    },
  { path: '/relatorio', name: 'relatorio', component: RelatorioView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
