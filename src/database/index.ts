import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';

export const database = new DataSource({
  type: config.database.type as 'sqlite',
  database: config.database.database,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [__dirname + '/entities/*.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}']
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await database.initialize();
    console.log('База данных подключена успешно');
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
    throw error;
  }
};