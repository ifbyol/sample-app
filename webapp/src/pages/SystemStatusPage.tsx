import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { HealthResponse } from '../types';
import CertificateWarning from '../components/CertificateWarning';
import config from '../utils/config';

const SystemStatusPage: React.FC = () => {
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const retryConnection = () => {
    setLoading(true);
    setCertificateError(false);
    // Trigger a re-check after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getHealthStatus = (healthData?: HealthResponse) => {
    if (!healthData) return 'unhealthy';
    return healthData.status === 'healthy' ? 'healthy' : 'unhealthy';
  };

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? '#28a745' : '#dc3545';
  };


  if (loading) {
    return <div className="loading">Checking system status...</div>;
  }

  return (
    <div>
      <div className="card">
        <h1>System Status</h1>
        <p>Monitor the health and status of all system services.</p>

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
            {health.gateway && health.gateway.timestamp && (
              <small>Last checked: {health.gateway.timestamp}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Admin Service</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.admin)) }}>
              ● {getHealthStatus(health.admin)}
            </div>
            {health.admin && health.admin.service && (
              <small>Service: {health.admin.service}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Booking Service</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.booking)) }}>
              ● {getHealthStatus(health.booking)}
            </div>
            {health.booking && health.booking.service && (
              <small>Service: {health.booking.service}</small>
            )}
          </div>

          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>Booking Management</h3>
            <div style={{ color: getHealthColor(getHealthStatus(health.bookingManagement)) }}>
              ● {getHealthStatus(health.bookingManagement)}
            </div>
            {health.bookingManagement && health.bookingManagement.service && (
              <small>Service: {health.bookingManagement.service}</small>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Service Information</h2>
        <p>The system consists of multiple microservices that work together to provide the complete hotel booking management solution.</p>
        <ul>
          <li><strong>Gateway Service:</strong> Routes requests and provides API access</li>
          <li><strong>Admin Service:</strong> Handles employee and complaint management</li>
          <li><strong>Booking Service:</strong> Processes room reservations and payments</li>
          <li><strong>Booking Management Service:</strong> Manages users, rooms, and booking data</li>
        </ul>
        <p><em>Status updates automatically every 30 seconds</em></p>
      </div>
    </div>
  );
};

export default SystemStatusPage;