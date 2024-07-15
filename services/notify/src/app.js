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
    const queueName = 'notify';
    await channel.assertQueue(queueName, { durable: false });

    console.log('Aguardando mensagens...');

    channel.consume(queueName, async (msg) => {
      try {
        const messageContent = msg.content.toString();
        console.log('Mensagem recebida:', messageContent);

        const parsedMessage = JSON.parse(messageContent);

        const payload = { order_id: parsedMessage.order_id, status: null, msg: null };

        switch (parsedMessage.status) {
          case 'EM_PREPARACAO':
            payload.msg = 'Pedido em preparação';
            payload.status = 'EM_PREPARACAO';
            break;
          case 'REPROVADO':
            payload.msg = 'Pagamento reprovado';
            payload.status = 'REPROVADO';
            break;
          case 'PRONTO':
            payload.msg = 'Pedido pronto';
            payload.status = 'PRONTO';
            break;
          default:
            throw new Error('Tipo de mensagem inválido');
        }

        await fetch(`http://${process.env.ORDER_URL}/order/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('Enviando e-mail...');

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
