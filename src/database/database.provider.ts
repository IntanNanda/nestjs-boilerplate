import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { PG_CONNECTION } from './database.constants';

export const databaseProvider: Provider = {
  provide: PG_CONNECTION,
  useFactory: (configService: ConfigService) => {
    const pool = new Pool({
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      user: configService.get<string>('DB_USER'),
      password: configService.get<string>('DB_PASS'),
      database: configService.get<string>('DB_NAME'),
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    return pool;
  },
  inject: [ConfigService],
};
