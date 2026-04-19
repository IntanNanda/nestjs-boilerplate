import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema = (metadata.metatype as any)?.schema as ZodSchema | undefined;

    if (!schema) {
      return value;
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(this.formatError(result.error));
    }

    return result.data;
  }

  private formatError(error: ZodError): { message: string; errors: string[] } {
    const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return {
      message: errors[0],
      errors,
    };
  }
}
