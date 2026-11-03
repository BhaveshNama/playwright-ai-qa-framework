import type { CheckoutSummary } from '../models/checkout.model';
import type { Order } from '../models/order.model';

export class OrderService {
  private readonly ordersBySession = new Map<string, Order[]>();

  createOrder(sessionId: string, checkoutSummary: CheckoutSummary): Order {
    const existingOrders = this.ordersBySession.get(sessionId) ?? [];

    const order: Order = {
      id: this.createOrderId(sessionId, existingOrders.length + 1),
      items: checkoutSummary.items.map((item) => ({
        product: {
          ...item.product,
        },
        quantity: item.quantity,
      })),
      totalInCents: checkoutSummary.totalInCents,
      shippingAddress: {
        ...checkoutSummary.shippingAddress,
      },
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    this.ordersBySession.set(sessionId, [...existingOrders, order]);

    return this.cloneOrder(order);
  }

  getOrders(sessionId: string): Order[] {
    return (this.ordersBySession.get(sessionId) ?? []).map((order) => this.cloneOrder(order));
  }

  getOrder(sessionId: string, orderId: string): Order | undefined {
    const order = this.ordersBySession
      .get(sessionId)
      ?.find((candidate) => candidate.id === orderId);

    return order ? this.cloneOrder(order) : undefined;
  }

  updateStatus(sessionId: string, orderId: string, nextStatus: Order['status']): Order | undefined {
    const orders = this.ordersBySession.get(sessionId);

    if (!orders) {
      return undefined;
    }

    const order = orders.find((candidate) => candidate.id === orderId);

    if (!order) {
      return undefined;
    }

    if (!this.isValidStatusTransition(order.status, nextStatus)) {
      throw new Error(`Invalid order status transition: ${order.status} -> ${nextStatus}`);
    }

    order.status = nextStatus;

    return this.cloneOrder(order);
  }

  clear(sessionId: string): void {
    this.ordersBySession.delete(sessionId);
  }

  private createOrderId(sessionId: string, sequence: number): string {
    const normalizedSessionId = sessionId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-12)
      .toUpperCase();

    return `ORD-${normalizedSessionId}-${String(sequence).padStart(4, '0')}`;
  }

  private isValidStatusTransition(
    currentStatus: Order['status'],
    nextStatus: Order['status'],
  ): boolean {
    const allowedTransitions: Record<Order['status'], Order['status'][]> = {
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    return allowedTransitions[currentStatus].includes(nextStatus);
  }

  private cloneOrder(order: Order): Order {
    return {
      ...order,
      items: order.items.map((item) => ({
        product: {
          ...item.product,
        },
        quantity: item.quantity,
      })),
      shippingAddress: {
        ...order.shippingAddress,
      },
    };
  }
}

export const orderService = new OrderService();
