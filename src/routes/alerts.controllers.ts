import { FastifyInstance } from 'fastify';
import { database } from '../database';
import { Message } from '../database/entities/Message';
import { latestMessage, TMessage } from '../rschs';

export async function getLatestMessage(): Promise<Message | TMessage | null> {
  const messageRepo = database.getRepository(Message);

  let lastMessage: Message | TMessage | null = latestMessage
  if (!lastMessage) {
    lastMessage = await messageRepo
      .createQueryBuilder('message')
      .orderBy('message.date', 'DESC')
      .getOne();
  }
  return lastMessage;
}

export async function alertRoutes(fastify: FastifyInstance) {
  const messageRepo = database.getRepository(Message);

  fastify.get('/alerts/latest', async (request, reply) => {
    const lastMessage = await getLatestMessage()
    
    if (!lastMessage) {
      return reply.code(404).send({ error: 'No alerts found' });
    }
    
    return {
      message: lastMessage.message,
      date: lastMessage.date,
      type: lastMessage.type
    };
  });

  fastify.get('/alerts', async (request, reply) => {
    const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
    
    const [messages, total] = await messageRepo.findAndCount({
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return {
      data: messages.map(msg => ({
        message: msg.message,
        date: msg.date,
        type: msg.type
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  });

  fastify.get('/alerts/status', async (request, reply) => {
    const latestMessage = await getLatestMessage()
    
    return {
      isActive: latestMessage?.type === 'start',
      lastUpdate: latestMessage?.date || null
    };
  });
}