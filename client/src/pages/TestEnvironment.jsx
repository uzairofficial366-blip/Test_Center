import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const TestEnvironment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const timerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchTestDetails();
    return () => clearInterval(timerRef.current);
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      const res = await api.get(`/user/test/${id}`);
      setTestData(res.data.test);
      setAssignment(res.data.assignment);
      setQuestions(res.data.questions || []);
      
      if (res.data.assignment.startedAt) {
        setIsStarted(true);
        calculateTimeLeft(res.data.assignment.startedAt, res.data.test.duration);
      }
    } catch (err) {
      alert('Error loading test');
      navigate('/dashboard');
    }
  };

  const calculateTimeLeft = (startTime, durationInMinutes) => {
    const end = new Date(startTime).getTime() + durationInMinutes * 60000;
    
    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const difference = end - now;
      
      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        handleAutoSubmit();
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTest = async () => {
    try {
      const res = await api.post(`/user/test/${id}/start`);
      setIsStarted(true);
      setAssignment(res.data);
      calculateTimeLeft(res.data.startedAt, testData.duration);
      // refetch to get questions if they weren't sent before
      const detailsRes = await api.get(`/user/test/${id}`);
      setQuestions(detailsRes.data.questions || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Error starting test');
    }
  };

  const handleOptionSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    
    if (e && !window.confirm("Are you sure you want to submit your test?")) {
      return;
    }

    await submitExam();
  };

  const handleAutoSubmit = async () => {
    alert("Time is up! Auto-submitting your test.");
    await submitExam();
  };

  const submitExam = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedOption: answers[qId]
    }));

    try {
      await api.post(`/user/test/${id}/submit`, { answers: formattedAnswers });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting test');
      setSubmitting(false);
    }
  };

  if (!testData || !assignment) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Portal...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="dashboard-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{testData.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{testData.category}</p>
          </div>
          {isStarted && (
            <div className={`test-timer ${timeLeft > 120 ? 'safe' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {!isStarted ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Ready to begin?</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
            Once you start, the timer ({testData.duration} minutes) will begin. You cannot pause it.
          </p>
          <button className="btn btn-primary" style={{ maxWidth: '200px' }} onClick={startTest}>
            Start Test Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>

          {currentQ && (
            <div className="card" style={{ marginBottom: '1.5rem', minHeight: '300px' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                {currentQ.questionText}
              </h3>
              <div className="question-options">
                {currentQ.options.map(opt => (
                  <label 
                    key={opt}
                    className={`option-box ${answers[currentQ._id] === opt ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name={`question_${currentQ._id}`} 
                      value={opt}
                      checked={answers[currentQ._id] === opt}
                      onChange={() => handleOptionSelect(currentQ._id, opt)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        border: '2px solid',
                        borderColor: answers[currentQ._id] === opt ? 'var(--primary)' : 'var(--text-secondary)',
                        background: answers[currentQ._id] === opt ? 'var(--primary)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}></div>
                      <span>{opt}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '4rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ maxWidth: '150px' }}
              onClick={handlePrev}
              disabled={currentIndex === 0 || submitting}
            >
              Previous
            </button>
            
            {currentIndex < questions.length - 1 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ maxWidth: '150px' }}
                onClick={handleNext}
                disabled={submitting}
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ maxWidth: '150px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default TestEnvironment;
