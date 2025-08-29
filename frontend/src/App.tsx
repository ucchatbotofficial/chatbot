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

// const logoUrl = '/urbancode logo.jpg';

function App() {
  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  // const [phone, setPhone] = useState('');
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
      // Validate name
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
      // Validate email
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
      // Validate phone number
      const phoneError = validatePhone(input);
      if (phoneError) {
        addMessage('user', input);
        addMessage('bot', `❌ ${phoneError}`);
        setInput('');
        return;
      }
      
      const formattedPhone = formatPhone(input);
      // setPhone(formattedPhone);
      console.log("Phone number captured:", formattedPhone);
      addMessage('user', input);
      setShowThankYou(true);
      setStep(4);
      setInput('');
      setSending(true);
      setError('');
      
      // Send details to backend for email and WhatsApp
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
      {/* Floating Chatbot Icon/Button */}
      {!open && (
        <button
          className="chatbot-fab"
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'transparent',
            border: 'none',
            padding: 0,
            boxShadow: 'none',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <img
            src="/get.jpeg"
            alt="Chatbot"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(26,183,157,0.18)',
              background: '#fff',
              border: '2px solid #1AB79D',
              transition: 'transform 0.2s',
              display: 'block',
            }}
          />
        </button>
      )}
      {/* Chat Window */}
      {open && (
        <div className="chatbot-window-modern">
          <div className="chatbot-header-modern">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-modern">
                <img src="/urbancode logo.jpg" alt="logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <span className="chatbot-title-modern">Urbancode Assistant</span>
            </div>
            <div className="chatbot-header-right">
              <button className="chatbot-icon-btn-modern" title="Refresh" onClick={() => window.location.reload()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4v6h6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20v-6h-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="chatbot-icon-btn-modern" title="Close" onClick={() => setOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#666" d="M6 6l8 8M6 14L14 6" stroke="#666" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
          <div className="chatbot-messages-modern">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg-modern ${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="chatbot-avatar-small">
                    <img src="/get.jpeg" alt="logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                <div>Thank you for sharing the details, We will be sharing the course details to your WhatsApp.</div>
                <div style={{ fontWeight: 700, margin: '16px 0 8px 0', fontSize: '1.1rem' }}>Dream big, learn bigger.</div>
                    <img src="/urbancode logo.jpg" alt="logo" style={{ width: 120, height: 120, borderRadius: 24, margin: '0 auto', display: 'block', background: '#fff' }} />
                <div style={{ color: '#1AB79D', marginTop: 12, fontWeight: 600, fontSize: '1.1rem' }}>Empowering Your Future, One Course at a Time.</div>
                {sending && <div style={{ color: '#1AB79D', marginTop: 12 }}>Sending details to email and WhatsApp...</div>}
                {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
                <div style={{ color: '#1AB79D', marginTop: 16, fontSize: '0.9rem', opacity: 0.8 }}>
                </div>
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
                    placeholder="Type an answer"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="chatbot-input-modern"
                  />
                  <button onClick={handleSend} className="send-btn-modern">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
          <style>{`
            .chatbot-fab {
              position: fixed !important;
              bottom: 24px !important;
              right: 24px !important;
              left: auto !important;
              top: auto !important;
              z-index: 9999 !important;
              background: transparent;
              border: none;
              padding: 0;
              cursor: pointer;
              box-shadow: none;
              width: 40px;
              height: 40px;
              transform: none !important;
              margin: 0 !important;
              animation: float 3s ease-in-out infinite;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .chatbot-fab:hover {
              transform: scale(1.1) translateY(-5px);
              filter: drop-shadow(0 10px 20px rgba(26, 183, 157, 0.3));
            }
            .chatbot-fab:active {
              transform: scale(0.95);
            }
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
            .chatbot-fab svg {
              display: block;
              width: 64px;
              height: 64px;
              filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
              transition: all 0.3s ease;
            }
            .chatbot-fab:hover svg {
              filter: drop-shadow(0 8px 16px rgba(26, 183, 157, 0.4));
            }
            .chatbot-window-modern {
              position: fixed !important;
              bottom: 20px !important;
              right: 20px !important;
              left: auto !important;
              top: auto !important;
              width: 380px;
              height: 580px;
              background: #fff;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.15);
              display: flex;
              flex-direction: column;
              z-index: 1001;
              overflow: hidden;
              transform: none !important;
              transform-origin: bottom right;
              margin: 0 !important;
              animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(100px) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }
            .chatbot-header-modern {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: #fff;
              border-bottom: 1px solid #f0f0f0;
            }
            .chatbot-header-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .chatbot-avatar-modern {
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #1AB79D 0%, #159c86 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 14px;
            }
            .chatbot-title-modern {
              font-size: 16px;
              font-weight: 600;
              color: #333;
            }
            .chatbot-header-right {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .chatbot-icon-btn-modern {
              background: none;
              border: none;
              padding: 6px;
              cursor: pointer;
              border-radius: 50%;
              transition: background 0.2s;
            }
            .chatbot-icon-btn-modern:hover {
              background: #f5f5f5;
            }
            .chatbot-messages-modern {
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              background: #fff;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .chatbot-msg-modern {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              animation: messageFloat 0.6s ease-out;
              transform-origin: left center;
            }
            .chatbot-msg-modern.user {
              flex-direction: row-reverse;
              transform-origin: right center;
            }
            .chatbot-msg-modern:nth-child(odd) {
              animation-delay: 0.1s;
            }
            .chatbot-msg-modern:nth-child(even) {
              animation-delay: 0.2s;
            }
            .chatbot-msg-modern:nth-child(3n) {
              animation-delay: 0.3s;
            }
            @keyframes messageFloat {
              0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              50% {
                transform: translateY(-5px) scale(1.02);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .chatbot-avatar-small {
              width: 28px;
              height: 28px;
              background: linear-gradient(135deg, #1AB79D 0%, #159c86 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 12px;
              flex-shrink: 0;
              animation: avatarFloat 2s ease-in-out infinite;
              animation-delay: 0.5s;
            }
            @keyframes avatarFloat {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-3px);
              }
            }
            .chatbot-msg-content {
              display: flex;
              flex-direction: column;
              max-width: 70%;
              animation: contentFloat 0.8s ease-out;
            }
            @keyframes contentFloat {
              0% {
                opacity: 0;
                transform: translateX(-10px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .chatbot-msg-modern.user .chatbot-msg-content {
              animation: contentFloatRight 0.8s ease-out;
            }
            @keyframes contentFloatRight {
              0% {
                opacity: 0;
                transform: translateX(10px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .chatbot-msg-bubble {
              padding: 12px 16px;
              border-radius: 18px;
              font-size: 14px;
              line-height: 1.4;
              word-wrap: break-word;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              animation: bubbleFloat 0.5s ease-out;
            }
            .chatbot-msg-bubble:hover {
              transform: translateY(-2px) scale(1.02);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            @keyframes bubbleFloat {
              0% {
                opacity: 0;
                transform: scale(0.8);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            .chatbot-msg-modern.bot .chatbot-msg-bubble {
              background: #f0f0f0;
              color: #333;
              border-bottom-left-radius: 4px;
            }
            .chatbot-msg-modern.user .chatbot-msg-bubble {
              background: #1AB79D;
              color: #000;
              border-bottom-right-radius: 4px;
            }
            .chatbot-msg-timestamp {
              font-size: 11px;
              color: #999;
              margin-top: 4px;
              padding-left: 4px;
              opacity: 0;
              animation: timestampFade 1s ease-out forwards;
              animation-delay: 0.8s;
            }
            .chatbot-msg-modern.user .chatbot-msg-timestamp {
              text-align: right;
              padding-right: 4px;
            }
            @keyframes timestampFade {
              0% {
                opacity: 0;
                transform: translateY(5px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .chatbot-input-row-modern {
              display: flex;
              padding: 16px 20px;
              border-top: 1px solid #f0f0f0;
              background: #fff;
              gap: 12px;
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
            }
            .send-btn-modern {
              background: #1AB79D;
              border: none;
              padding: 12px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
              flex-shrink: 0;
            }
            .send-btn-modern:hover {
              background: #159c86;
            }
            .thankyou-message-modern {
              text-align: center;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 12px;
              margin: 16px;
              border: 1px solid #e9ecef;
            }
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
            }
            .course-dropdown:focus {
              border-color: #1AB79D;
            }
            .course-dropdown option {
              padding: 8px;
              background: #fff;
              color: #333;
            }
            .course-dropdown option:hover {
              background: #f0f0f0;
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
                width: calc(100vw - 32px);
                height: calc(100vh - 64px);
                bottom: 16px;
                right: 16px;
                left: 16px;
              }
              .chatbot-fab {
                bottom: 16px;
                right: 16px;
              }
            }
            
            /* Force bottom right positioning - override any conflicting styles */
            .chatbot-fab {
              position: fixed !important;
              bottom: 20px !important;
              right: 20px !important;
              left: auto !important;
              top: auto !important;
              z-index: 1000;
              background: transparent;
              border: none;
              padding: 0;
              cursor: pointer;
              box-shadow: none;
              width: 56px;
              height: 56px;
              transform: none !important;
              margin: 0 !important;
              animation: float 3s ease-in-out infinite;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .chatbot-window-modern {
              position: fixed !important;
              bottom: 32px !important;
              right: 32px !important;
              left: auto !important;
              top: auto !important;
              transform: none !important;
              margin: 0 !important;
            }
          `}</style>
      </div>
      )}
    </>
  );
}

export default App;
