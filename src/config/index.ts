import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  telegramChannelURL: process.env.TELEGRAM_CHANNEL_URL || '',
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    database: process.env.DB_DATABASE || 'database.sqlite',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || true,
    logging: process.env.DB_LOGGING === 'true' || false
  },
  keywords: {
    start: (process.env.LIST_START_KEYWORDS || '').split(','),
    stop: (process.env.LIST_STOP_KEYWORDS || '').split(',')
  }
};