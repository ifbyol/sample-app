export interface User {
  id: number;
  email: string;
  username: string;
  date_of_birth: string;
  name: string;
  surname: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  internal_room_id: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  number_of_guests: number;
  start_date: string;
  end_date: string;
  payment_id?: string;
  status: 'Accepted' | 'Cancelled' | 'Refused';
  created_at: string;
  updated_at: string;
}

export interface BookingRequest {
  paymentId: string;
  creditCardNumber: string;
  roomId: string;
  userId: string;
  guests: number;
  startDate: string;
  endDate: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: string;
}

export interface CancellationRequest {
  bookingId: string;
  userId: string;
}

export interface Employee {
  id?: number;
  name: string;
  last_name: string;
  date_of_hiring: string;
  date_of_birthday: string;
  position: string;
  created_at?: string;
  updated_at?: string;
}

export interface Complaint {
  id?: number;
  customer: string;
  date: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValidationRequest {
  room_id: number;
  number_of_guests: number;
  start_date: string;
  end_date: string;
}

export interface ValidationResponse {
  valid: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  employees?: Employee[];
  complaints?: Complaint[];
  employee?: Employee;
  complaint?: Complaint;
}

export interface HealthResponse {
  status: string;
  service?: string;
  timestamp?: string;
  version?: string;
}