import { config } from "./config";
import * as cheerio from 'cheerio';
import { database } from "./database";
import { Message } from "./database/entities/Message";

export async function checkRSCHSStatus() {
  const html = await fetch(config.telegramChannelURL as string)
  const $ = cheerio.load(await html.text());
  
  const messages: { message: string, date: Date, type: string | null }[] = []
  $('.tgme_widget_message_wrap').each((index, element) => {
    const message = $(element).html();
    if (!message) return;

    const $message = cheerio.load(message)
    const $messageBlock = $message('.tgme_widget_message_text').text().replace(/\n/g, ' ').trim()
    const $messageDate = $message('time').attr('datetime')

    const keywords = [...config.keywords.start, ...config.keywords.stop]
    const filteredMessage = keywords.some(keyword => $messageBlock.includes(keyword))
    if (!filteredMessage) return;
    
    let typeMessage: string | null = null
    if (config.keywords.start.some(keyword => $messageBlock.includes(keyword))) {
      typeMessage = 'start'
    } else if (config.keywords.stop.some(keyword => $messageBlock.includes(keyword))) {
      typeMessage = 'stop'
    }

    messages.push({
      message: $messageBlock,
      date: new Date($messageDate as string),
      type: typeMessage
    })
  });

  const messageEntity = database.getRepository(Message)

  const newMessages = (
    await Promise.all(
      messages.map(async msg => {
        const exists = await messageEntity.findOne({
          where: { messageDate: msg.date }
        });
        return exists ? null : msg;
      })
    )
  ).filter((msg): msg is { message: string; date: Date; type: string | null } => msg !== null);
  
  if (!newMessages.length) return false
  for (const msg of newMessages) {
    await messageEntity.save({
      content: msg.message,
      messageDate: msg.date,
      type: msg.type as string
    })
  }

  const lastMessage = messages[messages.length - 1]
  if (config.keywords.start.some(keyword => lastMessage.message.includes(keyword))) 
    return lastMessage
  else if (config.keywords.stop.some(keyword => lastMessage.message.includes(keyword)))
    return lastMessage

  return false
}