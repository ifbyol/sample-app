# Admin Service - Development Guide

## Overview

The Admin service is a REST API built with Node.js and Express.js that handles hotel administration operations. It provides employee management and customer complaint tracking functionality with MySQL database integration, comprehensive input validation, and distributed tracing support.

## Architecture & Structure

```
admin/
├── src/
│   ├── config/          # Configuration and database connection
│   ├── middleware/      # Custom middleware (baggage handling)
│   ├── routes/          # API route handlers
│   ├── utils/           # Utility functions (logging)
│   └── app.js           # Main application entry point
├── db/scripts/          # Database initialization scripts
├── tests/               # Test files (placeholder for future tests)
├── Dockerfile           # Multi-stage Docker build
├── package.json         # Dependencies and scripts
└── CLAUDE.md           # This development guide
```

## Development Setup

### Prerequisites
- Node.js 20+
- MySQL 8.0 (when running locally)
- npm or yarn package manager

### Local Development Commands
```bash
# Install dependencies
npm install

# Start in development mode (with auto-reload)
npm run dev

# Start in production mode
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Environment Variables
Configure these environment variables:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `DB_HOST` - MySQL host (default: localhost)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USER` - Database user (default: admin)
- `DB_PASSWORD` - Database password (default: admin)
- `DB_NAME` - Database name (default: admin_db)

## API Endpoints

### Health Check
**GET /health**
Returns service health status and database connectivity.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "admin",
  "version": "1.0.0",
  "database": "connected"
}
```

### Service Information
**GET /**
Returns service information and available endpoints.

Response:
```json
{
  "service": "Admin Service",
  "version": "1.0.0",
  "description": "Admin service for booking management system",
  "endpoints": {
    "health": "/health",
    "root": "/",
    "employees": {
      "getAll": "GET /admin/employee",
      "create": "POST /admin/employee"
    },
    "complaints": {
      "getAll": "GET /admin/complaint",
      "create": "POST /admin/complaint"
    }
  }
}
```

### Employee Management

#### GET /admin/employee
Retrieve all employees from the database.

Response:
```json
{
  "success": true,
  "count": 20,
  "employees": [
    {
      "id": 1,
      "name": "John",
      "last_name": "Smith",
      "date_of_hiring": "2020-03-15",
      "date_of_birthday": "1985-07-22",
      "position": "Front Desk Manager",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /admin/employee
Create a new employee.

Request Body:
```json
{
  "name": "Jane",
  "last_name": "Doe",
  "date_of_hiring": "2024-01-15",
  "date_of_birthday": "1990-05-20",
  "position": "Manager"
}
```

Validation Rules:
- All fields are required
- Dates must be in YYYY-MM-DD format
- Date of hiring must be after date of birthday
- Name and last_name must be valid strings

Response (201):
```json
{
  "success": true,
  "message": "Employee created successfully",
  "employee": {
    "id": 21,
    "name": "Jane",
    "last_name": "Doe",
    "date_of_hiring": "2024-01-15",
    "date_of_birthday": "1990-05-20",
    "position": "Manager",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Complaint Management

#### GET /admin/complaint
Retrieve all complaints from the database.

Response:
```json
{
  "success": true,
  "count": 25,
  "complaints": [
    {
      "id": 1,
      "customer": "John Doe",
      "date": "2024-01-15",
      "text": "The air conditioning in room 205 was not working properly...",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /admin/complaint
Create a new complaint.

Request Body:
```json
{
  "customer": "Jane Smith",
  "date": "2024-01-20",
  "text": "Room was not cleaned properly during my stay."
}
```

Validation Rules:
- All fields are required
- Date must be in YYYY-MM-DD format and not in the future
- Customer name must be 2-255 characters
- Text must be 10-5000 characters

Response (201):
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "complaint": {
    "id": 26,
    "customer": "Jane Smith",
    "date": "2024-01-20",
    "text": "Room was not cleaned properly during my stay.",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## Database Integration

### Connection Management
- Uses MySQL2 with connection pooling
- Connection pool configured with 10 max connections
- Automatic connection testing on startup
- Graceful connection handling and error recovery

### Database Schema

#### Employees Table
```sql
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_hiring DATE NOT NULL,
    date_of_birthday DATE NOT NULL,
    position VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Complaints Table
```sql
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sample Data
- **20 employees** with realistic data across various hotel positions
- **25 complaints** covering common hotel service issues
- Data includes realistic names, dates, and detailed complaint scenarios

### Database Operations
- Uses prepared statements to prevent SQL injection
- Proper error handling and connection management
- Transaction-safe operations where needed
- Optimized queries with appropriate indexing

## Deployment

### Okteto
For deployment and development:
```bash
# Deploy to Okteto
okteto deploy --remote

# Development environment
okteto up
# Then inside container:
npm install && npm run dev
```

### Docker
```bash
# Build image
docker build -t admin-service .

# Run container
docker run -p 3001:3001 \
  -e DB_HOST=mysql \
  -e DB_USER=admin \
  -e DB_PASSWORD=admin \
  admin-service
```

## Baggage Header Propagation

### Overview
The service implements comprehensive baggage header handling for distributed tracing:

### Incoming Requests
- All incoming HTTP requests are processed by `baggageMiddleware`
- The `baggage` header is extracted and stored in the request object
- Baggage is automatically added to response headers for downstream services

### Logging Integration
- All log messages automatically include baggage information when available
- Uses structured JSON logging with Winston
- Example log entry:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Employee created successfully",
  "employeeId": 21,
  "baggage": "trace-id=abc123,span-id=def456"
}
```

### Usage in Route Handlers
Always pass the request object to logging functions:
```javascript
logger.info('Processing employee creation', { name, position }, req);
```

## Input Validation & Error Handling

### Validation Strategy
- **Server-side validation** for all input data
- **Business rule validation** (e.g., hiring date after birthday)
- **Data type and format validation** for dates and strings
- **Length validation** for text fields

### Error Response Format
All errors follow a consistent format:
```json
{
  "success": false,
  "error": "Bad request",
  "message": "Specific error description"
}
```

### Common Validation Rules
- **Required fields**: All endpoint-specific fields must be provided
- **Date validation**: Must be valid dates in YYYY-MM-DD format
- **Business logic**: Hiring dates, complaint dates, text lengths
- **String lengths**: Customer names, position titles, complaint text

### HTTP Status Codes
- `200` - Successful GET requests
- `201` - Successful resource creation
- `400` - Bad request (validation errors)
- `500` - Internal server error
- `503` - Service unavailable (health check failure)

## Logging Best Practices

### Context-Aware Logging
Always use the logger utility with request context:
```javascript
const logger = require('../utils/logger');

// Good - includes baggage automatically
logger.info('Operation completed', { count: items.length }, req);

// Avoid - loses request context
console.log('Operation completed');
```

### Log Levels
- `info` - Normal operations, successful requests
- `error` - Errors that need attention, failed operations
- `warn` - Unusual but non-fatal situations, validation failures
- `debug` - Detailed debugging information (development only)

### Structured Logging
Include relevant context in logs:
```javascript
logger.info('Creating new employee', {
  name: employee.name,
  position: employee.position,
  requestId: req.id
}, req);
```

## Security Considerations

### Input Sanitization
- All user inputs are validated and sanitized
- Prepared statements prevent SQL injection
- Input length limits prevent buffer overflow attacks

### Security Middleware
- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configures cross-origin resource sharing
- **Express JSON**: Limits request body size (10MB)

### Database Security
- Uses connection pooling with limited connections
- Prepared statements for all database queries
- No sensitive information in error responses (production mode)

## Testing Strategy

### Test Structure (Future Enhancement)
```javascript
// Example test structure for future implementation
describe('Employee Endpoints', () => {
  test('GET /admin/employee returns all employees', async () => {
    const response = await request(app).get('/admin/employee');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Testing Considerations
- Database integration testing with test database
- Input validation testing with edge cases
- Error handling testing for all failure scenarios
- Performance testing for database operations

## Performance Considerations

### Database Performance
- Connection pooling prevents connection overhead
- Proper indexing on frequently queried columns
- Efficient SQL queries with appropriate LIMIT clauses

### API Performance
- Minimal data processing in route handlers
- Efficient JSON serialization
- Appropriate HTTP caching headers (future enhancement)

### Monitoring
- Structured logging enables performance monitoring
- Request/response timing in logs
- Database connection pool monitoring

## Common Patterns

### Adding New Endpoints
1. Create route handler in appropriate routes file
2. Add input validation with detailed error messages
3. Include comprehensive logging with request context
4. Add route to main app.js
5. Update service information endpoint

### Database Operations
```javascript
// Standard pattern for database operations
router.post('/endpoint', async (req, res) => {
  try {
    // Validation
    if (!requiredField) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required field'
      });
    }

    // Database operation
    const pool = getPool();
    const [result] = await pool.execute(query, params);

    // Success response
    logger.info('Operation successful', { id: result.insertId }, req);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Operation failed', { error: error.message }, req);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

### Error Handling Pattern
```javascript
// Consistent error handling across all endpoints
catch (error) {
  logger.error('Specific operation failed', {
    error: error.message,
    operation: 'specific_operation'
  }, req);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'User-friendly error message'
  });
}
```

## Maintaining This Documentation

### When to Update CLAUDE.md

This documentation should be updated whenever making significant changes to the service:

**Always Update When:**
- Adding new API endpoints or modifying existing ones
- Changing database schema or adding new tables
- Modifying validation rules or error handling
- Adding new middleware or changing request processing
- Updating environment variables or configuration
- Changing authentication or security measures
- Adding new dependencies or changing Node.js version
- Modifying logging patterns or baggage handling

**Consider Updating When:**
- Adding new utility functions or helper methods
- Changing database queries or optimization strategies
- Modifying Docker configuration or deployment procedures
- Adding new testing approaches or frameworks
- Updating performance optimizations

### Documentation Standards
- Keep API examples up-to-date with actual responses
- Include both success and error scenarios
- Provide clear explanations for business logic
- Update version numbers and dependency versions
- Maintain consistent formatting and structure

Remember: Good documentation enables efficient development, debugging, and maintenance of the admin service.