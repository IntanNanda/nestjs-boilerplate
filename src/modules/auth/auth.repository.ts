import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '@/database/database.constants';

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.pool.query<AuthUser>(
      'SELECT id, email, password, name, role FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );
    return result.rows[0] || null;
  }
}
