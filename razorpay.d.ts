declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export interface RazorpayOrderOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, any>;
  }

  export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: RazorpayOrderOptions): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
  }
}
