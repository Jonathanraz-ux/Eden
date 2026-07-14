import type {
  Hotel,
  Booking,
  Room,
  RoomType,
  Guest,
  Employee,
  Payment,
  Review,
  RatePlan,
  Season,
  Invoice,
  InvoiceItem,
  Tax,
  Discount,
  Service,
  RestaurantOrder,
  RestaurantMenuItem,
  RestaurantTable,
  GalleryImage,
  Notification,
  RoomStatus,
  BookingStatus,
} from '../lib/types/database';
import type { RevenueByPeriod, PaymentMethodBreakdown, OccupancyByRoomType, BookingStatusDistribution } from '../lib/services/analyticsService';
import type { OperationsSummary, OperationTask } from '../lib/services/operationsService';
import type { ServiceWithStats } from '../lib/services/servicesService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEMO_HOTEL_ID = 'demo-hotel-001';
export const DEMO_WHATSAPP_PHONE = '+2250700000000';
export const DEMO_WHATSAPP_MESSAGE = encodeURIComponent(
  'Bonjour, je viens de tester votre dashboard de démonstration et je souhaite en savoir plus pour mon entreprise.'
);

// ---------------------------------------------------------------------------
// Hotel
// ---------------------------------------------------------------------------

export const demoHotel: Hotel = {
  id: DEMO_HOTEL_ID,
  name: "L'Éden Resort & Spa",
  brand: "L'Éden",
  address_line_1: '27 Avenue des Baobabs',
  address_line_2: null,
  city: 'Abidjan',
  postal_code: '01 BP 1234',
  region: 'Plateau',
  country: 'Côte d\'Ivoire',
  star_rating: 5,
  phone: '+225 27 20 20 30 40',
  email: 'contact@eden-hotel.ci',
  website: 'https://eden-hotel.ci',
  currency_code: 'XOF',
  default_language: 'fr',
  timezone: 'Africa/Abidjan',
  is_active: true,
  created_at: '2023-01-15T08:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
  deleted_at: null,
};

// ---------------------------------------------------------------------------
// Room Types
// ---------------------------------------------------------------------------

export const demoRoomTypes: RoomType[] = [
  {
    id: 'rt-001', hotel_id: DEMO_HOTEL_ID, name: 'Chambre Classique',
    description: 'Chambre confortable avec vue jardin', base_capacity: 2,
    base_price_cents: 7500000, surface_m2: 28, is_active: true, sort_order: 1,
    created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null,
  },
  {
    id: 'rt-002', hotel_id: DEMO_HOTEL_ID, name: 'Chambre Supérieure',
    description: 'Chambre spacieuse avec balcon', base_capacity: 2,
    base_price_cents: 11000000, surface_m2: 35, is_active: true, sort_order: 2,
    created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null,
  },
  {
    id: 'rt-003', hotel_id: DEMO_HOTEL_ID, name: 'Suite Junior',
    description: 'Suite avec salon séparé', base_capacity: 3,
    base_price_cents: 18000000, surface_m2: 52, is_active: true, sort_order: 3,
    created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null,
  },
  {
    id: 'rt-004', hotel_id: DEMO_HOTEL_ID, name: 'Suite Présidentielle',
    description: 'La suite la plus prestigieuse', base_capacity: 4,
    base_price_cents: 45000000, surface_m2: 95, is_active: true, sort_order: 4,
    created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null,
  },
];

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

function makeRooms(): Room[] {
  const statuses: RoomStatus[] = [
    'available', 'available', 'available', 'available', 'available',
    'occupied', 'occupied', 'occupied', 'occupied', 'occupied',
    'occupied', 'occupied', 'occupied', 'reserved', 'reserved',
    'reserved', 'cleaning', 'cleaning', 'maintenance', 'available',
    'available', 'occupied', 'available', 'available',
  ];

  const names = [
    '101', '102', '103', '104', '105',
    '201', '202', '203', '204', '205',
    '206', '301', '302', '303', '304',
    '401', '402', '403', '501', '502',
    'Villa 1', 'Villa 2', 'Bungalow 1', 'Bungalow 2',
  ];

  return names.map((name, i) => ({
    id: `room-${String(i + 1).padStart(3, '0')}`,
    hotel_id: DEMO_HOTEL_ID,
    room_type_id: demoRoomTypes[Math.min(Math.floor(i / 6), 3)].id,
    building_id: i < 15 ? 'bld-001' : i < 19 ? 'bld-002' : 'bld-003',
    floor_id: `fl-${Math.floor(i / 5) + 1}`,
    name,
    actual_capacity: i >= 19 ? 4 : 2,
    actual_surface_m2: i >= 19 ? 80 : 28 + (Math.floor(i / 6) * 7),
    price_adjustment_cents: 0,
    status: statuses[i],
    is_active: true,
    notes: null,
    created_at: '2023-01-15T08:00:00Z',
    updated_at: '2026-07-01T10:00:00Z',
    deleted_at: null,
  }));
}

export const demoRooms: Room[] = makeRooms();

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

export const demoGuests: Guest[] = [
  { id: 'g-001', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Amadou', last_name: 'Diallo', email: 'amadou.diallo@gmail.com', phone: '+225 07 08 12 34 56', document_type: 'passport', document_number: 'CI123456', document_expiry: '2028-12-31', birth_date: '1985-03-15', nationality: 'Côte d\'Ivoire', address: { city: 'Abidjan' }, preferences: { pillow: 'dow' }, first_stay_date: '2024-06-01', stay_count: 5, segment: 'business', loyalty_program: { tier: 'gold', points: 12500 }, is_active: true, created_at: '2024-06-01T10:00:00Z', updated_at: '2026-05-15T08:00:00Z', deleted_at: null },
  { id: 'g-002', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Sophie', last_name: 'Martin', email: 'sophie.martin@outlook.fr', phone: '+33 6 12 34 56 78', document_type: 'passport', document_number: 'FR789012', document_expiry: '2027-06-30', birth_date: '1990-08-22', nationality: 'France', address: { city: 'Paris' }, preferences: { room_view: 'pool' }, first_stay_date: '2025-01-10', stay_count: 3, segment: 'leisure', loyalty_program: { tier: 'silver', points: 5200 }, is_active: true, created_at: '2025-01-10T10:00:00Z', updated_at: '2026-03-20T08:00:00Z', deleted_at: null },
  { id: 'g-003', hotel_id: DEMO_HOTEL_ID, type: 'company', first_name: null, last_name: 'Société Ivoirienne de Commerce', email: 'reservations@sivocommerce.ci', phone: '+225 27 20 10 20 30', document_type: null, document_number: null, document_expiry: null, birth_date: null, nationality: 'Côte d\'Ivoire', address: { city: 'Abidjan', quarter: 'Plateau' }, preferences: null, first_stay_date: '2023-09-01', stay_count: 18, segment: 'corporate', loyalty_program: null, is_active: true, created_at: '2023-09-01T10:00:00Z', updated_at: '2026-06-10T08:00:00Z', deleted_at: null },
  { id: 'g-004', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Jean-Pierre', last_name: 'Koné', email: 'jp.kone@yahoo.fr', phone: '+225 05 06 78 90 12', document_type: 'cni', document_number: 'CI345678', document_expiry: '2029-03-15', birth_date: '1978-11-03', nationality: 'Côte d\'Ivoire', address: { city: 'Bouaké' }, preferences: { bed: 'king' }, first_stay_date: '2024-12-20', stay_count: 4, segment: 'business', loyalty_program: { tier: 'gold', points: 8900 }, is_active: true, created_at: '2024-12-20T10:00:00Z', updated_at: '2026-04-18T08:00:00Z', deleted_at: null },
  { id: 'g-005', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Fatou', last_name: 'Camara', email: 'fatou.camara@gmail.com', phone: '+224 622 33 44 55', document_type: 'passport', document_number: 'GN456789', document_expiry: '2027-09-30', birth_date: '1995-06-18', nationality: 'Guinée', address: { city: 'Conakry' }, preferences: null, first_stay_date: '2026-02-14', stay_count: 1, segment: 'leisure', loyalty_program: null, is_active: true, created_at: '2026-02-14T10:00:00Z', updated_at: '2026-02-14T10:00:00Z', deleted_at: null },
  { id: 'g-006', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Marc', last_name: 'Dupont', email: 'marc.dupont@orange.fr', phone: '+33 7 89 01 23 45', document_type: 'passport', document_number: 'FR234567', document_expiry: '2028-01-20', birth_date: '1982-04-07', nationality: 'France', address: { city: 'Lyon' }, preferences: { pillow: 'soft' }, first_stay_date: '2025-07-05', stay_count: 2, segment: 'leisure', loyalty_program: { tier: 'silver', points: 3100 }, is_active: true, created_at: '2025-07-05T10:00:00Z', updated_at: '2026-01-12T08:00:00Z', deleted_at: null },
  { id: 'g-007', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Aïssata', last_name: 'Bah', email: 'aissata.bah@hotmal.com', phone: '+224 666 77 88 99', document_type: 'passport', document_number: 'GN567890', document_expiry: '2029-05-10', birth_date: '1988-12-25', nationality: 'Guinée', address: { city: 'Kankan' }, preferences: null, first_stay_date: '2026-03-01', stay_count: 2, segment: 'leisure', loyalty_program: { tier: 'bronze', points: 1200 }, is_active: true, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-06-28T08:00:00Z', deleted_at: null },
  { id: 'g-008', hotel_id: DEMO_HOTEL_ID, type: 'company', first_name: null, last_name: 'West Africa Trading Ltd', email: 'booking@watrading.com', phone: '+233 30 277 8899', document_type: null, document_number: null, document_expiry: null, birth_date: null, nationality: 'Ghana', address: { city: 'Accra' }, preferences: null, first_stay_date: '2025-11-15', stay_count: 6, segment: 'corporate', loyalty_program: null, is_active: true, created_at: '2025-11-15T10:00:00Z', updated_at: '2026-05-22T08:00:00Z', deleted_at: null },
  { id: 'g-009', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Ibrahim', last_name: 'Touré', email: 'ibrahim.toure@oci.com', phone: '+225 01 02 03 04 05', document_type: 'cni', document_number: 'CI789012', document_expiry: '2030-01-01', birth_date: '1975-09-12', nationality: 'Côte d\'Ivoire', address: { city: 'Yamoussoukro' }, preferences: { room_view: 'garden' }, first_stay_date: '2024-03-10', stay_count: 7, segment: 'business', loyalty_program: { tier: 'platinum', points: 21000 }, is_active: true, created_at: '2024-03-10T10:00:00Z', updated_at: '2026-06-30T08:00:00Z', deleted_at: null },
  { id: 'g-010', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Claire', last_name: 'Bonnet', email: 'claire.bonnet@gmail.com', phone: '+33 6 98 76 54 32', document_type: 'passport', document_number: 'FR678901', document_expiry: '2027-11-15', birth_date: '1992-02-28', nationality: 'France', address: { city: 'Marseille' }, preferences: null, first_stay_date: '2026-05-20', stay_count: 1, segment: 'leisure', loyalty_program: null, is_active: true, created_at: '2026-05-20T10:00:00Z', updated_at: '2026-05-20T10:00:00Z', deleted_at: null },
  { id: 'g-011', hotel_id: DEMO_HOTEL_ID, type: 'individual', first_name: 'Oumar', last_name: 'Sidibé', email: 'oumar.sidibe@outlook.com', phone: '+223 76 54 32 10', document_type: 'passport', document_number: 'ML901234', document_expiry: '2028-07-20', birth_date: '1987-07-14', nationality: 'Mali', address: { city: 'Bamako' }, preferences: null, first_stay_date: '2026-04-05', stay_count: 1, segment: 'leisure', loyalty_program: null, is_active: true, created_at: '2026-04-05T10:00:00Z', updated_at: '2026-04-05T10:00:00Z', deleted_at: null },
  { id: 'g-012', hotel_id: DEMO_HOTEL_ID, type: 'agency', first_name: null, last_name: 'Voyages Afrique Tours', email: 'resa@voyagesafriquetours.com', phone: '+225 27 22 44 66 88', document_type: null, document_number: null, document_expiry: null, birth_date: null, nationality: 'Côte d\'Ivoire', address: { city: 'Abidjan' }, preferences: null, first_stay_date: '2024-01-15', stay_count: 12, segment: 'ota', loyalty_program: null, is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2026-06-05T08:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export const demoEmployees: Employee[] = [
  { id: 'emp-001', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Aya', last_name: 'N\'Guessan', email: 'aya.nguessan@eden-hotel.ci', phone: '+225 07 09 11 22 33', job_title: 'Directrice Générale', department: 'Direction', status: 'active', hire_date: '2022-06-01', supervisor_id: null, created_at: '2022-06-01T08:00:00Z', updated_at: '2026-01-10T08:00:00Z', deleted_at: null },
  { id: 'emp-002', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Kofi', last_name: 'Asante', email: 'kofi.asante@eden-hotel.ci', phone: '+225 05 13 24 35 46', job_title: 'Chef Réception', department: 'Réception', status: 'active', hire_date: '2023-01-15', supervisor_id: 'emp-001', created_at: '2023-01-15T08:00:00Z', updated_at: '2026-02-20T08:00:00Z', deleted_at: null },
  { id: 'emp-003', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Mariam', last_name: 'Touré', email: 'mariam.toure@eden-hotel.ci', phone: '+225 07 44 55 66 77', job_title: 'Réceptionniste', department: 'Réception', status: 'active', hire_date: '2024-03-01', supervisor_id: 'emp-002', created_at: '2024-03-01T08:00:00Z', updated_at: '2025-09-15T08:00:00Z', deleted_at: null },
  { id: 'emp-004', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Adjoua', last_name: 'Mensah', email: 'adjoua.mensah@eden-hotel.ci', phone: '+225 01 66 77 88 99', job_title: 'Chef Housekeeping', department: 'Housekeeping', status: 'active', hire_date: '2023-06-01', supervisor_id: 'emp-001', created_at: '2023-06-01T08:00:00Z', updated_at: '2026-03-10T08:00:00Z', deleted_at: null },
  { id: 'emp-005', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Yao', last_name: 'Bamba', email: 'yao.bamba@eden-hotel.ci', phone: '+225 05 88 99 00 11', job_title: 'Responsable Restaurant', department: 'Restauration', status: 'active', hire_date: '2023-03-01', supervisor_id: 'emp-001', created_at: '2023-03-01T08:00:00Z', updated_at: '2026-04-05T08:00:00Z', deleted_at: null },
  { id: 'emp-006', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Rachid', last_name: 'El-Fassi', email: 'rachid.elfassi@eden-hotel.ci', phone: '+212 6 12 34 56 78', job_title: 'Chef Cuisinier', department: 'Restauration', status: 'active', hire_date: '2024-01-10', supervisor_id: 'emp-005', created_at: '2024-01-10T08:00:00Z', updated_at: '2025-11-20T08:00:00Z', deleted_at: null },
  { id: 'emp-007', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Grâce', last_name: 'Ouattara', email: 'grace.ouattara@eden-hotel.ci', phone: '+225 07 22 33 44 55', job_title: 'Agent d\'entretien', department: 'Housekeeping', status: 'on_leave', hire_date: '2025-02-01', supervisor_id: 'emp-004', created_at: '2025-02-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z', deleted_at: null },
  { id: 'emp-008', hotel_id: DEMO_HOTEL_ID, auth_user_id: null, first_name: 'Lacina', last_name: 'Konaté', email: 'lacina.konate@eden-hotel.ci', phone: '+225 01 55 66 77 88', job_title: 'Responsable Financier', department: 'Finance', status: 'active', hire_date: '2022-09-01', supervisor_id: 'emp-001', created_at: '2022-09-01T08:00:00Z', updated_at: '2026-05-15T08:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

function d(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export const demoBookings: Booking[] = [
  { id: 'bk-001', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-001', created_at: '2026-06-15T10:00:00Z', check_in_date: d(-5), check_out_date: d(2), night_count: 7, status: 'checked_in', total_amount_cents: 52500000, paid_amount_cents: 30000000, balance_cents: 22500000, currency_code: 'XOF', source: 'direct', special_requests: 'Chambre calme, étage élevé', internal_notes: null, confirmed_at: '2026-06-16T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-06-28T14:00:00Z', deleted_at: null },
  { id: 'bk-002', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-002', booking_reference: 'EDN-2026-002', created_at: '2026-06-20T14:30:00Z', check_in_date: d(-2), check_out_date: d(3), night_count: 5, status: 'checked_in', total_amount_cents: 55000000, paid_amount_cents: 55000000, balance_cents: 0, currency_code: 'XOF', source: 'booking.com', special_requests: null, internal_notes: 'Client fidèle', confirmed_at: '2026-06-21T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-02T10:00:00Z', deleted_at: null },
  { id: 'bk-003', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-003', created_at: '2026-06-25T09:00:00Z', check_in_date: d(1), check_out_date: d(4), night_count: 3, status: 'confirmed', total_amount_cents: 22500000, paid_amount_cents: 11250000, balance_cents: 11250000, currency_code: 'XOF', source: 'direct', special_requests: 'Arrivée tardive prévue', internal_notes: null, confirmed_at: '2026-06-26T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-01T08:00:00Z', deleted_at: null },
  { id: 'bk-004', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-003', booking_reference: 'EDN-2026-004', created_at: '2026-07-01T11:00:00Z', check_in_date: d(5), check_out_date: d(8), night_count: 3, status: 'pending', total_amount_cents: 54000000, paid_amount_cents: 0, balance_cents: 54000000, currency_code: 'XOF', source: 'agoda', special_requests: null, internal_notes: null, confirmed_at: null, cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-01T11:00:00Z', deleted_at: null },
  { id: 'bk-005', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-005', created_at: '2026-05-10T08:00:00Z', check_in_date: d(-30), check_out_date: d(-27), night_count: 3, status: 'completed', total_amount_cents: 22500000, paid_amount_cents: 22500000, balance_cents: 0, currency_code: 'XOF', source: 'direct', special_requests: null, internal_notes: null, confirmed_at: '2026-05-11T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-05-13T11:00:00Z', deleted_at: null },
  { id: 'bk-006', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-002', booking_reference: 'EDN-2026-006', created_at: '2026-05-20T16:00:00Z', check_in_date: d(-20), check_out_date: d(-17), night_count: 3, status: 'completed', total_amount_cents: 33000000, paid_amount_cents: 33000000, balance_cents: 0, currency_code: 'XOF', source: 'booking.com', special_requests: null, internal_notes: null, confirmed_at: '2026-05-21T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-05-23T11:00:00Z', deleted_at: null },
  { id: 'bk-007', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-007', created_at: '2026-06-01T12:00:00Z', check_in_date: d(-10), check_out_date: d(-7), night_count: 3, status: 'completed', total_amount_cents: 22500000, paid_amount_cents: 22500000, balance_cents: 0, currency_code: 'XOF', source: 'direct', special_requests: null, internal_notes: null, confirmed_at: '2026-06-02T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-06-04T11:00:00Z', deleted_at: null },
  { id: 'bk-008', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-004', booking_reference: 'EDN-2026-008', created_at: '2026-06-28T09:30:00Z', check_in_date: d(-1), check_out_date: d(5), night_count: 6, status: 'checked_in', total_amount_cents: 270000000, paid_amount_cents: 135000000, balance_cents: 135000000, currency_code: 'XOF', source: 'direct', special_requests: 'Suite Présidentielle - Client VIP', internal_notes: 'Accueil VIP requis', confirmed_at: '2026-06-29T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-03T14:00:00Z', deleted_at: null },
  { id: 'bk-009', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-009', created_at: '2026-04-15T10:00:00Z', check_in_date: d(-45), check_out_date: d(-42), night_count: 3, status: 'cancelled', total_amount_cents: 22500000, paid_amount_cents: 0, balance_cents: 0, currency_code: 'XOF', source: 'direct', special_requests: null, internal_notes: null, confirmed_at: null, cancelled_at: '2026-04-20T08:00:00Z', cancellation_reason: 'Changement de plan', updated_at: '2026-04-20T08:00:00Z', deleted_at: null },
  { id: 'bk-010', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-002', booking_reference: 'EDN-2026-010', created_at: '2026-07-03T08:00:00Z', check_in_date: d(7), check_out_date: d(10), night_count: 3, status: 'confirmed', total_amount_cents: 33000000, paid_amount_cents: 16500000, balance_cents: 16500000, currency_code: 'XOF', source: 'expedia', special_requests: null, internal_notes: null, confirmed_at: '2026-07-04T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-04T08:00:00Z', deleted_at: null },
  { id: 'bk-011', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-001', booking_reference: 'EDN-2026-011', created_at: '2026-07-05T15:00:00Z', check_in_date: d(10), check_out_date: d(13), night_count: 3, status: 'pending', total_amount_cents: 22500000, paid_amount_cents: 0, balance_cents: 22500000, currency_code: 'XOF', source: 'direct', special_requests: 'Chambre avec vue mer', internal_notes: null, confirmed_at: null, cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-05T15:00:00Z', deleted_at: null },
  { id: 'bk-012', hotel_id: DEMO_HOTEL_ID, rate_plan_id: 'rp-003', booking_reference: 'EDN-2026-012', created_at: '2026-06-10T10:00:00Z', check_in_date: d(-3), check_out_date: d(1), night_count: 4, status: 'checked_out', total_amount_cents: 72000000, paid_amount_cents: 72000000, balance_cents: 0, currency_code: 'XOF', source: 'direct', special_requests: null, internal_notes: null, confirmed_at: '2026-06-11T08:00:00Z', cancelled_at: null, cancellation_reason: null, updated_at: '2026-07-03T11:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const demoPayments: Payment[] = [
  { id: 'pay-001', booking_id: 'bk-001', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-002', guest_id: 'g-001', amount_cents: 30000000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'success', external_reference: 'PAY-2026-001', notes: null, processed_at: '2026-06-15T10:05:00Z', created_at: '2026-06-15T10:00:00Z', updated_at: '2026-06-15T10:05:00Z' },
  { id: 'pay-002', booking_id: 'bk-002', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-003', guest_id: 'g-002', amount_cents: 55000000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'success', external_reference: 'PAY-2026-002', notes: null, processed_at: '2026-06-20T14:35:00Z', created_at: '2026-06-20T14:30:00Z', updated_at: '2026-06-20T14:35:00Z' },
  { id: 'pay-003', booking_id: 'bk-003', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-002', guest_id: 'g-003', amount_cents: 11250000, currency_code: 'XOF', method: 'transfer', type: 'deposit', status: 'success', external_reference: 'PAY-2026-003', notes: 'Virement SIVOCOM', processed_at: '2026-06-26T08:30:00Z', created_at: '2026-06-25T09:00:00Z', updated_at: '2026-06-26T08:30:00Z' },
  { id: 'pay-004', booking_id: 'bk-005', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-003', guest_id: 'g-004', amount_cents: 22500000, currency_code: 'XOF', method: 'cash', type: 'balance', status: 'success', external_reference: null, notes: null, processed_at: '2026-05-13T10:00:00Z', created_at: '2026-05-13T10:00:00Z', updated_at: '2026-05-13T10:00:00Z' },
  { id: 'pay-005', booking_id: 'bk-006', hotel_id: DEMO_HOTEL_ID, employee_id: null, guest_id: 'g-005', amount_cents: 33000000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'success', external_reference: 'PAY-2026-005', notes: 'Booking.com commission included', processed_at: '2026-05-20T16:05:00Z', created_at: '2026-05-20T16:00:00Z', updated_at: '2026-05-20T16:05:00Z' },
  { id: 'pay-006', booking_id: 'bk-007', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-002', guest_id: 'g-006', amount_cents: 22500000, currency_code: 'XOF', method: 'mobile_money', type: 'deposit', status: 'success', external_reference: 'MTN-MO-2026-007', notes: 'Orange Money', processed_at: '2026-06-02T08:10:00Z', created_at: '2026-06-01T12:00:00Z', updated_at: '2026-06-02T08:10:00Z' },
  { id: 'pay-007', booking_id: 'bk-008', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-002', guest_id: 'g-009', amount_cents: 135000000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'success', external_reference: 'PAY-2026-007', notes: 'VIP - Suite Présidentielle', processed_at: '2026-06-29T08:05:00Z', created_at: '2026-06-28T09:30:00Z', updated_at: '2026-06-29T08:05:00Z' },
  { id: 'pay-008', booking_id: 'bk-010', hotel_id: DEMO_HOTEL_ID, employee_id: null, guest_id: 'g-007', amount_cents: 16500000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'success', external_reference: 'EXP-2026-008', notes: null, processed_at: '2026-07-04T08:10:00Z', created_at: '2026-07-03T08:00:00Z', updated_at: '2026-07-04T08:10:00Z' },
  { id: 'pay-009', booking_id: 'bk-001', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-003', guest_id: 'g-001', amount_cents: 7500000, currency_code: 'XOF', method: 'cash', type: 'supplement', status: 'success', external_reference: null, notes: 'Surcharge minibar', processed_at: '2026-07-01T14:00:00Z', created_at: '2026-07-01T14:00:00Z', updated_at: '2026-07-01T14:00:00Z' },
  { id: 'pay-010', booking_id: 'bk-012', hotel_id: DEMO_HOTEL_ID, employee_id: 'emp-002', guest_id: 'g-008', amount_cents: 72000000, currency_code: 'XOF', method: 'transfer', type: 'balance', status: 'success', external_reference: 'WAT-TRF-2026-010', notes: 'Paiement intégral', processed_at: '2026-07-03T10:00:00Z', created_at: '2026-07-03T10:00:00Z', updated_at: '2026-07-03T10:00:00Z' },
  { id: 'pay-011', booking_id: 'bk-009', hotel_id: DEMO_HOTEL_ID, employee_id: null, guest_id: 'g-010', amount_cents: 10000000, currency_code: 'XOF', method: 'card', type: 'refund', status: 'refunded', external_reference: 'REF-2026-011', notes: 'Remboursement annulation', processed_at: '2026-04-22T08:00:00Z', created_at: '2026-04-22T08:00:00Z', updated_at: '2026-04-22T08:00:00Z' },
  { id: 'pay-012', booking_id: 'bk-004', hotel_id: DEMO_HOTEL_ID, employee_id: null, guest_id: 'g-011', amount_cents: 27000000, currency_code: 'XOF', method: 'card', type: 'deposit', status: 'pending', external_reference: 'AGD-2026-012', notes: null, processed_at: null, created_at: '2026-07-01T11:00:00Z', updated_at: '2026-07-01T11:00:00Z' },
];

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const demoReviews: Review[] = [
  { id: 'rev-001', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-001', booking_id: 'bk-005', rating: 5, title: 'Séjour parfait', comment: 'Un hôtel d\'exception. Le personnel est attentionné, les chambres sont immaculées et la vue est à couper le souffle. Je recommande vivement.', stay_date_start: d(-30), stay_date_end: d(-27), platform: 'google', hotel_reply: 'Merci infiniment pour votre fidélité, Monsieur Diallo. Nous avons hâte de vous accueillir à nouveau.', internal_note: null, is_visible: true, is_verified: true, created_at: '2026-05-14T10:00:00Z', updated_at: '2026-05-15T08:00:00Z', deleted_at: null },
  { id: 'rev-002', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-002', booking_id: 'bk-006', rating: 4, title: 'Très bon séjour', comment: 'Chambre magnifique, petit-déjeuner copieux. Le spa pourrait être un peu plus grand. Mais dans l\'ensemble, une très belle expérience.', stay_date_start: d(-20), stay_date_end: d(-17), platform: 'tripadvisor', hotel_reply: null, internal_note: null, is_visible: true, is_verified: true, created_at: '2026-05-24T14:00:00Z', updated_at: '2026-05-24T14:00:00Z', deleted_at: null },
  { id: 'rev-003', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-004', booking_id: 'bk-005', rating: 5, title: 'Service irréprochable', comment: 'Un cadre somptueux, un service impeccable. La cuisine du chef Rachid est extraordinaire. Merci à toute l\'équipe.', stay_date_start: d(-30), stay_date_end: d(-27), platform: 'google', hotel_reply: 'Votre satisfaction est notre plus belle récompense, Monsieur Koné. À bientôt !', internal_note: null, is_visible: true, is_verified: true, created_at: '2026-05-14T16:00:00Z', updated_at: '2026-05-16T08:00:00Z', deleted_at: null },
  { id: 'rev-004', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-006', booking_id: 'bk-007', rating: 4, title: 'Bon rapport qualité-prix', comment: 'Belle chambre, personnel accueillant. La piscine est un vrai plus. Je reviendrai.', stay_date_start: d(-10), stay_date_end: d(-7), platform: 'booking', hotel_reply: null, internal_note: null, is_visible: true, is_verified: true, created_at: '2026-06-05T12:00:00Z', updated_at: '2026-06-05T12:00:00Z', deleted_at: null },
  { id: 'rev-005', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-005', booking_id: 'bk-006', rating: 3, title: 'Correct mais perfectible', comment: 'L\'hôtel est bien, mais le Wi-Fi était instable pendant mon séjour. L\'accueil était chaleureux.', stay_date_start: d(-20), stay_date_end: d(-17), platform: 'tripadvisor', hotel_reply: 'Nous vous remercions pour votre retour et avons pris note de votre remarque concernant le Wi-Fi. Des améliorations sont en cours.', internal_note: 'Problème Wi-Fi signalé - à vérifier avec IT', is_visible: true, is_verified: true, created_at: '2026-05-25T09:00:00Z', updated_at: '2026-05-26T10:00:00Z', deleted_at: null },
  { id: 'rev-006', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-009', booking_id: null, rating: 5, title: 'Le meilleur hôtel d\'Abidjan', comment: 'Un établissement de classe mondiale. La Suite Présidentielle est somptueuse. Le restaurant propose une cuisine raffinée. Un grand bravo.', stay_date_start: d(-15), stay_date_end: d(-10), platform: 'google', hotel_reply: 'Merci pour ces mots élogieux, Monsieur Touré. Vous faites partie de notre famille depuis 2024.', internal_note: 'Client VIP - Platine', is_visible: true, is_verified: true, created_at: '2026-06-15T18:00:00Z', updated_at: '2026-06-16T08:00:00Z', deleted_at: null },
  { id: 'rev-007', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-007', booking_id: null, rating: 4, title: 'Séjour agréable', comment: 'Très bel hôtel, personnel souriant. La chambre était propre et spacieuse. Le petit-déjeuner aurait pu être plus varié.', stay_date_start: d(-12), stay_date_end: d(-9), platform: 'google', hotel_reply: null, internal_note: null, is_visible: true, is_verified: true, created_at: '2026-06-12T11:00:00Z', updated_at: '2026-06-12T11:00:00Z', deleted_at: null },
  { id: 'rev-008', hotel_id: DEMO_HOTEL_ID, guest_id: 'g-003', booking_id: 'bk-007', rating: 5, title: 'Partenariat excellence', comment: 'Notre entreprise séjourne régulièrement à L\'Éden pour nos voyages d\'affaires. Le service est toujours au top. Merci pour votre professionnalisme.', stay_date_start: d(-10), stay_date_end: d(-7), platform: 'direct', hotel_reply: 'Nous vous remercions de votre confiance renouvelée, Société Ivoirienne de Commerce. Nous sommes fiers de notre partenariat.', internal_note: null, is_visible: true, is_verified: true, created_at: '2026-06-06T14:00:00Z', updated_at: '2026-06-07T08:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Rate Plans
// ---------------------------------------------------------------------------

export const demoRatePlans: RatePlan[] = [
  { id: 'rp-001', hotel_id: DEMO_HOTEL_ID, name: 'Tarif Standard', description: 'Tarif de base sans flexibilité', cancellation_policy: { free_cancellation_days: 7 }, deposit_required_cents: null, deposit_percentage: 50, is_refundable: false, is_active: true, conditions: 'Annulation gratuite jusqu\'à 7 jours avant l\'arrivée', created_at: '2023-01-15T08:00:00Z', updated_at: '2025-01-01T08:00:00Z', deleted_at: null },
  { id: 'rp-002', hotel_id: DEMO_HOTEL_ID, name: 'Tarif Flexible', description: 'Annulation gratuite jusqu\'à 48h avant', cancellation_policy: { free_cancellation_days: 2 }, deposit_required_cents: null, deposit_percentage: 30, is_refundable: true, is_active: true, conditions: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée', created_at: '2023-01-15T08:00:00Z', updated_at: '2025-06-01T08:00:00Z', deleted_at: null },
  { id: 'rp-003', hotel_id: DEMO_HOTEL_ID, name: 'Pack Séjour', description: 'Inclut petit-déjeuner et transfert', cancellation_policy: { free_cancellation_days: 14 }, deposit_required_cents: 5000000, deposit_percentage: null, is_refundable: false, is_active: true, conditions: 'Petit-déjeuner buffet inclus + transfert aéroport', created_at: '2024-01-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rp-004', hotel_id: DEMO_HOTEL_ID, name: 'Tarif VIP', description: 'Accès salon, service en chambre 24h/24', cancellation_policy: { free_cancellation_days: 30 }, deposit_required_cents: 20000000, deposit_percentage: null, is_refundable: true, is_active: true, conditions: 'Accès VIP Lounge, service en chambre 24h, upgrade automatique', created_at: '2024-06-01T08:00:00Z', updated_at: '2026-03-01T08:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export const demoSeasons: Season[] = [
  { id: 's-001', hotel_id: DEMO_HOTEL_ID, name: 'Haute Saison', start_date: '2026-12-15', end_date: '2027-01-15', pricing_mode: 'percentage', value: 25, apply_days: null, priority: 1, is_active: true, created_at: '2026-01-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z' },
  { id: 's-002', hotel_id: DEMO_HOTEL_ID, name: 'Saison verte', start_date: '2026-06-01', end_date: '2026-09-30', pricing_mode: 'percentage', value: 15, apply_days: [5, 6], priority: 2, is_active: true, created_at: '2026-01-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z' },
  { id: 's-003', hotel_id: DEMO_HOTEL_ID, name: 'Fêtes de Fin d\'Année', start_date: '2026-12-25', end_date: '2027-01-05', pricing_mode: 'fixed_amount', value: 15000000, apply_days: null, priority: 0, is_active: true, created_at: '2026-06-01T08:00:00Z', updated_at: '2026-06-01T08:00:00Z' },
];

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const demoInvoices: Invoice[] = [
  { id: 'inv-001', booking_id: 'bk-005', hotel_id: DEMO_HOTEL_ID, invoice_number: 'FAC-2026-001', issue_date: '2026-05-13', due_date: '2026-05-13', total_amount_cents: 22500000, tax_amount_cents: 4050000, discount_amount_cents: 0, net_amount_cents: 18450000, status: 'paid', notes: null, created_at: '2026-05-13T10:00:00Z', updated_at: '2026-05-13T10:00:00Z' },
  { id: 'inv-002', booking_id: 'bk-006', hotel_id: DEMO_HOTEL_ID, invoice_number: 'FAC-2026-002', issue_date: '2026-05-23', due_date: '2026-05-23', total_amount_cents: 33000000, tax_amount_cents: 5940000, discount_amount_cents: 0, net_amount_cents: 27060000, status: 'paid', notes: null, created_at: '2026-05-23T10:00:00Z', updated_at: '2026-05-23T10:00:00Z' },
  { id: 'inv-003', booking_id: 'bk-001', hotel_id: DEMO_HOTEL_ID, invoice_number: 'FAC-2026-003', issue_date: d(-1), due_date: d(6), total_amount_cents: 52500000, tax_amount_cents: 9450000, discount_amount_cents: 2500000, net_amount_cents: 40550000, status: 'issued', notes: 'Remise fidélité 5%', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv-004', booking_id: 'bk-012', hotel_id: DEMO_HOTEL_ID, invoice_number: 'FAC-2026-004', issue_date: '2026-07-03', due_date: '2026-07-03', total_amount_cents: 72000000, tax_amount_cents: 12960000, discount_amount_cents: 0, net_amount_cents: 59040000, status: 'paid', notes: null, created_at: '2026-07-03T10:00:00Z', updated_at: '2026-07-03T10:00:00Z' },
  { id: 'inv-005', booking_id: 'bk-008', hotel_id: DEMO_HOTEL_ID, invoice_number: 'FAC-2026-005', issue_date: d(0), due_date: d(7), total_amount_cents: 270000000, tax_amount_cents: 48600000, discount_amount_cents: 0, net_amount_cents: 221400000, status: 'draft', notes: 'Suite Présidentielle - VIP', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// ---------------------------------------------------------------------------
// Invoice Items
// ---------------------------------------------------------------------------

export const demoInvoiceItems: InvoiceItem[] = [
  { id: 'ii-001', invoice_id: 'inv-001', description: 'Chambre Classique - 3 nuits', quantity: 3, unit_price_cents: 7500000, total_price_cents: 22500000, tax_rate: 18, tax_id: 'tax-001', discount_id: null, sort_order: 1, created_at: '2026-05-13T10:00:00Z' },
  { id: 'ii-002', invoice_id: 'inv-002', description: 'Chambre Supérieure - 3 nuits', quantity: 3, unit_price_cents: 11000000, total_price_cents: 33000000, tax_rate: 18, tax_id: 'tax-001', discount_id: null, sort_order: 1, created_at: '2026-05-23T10:00:00Z' },
  { id: 'ii-003', invoice_id: 'inv-003', description: 'Chambre Classique - 7 nuits', quantity: 7, unit_price_cents: 7500000, total_price_cents: 52500000, tax_rate: 18, tax_id: 'tax-001', discount_id: 'disc-002', sort_order: 1, created_at: new Date().toISOString() },
];

// ---------------------------------------------------------------------------
// Taxes
// ---------------------------------------------------------------------------

export const demoTaxes: Tax[] = [
  { id: 'tax-001', hotel_id: DEMO_HOTEL_ID, name: 'TVA 18%', rate: 0.18, is_active: true, created_at: '2023-01-15T08:00:00Z' },
  { id: 'tax-002', hotel_id: DEMO_HOTEL_ID, name: 'Taxe de séjour', rate: 0.02, is_active: true, created_at: '2023-01-15T08:00:00Z' },
  { id: 'tax-003', hotel_id: DEMO_HOTEL_ID, name: 'Taxe communale', rate: 0.01, is_active: false, created_at: '2023-06-01T08:00:00Z' },
];

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export const demoDiscounts: Discount[] = [
  { id: 'disc-001', hotel_id: DEMO_HOTEL_ID, name: 'Early Bird', type: 'percentage', value: 10, code: 'EARLY10', is_active: true, valid_from: '2026-01-01', valid_until: '2026-12-31', created_at: '2026-01-01T08:00:00Z' },
  { id: 'disc-002', hotel_id: DEMO_HOTEL_ID, name: 'Remise Fidélité', type: 'percentage', value: 5, code: null, is_active: true, valid_from: null, valid_until: null, created_at: '2024-06-01T08:00:00Z' },
  { id: 'disc-003', hotel_id: DEMO_HOTEL_ID, name: 'Offre Séjour Long', type: 'fixed_amount', value: 5000000, code: 'SEJOUR5', is_active: true, valid_from: '2026-06-01', valid_until: '2026-09-30', created_at: '2026-06-01T08:00:00Z' },
];

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const demoServices: Service[] = [
  { id: 'svc-001', hotel_id: DEMO_HOTEL_ID, name: 'Spa & Well-being', translations: { en: 'Spa & Well-being' }, description: 'Massage, soins du corps, hammam', unit_price_cents: 2500000, pricing_type: 'per_person', icon: 'Sparkles', category: 'wellness', tax_rate: 18, is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'svc-002', hotel_id: DEMO_HOTEL_ID, name: 'Transfert Aéroport', translations: { en: 'Airport Transfer' }, description: 'Navette aller/retour depuis l\'aéroport Felix Houphouet-Boigny', unit_price_cents: 1500000, pricing_type: 'per_room', icon: 'Car', category: 'transport', tax_rate: 18, is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'svc-003', hotel_id: DEMO_HOTEL_ID, name: 'Petit-déjeuner en chambre', translations: { en: 'In-room Breakfast' }, description: 'Service de petit-déjeuner en chambre 7h-10h', unit_price_cents: 800000, pricing_type: 'per_person', icon: 'Coffee', category: 'dining', tax_rate: 18, is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'svc-004', hotel_id: DEMO_HOTEL_ID, name: 'Service de blanchisserie', translations: { en: 'Laundry Service' }, description: 'Lavage et repassage express', unit_price_cents: 500000, pricing_type: 'per_room', icon: 'Shirt', category: 'amenities', tax_rate: 18, is_active: true, created_at: '2023-06-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'svc-005', hotel_id: DEMO_HOTEL_ID, name: 'Location de véhicule', translations: { en: 'Car Rental' }, description: 'Location de véhicules avec ou sans chauffeur', unit_price_cents: 15000000, pricing_type: 'flat', icon: 'Car', category: 'transport', tax_rate: 18, is_active: true, created_at: '2024-01-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
];

export const demoServicesWithStats: ServiceWithStats[] = demoServices.map(s => ({
  ...s,
  active_bookings: Math.floor(Math.random() * 20) + 5,
  revenue_cents: Math.floor(Math.random() * 10000000) + 1000000,
}));

// ---------------------------------------------------------------------------
// Restaurant
// ---------------------------------------------------------------------------

export const demoRestaurantTables: RestaurantTable[] = [
  { id: 'rtbl-001', hotel_id: DEMO_HOTEL_ID, name: 'Table 1', capacity: 2, location: 'Terrasse', is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null },
  { id: 'rtbl-002', hotel_id: DEMO_HOTEL_ID, name: 'Table 2', capacity: 4, location: 'Terrasse', is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null },
  { id: 'rtbl-003', hotel_id: DEMO_HOTEL_ID, name: 'Table 3', capacity: 6, location: 'Salle intérieure', is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null },
  { id: 'rtbl-004', hotel_id: DEMO_HOTEL_ID, name: 'Table 4', capacity: 8, location: 'Salle intérieure', is_active: true, created_at: '2023-01-15T08:00:00Z', updated_at: '2023-01-15T08:00:00Z', deleted_at: null },
  { id: 'rtbl-005', hotel_id: DEMO_HOTEL_ID, name: 'Table VIP', capacity: 10, location: 'Salon privé', is_active: true, created_at: '2024-06-01T08:00:00Z', updated_at: '2024-06-01T08:00:00Z', deleted_at: null },
];

export const demoRestaurantMenuItems: RestaurantMenuItem[] = [
  { id: 'rmi-001', hotel_id: DEMO_HOTEL_ID, name: 'Poulet Yassa', description: 'Poulet mariné aux oignons citronnés, riz basmati', price_cents: 4500000, category: 'Plats principaux', is_available: true, sort_order: 1, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-002', hotel_id: DEMO_HOTEL_ID, name: 'Poisson Braisé', description: 'Poisson entier braisé, sauce tomate épicée, ignames frites', price_cents: 5500000, category: 'Plats principaux', is_available: true, sort_order: 2, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-003', hotel_id: DEMO_HOTEL_ID, name: 'Salade César', description: 'Laitue romaine, parmesan, croûtons, sauce César', price_cents: 2500000, category: 'Entrées', is_available: true, sort_order: 3, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-004', hotel_id: DEMO_HOTEL_ID, name: 'Riz au Lait Coco', description: 'Dessert traditionnel à la vanille de Madagascar', price_cents: 1500000, category: 'Desserts', is_available: true, sort_order: 4, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-005', hotel_id: DEMO_HOTEL_ID, name: 'Jus de Bissap', description: 'Jus d\'hibiscus frais, servi glacé', price_cents: 800000, category: 'Boissons', is_available: true, sort_order: 5, created_at: '2023-01-15T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-006', hotel_id: DEMO_HOTEL_ID, name: 'Thiéboudienne', description: 'Riz au poisson, sauce tomate, légumes', price_cents: 5000000, category: 'Plats principaux', is_available: true, sort_order: 6, created_at: '2023-06-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-007', hotel_id: DEMO_HOTEL_ID, name: 'Champagne Brut', description: 'Bouteille de Champagne Moët & Chandon', price_cents: 25000000, category: 'Boissons', is_available: true, sort_order: 7, created_at: '2024-01-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
  { id: 'rmi-008', hotel_id: DEMO_HOTEL_ID, name: 'Brochettes de Bœuf', description: 'Brochettes marinées, légumes grillés, sauce arachide', price_cents: 4000000, category: 'Plats principaux', is_available: true, sort_order: 8, created_at: '2024-06-01T08:00:00Z', updated_at: '2026-01-01T08:00:00Z', deleted_at: null },
];

export const demoRestaurantOrders: RestaurantOrder[] = [
  { id: 'ro-001', hotel_id: DEMO_HOTEL_ID, table_id: 'rtbl-002', order_reference: 'CMD-001', status: 'served', type: 'dine_in', room_number: null, special_requests: 'Sans arachide', total_amount_cents: 9800000, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'ro-002', hotel_id: DEMO_HOTEL_ID, table_id: null, order_reference: 'CMD-002', status: 'preparing', type: 'room_service', room_number: '201', special_requests: null, total_amount_cents: 7000000, created_at: new Date(Date.now() - 900000).toISOString(), updated_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'ro-003', hotel_id: DEMO_HOTEL_ID, table_id: 'rtbl-004', order_reference: 'CMD-003', status: 'pending', type: 'dine_in', room_number: null, special_requests: 'Anniversaire - gâteau souhaité', total_amount_cents: 35000000, created_at: new Date(Date.now() - 300000).toISOString(), updated_at: new Date(Date.now() - 300000).toISOString() },
];

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const demoGalleryImages: GalleryImage[] = [
  { id: 'gal-001', hotel_id: DEMO_HOTEL_ID, url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt_text: 'Façade de L\'Éden Resort', caption: 'Vue extérieure du resort', sort_order: 1, is_active: true, created_at: '2024-01-01T08:00:00Z', updated_at: '2024-01-01T08:00:00Z', deleted_at: null },
  { id: 'gal-002', hotel_id: DEMO_HOTEL_ID, url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', alt_text: 'Chambre Supérieure', caption: 'Chambre avec vue panoramique', sort_order: 2, is_active: true, created_at: '2024-01-01T08:00:00Z', updated_at: '2024-01-01T08:00:00Z', deleted_at: null },
  { id: 'gal-003', hotel_id: DEMO_HOTEL_ID, url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', alt_text: 'Piscine du resort', caption: 'Piscine à débordement avec vue', sort_order: 3, is_active: true, created_at: '2024-01-01T08:00:00Z', updated_at: '2024-01-01T08:00:00Z', deleted_at: null },
  { id: 'gal-004', hotel_id: DEMO_HOTEL_ID, url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', alt_text: 'Restaurant gastronomique', caption: 'Restaurant Le Baobab', sort_order: 4, is_active: true, created_at: '2024-06-01T08:00:00Z', updated_at: '2024-06-01T08:00:00Z', deleted_at: null },
  { id: 'gal-005', hotel_id: DEMO_HOTEL_ID, url: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800', alt_text: 'Spa & Wellness', caption: 'Espace bien-être et relaxation', sort_order: 5, is_active: true, created_at: '2024-06-01T08:00:00Z', updated_at: '2024-06-01T08:00:00Z', deleted_at: null },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const demoNotifications: Notification[] = [
  { id: 'notif-001', hotel_id: DEMO_HOTEL_ID, booking_id: 'bk-001', payment_id: null, title: 'Check-in effectué', body: 'Amadou Diallo a effectué son check-in pour la chambre 201.', category: 'confirmation', priority: 'normal', template: null, sender_type: 'employee', sender_id: 'emp-002', sent_at: '2026-06-28T14:00:00Z', created_at: '2026-06-28T14:00:00Z' },
  { id: 'notif-002', hotel_id: DEMO_HOTEL_ID, booking_id: 'bk-004', payment_id: 'pay-012', title: 'Réservation en attente', body: 'Nouvelle réservation EDN-2026-004 en attente de confirmation de paiement.', category: 'alert', priority: 'high', template: null, sender_type: 'system', sender_id: null, sent_at: '2026-07-01T11:00:00Z', created_at: '2026-07-01T11:00:00Z' },
  { id: 'notif-003', hotel_id: DEMO_HOTEL_ID, booking_id: 'bk-008', payment_id: null, title: 'Client VIP à accueillir', body: 'Suite Présidentielle réservée - Accueil VIP requis demain.', category: 'reminder', priority: 'urgent', template: null, sender_type: 'employee', sender_id: 'emp-002', sent_at: '2026-06-29T08:00:00Z', created_at: '2026-06-29T08:00:00Z' },
  { id: 'notif-004', hotel_id: DEMO_HOTEL_ID, booking_id: null, payment_id: null, title: 'Maintenance requise', body: 'Chambre 401 signale un problème de climatisation.', category: 'alert', priority: 'high', template: null, sender_type: 'employee', sender_id: 'emp-004', sent_at: '2026-07-02T09:00:00Z', created_at: '2026-07-02T09:00:00Z' },
  { id: 'notif-005', hotel_id: DEMO_HOTEL_ID, booking_id: null, payment_id: null, title: 'Rappel check-out', body: '3 départs prévus aujourd\'hui. Dernier check-out à 11h.', category: 'reminder', priority: 'normal', template: null, sender_type: 'system', sender_id: null, sent_at: d(0) + 'T07:00:00Z', created_at: d(0) + 'T07:00:00Z' },
];

// ---------------------------------------------------------------------------
// Analytics (pre-computed data for charts)
// ---------------------------------------------------------------------------

export const demoRevenueByMonth: RevenueByPeriod[] = [
  { period: 'Août 25', revenue_cents: 12500000, booking_count: 7 },
  { period: 'Sep 25', revenue_cents: 14200000, booking_count: 8 },
  { period: 'Oct 25', revenue_cents: 16800000, booking_count: 9 },
  { period: 'Nov 25', revenue_cents: 19500000, booking_count: 10 },
  { period: 'Déc 25', revenue_cents: 28000000, booking_count: 14 },
  { period: 'Jan 26', revenue_cents: 22000000, booking_count: 11 },
  { period: 'Fév 26', revenue_cents: 18500000, booking_count: 9 },
  { period: 'Mar 26', revenue_cents: 20000000, booking_count: 10 },
  { period: 'Avr 26', revenue_cents: 17200000, booking_count: 8 },
  { period: 'Mai 26', revenue_cents: 21500000, booking_count: 11 },
  { period: 'Jun 26', revenue_cents: 24000000, booking_count: 12 },
  { period: 'Jul 26', revenue_cents: 26500000, booking_count: 13 },
];

export const demoRevenueByDay: RevenueByPeriod[] = Array.from({ length: 30 }, (_, i) => ({
  period: `${i + 1}`,
  revenue_cents: Math.round(600000 + Math.random() * 400000),
  booking_count: Math.floor(Math.random() * 3) + 1,
}));

export const demoPaymentMethods: PaymentMethodBreakdown[] = [
  { method: 'card', total_cents: 98000000, count: 45 },
  { method: 'transfer', total_cents: 42000000, count: 12 },
  { method: 'cash', total_cents: 25000000, count: 18 },
  { method: 'mobile_money', total_cents: 15000000, count: 8 },
];

export const demoOccupancyByRoomType: OccupancyByRoomType[] = [
  { room_type: 'Classique', total: 10, occupied: 8, rate: 82 },
  { room_type: 'Supérieure', total: 6, occupied: 4, rate: 75 },
  { room_type: 'Suite Junior', total: 3, occupied: 2, rate: 67 },
  { room_type: 'Suite Prestige', total: 2, occupied: 1, rate: 50 },
  { room_type: 'Villa', total: 2, occupied: 2, rate: 100 },
  { room_type: 'Bungalow', total: 2, occupied: 1, rate: 50 },
];

export const demoBookingStatusDist: BookingStatusDistribution[] = [
  { status: 'confirmed', count: 18 },
  { status: 'checked_in', count: 12 },
  { status: 'pending', count: 6 },
  { status: 'completed', count: 42 },
  { status: 'cancelled', count: 8 },
];

// ---------------------------------------------------------------------------
// Operations Summary
// ---------------------------------------------------------------------------

export const demoOperationsSummary: OperationsSummary = {
  arrivalsToday: 4,
  departuresToday: 3,
  toClean: 3,
  inMaintenance: 1,
  pendingPayments: 2,
  activeBookings: 14,
  overdueArrivals: 1,
  overdueDepartures: 0,
  totalRooms: 24,
  occupiedRooms: 14,
  tasks: [
    { id: 'task-001', type: 'check_in', title: 'Arrivée EDN-2026-003', subtitle: 'Chambre 303 — Demain', priority: 'high', href: '/bookings', booking_id: 'bk-003', room_number: '303' },
    { id: 'task-002', type: 'cleaning', title: 'Nettoyage Chambre 402', subtitle: 'Check-out effectué', priority: 'high', href: '/housekeeping', room_number: '402' },
    { id: 'task-003', type: 'payment_pending', title: 'Paiement en attente', subtitle: 'EDN-2026-004 — 27 000 000 XOF', priority: 'high', href: '/payments', booking_id: 'bk-004' },
    { id: 'task-004', type: 'maintenance', title: 'Maintenance Climatisation', subtitle: 'Chambre 401 — Rapporté par Adjoua', priority: 'medium', href: '/housekeeping', room_number: '401' },
    { id: 'task-005', type: 'room_unassigned', title: 'Chambre non assignée', subtitle: 'Réservation EDN-2026-011', priority: 'medium', href: '/bookings', booking_id: 'bk-011' },
  ],
};
