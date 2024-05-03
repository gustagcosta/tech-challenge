import { Card, GatewayResponse, Order } from './process-payment.entities';

export interface ProcessPaymentGateway {
  consumeGateway(order: Order, card: Card): Promise<GatewayResponse>;
  sendOrderHistory(order: Order, message: string): Promise<void>;
}
