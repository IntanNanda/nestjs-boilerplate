import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PG_CONNECTION } from '@/database/database.constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockPool = {
    query: vi.fn(),
    on: vi.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PG_CONNECTION)
      .useValue(mockPool)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - should login with valid credentials', async () => {
    const hashedPassword =
      '$2b$10$abcdefghijklmnopqrstuvwxycdefghijklmnopqrstu';

    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin',
          role: 'admin',
        },
      ],
    });

    vi.mock('bcrypt', () => ({
      compare: vi.fn().mockResolvedValue(true),
    }));

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
  });

  it('/users (GET) - should return paginated users', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'admin@example.com',
          name: 'Admin',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      ],
    });

    mockPool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
