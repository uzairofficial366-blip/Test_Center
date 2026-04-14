import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('tests');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, usersRes, resultsRes] = await Promise.all([
        api.get('/admin/tests'),
        api.get('/admin/users'),
        api.get('/admin/results')
      ]);
      setTests(testsRes.data);
      setUsers(usersRes.data);
      setResults(resultsRes.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const assignTest = async (userId, testId) => {
    try {
      await api.post('/admin/assign', { userId, testId });
      alert('Test successfully assigned!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning test');
    }
  };

  const uploadTest = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.post('/admin/upload-test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Test uploaded successfully!');
      e.target.reset();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading test');
    }
  };

  const thStyle = {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.85rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '0.85rem 1rem',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.4rem',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
  });

  return (
    <div className="animate-fade-in">
      <nav className="dashboard-nav">
        <div className="nav-brand">⚙️ Admin Control Panel</div>
        <div className="nav-user">
          <span>{user?.name} (Admin)</span>
          <button className="btn btn-outline" style={{ padding: '0.4rem 1rem' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-container">

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '2rem' }}>
          <button id="tab-tests" style={tabStyle('tests')} onClick={() => setActiveTab('tests')}>📋 Tests</button>
          <button id="tab-assign" style={tabStyle('assign')} onClick={() => setActiveTab('assign')}>👤 Assign</button>
          <button id="tab-results" style={tabStyle('results')} onClick={() => setActiveTab('results')}>📊 Results</button>
        </div>

        {/* ── TESTS TAB ── */}
        {activeTab === 'tests' && (
          <>
            <h2>Upload New Test</h2>
            <div className="card" style={{ marginBottom: '3rem' }}>
              <form onSubmit={uploadTest} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" name="category" className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input type="number" name="duration" className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="datetime-local" name="startTime" className="form-control" required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="datetime-local" name="endTime" className="form-control" required />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="datetime-local" name="deadline" className="form-control" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Questions File (CSV, DOCX, or PDF)</label>
                  <input type="file" name="testFile" className="form-control" accept=".csv,.pdf,.docx" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Results File (Optional — CSV, DOCX, or PDF)</label>
                  <input type="file" name="resultFile" className="form-control" accept=".csv,.pdf,.docx" />
                </div>
                <button type="submit" className="btn btn-success" style={{ gridColumn: '1 / -1' }}>Upload and Create Test</button>
              </form>
            </div>

            <h2>Available Tests</h2>
            <div className="grid-cards">
              {tests.map(test => (
                <div className="card" key={test._id}>
                  <h3>{test.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{test.category}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="badge badge-info">{test.duration} mins</span>
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>
                    <strong>Deadline:</strong> {new Date(test.deadline).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ASSIGN TAB ── */}
        {activeTab === 'assign' && (
          <>
            <h2>Assign Tests to Users</h2>
            <div className="grid-cards">
              {users.map(u => (
                <div className="card" key={u._id}>
                  <h3>{u.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{u.email}</p>
                  {u.rollno && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Roll No: {u.rollno}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <select id={`test-select-${u._id}`} className="form-control" defaultValue="">
                      <option value="" disabled>Select a test...</option>
                      {tests.map(t => (
                        <option key={t._id} value={t._id}>{t.title}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const select = document.getElementById(`test-select-${u._id}`);
                        if (select.value) assignTest(u._id, select.value);
                      }}
                    >
                      Assign Selected Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── RESULTS TAB ── */}
        {activeTab === 'results' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Submitted Results</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {results.length} submission{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No results yet. Students will appear here after submitting a test.
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Roll No</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Test</th>
                      <th style={thStyle}>Score</th>
                      <th style={thStyle}>Percentage</th>
                      <th style={thStyle}>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => {
                      const total = r.totalQuestions || 0;
                      const pct = total > 0 ? Math.round((r.score / total) * 100) : 0;
                      const pctColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr
                          key={r._id}
                          style={{
                            background: idx % 2 === 0 ? 'var(--card-bg)' : 'rgba(255,255,255,0.03)',
                            transition: 'background 0.15s'
                          }}
                        >
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.rollno || '—'}</td>
                          <td style={tdStyle}>{r.name}</td>
                          <td style={tdStyle}>{r.testId?.title || '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                            {r.score} / {total}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.75rem',
                              borderRadius: '999px',
                              background: pctColor + '22',
                              color: pctColor,
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              {total > 0 ? `${pct}%` : 'N/A'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {new Date(r.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
