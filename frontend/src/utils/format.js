export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor ?? 0)
}

// Formata dígitos brutos como "1.000,00" (sem símbolo)
export function mascararMoeda(digits) {
  if (!digits) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseInt(digits, 10) / 100)
}

// Converte valor numérico para string mascarada
export function valorParaMascara(val) {
  if (val === '' || val === null || val === undefined) return ''
  return mascararMoeda(String(Math.round(Number(val) * 100)))
}

// Handler para @input: formata o campo e retorna o número
export function onMoedaInput(event) {
  const digits = event.target.value.replace(/\D/g, '')
  if (!digits) {
    event.target.value = ''
    return ''
  }
  const numero = parseInt(digits, 10) / 100
  event.target.value = mascararMoeda(digits)
  return numero
}
