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
    const queueName = 'kitchen';
    await channel.assertQueue(queueName, { durable: false });

    console.log('Aguardando mensagens...');

    channel.consume(queueName, async (msg) => {
      try {
        const messageContent = msg.content.toString();
        console.log('Mensagem recebida:', messageContent);

        const parsedMessage = JSON.parse(messageContent);

        const payload = { order_id: parsedMessage.orderId, status: 'PRONTO', msg: 'Pedido pronto' };

        await new Promise((resolve) => setTimeout(resolve, 5000));

        await sendToNotifyQueue(payload);

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

async function sendToNotifyQueue(payload) {
  const connection = await amqp.connect(rabbitOptions);
  const channel = await connection.createChannel();
  const queueName = 'notify';

  await channel.assertQueue(queueName, { durable: false });

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));

  console.log(`Mensagem enviada para a fila notify: ${JSON.stringify(payload)}`);

  await channel.close();
  await connection.close();
}

consumeQueue();
