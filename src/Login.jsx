import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const [tab, setTab] = useState('login');
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  // Email autocomplete state
  const [showLoginSuggestions, setShowLoginSuggestions] = useState(false);
  const [showRegSuggestions, setShowRegSuggestions] = useState(false);
  const [showResetSuggestions, setShowResetSuggestions] = useState(false);
  // Keyboard navigation state
  const [selectedLoginIndex, setSelectedLoginIndex] = useState(-1);
  const [selectedRegIndex, setSelectedRegIndex] = useState(-1);
  const [selectedResetIndex, setSelectedResetIndex] = useState(-1);
  // Trivia/Quotes for daily rotation (100+)
  const triviaQuotes = [
    "💡 Did you know? The first website ever created is still online: info.cern.ch",
    "🌐 There are over 1.8 billion websites on the internet today.",
    "🔍 Google receives over 8.5 billion searches per day.",
    "🦾 The first search engine was Archie, created in 1990.",
    "📱 More than 60% of Google searches come from mobile devices.",
    "🧑‍💻 The word 'blog' comes from 'web log'.",
    "🌍 The first domain name ever registered was symbolics.com in 1985.",
    "🚀 The average page load time for top-ranking sites is under 2 seconds.",
    "🔗 The most linked-to website in the world is Wikipedia.",
    "🧠 The human brain processes images 60,000 times faster than text.",
    "📈 75% of users never scroll past the first page of search results.",
    "🕸️ The term 'spider' in SEO refers to bots that crawl the web.",
    "🧩 The first banner ad appeared in 1994.",
    "🦠 The first computer virus was created in 1971 and was called Creeper.",
    "🔒 HTTPS is a ranking factor in Google search.",
    "🧑‍🚀 The '@' symbol was chosen for email because it was rarely used in names.",
    "📦 The favicon (website icon) was introduced by Internet Explorer 5.",
    "🧑‍🎤 The first YouTube video was uploaded in 2005.",
    "🌟 The first tweet was sent in 2006 by Jack Dorsey.",
    "🦾 The first computer mouse was made of wood.",
    "🧑‍💻 The first emoticon was used in 1982: :-)",
    "🌐 The internet weighs about 50 grams (if you count electrons in motion).",
    "🧑‍🔬 The first webcam watched a coffee pot at Cambridge University.",
    "🧑‍🚀 The Voyager 1 probe has a 1970s computer with 68KB memory.",
    "🧑‍🎨 The first website had only text and links—no images!",
    "🧑‍💻 The first email was sent by Ray Tomlinson in 1971.",
    "🧑‍🔧 The first hard drive could hold 5MB and weighed over a ton.",
    "🧑‍🚒 The first antivirus software was called Reaper.",
    "🧑‍✈️ The first domain name auctioned was business.com for $7.5 million.",
    "🧑‍🌾 The first online purchase was a pizza from Pizza Hut in 1994.",
    "🧑‍🍳 The first search engine to use backlinks as a ranking factor was Google.",
    "🧑‍🔬 The first computer bug was a real moth found in a relay.",
    "🧑‍🎨 The first animated GIF was created in 1987.",
    "🧑‍🚀 The first smartphone was IBM Simon, released in 1994.",
    "🧑‍💻 The first web browser was called WorldWideWeb.",
    "🧑‍🏫 The first online ad was for AT&T in 1994.",
    "🧑‍🎤 The first viral video was the 'Dancing Baby' in 1996.",
    "🧑‍🔧 The first online map was MapQuest, launched in 1996.",
    "🧑‍🚒 The first online bank was Stanford Federal Credit Union in 1994.",
    "🧑‍✈️ The first online auction was held by eBay in 1995.",
    "🧑‍🌾 The first online dating site was Match.com in 1995.",
    "🧑‍🍳 The first online payment was made via PayPal in 1998.",
    "🧑‍🔬 The first online encyclopedia was Wikipedia, launched in 2001.",
    "🧑‍🎨 The first online video was uploaded to YouTube in 2005.",
    "🧑‍🚀 The first online music store was iTunes, launched in 2003.",
    "🧑‍💻 The first online bookstore was Amazon, launched in 1995.",
    "🧑‍🏫 The first online university was Jones International University in 1993.",
    "🧑‍🎤 The first online radio station was Internet Talk Radio in 1993.",
    "🧑‍🔧 The first online newspaper was The Columbus Dispatch in 1980.",
    "🧑‍🚒 The first online magazine was Salon, launched in 1995.",
    "🧑‍✈️ The first online travel agency was Expedia, launched in 1996.",
    "🧑‍🌾 The first online grocery store was Peapod, launched in 1989.",
    "🧑‍🍳 The first online pharmacy was Drugstore.com, launched in 1999.",
    "🧑‍🔬 The first online auction house was Sotheby's, launched in 1999.",
    "🧑‍🎨 The first online art gallery was Artnet, launched in 1989.",
    "🧑‍🚀 The first online stock trade was made by E*TRADE in 1983.",
    "🧑‍💻 The first online multiplayer game was MUD1, created in 1978.",
    "🧑‍🏫 The first online forum was the WELL, launched in 1985.",
    "🧑‍🎤 The first online chat service was Talkomatic, created in 1973.",
    "🧑‍🔧 The first online shopping cart was invented in 1994.",
    "🧑‍🚒 The first online classified ads were posted on Craigslist in 1995.",
    "🧑‍✈️ The first online job board was Monster.com, launched in 1994.",
    "🧑‍🌾 The first online car sale was made in 1995.",
    "🧑‍🍳 The first online recipe site was Epicurious, launched in 1995.",
    "🧑‍🔬 The first online weather service was Weather.com, launched in 1996.",
    "🧑‍🎨 The first online photo sharing site was Flickr, launched in 2004.",
    "🧑‍🚀 The first online video call was made in 1970.",
    "🧑‍💻 The first online spreadsheet was VisiCalc, released in 1979.",
    "🧑‍🏫 The first online survey was created in 1995.",
    "🧑‍🎤 The first online meme was the Hampster Dance in 1998.",
    "🧑‍🔧 The first online wiki was WikiWikiWeb, launched in 1995.",
    "🧑‍🚒 The first online podcast was created in 2004.",
    "🧑‍✈️ The first online map service was MapQuest, launched in 1996.",
    "🧑‍🌾 The first online pet adoption site was Petfinder, launched in 1996.",
    "🧑‍🍳 The first online food delivery was Pizza Hut in 1994.",
    "🧑‍🔬 The first online dating app was Tinder, launched in 2012.",
    "🧑‍🎨 The first online art auction was Sotheby's in 1999.",
    "🧑‍🚀 The first online concert was broadcast in 1993.",
    "🧑‍💻 The first online encyclopedia was Wikipedia, launched in 2001.",
    "🧑‍🏫 The first online video streaming was RealPlayer in 1995.",
    "🧑‍🎤 The first online music download was Napster in 1999.",
    "🧑‍🔧 The first online payment system was PayPal, launched in 1998.",
    "🧑‍🚒 The first online news aggregator was Slashdot, launched in 1997.",
    "🧑‍✈️ The first online travel review site was TripAdvisor, launched in 2000.",
    "🧑‍🌾 The first online gardening forum was GardenWeb, launched in 1996.",
    "🧑‍🍳 The first online cooking show was launched in 1996.",
    "🧑‍🔬 The first online science journal was arXiv, launched in 1991.",
    "🧑‍🎨 The first online design tool was Canva, launched in 2012.",
    "🧑‍🚀 The first online hackathon was held in 1999.",
    "🧑‍💻 The first online code editor was JSFiddle, launched in 2010.",
    "🧑‍🏫 The first online learning platform was Khan Academy, launched in 2008.",
    "🧑‍🎤 The first online karaoke site was launched in 2004.",
    "🧑‍🔧 The first online repair guide was iFixit, launched in 2003.",
    "🧑‍🚒 The first online emergency alert system was launched in 2001.",
    "🧑‍✈️ The first online flight tracker was FlightAware, launched in 2005.",
    "🧑‍🌾 The first online farmers market was launched in 2007.",
    "🧑‍🍳 The first online food blog was launched in 1997.",
    "🧑‍🔬 The first online science fair was held in 2011.",
    "🧑‍🎨 The first online art class was launched in 2009.",
    "🧑‍🚀 The first online space mission tracker was launched in 2012.",
    "🧑‍💻 The first online hackathon platform was Devpost, launched in 2013.",
    "🧑‍🏫 The first online coding bootcamp was launched in 2012.",
    "🧑‍🎤 The first online music festival was held in 2020.",
    "🧑‍🔧 The first online DIY community was Instructables, launched in 2005.",
    "🧑‍🚒 The first online fire safety course was launched in 2010.",
    "🧑‍✈️ The first online pilot training was launched in 2011.",
    "🧑‍🌾 The first online plant identification app was launched in 2013.",
    "🧑‍🍳 The first online cooking competition was held in 2015."
  ];
  // Pick trivia based on day of year
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const trivia = triviaQuotes[dayOfYear % triviaQuotes.length];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      saveEmail(loginEmail); // Save email on successful login
      setLoginError('');
    } catch (err) {
      setLoginError('Incorrect email or password.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      saveEmail(regEmail); // Save email on successful registration
      setRegSuccess('Registration successful! You can now log in.');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setRegError(err.message);
    }
  };

  // Email autocomplete helper functions
  const getSavedEmails = () => {
    try {
      return JSON.parse(localStorage.getItem('savedEmails') || '[]');
    } catch {
      return [];
    }
  };

  const saveEmail = (email) => {
    try {
      const savedEmails = getSavedEmails();
      if (!savedEmails.includes(email)) {
        savedEmails.unshift(email); // Add to beginning
        // Keep only last 10 emails
        const trimmedEmails = savedEmails.slice(0, 10);
        localStorage.setItem('savedEmails', JSON.stringify(trimmedEmails));
      }
    } catch (error) {
      // console.error('Failed to save email:', error);
    }
  };

  const getFilteredEmails = (input, savedEmails) => {
    if (!input || input.length < 1) return [];
    return savedEmails.filter(email => 
      email.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5); // Show max 5 suggestions
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setResetMessage('Failed to send reset email. Please check the email address.');
    }
  };

  // Keyboard navigation handlers
  const handleLoginKeyDown = (e) => {
    const filteredEmails = getFilteredEmails(loginEmail, getSavedEmails());
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedLoginIndex(prev => 
        prev < filteredEmails.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedLoginIndex(prev => 
        prev > 0 ? prev - 1 : filteredEmails.length - 1
      );
    } else if (e.key === 'Enter' && selectedLoginIndex >= 0 && filteredEmails[selectedLoginIndex]) {
      e.preventDefault();
      setLoginEmail(filteredEmails[selectedLoginIndex]);
      setShowLoginSuggestions(false);
      setSelectedLoginIndex(-1);
    } else if (e.key === 'Escape') {
      setShowLoginSuggestions(false);
      setSelectedLoginIndex(-1);
    }
  };

  const handleRegKeyDown = (e) => {
    const filteredEmails = getFilteredEmails(regEmail, getSavedEmails());
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedRegIndex(prev => 
        prev < filteredEmails.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedRegIndex(prev => 
        prev > 0 ? prev - 1 : filteredEmails.length - 1
      );
    } else if (e.key === 'Enter' && selectedRegIndex >= 0 && filteredEmails[selectedRegIndex]) {
      e.preventDefault();
      setRegEmail(filteredEmails[selectedRegIndex]);
      setShowRegSuggestions(false);
      setSelectedRegIndex(-1);
    } else if (e.key === 'Escape') {
      setShowRegSuggestions(false);
      setSelectedRegIndex(-1);
    }
  };

  const handleResetKeyDown = (e) => {
    const filteredEmails = getFilteredEmails(resetEmail, getSavedEmails());
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResetIndex(prev => 
        prev < filteredEmails.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResetIndex(prev => 
        prev > 0 ? prev - 1 : filteredEmails.length - 1
      );
    } else if (e.key === 'Enter' && selectedResetIndex >= 0 && filteredEmails[selectedResetIndex]) {
      e.preventDefault();
      setResetEmail(filteredEmails[selectedResetIndex]);
      setShowResetSuggestions(false);
      setSelectedResetIndex(-1);
    } else if (e.key === 'Escape') {
      setShowResetSuggestions(false);
      setSelectedResetIndex(-1);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-bg-blob login-bg-blob1"></div>
      <div className="login-bg-blob login-bg-blob2"></div>
      <div className="login-bg-blob login-bg-blob3"></div>
      <div className="login-page">
        <div className="confetti">
          <span className="c1"></span>
          <span className="c2"></span>
          <span className="c3"></span>
          <span className="c4"></span>
          <span className="c5"></span>
        </div>
        <span className="login-emoji" role="img" aria-label="party">🎉</span>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => setTab('login')} style={{
            background: tab === 'login' ? 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)' : '#f7f6f2',
            color: tab === 'login' ? '#fff' : '#232323',
            border: 'none',
            borderRadius: '12px 0 0 12px',
            fontWeight: 700,
            fontSize: '1.08em',
            padding: '0.7em 1.6em',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            boxShadow: tab === 'login' ? '0 2px 8px #e0e7ef' : 'none',
          }}>Login</button>
          <button onClick={() => setTab('register')} style={{
            background: tab === 'register' ? 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)' : '#f7f6f2',
            color: tab === 'register' ? '#fff' : '#232323',
            border: 'none',
            borderRadius: '0 12px 12px 0',
            fontWeight: 700,
            fontSize: '1.08em',
            padding: '0.7em 1.6em',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            boxShadow: tab === 'register' ? '0 2px 8px #e0e7ef' : 'none',
          }}>Register</button>
        </div>
        {tab === 'login' ? (
          <>
            <h2 className="login-title">Login</h2>
            <form onSubmit={handleLogin} style={{marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%'}}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={e => {
                    setLoginEmail(e.target.value);
                    setShowLoginSuggestions(e.target.value.length > 0);
                    setSelectedLoginIndex(-1);
                  }}
                  onKeyDown={handleLoginKeyDown}
                  onFocus={() => setShowLoginSuggestions(loginEmail.length > 0)}
                  onBlur={() => setTimeout(() => setShowLoginSuggestions(false), 200)}
                  placeholder="Email" 
                  required 
                  style={{ color: '#232323', background: '#fff', padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em', width: '100%', boxSizing: 'border-box' }} 
                />
                {showLoginSuggestions && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1.5px solid #b6b6d8',
                    borderRadius: '0 0 10px 10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: 200,
                    overflowY: 'auto',
                    width: '100%'
                  }}>
                    {getFilteredEmails(loginEmail, getSavedEmails()).map((email, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setLoginEmail(email);
                          setShowLoginSuggestions(false);
                          setSelectedLoginIndex(-1);
                        }}
                        style={{
                          padding: '0.8em 1em',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '1em',
                          color: '#232323',
                          transition: 'background 0.15s',
                          backgroundColor: index === selectedLoginIndex ? '#f0f8ff' : '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f5f5f5';
                          setSelectedLoginIndex(index);
                        }}
                        onMouseLeave={(e) => e.target.style.background = index === selectedLoginIndex ? '#f0f8ff' : '#fff'}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                placeholder="Password" 
                required 
                style={{ color: '#232323', background: '#fff', padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em', width: '100%', boxSizing: 'border-box' }} 
              />
              <button type="submit">Login</button>
              {loginError && <div className="error-message">{loginError}</div>}
            </form>
            <button onClick={() => setShowReset(v => !v)} style={{ background: 'none', border: 'none', color: '#1976d2', fontWeight: 600, marginTop: 10, cursor: 'pointer', textDecoration: 'underline', fontSize: '1em' }}>Forgot Password?</button>
            {showReset && (
              <form onSubmit={handleResetPassword} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: '100%' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="email" 
                    value={resetEmail} 
                    onChange={e => {
                      setResetEmail(e.target.value);
                      setShowResetSuggestions(e.target.value.length > 0);
                      setSelectedResetIndex(-1);
                    }}
                    onKeyDown={handleResetKeyDown}
                    onFocus={() => setShowResetSuggestions(resetEmail.length > 0)}
                    onBlur={() => setTimeout(() => setShowResetSuggestions(false), 200)}
                    placeholder="Enter your email" 
                    required 
                    style={{ color: '#232323', background: '#fff', padding: '0.8em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1em', width: '100%', boxSizing: 'border-box' }} 
                  />
                  {showResetSuggestions && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1.5px solid #b6b6d8',
                      borderRadius: '0 0 10px 10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      maxHeight: 200,
                      overflowY: 'auto',
                      width: '100%'
                    }}>
                      {getFilteredEmails(resetEmail, getSavedEmails()).map((email, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setResetEmail(email);
                            setShowResetSuggestions(false);
                            setSelectedResetIndex(-1);
                          }}
                          style={{
                            padding: '0.8em 1em',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '1em',
                            color: '#232323',
                            transition: 'background 0.15s',
                            backgroundColor: index === selectedResetIndex ? '#f0f8ff' : '#fff'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f5f5f5';
                            setSelectedResetIndex(index);
                          }}
                          onMouseLeave={(e) => e.target.style.background = index === selectedResetIndex ? '#f0f8ff' : '#fff'}
                        >
                          {email}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit">Send Reset Email</button>
                {resetMessage && <div style={{ color: resetMessage.includes('sent') ? '#1976d2' : '#c00', fontWeight: 600 }}>{resetMessage}</div>}
              </form>
            )}
            <div style={{ marginTop: 32, marginBottom: 0, padding: '1.1em 1.2em', background: 'rgba(255,255,255,0.85)', borderRadius: 14, boxShadow: '0 2px 12px #e0e7ef', fontSize: '1.08em', color: '#1976d2', fontWeight: 600, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.5 }}>
              {trivia}
            </div>
          </>
        ) : (
          <>
            <h2 className="login-title">Register</h2>
            <form onSubmit={handleRegister} style={{marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%'}}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="email" 
                  value={regEmail} 
                  onChange={e => {
                    setRegEmail(e.target.value);
                    setShowRegSuggestions(e.target.value.length > 0);
                    setSelectedRegIndex(-1);
                  }}
                  onKeyDown={handleRegKeyDown}
                  onFocus={() => setShowRegSuggestions(regEmail.length > 0)}
                  onBlur={() => setTimeout(() => setShowRegSuggestions(false), 200)}
                  placeholder="Email" 
                  required 
                  style={{ color: '#232323', background: '#fff', padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em', width: '100%', boxSizing: 'border-box' }} 
                />
                {showRegSuggestions && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1.5px solid #b6b6d8',
                    borderRadius: '0 0 10px 10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: 200,
                    overflowY: 'auto',
                    width: '100%'
                  }}>
                    {getFilteredEmails(regEmail, getSavedEmails()).map((email, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setRegEmail(email);
                          setShowRegSuggestions(false);
                          setSelectedRegIndex(-1);
                        }}
                        style={{
                          padding: '0.8em 1em',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '1em',
                          color: '#232323',
                          transition: 'background 0.15s',
                          backgroundColor: index === selectedRegIndex ? '#f0f8ff' : '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f5f5f5';
                          setSelectedRegIndex(index);
                        }}
                        onMouseLeave={(e) => e.target.style.background = index === selectedRegIndex ? '#f0f8ff' : '#fff'}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input 
                type="password" 
                value={regPassword} 
                onChange={e => setRegPassword(e.target.value)} 
                placeholder="Password" 
                required 
                style={{ color: '#232323', background: '#fff', padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em', width: '100%', boxSizing: 'border-box' }} 
              />
              <button type="submit">Register</button>
              {regError && <div className="error-message">{regError}</div>}
              {regSuccess && <div style={{ color: '#1976d2', fontWeight: 600, marginTop: 4 }}>{regSuccess}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
} 