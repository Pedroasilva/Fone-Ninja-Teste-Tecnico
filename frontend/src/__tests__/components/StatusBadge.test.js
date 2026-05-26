import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../../components/StatusBadge.vue'

describe('StatusBadge', () => {
  it('exibe "Ativa" quando cancelada é false', () => {
    const wrapper = mount(StatusBadge, { props: { cancelada: false } })
    expect(wrapper.text()).toBe('Ativa')
  })

  it('exibe "Cancelada" quando cancelada é true', () => {
    const wrapper = mount(StatusBadge, { props: { cancelada: true } })
    expect(wrapper.text()).toBe('Cancelada')
  })

  it('aplica classe badge-ativa quando não cancelada', () => {
    const wrapper = mount(StatusBadge, { props: { cancelada: false } })
    expect(wrapper.find('span').classes()).toContain('badge-ativa')
  })

  it('aplica classe badge-cancelada quando cancelada', () => {
    const wrapper = mount(StatusBadge, { props: { cancelada: true } })
    expect(wrapper.find('span').classes()).toContain('badge-cancelada')
  })
})
