export type Product = {
  id: string;
  name: string;
  category: 'Shirts' | 'Trousers';
  type: 'shirt' | 'trouser';
  fit_type: string | null;
  fit_slug: string | null;
  price: number;
  fabric: string | null;
  cut: string | null;
  fit: string | null;
  sizes: string[];
  description: string | null;
  care: string | null;
  badge: string | null;
  images: string[];
  active: boolean;
  created_at?: string;
};

export type InventoryRow = {
  id: number;
  product_id: string;
  size: string;
  stock: number;
};

export type CartItem = {
  id: string;
  size: string;
  qty: number;
};

export type SavedItem = {
  id: string;
  size: string;
};

export type Address = {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type OrderItem = {
  id?: number;
  order_id?: number;
  product_id: string;
  product_name: string;
  size: string;
  qty: number;
  price: number;
};

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: 'processing' | 'placed' | 'pending' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  tracking_number: string | null;
  delivery_date: string | null;
  created_at: string;
  order_notes?: string | null;
  shipping_method?: string | null;
  order_items?: OrderItem[];
};

export type HeroBanner = {
  id: string;
  desktop_image: string;
  mobile_image?: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  display_order: number;
  active: boolean;
};

export type FeaturedBanner = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  desktop_image: string;
  mobile_image?: string;
  link: string;
  active: boolean;
};

export type HomepageHeroLayout = 'split' | 'full' | 'center';

export type HomepageHero = {
  enabled: boolean;
  layout: HomepageHeroLayout;
  label: string;
  heading: string;
  description: string;
  button_text: string;
  button_link: string;
  desktop_image: string;
  mobile_image: string;
  image_position: 'top' | 'center' | 'bottom' | 'left' | 'right';
  image_scale: number;
  overlay_opacity: number;
  border_radius: number;
  bg_color: string;
  text_color: string;
};

export type HomepageSectionId =
  | 'hero'
  | 'shop_by_style'
  | 'featured_collection'
  | 'new_arrivals'
  | 'premium_fabrics'
  | 'why_dvero'
  | 'reviews'
  | 'instagram'
  | 'newsletter';

export type HomepageSection = {
  id: HomepageSectionId;
  label: string;
  enabled: boolean;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  bg_color: string;
  text_color: string;
  button_text: string;
  button_link: string;
  images?: string[];
};

export type PromoBannerTextPosition = 'left' | 'center' | 'right';
export type PromoBannerVerticalPosition = 'top' | 'center' | 'bottom';

export type PromoBanner = {
  enabled: boolean;
  desktop_image: string;
  mobile_image: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  text_position: PromoBannerTextPosition;
  vertical_position: PromoBannerVerticalPosition;
  text_color: string;
  overlay_color: string;
  overlay_opacity: number;
  gradient_enabled: boolean;
};

export type PromoBannerId = 'mens_collection' | 'shirts' | 'trousers' | 'new_arrivals';

export type PromoBanners = Record<PromoBannerId, PromoBanner>;

export type HomepageTheme = {
  bg_color: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_style: 'sharp' | 'rounded' | 'pill';
  border_radius: number;
  shadow: 'none' | 'soft' | 'strong';
  container_width: number;
};

export type SiteSettings = {
  free_shipping_threshold: number;
  flat_shipping_rate: number;
  announcement_text: string;
  return_window_days: number;
  category_images?: Record<string, string>;
  hero_banners?: HeroBanner[];
  featured_banners?: FeaturedBanner[];
  homepage_hero?: HomepageHero;
  homepage_sections?: HomepageSection[];
  homepage_theme?: HomepageTheme;
  promo_banners?: PromoBanners;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: 'admin' | 'staff' | 'customer';
  created_at?: string;
};

export type ProductReview = {
  id: number;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type WishlistItem = {
  id?: number;
  user_id?: string;
  product_id: string;
  created_at?: string;
};

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export type FilterState = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  sort: SortOption;
  search: string;
};

export type Coupon = {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_spend: number;
  active: boolean;
};

export type ReturnRequest = {
  id: number;
  order_id: number;
  customer_email: string;
  type: 'return' | 'exchange';
  reason: string;
  requested_size: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
};
