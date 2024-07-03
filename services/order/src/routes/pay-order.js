import dbConnect from '../database.js';
import crypto from 'crypto';
import amqp from 'amqplib';

export const payOrderControler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userToken = authHeader.split(' ')[1];

      const userResponse = await fetch(`http://${process.env.AUTH_URL}/user`, {
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

    await db.execute('INSERT INTO `order_history` (id, order_id, old_status, new_status, msg) VALUES (?, ?, ?, ?, ?)', [
      crypto.randomUUID(),
      order.id,
      'RECEBIDO',
      'PAGAMENTO_SOLICITADO',
      'Pagamento solicitado',
    ]);

    await db.execute('UPDATE `order` SET status = ? WHERE id = ?', ['PAGAMENTO_SOLICITADO', order.id]);

    await db.end();

    const rabbitUrl = `amqp://${process.env.RABITMQ_URL}`;
    const connection = await amqp.connect(rabbitUrl);
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
