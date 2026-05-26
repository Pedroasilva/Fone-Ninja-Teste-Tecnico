<template>
  <div style="font-size:0.8125rem; color:#374151;">
    <span v-if="labelCompra" style="color:#6B7280; font-size:0.75rem;">{{ labelCompra }}</span>
    <br v-if="labelCompra">
    {{ formatarData(data) }}
  </div>
  <div v-if="dataCancelamento" style="margin-top:6px; font-size:0.8125rem; color:#DC2626;">
    <span style="color:#9CA3AF; font-size:0.75rem;">Cancelamento</span><br>
    {{ formatarData(dataCancelamento) }}
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: String,
    required: true,
  },
  labelCompra: {
    type: String,
    default: '',
  },
  dataCancelamento: {
    type: String,
    default: null,
  },
})

function formatarData(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
