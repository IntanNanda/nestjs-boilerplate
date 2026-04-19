import { vi } from 'vitest';

// Setup global mocks or configurations for tests
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));
