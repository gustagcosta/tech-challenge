import dbConnect from '../database.js';
import crypto from 'crypto';
import amqp from 'amqplib';

const rabbitOptions = {
  protocol: 'amqp',
  hostname: process.env.RABBITMQ_HOSTNAME,
  port: parseInt(process.env.RABBITMQ_PORT),
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
};

export const payOrderControler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userToken = authHeader.split(' ')[1];

      const userResponse = await fetch(`http://${process.env.AUTH_URL}/api/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (userResponse.status === 200) {
        const userData = await userResponse.json();
        userId = userData.id;
      } else {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
    }

    const db = await dbConnect();

    const [orderRows] = await db.execute('SELECT * FROM `order` WHERE id = ?', [req.params.order_id]);
    const order = orderRows[0];

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (userId && order.user_id !== userId) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    if (order.status != 'RECEBIDO') {
      return res.status(400).json({ message: 'Status inválido de pedido' });
    }

    await db.end();

    const connection = await amqp.connect(rabbitOptions);
    const channel = await connection.createChannel();
    const queueName = 'pay';

    await channel.assertQueue(queueName, { durable: false });

    const msg = { orderId: order.id };
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));

    console.log(`Mensagem enviada: ${JSON.stringify(msg)}`);

    await channel.close();
    await connection.close();

    return res.status(200).send();
  } catch (error) {
    console.error({ error });
    return res.status(500).send('error interno');
  }
};
