# Admin

A REST API service for hotel administration built with Node.js, Express.js and MySQL.

**Features:**
- Employee management (create and retrieve)
- Customer complaint management (create and retrieve)
- MySQL database integration
- Input validation and error handling
- Baggage header propagation for distributed tracing
- Structured logging with Winston

**Endpoints:**
- `GET /health` - Health check with database connectivity
- `GET /` - Service information and available endpoints
- `GET /admin/employee` - Retrieve all employees
- `POST /admin/employee` - Create new employee
- `GET /admin/complaint` - Retrieve all complaints
- `POST /admin/complaint` - Create new complaint

**Technology Stack:**
- Node.js 20
- Express.js
- MySQL 8.0
- Winston (logging)
- Helmet & CORS (security)
- Okteto

**Okteto Deployment:**
```bash
okteto deploy --remote
```

**Development with Okteto:**
```bash
# Start development environment with live sync
okteto up

# Once inside the development container, install dependencies and start
npm install && npm run dev

# Access API endpoints from within the development container
curl http://localhost:3001/health
curl http://localhost:3001/
curl http://localhost:3001/admin/employee
curl -H "Content-Type: application/json" -d '{"name":"John","last_name":"Doe","date_of_hiring":"2024-01-15","date_of_birthday":"1990-05-20","position":"Manager"}' http://localhost:3001/admin/employee
curl http://localhost:3001/admin/complaint
curl -H "Content-Type: application/json" -d '{"customer":"Jane Smith","date":"2024-01-20","text":"Room was not cleaned properly during my stay."}' http://localhost:3001/admin/complaint
```

**Database Schema:**
- **Employees**: id, name, last_name, date_of_hiring, date_of_birthday, position, timestamps
- **Complaints**: id, customer, date, text, timestamps
- Includes 20 sample employees and 25 sample complaints for testing

**Input Validation:**
- Employee creation validates all required fields and date logic
- Complaint creation validates text length (10-5000 chars) and prevents future dates
- Comprehensive error messages for invalid input