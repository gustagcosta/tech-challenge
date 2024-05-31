const amqp = require('amqplib');

const rabbitUrl = 'amqp://localhost';

async function consumeQueue() {
  try {
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    const queueName = 'pay';
    await channel.assertQueue(queueName, { durable: false });

    console.log('Aguardando mensagens...');

    channel.consume(queueName, async (msg) => {
      try {
        const messageContent = msg.content.toString();
        console.log('Mensagem recebida:', messageContent);

        const parsedMessage = JSON.parse(messageContent);
        console.log('Mensagem parseada:', parsedMessage);

        await new Promise(resolve => setTimeout(resolve, 2000));

        channel.ack(msg);
        console.log('Mensagem processada com sucesso.');

      } catch (error) {
        console.error('Erro:', error);
        channel.reject(msg, false);
      }
    });

  } catch (error) {
    console.error('Erro ao consumir a fila:', error);
  }
}

consumeQueue();
