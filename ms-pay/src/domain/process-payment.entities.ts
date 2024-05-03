export type Order = {
  id: number;
  value: number;
};

export type Card = {
  number: string;
  brand: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
};

export enum GatewayResponse {
  approved = 'APPROVED',
  disapproved = 'DISAPPROVED',
}
