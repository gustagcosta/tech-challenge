import dbConnect from '../database.js';
import crypto from 'crypto';

export const createOrderController = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userToken = authHeader.split(' ')[1];

      const userResponse = await fetch('http://localhost:8080/user', {
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

    const data = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Body não fornecido' });
    }

    const items = data.items;

    if (!items || items.length <= 0) {
      return res.status(400).json({ message: 'Itens não fornecidos' });
    }

    const validateProductResponse = await fetch('http://localhost:8081/products/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items.map((i) => i.id)),
    });

    if (!validateProductResponse.ok) {
      return res.status(400).json({ message: 'Itens invalidos' });
    }

    const db = await dbConnect();

    const orderId = crypto.randomUUID();

    await db.execute('INSERT INTO `order` (id, products, status, user_id) VALUES (?, ?, ?, ?)', [
      orderId,
      JSON.stringify(items),
      'RECEBIDO',
      userId,
    ]);

    await db.execute('INSERT INTO `order_history` (id, order_id, old_status, new_status, msg) VALUES (?, ?, ?, ?, ?)', [
      crypto.randomUUID(),
      orderId,
      null,
      'RECEBIDO',
      'Pedido recebido',
    ]);

    await db.end();

    return res.status(201).json({ orderId });
  } catch (error) {
    console.error({ error });
    return res.status(500).send('error interno');
  }
};
