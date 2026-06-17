import type React from 'react';

export type SlotName =
  | 'Header.before'
  | 'Header.after'
  | 'ProductCard.badges'
  | 'ProductDetail.afterOptions'
  | 'Cart.summary'
  | 'Checkout.paymentMethods'
  | 'OrderDetail.afterStatus'
  | 'Footer.columns';

export type SlotComponent<Props = Record<string, unknown>> = React.ComponentType<Props>;

export type ServerHookMap = {
  beforeFleetbaseRequest: (request: Request) => Promise<Request> | Request;
  afterFleetbaseResponse: (response: Response) => Promise<Response> | Response;
  beforeCheckoutCapture: (payload: unknown) => Promise<unknown> | unknown;
  afterOrderPlaced: (order: unknown) => Promise<void> | void;
};

export type StorefrontPlugin = {
  id: string;
  name: string;
  slots?: Partial<Record<SlotName, SlotComponent[]>>;
  serverHooks?: Partial<ServerHookMap>;
  clientProviders?: React.ComponentType<{ children: React.ReactNode }>[];
};
