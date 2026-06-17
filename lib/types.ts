export type StorefrontAbout = {
  id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  currency?: string;
  country?: string;
  options?: Record<string, unknown>;
  logo_url?: string;
  backdrop_url?: string;
  rating?: number;
  online?: boolean;
  is_network?: boolean;
  is_store?: boolean;
  slug?: string;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  products?: StorefrontProduct[];
};

export type StorefrontProduct = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  primary_image_url?: string;
  price: number;
  sale_price?: number | null;
  currency?: string;
  is_on_sale?: boolean;
  is_recommended?: boolean;
  is_service?: boolean;
  is_bookable?: boolean;
  is_available?: boolean;
  tags?: string[];
  status?: string;
  meta?: Record<string, unknown>;
  slug?: string;
  addon_categories?: ProductAddonCategory[];
  variants?: ProductVariant[];
  images?: string[];
  videos?: string[];
  youtube_urls?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
  options?: ProductVariantOption[];
};

export type ProductVariantOption = {
  id: string;
  name: string;
  price?: number;
  description?: string;
};

export type ProductAddonCategory = {
  id: string;
  name: string;
  required?: boolean;
  multi_select?: boolean;
  addons?: ProductAddon[];
};

export type ProductAddon = {
  id: string;
  name: string;
  price?: number;
  description?: string;
};

export type CartItem = {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  product_image_url?: string;
  quantity: number;
  price?: number;
  subtotal: number;
  variants?: unknown[];
  addons?: unknown[];
  store_location_id?: string;
};

export type Cart = {
  id: string;
  currency?: string;
  subtotal?: number;
  total_items?: number;
  total_unique_items?: number;
  items: CartItem[];
  expires_at?: string;
};

export type Customer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  token?: string;
};

export type PaymentGateway = {
  id: string;
  code?: string;
  name?: string;
  public_key?: string;
};

export type ServiceQuote = {
  id: string;
  amount: number;
  currency?: string;
  distance?: number;
  time?: number;
};

export type Order = {
  id: string;
  status?: string;
  tracking_number?: string;
  public_id?: string;
  created_at?: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
};

export type NetworkStore = StorefrontAbout;
