// Shared constants for the application
export const SHIPPING_THRESHOLD = 50; // Free shipping above this amount
export const SHIPPING_COST = 10;
export const TAX_RATE = 0.1; // 10% tax

// Order statuses
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Payment statuses
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
