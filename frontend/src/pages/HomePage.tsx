import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { HealthResponse } from '../types';
import CertificateWarning from '../components/CertificateWarning';
import config from '../utils/config';

const HomePage: React.FC = () => {
  const [health, setHealth] = useState<{
    gateway?: HealthResponse;
    admin?: HealthResponse;
    booking?: HealthResponse;
    bookingManagement?: HealthResponse;
  }>({});
  const [loading, setLoading] = useState(true);
  const [certificateError, setCertificateError] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setCertificateError(false);
        const [gatewayHealth, adminHealth, bookingHealth, bookingManagementHealth] = await Promise.allSettled([
          apiService.getGatewayHealth(),
          apiService.getAdminHealth(),
          apiService.getBookingHealth(),
          apiService.getBookingManagementHealth(),
        ]);

        // Check if any requests failed due to certificate errors
        const results = [gatewayHealth, adminHealth, bookingHealth, bookingManagementHealth];
        const hasCertificateError = results.some(result => {
          if (result.status === 'rejected') {
            const error = result.reason;
            return error?.code === 'ERR_CERT_AUTHORITY_INVALID' ||
                   error?.code === 'ERR_CERT_COMMON_NAME_INVALID' ||
                   error?.message?.includes('certificate') ||
                   error?.message?.includes('SSL') ||
                   error?.message?.includes('CERT') ||
                   error?.name === 'AxiosError';
          }
          return false;
        });

        if (hasCertificateError && config.apiBaseUrl.startsWith('https://')) {
          setCertificateError(true);
        }

        setHealth({
          gateway: gatewayHealth.status === 'fulfilled' ? gatewayHealth.value : undefined,
          admin: adminHealth.status === 'fulfilled' ? adminHealth.value : undefined,
          booking: bookingHealth.status === 'fulfilled' ? bookingHealth.value : undefined,
          bookingManagement: bookingManagementHealth.status === 'fulfilled' ? bookingManagementHealth.value : undefined,
        });
      } catch (error) {
        console.error('Error checking health:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  const retryConnection = () => {
    setLoading(true);
    setCertificateError(false);
    // Trigger a re-check after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (loading) {
    return <div className="loading">Checking system health...</div>;
  }

  const getHealthStatus = (healthData?: HealthResponse) => {
    if (!healthData) return 'unhealthy';
    return healthData.status === 'healthy' ? 'healthy' : 'unhealthy';
  };

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? '#28a745' : '#dc3545';
  };

  return (
    <div>
      <div className="card">
        <h1>Hotel Booking Management System</h1>
        <p>Welcome to the hotel booking management system. This application provides a complete solution for managing hotel bookings, rooms, users, and administrative tasks.</p>

        {certificateError && (
          <CertificateWarning
            apiUrl={config.apiBaseUrl}
            onRetry={retryConnection}
          />
        )}
      </div>

      <div className="card">
        <h2>System Health Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Gateway Service</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.gateway)) }}>
              ● {getHealthStatus(health.gateway)}
            </div>
            {health.gateway && (
              <small>Last checked: {health.gateway.timestamp}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Admin Service</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.admin)) }}>
              ● {getHealthStatus(health.admin)}
            </div>
            {health.admin && (
              <small>Service: {health.admin.service}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Booking Service</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.booking)) }}>
              ● {getHealthStatus(health.booking)}
            </div>
            {health.booking && (
              <small>Service: {health.booking.service}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Booking Management</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.bookingManagement)) }}>
              ● {getHealthStatus(health.bookingManagement)}
            </div>
            {health.bookingManagement && (
              <small>Service: {health.bookingManagement.service}</small>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Available Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h3>📅 Booking Management</h3>
            <p>Create, view, and cancel hotel room bookings with integrated payment processing.</p>
            <ul>
              <li>Real-time booking creation</li>
              <li>Payment integration</li>
              <li>Booking cancellation</li>
              <li>Status tracking</li>
            </ul>
          </div>

          <div>
            <h3>🏨 Room Management</h3>
            <p>Manage hotel room inventory and availability.</p>
            <ul>
              <li>Room listing and details</li>
              <li>Capacity management</li>
              <li>Availability tracking</li>
              <li>Room validation</li>
            </ul>
          </div>

          <div>
            <h3>👥 User Management</h3>
            <p>Manage system users and customer information.</p>
            <ul>
              <li>User directory</li>
              <li>User registration</li>
              <li>Profile management</li>
              <li>Booking history</li>
            </ul>
          </div>

          <div>
            <h3>⚙️ Administration</h3>
            <p>Administrative tools for hotel staff management and customer service.</p>
            <ul>
              <li>Employee management</li>
              <li>Complaint tracking</li>
              <li>System monitoring</li>
              <li>Reporting tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;