import { IncomingPayment } from './IncomingPayment';

export interface DomosedOptions {
  token: string;

  apiUrl?: string;
  onPayment?: (payment: IncomingPayment) => void;
}
