import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export class UpdateUserDto {
  static schema = updateUserSchema;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'password123', required: false })
  password?: string;

  @ApiProperty({ example: 'user', required: false })
  role?: string;
}
