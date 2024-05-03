import { Card, Order, GatewayResponse } from './process-payment.entities';
import { ProcessPaymentGateway } from './process-payment.gateway';

export class ProcessPaymentInteractor {
  constructor(private readonly gateway: ProcessPaymentGateway) {}

  public async execute(input: any) {
    const order: Order = input.order;
    const card: Card = input.card;

    if (!order || !card) {
      throw new Error('Input inválido');
    }

    const requiredCardFields = [
      'number',
      'brand',
      'cardholderName',
      'expirationMonth',
      'expirationYear',
      'securityCode',
    ];

    for (const field of requiredCardFields) {
      if (!card[field]) {
        throw new Error(`Campo '${field}' do cartão ausente`);
      }
    }

    const requiredOrderFields = ['id', 'value'];
    for (const field of requiredOrderFields) {
      if (!order[field]) {
        throw new Error(`Campo '${field}' do pedido ausente`);
      }
    }

    const gatewayResponse = await this.gateway.consumeGateway(order, card);

    if (gatewayResponse === GatewayResponse.approved) {
      await this.gateway.sendOrderHistory(order, 'Pagamento aprovado');
    } else {
      await this.gateway.sendOrderHistory(order, 'Pagamento reprovado');
      // enviar na outra fila
    }
  }
}
