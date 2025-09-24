import React, { useState } from 'react';

interface CertificateWarningProps {
  apiUrl: string;
  onRetry: () => void;
}

const CertificateWarning: React.FC<CertificateWarningProps> = ({ apiUrl, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleTrustCertificate = () => {
    // Open the API URL in a new tab so user can accept the certificate
    window.open(apiUrl, '_blank');
    // Wait a moment then offer to retry
    setTimeout(() => {
      if (window.confirm('After accepting the certificate in the new tab, click OK to retry the connection.')) {
        onRetry();
      }
    }, 2000);
  };

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '4px',
      padding: '15px',
      margin: '20px 0',
      color: '#856404'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>
        🔒 SSL Certificate Issue
      </h3>
      <p>
        The application cannot connect to the API server due to an untrusted SSL certificate.
        This is expected when using self-signed certificates.
      </p>

      <div style={{ marginTop: '15px' }}>
        <button
          className="btn"
          onClick={handleTrustCertificate}
          style={{ marginRight: '10px', backgroundColor: '#ffc107', color: '#212529' }}
        >
          Trust Certificate & Retry
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showDetails && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Manual Steps to Trust Certificate:</strong>
          <ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Click "Trust Certificate & Retry" button above</li>
            <li>A new tab will open with the API URL: <code>{apiUrl}</code></li>
            <li>Your browser will show a security warning</li>
            <li>Click "Advanced" and then "Proceed to {new URL(apiUrl).hostname} (unsafe)"</li>
            <li>Return to this tab and the application should work</li>
          </ol>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
            <strong>Note:</strong> This is safe for development/testing environments with self-signed certificates.
            In production, use properly signed certificates from a trusted Certificate Authority.
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificateWarning;