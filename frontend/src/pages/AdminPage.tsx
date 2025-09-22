import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Employee, Complaint } from '../types';

const AdminPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'complaints'>('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  const [employeeForm, setEmployeeForm] = useState<Employee>({
    name: '',
    last_name: '',
    date_of_hiring: '',
    date_of_birthday: '',
    position: '',
  });

  const [complaintForm, setComplaintForm] = useState<Complaint>({
    customer: '',
    date: '',
    text: '',
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, complaintsData] = await Promise.all([
          apiService.getEmployees(),
          apiService.getComplaints(),
        ]);
        setEmployees(employeesData);
        setComplaints(complaintsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const newEmployee = await apiService.createEmployee(employeeForm);
      setEmployees([...employees, newEmployee]);
      setShowEmployeeForm(false);
      setEmployeeForm({
        name: '',
        last_name: '',
        date_of_hiring: '',
        date_of_birthday: '',
        position: '',
      });
    } catch (error: any) {
      setFormErrors([error.response?.data?.message || 'Error creating employee']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const newComplaint = await apiService.createComplaint(complaintForm);
      setComplaints([...complaints, newComplaint]);
      setShowComplaintForm(false);
      setComplaintForm({
        customer: '',
        date: '',
        text: '',
      });
    } catch (error: any) {
      setFormErrors([error.response?.data?.message || 'Error creating complaint']);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin data...</div>;
  }

  return (
    <div>
      <div className="card">
        <h1>Administration</h1>
        <p>Administrative tools for hotel staff management and customer service.</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className={`btn ${activeTab === 'employees' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('employees')}
          >
            Employees ({employees.length})
          </button>
          <button
            className={`btn ${activeTab === 'complaints' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('complaints')}
          >
            Complaints ({complaints.length})
          </button>
        </div>

        {activeTab === 'employees' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Employees</h2>
              <button className="btn" onClick={() => setShowEmployeeForm(!showEmployeeForm)}>
                {showEmployeeForm ? 'Cancel' : 'Add Employee'}
              </button>
            </div>

            {showEmployeeForm && (
              <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3>Add New Employee</h3>
                <form onSubmit={handleEmployeeSubmit}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={employeeForm.last_name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={employeeForm.date_of_birthday}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, date_of_birthday: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Hiring</label>
                    <input
                      type="date"
                      value={employeeForm.date_of_hiring}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, date_of_hiring: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={employeeForm.position}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                      placeholder="e.g., Front Desk Manager, Housekeeper"
                      required
                    />
                  </div>

                  {formErrors.length > 0 && (
                    <div className="error">
                      {formErrors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Employee'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeForm(false)} style={{ marginLeft: '10px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Date of Birth</th>
                  <th>Date of Hiring</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.name} {employee.last_name}</td>
                    <td>{employee.position}</td>
                    <td>{new Date(employee.date_of_birthday).toLocaleDateString()}</td>
                    <td>{new Date(employee.date_of_hiring).toLocaleDateString()}</td>
                    <td>{employee.created_at && new Date(employee.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {employees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No employees found. Add your first employee!
              </div>
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Complaints</h2>
              <button className="btn" onClick={() => setShowComplaintForm(!showComplaintForm)}>
                {showComplaintForm ? 'Cancel' : 'Add Complaint'}
              </button>
            </div>

            {showComplaintForm && (
              <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3>Add New Complaint</h3>
                <form onSubmit={handleComplaintSubmit}>
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      value={complaintForm.customer}
                      onChange={(e) => setComplaintForm({ ...complaintForm, customer: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Complaint</label>
                    <input
                      type="date"
                      value={complaintForm.date}
                      onChange={(e) => setComplaintForm({ ...complaintForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Complaint Details</label>
                    <textarea
                      value={complaintForm.text}
                      onChange={(e) => setComplaintForm({ ...complaintForm, text: e.target.value })}
                      placeholder="Describe the complaint in detail..."
                      required
                    />
                  </div>

                  {formErrors.length > 0 && (
                    <div className="error">
                      {formErrors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Complaint'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowComplaintForm(false)} style={{ marginLeft: '10px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Complaint</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td>{complaint.id}</td>
                    <td>{complaint.customer}</td>
                    <td>{new Date(complaint.date).toLocaleDateString()}</td>
                    <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                      {complaint.text.length > 100 ? complaint.text.substring(0, 100) + '...' : complaint.text}
                    </td>
                    <td>{complaint.created_at && new Date(complaint.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {complaints.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No complaints found. Add your first complaint record!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;