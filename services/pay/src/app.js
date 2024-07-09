const amqp = require('amqplib');

const rabbitOptions = {
  protocol: 'amqp',
  hostname: process.env.RABBITMQ_HOSTNAME,
  port: parseInt(process.env.RABBITMQ_PORT),
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
};

async function consumeQueue() {
  try {
    const connection = await amqp.connect(rabbitOptions);

    const channel = await connection.createChannel();
    const queueName = 'pay';
    await channel.assertQueue(queueName, { durable: false });

    console.log('Aguardando mensagens...');

    channel.consume(queueName, async (msg) => {
      try {
        const messageContent = msg.content.toString();
        console.log('Mensagem recebida:', messageContent);

        const parsedMessage = JSON.parse(messageContent);

        const payload = { order_id: parsedMessage.orderId, status: null, msg: null };

        if (Math.random() < 0.5) {
          payload.msg = 'Pagamento aprovado';
          payload.status = 'PAGAMENTO_APROVADO';

          await sendToKitchenQueue(parsedMessage.orderId);
        } else {
          payload.msg = 'Pagamento reprovado';
          payload.status = 'PAGAMENTO_REPROVADO';
        }

        await fetch(`http://${process.env.ORDER_URL}/order/callback`, {
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

async function sendToKitchenQueue(orderId) {
  const connection = await amqp.connect(rabbitOptions);
  const channel = await connection.createChannel();
  const queueName = 'kitchen';

  await channel.assertQueue(queueName, { durable: false });

  const msg = { orderId };
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));

  console.log(`Mensagem enviada: ${JSON.stringify(msg)}`);

  await channel.close();
  await connection.close();
}
