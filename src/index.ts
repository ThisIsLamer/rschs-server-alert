import 'reflect-metadata';
import { initializeDatabase } from './database';
import { config } from './config';
import { checkRSCHSStatus } from './rschs';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { alertRoutes, getLatestMessage } from './routes/alerts.controllers';

const clients = new Set<any>();

(async () => {
  await initializeDatabase();
  
  const fastify = Fastify({ logger: true });
  
  await fastify.register(websocket);
  
  // REST API маршруты
  await fastify.register(alertRoutes);
  
  // WebSocket маршрут
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, async (connection) => {
      clients.add(connection.socket);
      console.log(`Клиент подключен. Всего клиентов: ${clients.size}`);
      connection.socket.send(JSON.stringify(await getLatestMessage()))
      
      connection.socket.on('close', () => {
        clients.delete(connection.socket);
        console.log(`Клиент отключен. Всего клиентов: ${clients.size}`);
      });
    });
  });
  
  const broadcastToClients = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
    console.log(`Отправлено клиентам ${clients.size}:`, data);
  };
  
  setInterval(async () => {
    const status = await checkRSCHSStatus();
    if (!status) return;
    
    broadcastToClients(status);
  }, 10000);
  
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Сервер запущен на порту ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();