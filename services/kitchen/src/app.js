const amqp = require('amqplib');

const rabbitUrl = 'amqp://localhost';

async function consumeQueue() {
  try {
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    const queueName = 'kitchen';
    await channel.assertQueue(queueName, { durable: false });

    console.log('Aguardando mensagens...');

    channel.consume(queueName, async (msg) => {
      try {
        const messageContent = msg.content.toString();
        console.log('Mensagem recebida:', messageContent);

        const parsedMessage = JSON.parse(messageContent);
        console.log('Mensagem parseada:', parsedMessage);

        const payload = { order_id: parsedMessage.orderId, status: 'PEDIDO_PRONTO', msg: 'Pedido pronto' };

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await fetch('http://localhost:8082/order/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

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
