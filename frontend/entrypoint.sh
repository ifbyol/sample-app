#!/bin/sh

# Generate runtime configuration
cat <<EOF > /usr/share/nginx/html/config.js
window.ENV = {
  GATEWAY_API_BASE_URL: '${GATEWAY_API_BASE_URL:-http://localhost:8082}',
  IGNORE_SSL_ERRORS: '${IGNORE_SSL_ERRORS:-false}'
};
EOF

# Start nginx
nginx -g "daemon off;"