export interface Order {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
  };
  account: {
    _id: string;
    title: string;
    game: string;
    price: number;
    type?: string;
    images?: string[];
  };
  amount: number;
  originalPrice?: number;
  paymentMethod: "balance" | "bank" | "card" | "payos";
  status: "pending" | "processing" | "completed" | "cancelled";
  transactionId: string;
  notes?: string;
  discount?: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    amount: number;
  };
  completedAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface OrderStats {
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalAmount: number;
    totalOrders: number;
  };
  today: {
    count: number;
    revenue: number;
  };
}
