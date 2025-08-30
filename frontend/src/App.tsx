import { useState, useRef, useEffect } from 'react';
import './App.css';

const courses = [
  'Data Science',
  'Digital Marketing',
  'Database',
  'Data Analytics',
  'Cloud & DevOps',
  'Data Analysis',
  'Programming Languages',
  'Software Testing',
  'Kids',
  'Internship',
  'Other',
];

function App() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: "Greetings from Urbancode! I'm your personal assistant.",
      timestamp: new Date()
    },
    { 
      role: 'bot', 
      content: 'Enter your name....',
      timestamp: new Date()
    }
  ]);
  const [showThankYou, setShowThankYou] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1h ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d ago';
    return `${diffInDays}d ago`;
  };

  const addMessage = (role: 'bot' | 'user', content: string) => {
    setMessages(msgs => [...msgs, { role, content, timestamp: new Date() }]);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showThankYou]);

  // Validation functions
  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Name cannot be empty. Please enter your full name.";
    }
    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters long.";
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      return "Name should only contain letters and spaces.";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return "Email cannot be empty.";
    }
    
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email format (e.g., name@example.com).";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      return "Phone number cannot be empty.";
    }
    
    // Remove any spaces, dashes, or other characters
    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with +91
    if (cleanPhone.startsWith('+91')) {
      const digits = cleanPhone.substring(3);
      if (!/^\d{10}$/.test(digits)) {
        return "Phone number must be +91 followed by exactly 10 digits (e.g., +91 9876543210).";
      }
      return null;
    }
    
    // Check if it's just 10 digits (we'll add +91 automatically)
    if (/^\d{10}$/.test(cleanPhone)) {
      return null; // Valid - we'll add +91 prefix
    }
    
    return "Please enter phone number in format: +91 followed by 10 digits (e.g., +91 9876543210) or just 10 digits.";
  };

  const formatPhone = (phone: string): string => {
    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+91')) {
      return cleanPhone;
    }
    if (/^\d{10}$/.test(cleanPhone)) {
      return `+91${cleanPhone}`;
    }
    return phone; // Return as-is if invalid (validation should catch this)
  };

   const handleSend = async () => {
    if (!input.trim()) return;
    
    if (step === 0) {
      const nameError = validateName(input);
      if (nameError) {
        addMessage('user', input);
        addMessage('bot', `❌ ${nameError}`);
        setInput('');
        return;
      }
      
      setName(input.trim());
      addMessage('user', input);
      addMessage('bot', 'Enter your email address..');
      setStep(1);
      setInput('');
      
    } else if (step === 1) {
      const emailError = validateEmail(input);
      if (emailError) {
        addMessage('user', input);
        addMessage('bot', `❌ ${emailError}`);
        setInput('');
        return;
      }
      
      setEmail(input.trim());
      addMessage('user', input);
      addMessage('bot', 'Hello, we are running exciting offers on all our 48+ courses. May I know which course you are looking for? Or you can also call on IND : +91 98787 98797 for all your course related enquiries.');
      addMessage('bot', 'Please Select your course');
      setStep(2);
      setInput('');
      
    } else if (step === 2) {
      setCourse(input);
      addMessage('user', input);
      addMessage('bot', 'Please share your contact number to get call from our Course coordinators.');
      setStep(3);
      setInput('');
      
    } else if (step === 3) {
      const phoneError = validatePhone(input);
      if (phoneError) {
        addMessage('user', input);
        addMessage('bot', `❌ ${phoneError}`);
        setInput('');
        return;
      }
      
      const formattedPhone = formatPhone(input);
      addMessage('user', input);
      setShowThankYou(true);
      setStep(4);
      setInput('');
      setSending(true);
      setError('');
      
      try {
        const enquiryData = {
          name: name.trim(),
          email: email.trim(),
          course: course,
          phone: formattedPhone
        };
        
        const res = await fetch('https://chatbot-uz71.onrender.com/submit-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enquiryData)
        });
        
        if (!res.ok) {  
          const altRes = await fetch('https://chatbot-uz71.onrender.com/submit-details-alternative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enquiryData)
          });
          
          if (!altRes.ok) {
            throw new Error('Both email methods failed.');
          }
        }
      } catch (e) {
        setError('Failed to send details, but your information has been saved. We will contact you soon.');
        console.error("Submission error:", e);
      }
      setSending(false);
    }
  };

  const handleCourseSelect = async (c: string) => {                    
    setCourse(c);
    addMessage('user', c);
    addMessage('bot', 'Please share your contact number to get call from our Course coordinators.');
    setStep(3);
    setInput('');
  };

  return (
    <>
      {open && (
        <div className="chatbot-window-modern">
          <div className="chatbot-header-modern">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-modern">
                <img src="/urbancode-logo.jpg" alt="logo" />
              </div>
              <div className="chatbot-title-container">
                <span className="chatbot-title-modern">Urbancode Assistant</span>
                <span className="chatbot-status">Online</span>
              </div>
            </div>
            <div className="chatbot-header-right">
              <button className="chatbot-icon-btn-modern" title="Minimize">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12H18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="chatbot-icon-btn-modern" title="Refresh" onClick={() => window.location.reload()}>
                {/* <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4v6h6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20v-6h-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
              </button>
              <button className="chatbot-icon-btn-modern" title="Close" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="chatbot-messages-modern">
            <div className="welcome-banner">
              <h3>Welcome to Urbancode!</h3>
              <p>How can I assist you today?</p>
            </div>
            
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg-modern ${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="chatbot-avatar-small">
                    <img src="/get.png" alt="Assistant" />
                  </div>
                )}
                <div className="chatbot-msg-content">
                  <div className="chatbot-msg-bubble">{msg.content}</div>
                  <div className="chatbot-msg-timestamp">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {showThankYou && (
              <div className="thankyou-message-modern">
                <div className="thankyou-icon">✓</div>
                <h3>Thank you for your inquiry!</h3>
                <p>We will be sharing the course details to your WhatsApp shortly.</p>
                <div className="signature">
                  <p className="tagline">Dream big, learn bigger.</p>
                  <img src="/urbancode-logo.jpg" alt="Urbancode Logo" className="logo" />
                  <p className="mission">Empowering Your Future, One Course at a Time.</p>
                </div>
                {sending && <div className="sending-indicator">Sending details...</div>}
                {error && <div className="error-message">{error}</div>}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {!showThankYou && (
            <div className="chatbot-input-container">
              {step === 2 ? (
                <div className="course-selection">
                  <p className="instruction">Please select your course:</p>
                  <div className="course-options">
                    {courses.map(c => (
                      <button 
                        key={c} 
                        className={`course-option ${course === c ? 'selected' : ''}`}
                        onClick={() => handleCourseSelect(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <input
                    type={step === 1 ? 'email' : step === 3 ? 'tel' : 'text'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={step === 0 ? "Enter your name..." : step === 1 ? "Enter your email..." : "Enter your phone number..."}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="chat-input"
                  />
                  <button onClick={handleSend} className="send-button" disabled={!input.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
