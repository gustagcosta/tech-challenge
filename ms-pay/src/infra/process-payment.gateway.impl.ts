import { Card, GatewayResponse, Order } from '../domain/process-payment.entities';
import { ProcessPaymentGateway } from '../domain/process-payment.gateway';

export class ProcessPaymentGatewayImpl implements ProcessPaymentGateway {
  public async consumeGateway(order: Order, card: Card): Promise<GatewayResponse> {
    // random simulation proposal

    const randomNumber = Math.floor(Math.random() * 10) + 1;

    const luckNumber = randomNumber + order.id + Number(card.number);

    if (luckNumber % 2 === 0) {
      return GatewayResponse.approved;
    } else {
      return GatewayResponse.disapproved;
    }
  }

  public async sendOrderHistory(order: Order, message: string) {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: order.id,
        body: message,
        userId: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar histórico');
    }

    console.log(`Histórico enviado, mensagem: ${message}`);
  }
}
