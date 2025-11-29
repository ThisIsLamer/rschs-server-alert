import 'reflect-metadata';
import { initializeDatabase } from './database';
import { config } from './config';
import WebSocket, { WebSocketServer } from 'ws';
import { checkRSCHSStatus } from './rschs';

interface ClientConnection {
  ws: WebSocket;
  isAlive: boolean;
}

const clients = new Set<ClientConnection>();

(async () => {
  await initializeDatabase();
  
  const wss = new WebSocketServer({ port: config.port });
  console.log(`Веб сокет сервер запущен на порту ${config.port}`);
  
  wss.on('connection', (ws) => {
    const client: ClientConnection = { ws, isAlive: true };
    clients.add(client);
    console.log(`Клиент подключен. Всего клиентов:`, clients.size);
    
    ws.on('pong', () => {
      client.isAlive = true;
    });
    
    ws.on('close', () => {
      clients.delete(client);
      console.log('Клиент отключен. Всего клиентов:', clients.size);
    });
    
    ws.on('error', (error) => {
      console.error('Ошибка веб сокет сервера:', error);
      clients.delete(client);
    });
  });
  
  setInterval(() => {
    clients.forEach((client) => {
      if (!client.isAlive) {
        console.log('Отключение клиента');
        client.ws.terminate();
        clients.delete(client);
        return;
      }
      
      client.isAlive = false;
      client.ws.ping();
    });
  }, 30000);
  
  const broadcastToClients = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
    console.log(`Отправлено клиентам ${clients.size}:`, data);
  };
  
  setInterval(async () => {
    const status = await checkRSCHSStatus()
    if (!status) return

    broadcastToClients(status);
  }, 10000);
})();
