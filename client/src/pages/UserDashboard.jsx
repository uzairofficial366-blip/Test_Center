import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/user/dashboard');
        setAssignments(res.data);
      } catch (err) {
        console.error('Error fetching dashboard', err);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    if(status === 'completed') return <span className="badge badge-success">Completed</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  return (
    <div className="animate-fade-in">
      <nav className="dashboard-nav">
        <div className="nav-brand">📚 EduTest Portal</div>
        <div className="nav-user">
          <span>{user?.name}</span>
          <button className="btn btn-outline" style={{ padding: '0.4rem 1rem' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        <h2>Your Assigned Tests</h2>
        
        {assignments.length === 0 ? (
          <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any tests assigned right now.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {assignments.map(a => (
              <div className="card" key={a._id}>
                <h3>{a.testId.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{a.testId.category}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="badge badge-info">{a.testId.duration} mins</span>
                  {getStatusBadge(a.status)}
                </div>
                
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <strong>Deadline:</strong> {new Date(a.testId.deadline).toLocaleString()}
                </p>
                
                {a.status !== 'completed' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/test/${a.testId._id}`)}
                  >
                    Enter Test Portal
                  </button>
                )}
                {a.status === 'completed' && (
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>Submitted</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
