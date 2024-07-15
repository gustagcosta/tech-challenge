import dbConnect from '../database.js';
import crypto from 'crypto';

export const callbackController = async (req, res) => {
  const connection = await dbConnect();

  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Body não fornecido' });
    }

    const { order_id: orderId, status, msg } = data;

    if (!status || !msg || !orderId) {
      return res.status(400).json({ message: 'Payload inválido' });
    }

    await connection.beginTransaction();

    const [orderRows] = await connection.execute('SELECT * FROM `order` WHERE id = ?', [orderId]);
    const order = orderRows[0];

    if (!order) {
      await connection.rollback();
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    await connection.execute(
      'INSERT INTO `order_history` (id, order_id, old_status, new_status, msg) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), orderId, order.status, status, msg]
    );

    await connection.execute('UPDATE `order` SET status = ? WHERE id = ?', [status, orderId]);

    await connection.commit();
    await connection.end();

    return res.status(204).send();
  } catch (error) {
    console.error({ error });
    if (connection) await connection.rollback();
    return res.status(500).send('Erro interno');
  } finally {
    if (connection) await connection.end();
  }
};
