import { vi } from 'vitest'

vi.mock('../api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    delete: vi.fn(),
  },
}))
