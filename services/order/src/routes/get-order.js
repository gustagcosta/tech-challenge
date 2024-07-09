import dbConnect from '../database.js';
import crypto from 'crypto';

export const getOrderController = async (req, res) => {
  const orderId = req.params.order_id;

  try {
    const db = await dbConnect();

    const orderQuery = 'SELECT * FROM `order` WHERE `id` = ?';
    const [orderRows] = await db.query(orderQuery, [orderId]);

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).send('Order not found');
    }

    const order = orderRows[0];

    const historyQuery = 'SELECT * FROM `order_history` WHERE `order_id` = ? ORDER BY `created_at`';
    const [historyRows] = await db.query(historyQuery, [orderId]);

    order.history = historyRows.map((h) => ({ msg: h.msg, created_at: h.created_at }));

    await db.end();

    return res.status(200).json(order);
  } catch (error) {
    console.error({ error });
    return res.status(500).send('error interno');
  }
};
