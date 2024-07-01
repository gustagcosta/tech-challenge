import dbConnect from '../database.js';
import crypto from 'crypto';

export const callbackController = async (req, res) => {
  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Body não fornecido' });
    }

    const { order_id: orderId, status, msg } = data;

    if (!status || !msg || !orderId) {
      return res.status(400).json({ message: 'Payload inválido' });
    }

    const db = await dbConnect();

    const [orderRows] = await db.execute('SELECT * FROM `order` WHERE id = ?', [orderId]);
    const order = orderRows[0];

    await db.execute('INSERT INTO `order_history` (id, order_id, old_status, new_status, msg) VALUES (?, ?, ?, ?, ?)', [
      crypto.randomUUID(),
      orderId,
      order.status,
      status,
      msg,
    ]);

    await db.execute('UPDATE `order` SET status = ? WHERE id = ?', [status, orderId]);

    await db.end();

    return res.status(204).send();
  } catch (error) {
    console.error({ error });
    return res.status(500).send('error interno');
  }
};
