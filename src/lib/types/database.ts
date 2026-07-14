// ============================================================================
// EDEN — Database Types
// ============================================================================
// Types TypeScript miroir du schéma SQL.
// Conventions : snake_case (matching DB), tous les montants en INTEGER cents.
// ============================================================================

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export interface Hotel {
  id: string;
  name: string;
  brand: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  region: string | null;
  country: string;
  star_rating: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency_code: string;
  default_language: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HotelSettings {
  id: string;
  hotel_id: string;
  cancellation_policy: Record<string, unknown> | null;
  no_show_policy: Record<string, unknown> | null;
  expiration_delay: string;
  check_in_time: string;
  check_out_time: string;
  default_vat_rate: number | null;
  cleaning_fee_cents: number | null;
  deposit_required: boolean;
  deposit_amount_cents: number | null;
  languages_available: string[] | null;
  custom_settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  hotel_id: string;
  name: string;
  code: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Floor {
  id: string;
  hotel_id: string;
  building_id: string | null;
  name: string;
  level: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Media {
  id: string;
  hotel_id: string;
  entity_type: 'hotel' | 'room' | 'room_type';
  entity_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  base_capacity: number;
  base_price_cents: number;
  surface_m2: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_service';

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  building_id: string | null;
  floor_id: string | null;
  name: string;
  actual_capacity: number;
  actual_surface_m2: number | null;
  price_adjustment_cents: number;
  status: RoomStatus;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Amenity {
  id: string;
  hotel_id: string;
  name: string;
  translations: Record<string, string> | null;
  icon: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RoomAmenity {
  id: string;
  room_id: string;
  amenity_id: string;
  quantity: number;
  notes: string | null;
}

export interface RoomTypeAmenity {
  id: string;
  room_type_id: string;
  amenity_id: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

export type GuestType = 'individual' | 'company' | 'agency' | 'partner';

export interface Guest {
  id: string;
  hotel_id: string;
  type: GuestType;
  first_name: string | null;
  last_name: string;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  document_expiry: string | null;
  birth_date: string | null;
  nationality: string | null;
  address: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  first_stay_date: string | null;
  stay_count: number;
  segment: string | null;
  loyalty_program: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Employees & Roles
// ---------------------------------------------------------------------------

export type EmployeeStatus = 'active' | 'on_leave' | 'absent' | 'inactive' | 'suspended';

export interface Employee {
  id: string;
  hotel_id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  status: EmployeeStatus;
  hire_date: string | null;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Role {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  group_name: string | null;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface EmployeeRole {
  id: string;
  employee_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show' | 'expired';
export type BookingRoomStatus = 'reserved' | 'occupied' | 'vacated' | 'cancelled';
export type BookingGuestRole = 'primary_guest' | 'adult' | 'child' | 'infant' | 'billing_contact';
export type BookingServiceStatus = 'pending' | 'delivered' | 'cancelled';

export interface Booking {
  id: string;
  hotel_id: string;
  rate_plan_id: string;
  booking_reference: string;
  created_at: string;
  check_in_date: string;
  check_out_date: string;
  night_count: number;
  status: BookingStatus;
  total_amount_cents: number;
  paid_amount_cents: number;
  balance_cents: number;
  currency_code: string;
  source: string | null;
  special_requests: string | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookingRoom {
  id: string;
  booking_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  night_count: number;
  adult_count: number;
  child_count: number;
  applied_price_cents: number;
  status: BookingRoomStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingGuest {
  id: string;
  booking_id: string;
  guest_id: string;
  role: BookingGuestRole;
  is_payer: boolean;
  is_main_contact: boolean;
  check_in_date: string | null;
  check_out_date: string | null;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  booking_guest_id: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  service_date: string | null;
  status: BookingServiceStatus;
  created_at: string;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_type: 'employee' | 'guest' | 'system' | null;
  reason: string | null;
  created_at: string;
}

export interface RoomStatusHistory {
  id: string;
  room_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'mobile_money' | 'check' | 'crypto';
export type PaymentType = 'deposit' | 'balance' | 'deposit_guarantee' | 'refund' | 'supplement' | 'credit_note';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  booking_id: string;
  hotel_id: string;
  employee_id: string | null;
  guest_id: string | null;
  amount_cents: number;
  currency_code: string;
  method: PaymentMethod;
  type: PaymentType;
  status: PaymentStatus;
  external_reference: string | null;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'credit_note';

export interface Invoice {
  id: string;
  booking_id: string;
  hotel_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount_cents: number;
  tax_amount_cents: number;
  discount_amount_cents: number;
  net_amount_cents: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  tax_rate: number;
  tax_id: string | null;
  discount_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface InvoiceSequence {
  id: string;
  hotel_id: string;
  year: number;
  prefix: string;
  current_number: number;
}

export interface Tax {
  id: string;
  hotel_id: string;
  name: string;
  rate: number;
  is_active: boolean;
  created_at: string;
}

export type DiscountType = 'percentage' | 'fixed_amount';

export interface Discount {
  id: string;
  hotel_id: string;
  name: string;
  type: DiscountType;
  value: number;
  code: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string | null;
  is_active: boolean;
}

export interface RatePlan {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  cancellation_policy: Record<string, unknown> | null;
  deposit_required_cents: number | null;
  deposit_percentage: number | null;
  is_refundable: boolean;
  is_active: boolean;
  conditions: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RatePlanRoomType {
  id: string;
  rate_plan_id: string;
  room_type_id: string;
  applied_price_cents: number | null;
}

export type SeasonPricingMode = 'percentage' | 'fixed_amount' | 'fixed_price' | 'per_night' | 'weekend_price' | 'event_price';

export interface Season {
  id: string;
  hotel_id: string;
  name: string;
  start_date: string;
  end_date: string;
  pricing_mode: SeasonPricingMode;
  value: number;
  apply_days: number[] | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServicePricingType = 'per_person' | 'per_room' | 'per_night' | 'flat';

export interface Service {
  id: string;
  hotel_id: string;
  name: string;
  translations: Record<string, string> | null;
  description: string | null;
  unit_price_cents: number;
  pricing_type: ServicePricingType;
  icon: string | null;
  category: string | null;
  tax_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: string;
  hotel_id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Restaurant
// ---------------------------------------------------------------------------

export interface RestaurantTable {
  id: string;
  hotel_id: string;
  name: string;
  capacity: number;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RestaurantMenuItem {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RestaurantOrder {
  id: string;
  hotel_id: string;
  table_id: string | null;
  order_reference: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  type: 'dine_in' | 'room_service' | 'takeaway';
  room_number: string | null;
  special_requests: string | null;
  total_amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  notes: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  created_at: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationCategory = 'confirmation' | 'reminder' | 'alert' | 'promotion' | 'invoice' | 'internal' | 'urgent';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  hotel_id: string;
  booking_id: string | null;
  payment_id: string | null;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  template: string | null;
  sender_type: string | null;
  sender_id: string | null;
  sent_at: string | null;
  created_at: string;
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';
export type NotificationRecipientStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'archived' | 'failed';

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  recipient_type: 'guest' | 'employee';
  recipient_id: string;
  channel: NotificationChannel;
  status: NotificationRecipientStatus;
  read_at: string | null;
  attempt_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  hotel_id: string;
  guest_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  stay_date_start: string | null;
  stay_date_end: string | null;
  platform: string | null;
  hotel_reply: string | null;
  internal_note: string | null;
  is_visible: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  hotel_id: string;
  employee_id: string | null;
  guest_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Utility types for insert/update
// ---------------------------------------------------------------------------

export type Insert<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type Update<T> = Partial<Insert<T>>;
