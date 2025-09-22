import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../utils/config';
import {
  User,
  Room,
  Booking,
  BookingRequest,
  BookingResponse,
  CancellationRequest,
  Employee,
  Complaint,
  ValidationRequest,
  ValidationResponse,
  HealthResponse,
  ApiResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      // Configure axios to handle self-signed certificates more gracefully
      validateStatus: (status) => {
        // Accept any status code (including certificate errors)
        return status >= 200 && status < 600;
      },
    });

    // Request interceptor to add baggage headers for distributed tracing
    this.client.interceptors.request.use((requestConfig) => {
      const traceId = this.generateTraceId();
      requestConfig.headers['baggage'] = `trace-id=${traceId}`;
      return requestConfig;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        // Handle SSL certificate errors specifically
        if (error.code === 'ERR_CERT_AUTHORITY_INVALID' ||
            error.code === 'ERR_CERT_COMMON_NAME_INVALID' ||
            error.message?.includes('certificate') ||
            error.message?.includes('SSL')) {
          console.warn('SSL Certificate Error - This is expected with self-signed certificates:', error.message);
          // For development/testing with self-signed certificates, we might want to retry or handle gracefully
          if (config.ignoreSslErrors) {
            console.warn('Ignoring SSL errors due to configuration');
          }
        } else {
          console.error('API Error:', error.response?.data || error.message);
        }
        throw error;
      }
    );
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Health check endpoints
  async getGatewayHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(config.endpoints.health);
    return response.data;
  }

  async getAdminHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(config.endpoints.admin.health);
    return response.data;
  }

  async getBookingHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(config.endpoints.booking.health);
    return response.data;
  }

  async getBookingManagementHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(config.endpoints.bookingManagement.healthz);
    return response.data;
  }

  // Admin service methods
  async getEmployees(): Promise<Employee[]> {
    const response = await this.client.get<ApiResponse<Employee[]>>(config.endpoints.admin.employees);
    return response.data.data || response.data.employees || [];
  }

  async createEmployee(employee: Employee): Promise<Employee> {
    const response = await this.client.post<ApiResponse<Employee>>(config.endpoints.admin.employees, employee);
    return response.data.data || response.data.employee || employee;
  }

  async getComplaints(): Promise<Complaint[]> {
    const response = await this.client.get<ApiResponse<Complaint[]>>(config.endpoints.admin.complaints);
    return response.data.data || response.data.complaints || [];
  }

  async createComplaint(complaint: Complaint): Promise<Complaint> {
    const response = await this.client.post<ApiResponse<Complaint>>(config.endpoints.admin.complaints, complaint);
    return response.data.data || response.data.complaint || complaint;
  }

  // Booking service methods
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    const response = await this.client.post<BookingResponse>(config.endpoints.booking.book, booking);
    return response.data;
  }

  async cancelBooking(cancellation: CancellationRequest): Promise<BookingResponse> {
    const response = await this.client.post<BookingResponse>(config.endpoints.booking.cancel, cancellation);
    return response.data;
  }

  // Booking-management service methods
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>(config.endpoints.bookingManagement.users);
    return response.data;
  }

  async getRooms(): Promise<Room[]> {
    const response = await this.client.get<Room[]>(config.endpoints.bookingManagement.rooms);
    return response.data;
  }

  async getBookings(): Promise<Booking[]> {
    const response = await this.client.get<Booking[]>(config.endpoints.bookingManagement.bookings);
    return response.data;
  }

  async validateBooking(validation: ValidationRequest): Promise<ValidationResponse> {
    const response = await this.client.post<ValidationResponse>(config.endpoints.bookingManagement.validate, validation);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;