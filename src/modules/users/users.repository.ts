import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '@/database/database.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async findAll(limit: number, offset: number): Promise<User[]> {
    const result = await this.pool.query<User>(
      'SELECT id, email, name, role, created_at, updated_at, deleted_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL',
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      'SELECT id, email, name, role, created_at, updated_at, deleted_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      'SELECT id, email, name, role, created_at, updated_at, deleted_at FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );
    return result.rows[0] || null;
  }

  async create(dto: CreateUserDto, hashedPassword: string): Promise<User> {
    const result = await this.pool.query<User>(
      'INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at, deleted_at',
      [dto.email, dto.name, hashedPassword, dto.role || 'user'],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateUserDto, hashedPassword?: string): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (dto.email) {
      fields.push(`email = $${index++}`);
      values.push(dto.email);
    }
    if (dto.name) {
      fields.push(`name = $${index++}`);
      values.push(dto.name);
    }
    if (hashedPassword) {
      fields.push(`password = $${index++}`);
      values.push(hashedPassword);
    }
    if (dto.role) {
      fields.push(`role = $${index++}`);
      values.push(dto.role);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} AND deleted_at IS NULL RETURNING id, email, name, role, created_at, updated_at, deleted_at`,
      values,
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    return result.rowCount > 0;
  }
}
