import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

export class CreateUserDto {
  static schema = createUserSchema;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'user', required: false })
  role?: string;
}
