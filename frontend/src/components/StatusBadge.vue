<template>
  <span :class="cancelada ? 'badge-cancelada' : 'badge-ativa'">
    {{ cancelada ? 'Cancelada' : 'Ativa' }}
  </span>
</template>

<script setup>
defineProps({
  cancelada: {
    type: Boolean,
    required: true,
  },
})
</script>
