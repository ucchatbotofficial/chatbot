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
  const [open, setOpen] = useState(false);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showThankYou]);

  // Validation functions (unchanged)
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
    
    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
    
    if (cleanPhone.startsWith('+91')) {
      const digits = cleanPhone.substring(3);
      if (!/^\d{10}$/.test(digits)) {
        return "Phone number must be +91 followed by exactly 10 digits (e.g., +91 9876543210).";
      }
      return null;
    }
    
    if (/^\d{10}$/.test(cleanPhone)) {
      return null;
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
    return phone;
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
        
        console.log("Sending enquiry data:", enquiryData);
        
        const res = await fetch('https://chatbot-uz71.onrender.com/submit-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enquiryData)
        });
        
        if (!res.ok) {  
          console.log("Main email endpoint failed, trying alternative...");
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
      {/* Floating Chat Button */}
      {!open && (
        <button
          className="chatbot-fab"
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
        >
          <div className="fab-icon-container">
            <img src="/get.png" alt="Chat" className="fab-icon" />
          </div>
          <span className="pulse-ring"></span>
        </button>
      )}
      
      {/* Chat Window */}
      {open && (
        <div className="chatbot-window-modern">
          <div className="chatbot-header-modern">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-modern">
                <img src="/urbancode-logo.jpg" alt="logo" />
              </div>
              <div className="chatbot-title-container">
                <span className="chatbot-title-modern">Urbancode Assistant</span>
                <span className="chatbot-status">Online • Typically replies instantly</span>
              </div>
            </div>
            <div className="chatbot-header-right">
              <button className="chatbot-icon-btn-modern" title="Refresh" onClick={() => window.location.reload()}>
                <span className="icon-refresh">↻</span>
              </button>
              <button className="chatbot-icon-btn-modern" title="Close" onClick={() => setOpen(false)}>
                <span className="icon-close">×</span>
              </button>
            </div>
          </div>
          
          <div className="chatbot-messages-modern">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg-modern ${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="chatbot-avatar-small">
                    <img src="/get.png" alt="Bot" />
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
                <div className="thankyou-title">Thank you for sharing your details!</div>
                <div className="thankyou-text">We will be sharing the course details to your WhatsApp shortly.</div>
                <div className="thankyou-quote">Dream big, learn bigger.</div>
                <img src="/urbancode-logo.jpg" alt="Urbancode Logo" className="thankyou-logo" />
                <div className="thankyou-footer">Empowering Your Future, One Course at a Time.</div>
                {sending && <div className="sending-indicator">Sending details to email and WhatsApp...</div>}
                {error && <div className="error-message">{error}</div>}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {!showThankYou && (
            <div className="chatbot-input-row-modern">
              {step === 2 ? (
                <div className="course-dropdown-container">
                  <label className="course-dropdown-label">Please Select your course:</label>
                  <select 
                    className="course-dropdown"
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    value={course}
                  >
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <input
                    type={step === 1 ? 'email' : step === 3 ? 'tel' : 'text'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your response..."
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="chatbot-input-modern"
                  />
                  <button onClick={handleSend} className="send-btn-modern" disabled={!input.trim()}>
                    <span className="send-icon">→</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      <style>{`
        /* Floating Action Button */
        .chatbot-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          background: #1AB79D;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(26, 183, 157, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          animation: float 3s ease-in-out infinite;
        }
        
        .chatbot-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(26, 183, 157, 0.4);
        }
        
        .fab-icon-container {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .fab-icon {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(26, 183, 157, 0.4);
          animation: pulse 2s infinite;
          z-index: -1;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        /* Chat Window */
        .chatbot-window-modern {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 380px;
          height: 580px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Header */
        .chatbot-header-modern {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .chatbot-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chatbot-avatar-modern {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chatbot-avatar-modern img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .chatbot-title-container {
          display: flex;
          flex-direction: column;
        }
        
        .chatbot-title-modern {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .chatbot-status {
          font-size: 12px;
          color: #1AB79D;
          margin-top: 2px;
        }
        
        .chatbot-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .chatbot-icon-btn-modern {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          font-size: 18px;
          color: #666;
        }
        
        .chatbot-icon-btn-modern:hover {
          background: #f5f5f5;
        }
        
        /* Messages Area */
        .chatbot-messages-modern {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .chatbot-msg-modern {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .chatbot-msg-modern.user {
          flex-direction: row-reverse;
        }
        
        .chatbot-avatar-small {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          background: #f0f0f0;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chatbot-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .chatbot-msg-content {
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }
        
        .chatbot-msg-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          animation: messageAppear 0.3s ease-out;
        }
        
        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .chatbot-msg-modern.bot .chatbot-msg-bubble {
          background: #f0f0f0;
          color: #333;
          border-bottom-left-radius: 4px;
        }
        
        .chatbot-msg-modern.user .chatbot-msg-bubble {
          background: #1AB79D;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        
        .chatbot-msg-timestamp {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
          padding: 0 8px;
        }
        
        .chatbot-msg-modern.user .chatbot-msg-timestamp {
          text-align: right;
        }
        
        /* Thank You Message */
        .thankyou-message-modern {
          text-align: center;
          padding: 20px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          margin-top: 10px;
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .thankyou-title {
          font-weight: 700;
          font-size: 18px;
          color: #1AB79D;
          margin-bottom: 10px;
        }
        
        .thankyou-text {
          font-size: 14px;
          color: #333;
          margin-bottom: 15px;
        }
        
        .thankyou-quote {
          font-weight: 700;
          margin: 16px 0;
          font-size: 16px;
        }
        
        .thankyou-logo {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          margin: 0 auto;
          display: block;
          background: #fff;
          padding: 8px;
          border: 1px solid #eee;
        }
        
        .thankyou-footer {
          color: #1AB79D;
          margin-top: 15px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .sending-indicator {
          color: #1AB79D;
          margin-top: 12px;
          font-size: 13px;
        }
        
        .error-message {
          color: #ff4d4f;
          margin-top: 12px;
          font-size: 13px;
        }
        
        /* Input Area */
        .chatbot-input-row-modern {
          display: flex;
          padding: 16px 20px;
          border-top: 1px solid #f0f0f0;
          background: #fff;
          gap: 12px;
          align-items: center;
        }
        
        .chatbot-input-modern {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          background: #fff;
          color: #000;
          transition: border 0.2s;
        }
        
        .chatbot-input-modern:focus {
          border-color: #1AB79D;
          box-shadow: 0 0 0 2px rgba(26, 183, 157, 0.1);
        }
        
        .send-btn-modern {
          background: #1AB79D;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        
        .send-btn-modern:hover:not(:disabled) {
          background: #159c86;
        }
        
        .send-btn-modern:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .send-icon {
          color: white;
          font-size: 18px;
          font-weight: bold;
        }
        
        /* Course Dropdown */
        .course-dropdown-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        
        .course-dropdown-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }
        
        .course-dropdown {
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          background: #fff;
          color: #333;
          transition: border 0.2s;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px;
        }
        
        .course-dropdown:focus {
          border-color: #1AB79D;
          box-shadow: 0 0 0 2px rgba(26, 183, 157, 0.1);
        }
        
        /* Custom scrollbar */
        .chatbot-messages-modern::-webkit-scrollbar {
          width: 6px;
        }
        
        .chatbot-messages-modern::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .chatbot-messages-modern::-webkit-scrollbar-thumb {
          background: #1AB79D;
          border-radius: 3px;
        }
        
        .chatbot-messages-modern::-webkit-scrollbar-thumb:hover {
          background: #159c86;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
          .chatbot-window-modern {
            width: calc(100vw - 40px);
            height: 70vh;
            right: 20px;
            bottom: 80px;
          }
          
          .chatbot-fab {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>
    </>
  );
}

export default App;