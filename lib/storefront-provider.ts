// Shared types used by both the chains-api adapter and the Fleetbase adapter.
// Components import from here rather than from a specific backend.

export type PaymentMode = 'platform_stk' | 'business_till' | 'bitcoin' | 'cash' | 'card';

export type ChainsStoreInfo = {
  organizationId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  currency: string;
  taxRate: number;
  isOpen: boolean;
  paymentModes: PaymentMode[];
  mpesa: {
    enabled: boolean;
    shortCode: string | null;
    transactionType: string;
    accountReference: string | null;
  } | null;
  bitcoin: { enabled: boolean; address: string | null } | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
};

export type ChainsMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  onSale?: boolean;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
  isActive: boolean;
  stock: number | null;
};
