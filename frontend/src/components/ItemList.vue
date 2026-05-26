<template>
  <ul style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:2px;">
    <li
      v-for="produto in produtos"
      :key="produto.id"
      style="font-size:0.8125rem; color:#374151; white-space:nowrap;"
    >
      {{ produto.nome }}
      <span style="color:#6B7280;">× {{ produto.pivot.quantidade }}</span>
      <span style="color:#9CA3AF; margin-left:4px;">({{ formatarMoeda(produto.pivot.preco_unitario) }}/un)</span>
    </li>
  </ul>
</template>

<script setup>
import { formatarMoeda } from '../utils/format'

defineProps({
  produtos: {
    type: Array,
    required: true,
  },
})
</script>
