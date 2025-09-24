// Access runtime configuration from window.ENV
declare global {
  interface Window {
    ENV?: {
      GATEWAY_API_BASE_URL?: string;
      IGNORE_SSL_ERRORS?: string;
    };
  }
}

export const config = {
  apiBaseUrl: window.ENV?.GATEWAY_API_BASE_URL || 'http://localhost:8082',
  apiTimeout: 10000, // 10 seconds
  ignoreSslErrors: window.ENV?.IGNORE_SSL_ERRORS === 'true' || process.env.NODE_ENV === 'development',

  // Endpoints
  endpoints: {
    // Gateway health
    health: '/healthz',

    // Admin service routes
    admin: {
      root: '/admin',
      health: '/admin/health',
      employees: '/admin/employee',
      complaints: '/admin/complaint',
    },

    // Booking service routes
    booking: {
      health: '/booking/health',
      book: '/booking/book',
      cancel: '/booking/cancel',
    },

    // Booking-management service routes
    bookingManagement: {
      healthz: '/booking-management/healthz',
      users: '/booking-management/users',
      rooms: '/booking-management/rooms',
      bookings: '/booking-management/bookings',
      validate: '/booking-management/validate',
    },
  },
};

export default config;