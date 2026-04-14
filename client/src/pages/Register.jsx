import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollno, setRollno] = useState('');
  const [cnic, setCnic] = useState('');
  const [picture, setPicture] = useState(null);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      if (rollno) formData.append('rollno', rollno);
      if (cnic) formData.append('cnic', cnic);
      if (picture) formData.append('profilePic', picture);

      // We need to use api directly since AuthContext register might only take 3 params right now.
      // Wait, let's just pass this down to the AuthContext register if we update it.
      // Easiest is to update AuthContext register to take formData.
      await register(formData);
      navigate('/dashboard'); // Only students can register normally
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <div className="glass-card auth-card" style={{ maxWidth: '500px' }}>
        <div className="page-header">
          <h1>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign up to start taking tests</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Profile Picture</label>
            <input 
              type="file" 
              className="form-control" 
              accept="image/*"
              onChange={(e) => setPicture(e.target.files[0])}
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Roll Number</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                value={rollno}
                onChange={(e) => setRollno(e.target.value)}
                placeholder="1001"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>CNIC (Numbers only)</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="3520212345678"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Sign Up
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
