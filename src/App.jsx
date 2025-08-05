import { useState, useEffect, useRef } from 'react';
import './App.css'
import { Toaster, toast } from 'sonner';
import Sidebar from './Sidebar';
import TemplateManager from './TemplateManager';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import DApaChecker from './DApaChecker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Tickets from './Tickets';
import LinkBuildings from './LinkBuildings';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, getAuth } from 'firebase/auth';
import AuthPage from './AuthPage';
import Login from './Login';
import Register from './Register';
import { getCompanies, saveCompany, deleteCompany, getConversations } from './firestoreHelpers';
import { getPackages, savePackages, getTrash, saveTrash, getTickets, saveTicket, loadHistoryLog, saveHistoryLog, clearHistoryLog, saveTemplate } from './firestoreHelpers';
import { onSnapshot, collection, doc as firestoreDoc, doc, deleteDoc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import GitsPage from './GitsPage';
import SiteAuditsPage from './SiteAuditsPage';
import { setSessionStartTime, isSessionExpired, clearSessionStartTime, getTimeUntil6PM, formatRemainingTime } from './sessionUtils';
import ResourcesPage from './ResourcesPage';
import CompanyOverview from './CompanyOverview';
import NotesPage from './NotesPage';
import TemplateTrash from './TemplateTrash';
import ProfilePage from './ProfilePage';
import ChatManager from './ChatSystem/ChatManager';
import ChatUsersPage from './ChatSystem/ChatUsersPage';
import { useChat } from './ChatSystem/ChatManager';
import EOCAccounts from './EOCAccounts';

function HomeHero({ userEmail }) {
  const navigate = useNavigate();
  // Motivational quotes for daily rotation
  const quotes = [
    "👾 Track your companies, manage reports, and conquer the SEO galaxy!\nAll your data is safe in the cloud.",
    "🌟 Success is not for the lazy. Take action today!",
    "🚀 Every day is a new chance to optimize and grow.",
    "💡 Small steps every day lead to big results.",
    "🪐 Dream big, work hard, and reach for the stars!",
    "📈 Progress, not perfection. Keep moving forward!",
    "✨ Your SEO journey is your superpower. Use it!",
    "🌱 Growth is a journey, not a destination.",
    "🔥 Passion fuels progress.",
    "🧠 Learn something new every day.",
    "🎯 Focus on what matters most.",
    "⏳ Time you enjoy wasting is not wasted time.",
    "🦾 Consistency beats intensity.",
    "🌞 Start your day with a win.",
    "🧩 Every problem has a solution.",
    "🌈 Positivity is a choice.",
    "🛠️ Build your dreams, one step at a time.",
    "🦄 Be unique. Be you.",
    "🧭 Let your values guide you.",
    "🕹️ Level up your skills today!",
    "📚 Knowledge is power.",
    "🧘‍♂️ Balance brings clarity.",
    "🎵 Find your rhythm and flow.",
    "🧗‍♂️ Challenges make you stronger.",
    "🌻 Bloom where you are planted.",
    "🛸 Explore new possibilities.",
    "🧲 Attract what you expect.",
    "🦋 Embrace change and transformation.",
    "🧑‍🚀 Reach beyond your limits.",
    "🧩 Piece by piece, you build success.",
    "🕰️ Make every moment count.",
    "🧃 Stay fresh, stay creative.",
    "🧑‍💻 Code your own destiny.",
    "🧭 Stay true to your direction.",
    "🧱 Lay strong foundations.",
    "🧗‍♀️ Climb higher every day.",
    "🧠 Sharpen your mind.",
    "🧑‍🎨 Create your masterpiece.",
    "🧑‍🔬 Experiment and learn.",
    "🧑‍🏫 Teach what you know.",
    "🧑‍🚒 Be brave in the face of fear.",
    "🧑‍✈️ Navigate your journey.",
    "🧑‍🌾 Plant seeds of success.",
    "🧑‍🍳 Mix hard work with fun.",
    "🧑‍🔧 Fix what you can, accept what you can't.",
    "🧑‍🎤 Let your voice be heard.",
    "🧑‍🎓 Never stop learning.",
    "🧑‍🚀 The sky is not the limit.",
    "🧑‍🚒 Rescue your dreams from doubt.",
    "🧑‍⚖️ Judge less, understand more.",
    "🧑‍🌾 Grow through what you go through.",
    "🧑‍🍳 Cook up new ideas.",
    "🧑‍🔬 Science your way to success.",
    "🧑‍🎨 Paint your future bright.",
    "🧑‍🚀 Explore the unknown.",
    "🧑‍💻 Debug your worries.",
    "🧑‍🏫 Share your wisdom.",
    "🧑‍🎤 Perform with passion.",
    "🧑‍🔧 Build your legacy.",
    "🧑‍🚒 Protect your peace.",
    "🧑‍✈️ Chart your own course.",
    "🧑‍🌾 Nurture your goals.",
    "🧑‍🍳 Spice up your routine.",
    "🧑‍🔬 Test your limits.",
    "🧑‍🎨 Color your world.",
    "🧑‍🚀 Take giant leaps.",
    "🧑‍💻 Automate the boring stuff.",
    "🧑‍🏫 Learn, unlearn, relearn.",
    "🧑‍🎤 Rock your day.",
    "🧑‍🔧 Repair with care.",
    "🧑‍🚒 Stay cool under pressure.",
    "🧑‍✈️ Soar with confidence.",
    "🧑‍🌾 Reap what you sow.",
    "🧑‍🍳 Savor your achievements.",
    "🧑‍🔬 Analyze, adapt, advance.",
    "🧑‍🎨 Imagine the impossible.",
    "🧑‍🚀 Boldly go forward.",
    "🧑‍💻 Type your own story.",
    "🧑‍🏫 Mentor with kindness.",
    "🧑‍🎤 Find your harmony.",
    "🧑‍🔧 Fine-tune your craft.",
    "🧑‍🚒 Be a hero in small ways.",
    "🧑‍✈️ Glide through challenges.",
    "🧑‍🌾 Water your dreams daily.",
    "🧑‍🍳 Mix in gratitude.",
    "🧑‍🔬 Observe, reflect, improve.",
    "🧑‍🎨 Sketch your ambitions.",
    "🧑‍🚀 Set your sights high.",
    "🧑‍💻 Code with courage.",
    "🧑‍🏫 Pass on positivity.",
    "🧑‍🎤 Let your light shine.",
    "🧑‍🔧 Keep your tools sharp.",
    "🧑‍🚒 Stay ready for anything.",
    "🧑‍✈️ Pilot your progress."
  ];
  // Pick quote based on day of year
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const quote = quotes[dayOfYear % quotes.length];
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0e7ef 0%, #f5f7fa 100%)',
      fontFamily: 'Inter, Nunito, Poppins, Arial, sans-serif',
      padding: '0',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '2.2rem',
        boxShadow: '0 4px 32px #e0e7ef',
        padding: '3.2rem 2.5rem 2.5rem 2.5rem',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        margin: '2rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.2rem',
      }}>
        <span style={{
          background: '#f7f7fa',
          borderRadius: '50%',
          boxShadow: '0 2px 8px #e0e7ef',
          padding: '0.5em',
          fontSize: '2.7rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.7em',
        }} role="img" aria-label="fire">🔥</span>
        <h1 style={{
          fontFamily: 'Poppins, Inter, Nunito, Arial, sans-serif',
          fontWeight: 800,
          fontSize: '2.3rem',
          color: '#1976d2',
          letterSpacing: '0.04em',
          margin: 0,
          background: 'none',
        }}>
          Welcome <span style={{ color: '#232323', fontWeight: 700 }}>{userEmail ? userEmail : 'Kupal'}</span>
        </h1>
        <p style={{ fontSize: '1.18rem', color: '#1976d2', fontWeight: 600, margin: 0 }}>
          You have landed on your <span style={{ color: '#43a047', fontWeight: 700 }}>Personal SEO Tracker</span>.
        </p>
        <p style={{ fontSize: '1.08rem', color: '#444', margin: 0, whiteSpace: 'pre-line', fontWeight: 500 }}>
          {quote}
        </p>
        <button style={{
          background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '2rem',
          fontWeight: 700,
          fontSize: '1.15em',
          padding: '0.8em 2.2em',
          boxShadow: '0 2px 12px #e0e7ef',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          marginTop: '1.2rem',
          transition: 'background 0.18s, color 0.18s, transform 0.18s',
        }}
          onClick={() => navigate('/company-tracker')}
        >
          🚀 Go to Company Tracker
        </button>
      </div>
    </section>
  );
}

const ALL_PACKAGES = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getEOC(start) {
  // start: e.g. 'February 4, 2017'
  if (!start) return '';
  const match = start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return '';
  const [_, month, day, year] = match;
  const date = new Date(`${month} ${day}, ${year}`);
  if (isNaN(date)) return '';
  date.setFullYear(date.getFullYear() + 1);
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Enhanced EOC calculation that accounts for OnHold periods
export function getAdjustedEOC(company) {
  if (!company.start) return '';
  
  // Get base EOC date
  const baseEOC = getEOC(company.start);
  if (!baseEOC) return '';
  
  // Parse base EOC date
  const match = baseEOC.match(/^(\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return baseEOC;
  
  const [_, month, day, year] = match;
  const baseEOCDate = new Date(`${month} ${day}, ${year}`);
  
  // Add OnHold days to extend EOC
  const onholdDays = company.totalOnholdDays || 0;
  const adjustedEOCDate = new Date(baseEOCDate.getTime() + (onholdDays * 24 * 60 * 60 * 1000));
  
  return `${months[adjustedEOCDate.getMonth()]} ${adjustedEOCDate.getDate()}, ${adjustedEOCDate.getFullYear()}`;
}

// Calculate active days (excluding OnHold periods)
export function getActiveDays(company) {
  if (!company.start) return 0;
  
  const startDate = parseDisplayDateToInput(company.start);
  if (!startDate) return 0;
  
  const today = new Date();
  const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  // Subtract OnHold days to get active days
  const onholdDays = company.totalOnholdDays || 0;
  return Math.max(0, totalDays - onholdDays);
}

function CompanyTracker({ editData, clearEdit, packages, setPackages }) {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: '',
    startDate: null,
    status: 'Active',
  });
  const [editId, setEditId] = useState(null);
  const [showAddToPackage, setShowAddToPackage] = useState(null); // company id

  // Optimized: Single useEffect for loading companies with cleanup and filtering
  useEffect(() => {
    async function loadUnassignedCompanies() {
      try {
        // Fetch both companies and packages in parallel
        const [all, pkgs] = await Promise.all([
          getCompanies(),
          getPackages()
        ]);
        
        // One-time cleanup: delete companies with blank names
        const blanks = all.filter(c => !c.name || c.name.trim() === '');
        for (const c of blanks) {
          if (c.id) {
            await deleteCompany(c.id);
          }
        }
        
        // One-time migration: add missing audit status fields
        const needsMigration = all.filter(c => !('siteAuditBStatus' in c) || !('siteAuditCStatus' in c));
        for (const c of needsMigration) {
          if (c.id) {
            await saveCompany({ 
              ...c, 
              siteAuditBStatus: c.siteAuditBStatus || 'Pending', 
              siteAuditCStatus: c.siteAuditCStatus || 'Pending' 
            });
          }
        }
        
        // Filter companies in one pass
        const validCompanies = all.filter(c => c.name && c.name.trim() !== '');
        const packagedIds = new Set();
        Object.values(pkgs).forEach(arr => arr.forEach(c => packagedIds.add(c.id)));
        
        // Only show companies not in any package
        setCompanies(validCompanies.filter(c => !packagedIds.has(c.id)));
      } catch (error) {
        setCompanies([]);
      }
    }
    
    loadUnassignedCompanies();
  }, [packages]); // Only depend on packages changes

  // If editData is provided (from package page), load it into the form
  useEffect(() => {
    if (editData) {
      setEditId(editData.id);
      let startDate = null;
      if (editData.start) {
        const match = editData.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
        if (match) {
          startDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
        }
      }
      setForm({
        name: editData.name,
        startDate,
        status: editData.status,
      });
      if (clearEdit) clearEdit();
    }
    // eslint-disable-next-line
  }, [editData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = date => {
    setForm({ ...form, startDate: date });
  };

  // Removed unused updatePackages function

  const handleAddOrEdit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) return;
    const start = form.startDate ? `${months[form.startDate.getMonth()]} ${form.startDate.getDate()}, ${form.startDate.getFullYear()}` : '';
    if (editId) {
      const updated = { ...form, start, id: editId };
      await saveCompany(updated);
              setCompanies(await getCompanies());
        setEditId(null);
        toast.success('Company updated successfully');

    } else {
              const newCompany = { 
          ...form, 
          start, 
          id: Date.now(), 
          siteAuditBStatus: 'Pending', 
          siteAuditCStatus: 'Pending',
          onholdStartDate: null,
          onholdEndDate: null,
          totalOnholdDays: 0
        };
              await saveCompany(newCompany);
        setCompanies(await getCompanies());
        toast.success('Company added successfully');

    }
    setForm({ name: '', startDate: null, status: 'Active' });
  };

  const handleDelete = async id => {
    // Find the company to delete
    const companyToDelete = companies.find(c => c.id === id);
    if (!companyToDelete) return;
    // Add to trash before deleting
    const trash = await getTrash();
    await saveTrash([...(trash || []), { ...companyToDelete, type: 'company' }]);
    // Optimistically update UI
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (window.fetchAlerts) fetchAlerts();
    await deleteCompany(id);
    setCompanies(await getCompanies());
    if (editId === id) {
      setEditId(null);
      setForm({ name: '', startDate: null, status: 'Active' });
    }
    // Remove from all package pages
    getPackages().then(packages => {
      Object.keys(packages).forEach(pkg => {
        packages[pkg] = packages[pkg].filter(c => c.id !== id);
      });
      savePackages(packages);
    });
  };

  const handleEdit = c => {
    setEditId(c.id);
    let startDate = null;
    if (c.start) {
      const match = c.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
      if (match) {
        startDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
      }
    }
    setForm({
      name: c.name,
      startDate,
      status: c.status,
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm({ name: '', startDate: null, status: 'Active' });
  };

  // Add to package pages
  const handleAddToPackage = async (company, pkg) => {
    // Remove from CompanyTracker (Firestore and local state)
    await deleteCompany(company.id);
    setCompanies(prev => prev.filter(c => c.id !== company.id));
    // Add to package
    const updatedPackages = { ...packages };
    if (!updatedPackages[pkg]) updatedPackages[pkg] = [];
    if (!updatedPackages[pkg].some(c => c.id === company.id)) {
      updatedPackages[pkg].push({
        ...company,
        package: pkg,
        tasks: {
          forVSO: 'Pending',
          forRevision: 'Pending',
          ra: 'Pending',
          distribution: 'Pending',
          businessProfileClaiming: 'Pending',
        },
        reportI: 'Pending',
        reportII: 'Pending',
        bmCreation: 'Pending',
        bmSubmission: 'Pending',
      });
      setPackages(updatedPackages);
      await savePackages(updatedPackages);
      toast.success(`Company added to ${pkg} successfully`);
    }
    setShowAddToPackage(null);
  };
  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title">Company Tracker</h1>
      <p className="hero-desc">Add and manage your company names here.</p>
      <form className="company-form" onSubmit={handleAddOrEdit}>
        <input
          name="name"
          type="text"
          placeholder="Company Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{
            fontSize: '0.95rem',
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            outline: 'none',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#007bff';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e1e5e9';
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }}
        />
        <DatePicker
          selected={form.startDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText="Start Date"
          className="company-form-datepicker"
          required
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          yearDropdownItemNumber={20}
          scrollableYearDropdown
          onClickOutside={(e) => e.preventDefault()}
          onInputClick={(e) => e.preventDefault()}
          customInput={
            <input
              style={{
                fontSize: '0.95rem',
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                outline: 'none',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              placeholder="Start Date"
            />
          }
          renderCustomHeader={({ date, changeYear, changeMonth }) => (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '8px',
              background: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              borderRadius: '4px 4px 0 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#495057'
              }}>
                <span>Quick Navigation:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      changeYear(date.getFullYear() - 1);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      background: '#e9ecef',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#495057',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      minWidth: '32px'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#007bff';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = '#e9ecef';
                      e.target.style.color = '#495057';
                    }}
                  >
                    ←
                  </button>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#495057',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {date.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      changeYear(date.getFullYear() + 1);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      background: '#e9ecef',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#495057',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      minWidth: '32px'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#007bff';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = '#e9ecef';
                      e.target.style.color = '#495057';
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '6px',
                fontSize: '1rem',
                color: '#856404',
                fontWeight: '700',
                margin: '8px 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📅 {date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #dee2e6'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#495057',
                  marginBottom: '4px'
                }}>
                  Quick Months:
                </div>
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  flexWrap: 'wrap'
                }}>
                  {/* All months for current year */}
                  {[
                    { label: 'Jan', month: 0 },
                    { label: 'Feb', month: 1 },
                    { label: 'Mar', month: 2 },
                    { label: 'Apr', month: 3 },
                    { label: 'May', month: 4 },
                    { label: 'Jun', month: 5 },
                    { label: 'Jul', month: 6 },
                    { label: 'Aug', month: 7 },
                    { label: 'Sep', month: 8 },
                    { label: 'Oct', month: 9 },
                    { label: 'Nov', month: 10 },
                    { label: 'Dec', month: 11 }
                  ].map(({ label, month }) => {
                    const isCurrentMonth = date.getMonth() === month;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          changeMonth(month);
                        }}
                        style={{
                          padding: '3px 6px',
                          fontSize: '0.75rem',
                          background: isCurrentMonth ? '#007bff' : '#f8f9fa',
                          border: `1px solid ${isCurrentMonth ? '#007bff' : '#dee2e6'}`,
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: isCurrentMonth ? '#fff' : '#6c757d',
                          fontWeight: isCurrentMonth ? '600' : '500',
                          transition: 'all 0.2s',
                          minWidth: '28px',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                        onMouseOver={e => {
                          if (!isCurrentMonth) {
                            e.target.style.background = '#28a745';
                            e.target.style.color = '#fff';
                            e.target.style.borderColor = '#28a745';
                          }
                        }}
                        onMouseOut={e => {
                          if (!isCurrentMonth) {
                            e.target.style.background = '#f8f9fa';
                            e.target.style.color = '#6c757d';
                            e.target.style.borderColor = '#dee2e6';
                          }
                        }}
                      >
                        {label}
                        {isCurrentMonth && (
                          <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '6px',
                            height: '6px',
                            background: '#fff',
                            borderRadius: '50%',
                            border: '1px solid #007bff'
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        />
        <select 
          name="status" 
          value={form.status} 
          onChange={handleChange}
          style={{
            fontSize: '0.95rem',
            width: 'auto',
            minWidth: 'fit-content',
            padding: '8px 12px',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            outline: 'none',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#007bff';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e1e5e9';
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }}
        >
          <option value="Active">🟢 Active</option>
          <option value="OnHold">🟣 OnHold</option>
        </select>
        <button 
          type="submit"
          style={{
            fontSize: '0.9rem',
            width: 'auto',
            minWidth: 'fit-content',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            background: '#007bff',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,123,255,0.2)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#0056b3';
            e.target.style.boxShadow = '0 3px 8px rgba(0,123,255,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#007bff';
            e.target.style.boxShadow = '0 2px 6px rgba(0,123,255,0.2)';
          }}
        >
          {editId ? 'Update' : 'Add'}
        </button>
        {editId && (
          <button 
            type="button" 
            onClick={handleCancel}
            style={{
              fontSize: '0.9rem',
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e1e5e9',
              borderRadius: '6px',
              background: '#ffffff',
              color: '#6c757d',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginTop: '6px'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#6c757d';
              e.target.style.background = '#f8f9fa';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.background = '#ffffff';
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <div className="table-scroll-container table-responsive">
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Start Date</th>
              <th>EOC</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.filter(c => c.name && c.name.trim() !== '').length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies yet.</td></tr>
            )}
            {companies.filter(c => c.name && c.name.trim() !== '').map(c => (
              <tr key={c.id} style={{ position: 'relative' }}>
                <td className="company-name">{c.name}</td>
                <td>{c.start}</td>
                <td>{getEOC(c.start)}</td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      getPackages().then(packages => {
                        // Find which package this company belongs to
                        let targetPackage = null;
                        for (const [pkgName, pkgCompanies] of Object.entries(packages)) {
                          if (pkgCompanies.some(company => company.id === c.id)) {
                            targetPackage = pkgName;
                            break;
                          }
                        }
                        if (targetPackage) {
                          const updatedCompanies = (packages[targetPackage] || []).map(row =>
                            row.id === c.id ? { ...row, status: newStatus } : row
                          );
                          packages[targetPackage] = updatedCompanies;
                          savePackages(packages);
                          setCompanies(updatedCompanies);
                        }
                      });
                    }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="OnHold">🟣 OnHold</option>
                  </select>
                </td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                  <button className="delete-btn" style={{marginLeft:8,background:'#e0eaff',color:'#232323'}} onClick={() => handleEdit(c)}>Edit</button>
                  <button className="delete-btn" style={{marginLeft:8,background:'#eaffea',color:'#232323'}} onClick={() => setShowAddToPackage(c.id)}>Add</button>
                  {showAddToPackage === c.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '48px',
                      right: 0,
                      left: 'auto',
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: 8,
                      boxShadow: '0 2px 8px #ececec',
                      zIndex: 2000,
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      minWidth: 420,
                      justifyContent: 'flex-end',
                    }}>
                      <div style={{marginRight: 8, fontWeight: 600}}>Add to package:</div>
                      <button style={{margin:2}} className="package-basic" onClick={() => handleAddToPackage(c, 'SEO - BASIC')}>SEO - BASIC</button>
                      <button style={{margin:2}} className="package-premium" onClick={() => handleAddToPackage(c, 'SEO - PREMIUM')}>SEO - PREMIUM</button>
                      <button style={{margin:2}} className="package-pro" onClick={() => handleAddToPackage(c, 'SEO - PRO')}>SEO - PRO</button>
                      <button style={{margin:2}} className="package-ultimate" onClick={() => handleAddToPackage(c, 'SEO - ULTIMATE')}>SEO - ULTIMATE</button>
                      <button style={{margin:2,background:'#ffeaea',color:'#c00',borderRadius:8}} onClick={() => setShowAddToPackage(null)}>Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function parseDisplayDateToInput(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return null;
  const [_, month, day, year] = match;
  return new Date(`${month} ${day}, ${year}`);
}

function formatDateToDisplay(dateObj) {
  if (!dateObj) return '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

function TicketModalForm({ ticket, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    subject: ticket.subject || '',
    ticketId: ticket.ticketId || '',
    followUpDate: ticket.followUpDate ? new Date(ticket.followUpDate).toISOString().split('T')[0] : '',
    description: ticket.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedTicket = {
      ...ticket,
      subject: formData.subject,
      ticketId: formData.ticketId,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : '',
      description: formData.description
    };
    onSave(updatedTicket);
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
          Subject *
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Enter ticket subject"
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
          Ticket ID *
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={formData.ticketId}
            onChange={(e) => setFormData(prev => ({ ...prev, ticketId: e.target.value }))}
            placeholder="Enter ticket ID"
            required
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            type="button"
                          onClick={() => {
                navigator.clipboard.writeText(formData.ticketId);
                toast.success('Ticket ID copied to clipboard!');
              }}
            title="Copy Ticket ID"
            style={{
              padding: '8px',
              background: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              minWidth: '36px',
              height: '36px'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#e9ecef';
              e.currentTarget.style.borderColor = '#adb5bd';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.borderColor = '#ced4da';
            }}
          >
            📋
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
          Follow Up Date *
        </label>
        <input
          type="date"
          value={formData.followUpDate}
          onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#495057' }}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter ticket description"
          rows="3"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      <div className="confirm-btns">
        <button type="submit" className="confirm-btn delete" style={{ background: '#28a745' }}>
          Save Ticket
        </button>
        <button type="button" className="confirm-btn cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function PackagePage({ pkg, packages, setPackages, setIsUpdatingPackages }) {
  const [companies, setCompanies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState(null);
  const [editEOC, setEditEOC] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVSO, setFilterVSO] = useState('');
  const [filterRevision, setFilterRevision] = useState('');
  const [filterRA, setFilterRA] = useState('');
  const [filterDistribution, setFilterDistribution] = useState('');
  const [filterBusinessProfileClaiming, setFilterBusinessProfileClaiming] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);
  const [pendingHistorySave, setPendingHistorySave] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  const [recentChanges, setRecentChanges] = useState(new Set());

  // Sync companies state with packages prop for real-time updates and ensure tasks are initialized
  useEffect(() => {
    if (packages && packages[pkg]) {
      let pkgCompanies = (packages[pkg] || []).map(c => {
        const companyWithTasks = {
          ...c,
          tasks: {
            forVSO: c.tasks?.forVSO || 'Pending',
            forRevision: c.tasks?.forRevision || 'Pending',
            ra: c.tasks?.ra || 'Pending',
            distribution: c.tasks?.distribution || 'Pending',
            businessProfileClaiming: c.tasks?.businessProfileClaiming || 'Pending',
          },
        };
        return companyWithTasks;
      });
      
      // Always update companies state to reflect the latest packages data
      setCompanies(pkgCompanies);
      
      // Only save back if tasks were completely missing (not if they were just updated)
      const hasMissingTasks = pkgCompanies.some((c, i) => {
        const originalCompany = packages[pkg][i] || {};
        return !originalCompany.tasks || 
               !originalCompany.tasks.forVSO || 
               !originalCompany.tasks.forRevision || 
               !originalCompany.tasks.ra || 
               !originalCompany.tasks.distribution || 
               !originalCompany.tasks.businessProfileClaiming;
      });
      
      if (hasMissingTasks) {
        const updatedPackages = { ...packages };
        updatedPackages[pkg] = pkgCompanies;
        savePackages(updatedPackages);
      }
    }
  }, [packages, pkg]);

  // History entry structure
  const createHistoryEntry = (companyId, companyName, packageName, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    companyName,
    packageName,
    field,
    oldValue,
    newValue,
    action
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]);
    setRecentChanges(prev => new Set([...prev, entry.companyId]));
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.companyId);
        return newSet;
      });
    }, 5000);
    
    // Debounced save to reduce database writes
    setPendingHistorySave(true);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const newTimeout = setTimeout(() => {
      setHistory(currentHistory => {
        if (currentHistory && currentHistory.length > 0) {
          saveHistoryLog(`seo-${pkg.toLowerCase().replace('seo - ', '')}`, currentHistory).catch(err => {
            console.error('Error saving history:', err);
          });
        }
        return currentHistory;
      });
      setPendingHistorySave(false);
    }, 2000); // 2 second delay
    setSaveTimeout(newTimeout);
  };

  const revertChange = async (historyEntry) => {
    setRevertModal(historyEntry);
  };

  const confirmRevert = async () => {
    const historyEntry = revertModal;
    try {
      const field = historyEntry.field;
      const value = historyEntry.oldValue;
      
      if (field === 'Status') {
        // Update company status
        const updatedPackages = { ...packages };
        updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
          c.id === historyEntry.companyId ? { ...c, status: value } : c
        );
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
      } else if (field === 'Company Name' || field === 'Start Date' || field === 'EOC Date') {
        // Handle company info changes
        const updatedPackages = { ...packages };
        updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
          c.id === historyEntry.companyId ? { 
            ...c, 
            name: field === 'Company Name' ? value : c.name,
            start: field === 'Start Date' ? value : c.start,
            eoc: field === 'EOC Date' ? value : c.eoc
          } : c
        );
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
      } else {
        // Handle task changes
        const updatedPackages = { ...packages };
        updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
          c.id === historyEntry.companyId ? {
            ...c,
            tasks: { ...c.tasks, [field.toLowerCase().replace(/ /g, '')]: value }
          } : c
        );
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
      }
      
      // Reload companies to reflect changes
      const updatedPackages = await getPackages();
      let pkgCompanies = (updatedPackages[pkg] || []).map(c => ({
        ...c,
        tasks: {
          forVSO: c.tasks?.forVSO || 'Pending',
          forRevision: c.tasks?.forRevision || 'Pending',
          ra: c.tasks?.ra || 'Pending',
          distribution: c.tasks?.distribution || 'Pending',
          businessProfileClaiming: c.tasks?.businessProfileClaiming || 'Pending',
        },
      }));
      setCompanies(pkgCompanies);
      
      // Add revert entry to history
      const revertEntry = createHistoryEntry(
        historyEntry.companyId,
        historyEntry.companyName,
        historyEntry.packageName,
        historyEntry.field,
        historyEntry.newValue,
        historyEntry.oldValue,
        'reverted'
      );
      addToHistory(revertEntry);
      
      setRevertModal(null);
      
    } catch (err) {
      console.error('Error reverting change:', err);
      alert('Failed to revert change. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    // Clear any pending save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    setPendingHistorySave(false);
    
    setHistory([]);
    await clearHistoryLog(`seo-${pkg.toLowerCase().replace('seo - ', '')}`);
    setClearHistoryModal(false);
  };

  const handleTicketModalSave = async (updatedTicket) => {
    try {
      console.log('🎫 Starting ticket save process...');
      console.log('🎫 Original ticket data:', updatedTicket);
      
      // Validate required fields
      if (!updatedTicket.id) {
        throw new Error('Ticket ID is missing');
      }
      if (!updatedTicket.company) {
        throw new Error('Company name is missing');
      }
      if (!updatedTicket.taskType) {
        throw new Error('Task type is missing');
      }
      
      // Ensure createdAt is set for proper ordering
      const ticketToSave = {
        ...updatedTicket,
        createdAt: updatedTicket.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('🎫 Final ticket to save:', ticketToSave);
      console.log('🎫 Calling saveTicket function...');
      
      await saveTicket(ticketToSave);
      
      console.log('🎫 Ticket saved successfully to Firestore');
      setTicketModal(null);
      toast.success(`✅ Ticket created successfully for ${updatedTicket.company}`);

    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast.error(`Failed to save ticket: ${error.message}`);
    }
  };

  const handleTicketModalCancel = async () => {
    // Rollback the Business Profile Claiming status to its previous value
    if (ticketModal && ticketModal.company && ticketModal.package) {
      const companyId = ticketModal.company.id;
      const oldValue = ticketModal.oldValue || 'Pending';
      
      try {
        // Update packages to rollback the status
        const updatedPackages = { ...packages };
        let pkgCompanies = (updatedPackages[ticketModal.package] || []).map(c => {
          if (c.id === companyId) {
            const updatedCompany = {
              ...c,
              tasks: { ...c.tasks, businessProfileClaiming: oldValue }
            };
            
            // Remove the temporary ticketId if it was set, but don't set it to undefined
            if (c.ticketId === ticketModal.ticket.id) {
              // Use delete operator to remove the property entirely
              delete updatedCompany.ticketId;
            }
            
            return updatedCompany;
          }
          return c;
        });
        updatedPackages[ticketModal.package] = pkgCompanies;
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
        setCompanies(pkgCompanies);
        
        // Add to history for the rollback
        const historyEntry = createHistoryEntry(
          companyId,
          ticketModal.company.name,
          ticketModal.package,
          'Business Profile Claiming',
          'Ticket',
          oldValue,
          'cancelled'
        );
        addToHistory(historyEntry);
        
        
              } catch (error) {
          console.error('Error rolling back ticket creation:', error);
          toast.error('Error cancelling ticket creation. Please try again.');
        
      }
    }
    
    setTicketModal(null);
  };

  // Task columns
  const taskKeys = [
    'forVSO',
    'forRevision',
    'ra',
    'distribution',
    'businessProfileClaiming',
  ];
  const taskLabels = [
    'FOR VSO',
    'FOR REVISION',
    'R/A',
    'Distribution',
    'Business Profile Claiming',
  ];
  const taskOptions = [
    { value: 'Pending', label: '🔴 Pending' },
    { value: 'Completed', label: '🟢 Completed' },
  ];
  const businessProfileClaimingOptions = [
    { value: 'Pending', label: '🟡 Pending' },
    { value: 'Ticket', label: '🔴 Ticket' },
    { value: 'Completed', label: '🟢 Completed' },
  ];

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog(`seo-${pkg.toLowerCase().replace('seo - ', '')}`);
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, [pkg]);

  // Save history to Firestore on every change (now handled by debounced addToHistory)
  // Removed to prevent double saves and reduce database usage



  // Handle dropdown change
  const handleTaskChange = async (companyId, taskKey, value) => {
    const company = companies.find(c => c.id === companyId);
    const oldValue = company?.tasks?.[taskKey] || 'Pending';
    
    // Special handling for Business Profile Claiming
    if (taskKey === 'businessProfileClaiming' && value === 'Ticket') {
      // Check if a ticket already exists for this company
      let existingTicket = null;
      if (company.ticketId) {
        try {
          // Verify the ticket actually exists in the database
          const { getTickets } = await import('./firestoreHelpers');
          const tickets = await getTickets();
          existingTicket = tickets.find(t => t.id === company.ticketId);
        } catch (error) {
          console.error('Error checking existing ticket:', error);
        }
      }
      
      if (existingTicket) {
        // Ticket already exists, update the status and reopen the ticket if it's closed
        const updatedPackages = { ...packages };
        let pkgCompanies = (updatedPackages[pkg] || []).map(c => {
          if (c.id === companyId) {
            return {
              ...c,
              tasks: { ...c.tasks, [taskKey]: value }
              // Keep existing ticketId
            };
          }
          return c;
        });
        updatedPackages[pkg] = pkgCompanies;
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
        setCompanies(pkgCompanies);
        
        // Reopen the ticket if it's currently closed (optimized - no additional read)
        if (existingTicket.status === 'closed') {
          try {
            const { saveTicket } = await import('./firestoreHelpers');
            const updatedTicket = { ...existingTicket, status: 'open' };
            await saveTicket(updatedTicket);
            toast.success(`✅ Ticket for ${company.name} reopened`);
          } catch (error) {
            console.error('Error reopening ticket:', error);
            toast.error('Failed to reopen ticket');
          }
        } else {
          toast.success(`✅ Existing ticket reactivated for ${company.name}`);
        }
        
        // Add to history
        const historyEntry = createHistoryEntry(
          companyId,
          company?.name || 'Unknown Company',
          pkg,
          'Business Profile Claiming',
          oldValue,
          value
        );
        addToHistory(historyEntry);
        
        return;
      } else if (company.ticketId) {
        // Clean up orphaned ticketId reference
        const updatedPackages = { ...packages };
        let pkgCompanies = (updatedPackages[pkg] || []).map(c => {
          if (c.id === companyId) {
            const updatedCompany = { ...c };
            // Use delete operator to remove the property entirely
            delete updatedCompany.ticketId;
            return updatedCompany;
          }
          return c;
        });
        updatedPackages[pkg] = pkgCompanies;
        setPackages(updatedPackages);
        await savePackages(updatedPackages);
        setCompanies(pkgCompanies);
      }
      
      // No existing ticket, create a new one
      const timestamp = Date.now();
      const ticketData = {
        id: timestamp.toString(),
        company: company.name,
        subject: `Business Profile Claiming - ${company.name}`,
        ticketId: `BPC-${timestamp}`, // Default ticket ID
        description: `Business Profile Claiming task for ${company.name} in ${pkg} package.`,
        status: 'open',
        priority: 'medium',
        category: 'Business Profile',
        createdAt: new Date().toISOString(), // Changed from createdDate to createdAt
        followUpDate: new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        package: pkg,
        companyId: companyId,
        taskType: 'businessProfileClaiming'
      };
      
              // Update company with ticket reference and save ticket to database
        const updatedPackages = { ...packages };
        let pkgCompanies = (updatedPackages[pkg] || []).map(c => {
          if (c.id === companyId) {
            return {
              ...c,
              tasks: { ...c.tasks, [taskKey]: value },
              ticketId: ticketData.id // Store ticket reference
            };
          }
          return c;
        });
        updatedPackages[pkg] = pkgCompanies;
        setPackages(updatedPackages);
        setCompanies(pkgCompanies);
        
        // Save both ticket and packages to Firestore
        try {
          setIsUpdatingPackages(true); // Prevent listener from interfering
          
          console.log('🎫 Saving ticket to Firestore:', ticketData.id);
          await saveTicket(ticketData);
          console.log('🎫 Ticket saved successfully');
          
          console.log('🎫 Saving packages to Firestore with updated company data');
          console.log('🎫 Updated packages data:', updatedPackages);
          await savePackages(updatedPackages);
          console.log('🎫 Packages updated successfully');
          
          // Verify the save by reading back the packages
          const { getPackages } = await import('./firestoreHelpers');
          const savedPackages = await getPackages();
          console.log('🎫 Verification - saved packages data:', savedPackages);
          
          toast.success(`✅ Ticket created and saved successfully for ${company.name}`);
        } catch (error) {
          console.error('❌ Error saving ticket or packages:', error);
          toast.error('Failed to save ticket. Please try again.');
        } finally {
          // Allow listener to update after a delay
          setTimeout(() => setIsUpdatingPackages(false), 2000);
        }
      
      // Add to history
      const historyEntry = createHistoryEntry(
        companyId,
        company?.name || 'Unknown Company',
        pkg,
        'Business Profile Claiming',
        oldValue,
        value
      );
      addToHistory(historyEntry);
      
      // Open ticket modal for finalization
      setTicketModal({
        ticket: ticketData,
        company: company,
        package: pkg,
        oldValue: oldValue // Store the old value for rollback
      });
      
      return;
    }
    
    // Handle Completed status - check if there's a related ticket
    if (taskKey === 'businessProfileClaiming' && value === 'Completed') {
      const companyWithTicket = companies.find(c => c.id === companyId);
      if (companyWithTicket?.ticketId) {
        try {
          // Optimistic UI update - update ticket status immediately
          const { getTickets, saveTicket } = await import('./firestoreHelpers');
          const tickets = await getTickets();
          const relatedTicket = tickets.find(t => t.id === companyWithTicket.ticketId);
          if (relatedTicket && relatedTicket.status !== 'closed') {
            const updatedTicket = { ...relatedTicket, status: 'closed' };
            await saveTicket(updatedTicket);
            toast.success(`✅ Ticket for ${company.name} marked as closed`);
          }
        } catch (error) {
          console.error('Error updating ticket status:', error);
          toast.error('Failed to update ticket status');
        }
      }
    }
    
    // Handle Ticket status - ensure ticket exists and is open
    if (taskKey === 'businessProfileClaiming' && value === 'Ticket') {
      const companyWithTicket = companies.find(c => c.id === companyId);
      if (companyWithTicket?.ticketId) {
        try {
          // Optimistic UI update - update ticket status immediately
          const { getTickets, saveTicket } = await import('./firestoreHelpers');
          const tickets = await getTickets();
          const relatedTicket = tickets.find(t => t.id === companyWithTicket.ticketId);
          if (relatedTicket && relatedTicket.status === 'closed') {
            const updatedTicket = { ...relatedTicket, status: 'open' };
            await saveTicket(updatedTicket);
            toast.success(`✅ Ticket for ${company.name} reopened`);
          }
        } catch (error) {
          console.error('Error updating ticket status:', error);
          toast.error('Failed to update ticket status');
        }
      }
    }
    
    // Handle Pending status - keep existing ticket but hide the button
    if (taskKey === 'businessProfileClaiming' && value === 'Pending') {
          // The ticket remains in the database but the button won't show
    // This allows for easy reactivation later
    toast.success(`Ticket for ${company.name} is now pending`);
      
    }
    
    // Regular task update
    const updatedPackages = { ...packages };
    let pkgCompanies = (updatedPackages[pkg] || []).map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          tasks: { ...c.tasks, [taskKey]: value },
        };
      }
      return c;
    });
    updatedPackages[pkg] = pkgCompanies;
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
    setCompanies(pkgCompanies);
    
    // Add to history
    const fieldName = taskLabels[taskKeys.indexOf(taskKey)] || taskKey;
    const historyEntry = createHistoryEntry(
      companyId,
      company?.name || 'Unknown Company',
      pkg,
      fieldName,
      oldValue,
      value
    );
    addToHistory(historyEntry);
  };

  const handleEdit = (company) => {
    setEditId(company.id);
    setEditName(company.name);
    setEditStart(parseDisplayDateToInput(company.start));
    setEditEOC(parseDisplayDateToInput(company.eocDate || company.eoc || getEOC(company.start)));
  };

  const handleEditSave = async (company) => {
    const updatedCompany = {
      ...company,
      name: editName,
      start: formatDateToDisplay(editStart),
      eocDate: formatDateToDisplay(editEOC),
    };

    // Optimistic UI update - apply changes immediately
    const updatedPackages = { ...packages };
    const updatedCompanies = (updatedPackages[pkg] || []).map(c =>
      c.id === company.id ? updatedCompany : c
    );
    updatedPackages[pkg] = updatedCompanies;
    setPackages(updatedPackages);
    setCompanies(updatedCompanies);
    
    // Show success message immediately
    toast.success('Company updated successfully');
    
    // Reset edit state immediately
    setEditId(null);
    setEditName('');
    setEditStart(null);
    setEditEOC(null);
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        await savePackages(updatedPackages);
        console.log('Company update saved to Firestore');
      } catch (error) {
        console.error('Failed to save company update:', error);
        toast.error('Failed to save changes - will retry');
      }
    });
    
    // Add to history for each changed field (background operation)
    addBackgroundOperation(async () => {
      if (editName !== company.name) {
        const historyEntry = createHistoryEntry(
          company.id,
          company.name,
          pkg,
          'Company Name',
          company.name,
          editName
        );
        addToHistory(historyEntry);
      }
      
      if (formatDateToDisplay(editStart) !== company.start) {
        const historyEntry = createHistoryEntry(
          company.id,
          company.name,
          pkg,
          'Start Date',
          company.start,
          formatDateToDisplay(editStart)
        );
        addToHistory(historyEntry);
      }
      
      if (formatDateToDisplay(editEOC) !== (company.eocDate || company.eoc)) {
        const historyEntry = createHistoryEntry(
          company.id,
          company.name,
          pkg,
          'EOC Date',
          company.eocDate || company.eoc,
          formatDateToDisplay(editEOC)
        );
        addToHistory(historyEntry);
      }
    });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditName('');
    setEditStart(null);
    setEditEOC(null);
  };

  const handleRemove = (company) => {
    setConfirmRemoveId(company.id);
  };
  const handleRemoveConfirm = async () => {
    // Use confirmRemoveId to find the company to remove
    const companyToRemove = (companies || []).find(c => c.id === confirmRemoveId);
    
    // Optimistic UI update - remove immediately
    const updatedPackages = { ...packages };
    const updatedCompanies = (updatedPackages[pkg] || []).filter(c => c.id !== confirmRemoveId);
    updatedPackages[pkg] = updatedCompanies;
    setPackages(updatedPackages);
    setCompanies(updatedCompanies);
    
    // Show success message immediately
    toast.success('Company removed successfully');
    
    // Reset confirm state immediately
    setConfirmRemoveId(null);
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        await savePackages(updatedPackages);
        console.log('Company removal saved to Firestore');
      } catch (error) {
        console.error('Failed to save company removal:', error);
        toast.error('Failed to save removal - will retry');
      }
    });
    
    // Add to history (background operation)
    if (companyToRemove) {
      addBackgroundOperation(async () => {
        const historyEntry = createHistoryEntry(
          companyToRemove.id,
          companyToRemove.name,
          pkg,
          'Company',
          'In Package',
          'Removed',
          'removed'
        );
        addToHistory(historyEntry);
        
        // Add to trash
        const trash = await getTrash();
        trash.push({ ...companyToRemove, originalPackage: pkg, type: 'company' });
        await saveTrash(trash);
      });
    }
  };
  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  // Handle status change
  const handleStatusChange = async (companyId, newStatus) => {
    const company = companies.find(c => c.id === companyId);
    const oldStatus = company?.status || 'Active';
    const today = new Date();
    
    // Optimistic UI update - apply status change immediately
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c => {
      if (c.id === companyId) {
        const updatedCompany = { ...c, status: newStatus };
        
        // Track OnHold periods
        if (newStatus === 'OnHold' && c.status !== 'OnHold') {
          // Starting OnHold period
          updatedCompany.onholdStartDate = today.toISOString();
          updatedCompany.onholdEndDate = null;
        } else if (c.status === 'OnHold' && newStatus !== 'OnHold') {
          // Ending OnHold period
          if (c.onholdStartDate) {
            const startDate = new Date(c.onholdStartDate);
            const onholdDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            updatedCompany.totalOnholdDays = (c.totalOnholdDays || 0) + onholdDays;
            updatedCompany.onholdEndDate = today.toISOString();
          }
        }
        
        return updatedCompany;
      }
      return c;
    });
    
    setPackages(updatedPackages);
    setCompanies(updatedPackages[pkg]);
    
    // Show success message immediately
    toast.success(`Status changed to ${newStatus}`);
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        await savePackages(updatedPackages);
        console.log('Status change saved to Firestore');
      } catch (error) {
        console.error('Failed to save status change:', error);
        toast.error('Failed to save status change - will retry');
      }
    });
    
    // Add to history (background operation)
    addBackgroundOperation(async () => {
      const historyEntry = createHistoryEntry(
        companyId,
        company?.name || 'Unknown Company',
        pkg,
        'Status',
        oldStatus,
        newStatus
      );
      addToHistory(historyEntry);
    });
  };
  // Filtered companies for this package
  const filteredCompanies = (companies || [])
    .filter(c => c.name && c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !filterStatus || c.status === filterStatus)
    .filter(c => !filterVSO || (c.tasks?.forVSO || 'Pending') === filterVSO)
    .filter(c => !filterRevision || (c.tasks?.forRevision || 'Pending') === filterRevision)
    .filter(c => !filterRA || (c.tasks?.ra || 'Pending') === filterRA)
    .filter(c => !filterDistribution || (c.tasks?.distribution || 'Pending') === filterDistribution)
    .filter(c => !filterBusinessProfileClaiming || (c.tasks?.businessProfileClaiming || 'Pending') === filterBusinessProfileClaiming);

  const pageCount = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = filteredCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="company-tracker-page">
      <h2 className="fancy-subtitle">{pkg} Companies</h2>
      <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filteredCompanies.length}</div>

      {/* History Log Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 16px',
            background: showHistory ? '#007bff' : '#f8f9fa',
            color: showHistory ? '#ffffff' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
          }}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
          {pendingHistorySave && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              background: '#ffc107',
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite'
            }} />
          )}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e0e7ef',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto 30px'
        }}>
          {/* Icon-only Clear History button in upper right */}
          <button
            onClick={() => setClearHistoryModal(true)}
            title="Clear History"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.18s',
              zIndex: 1
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8d7da'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {/* Trash can SVG icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <div style={{ paddingRight: '40px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#495057' }}>History Log</h3>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '16px', marginTop: '20px' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', margin: '30px 0', fontSize: '1.1rem' }}>
                No history entries yet
              </p>
            ) : (
              <div>
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                      borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : 
                                 entry.packageName === 'SEO - BASIC' ? '4px solid #4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '4px solid #00897B' :
                                 entry.packageName === 'SEO - PRO' ? '4px solid #8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '4px solid #1A237E' : '4px solid #007bff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#495057', 
                        marginBottom: '6px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          flex: '1', 
                          minWidth: 0, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#495057',
                          fontWeight: '600'
                        }}>
                          {entry.companyName}
                        </span>
                        <span style={{ 
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#6c757d',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.packageName}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        color: '#6c757d', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                        <span style={{ 
                          color: entry.oldValue === 'Completed' ? '#28a745' : entry.oldValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : entry.newValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.newValue}</span>
                        {entry.action === 'reverted' && (
                          <span style={{ 
                            color: '#ffc107', 
                            marginLeft: '4px', 
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#adb5bd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '0.9em' }}>🕒</span>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                    {entry.action !== 'reverted' && (
                      <button
                        onClick={() => revertChange(entry)}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#6c757d',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px',
                          alignSelf: 'center',
                          whiteSpace: 'nowrap',
                          height: '32px'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.color = '#495057';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#6c757d';
                        }}
                      >
                        <span style={{ fontSize: '0.9em' }}>↩️</span>
                        Revert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-scroll-container table-responsive">
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>SEO Package</th>
              <th>Start Date</th>
              <th>EOC</th>
              <th>Status
                <select
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  style={{ marginTop: 4, width: '100%', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '0.95rem', background: '#faf9f6', color: '#232323' }}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="OnHold">OnHold</option>
                </select>
              </th>
              {taskLabels.map((label, i) => (
                <th key={label} style={{ minWidth: label === 'Business Profile Claiming' ? 180 : 140 }}>
                  {label}
                  <select
                    value={
                      i === 0 ? filterVSO :
                      i === 1 ? filterRevision :
                      i === 2 ? filterRA :
                      i === 3 ? filterDistribution :
                      i === 4 ? filterBusinessProfileClaiming :
                      ''
                    }
                    onChange={e => {
                      if (i === 0) setFilterVSO(e.target.value);
                      else if (i === 1) setFilterRevision(e.target.value);
                      else if (i === 2) setFilterRA(e.target.value);
                      else if (i === 3) setFilterDistribution(e.target.value);
                      else if (i === 4) setFilterBusinessProfileClaiming(e.target.value);
                      setPage(1);
                    }}
                    style={{ marginTop: 4, width: '100%', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '0.95rem', background: '#faf9f6', color: '#232323' }}
                  >
                    <option value="">All</option>
                    {label === 'Business Profile Claiming' ? (
                      <>
                        <option value="Ticket">🔴 Ticket</option>
                        <option value="Completed">🟢 Completed</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">🔴 Pending</option>
                        <option value="Completed">🟢 Completed</option>
                      </>
                    )}
                  </select>
                </th>
              ))}
              <th className="package-search-th">
                <input
                  name="companySearch"
                  type="text"
                  className="package-search-input"
                  placeholder="Search company..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedCompanies.length === 0 && (
              <tr>
                <td className="no-companies" colSpan={6 + taskLabels.length + 2}>No companies found.</td>
              </tr>
            )}
            {paginatedCompanies.map(c => (
              <tr key={c.id}>
                <td className="company-name">
                  {editId === c.id ? (
                    <input
                      name="editCompanyName"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td>
                  <span className={
                    c.package === 'SEO - BASIC' ? 'package-basic' :
                    c.package === 'SEO - PREMIUM' ? 'package-premium' :
                    c.package === 'SEO - PRO' ? 'package-pro' :
                    c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                  }>
                    {c.package}
                  </span>
                </td>
                <td>
                  {editId === c.id ? (
                    <DatePicker
                      selected={editStart}
                      onChange={date => setEditStart(date)}
                      dateFormat="MMMM d, yyyy"
                      className="react-datepicker__input"
                      popperPlacement="bottom"
                      placeholderText="Type: MM/DD/YYYY or click to pick"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={20}
                      scrollableYearDropdown
                      customInput={
                        <input
                          style={{
                            padding: '0.5em 1em',
                            borderRadius: 8,
                            border: '1.5px solid #b6b6d8',
                            fontSize: '1rem',
                            minWidth: 120,
                            outline: 'none'
                          }}
                          placeholder="Type: MM/DD/YYYY or click to pick"
                        />
                      }
                      renderCustomHeader={({ date, changeYear, changeMonth }) => (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '8px',
                          background: '#f8f9fa',
                          borderBottom: '1px solid #e9ecef',
                          borderRadius: '4px 4px 0 0'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            <span>Quick Navigation:</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <button
                                onClick={() => changeYear(date.getFullYear() - 1)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  background: '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#495057',
                                  fontWeight: '500',
                                  transition: 'all 0.2s',
                                  minWidth: '32px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = '#007bff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = '#e9ecef';
                                  e.target.style.color = '#495057';
                                }}
                              >
                                ←
                              </button>
                              <span style={{ 
                                fontSize: '1rem', 
                                fontWeight: '600', 
                                color: '#495057',
                                minWidth: '60px',
                                textAlign: 'center'
                              }}>
                                {date.getFullYear()}
                              </span>
                              <button
                                onClick={() => changeYear(date.getFullYear() + 1)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  background: '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#495057',
                                  fontWeight: '500',
                                  transition: 'all 0.2s',
                                  minWidth: '32px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = '#007bff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = '#e9ecef';
                                  e.target.style.color = '#495057';
                                }}
                              >
                                →
                              </button>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            color: '#856404',
                            fontWeight: '700',
                            margin: '8px 0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            📅 {date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap'
                          }}>
                            {/* Quick Year + Month combinations */}
                            {[
                              { label: '2y ago (Jan)', year: -2, month: 0 },
                              { label: '3y ago (Jan)', year: -3, month: 0 },
                              { label: '5y ago (Jan)', year: -5, month: 0 },
                              { label: '2y ago (Jun)', year: -2, month: 5 },
                              { label: '3y ago (Jun)', year: -3, month: 5 },
                              { label: '5y ago (Jun)', year: -5, month: 5 }
                            ].map(({ label, year, month }) => (
                              <button
                                key={label}
                                onClick={() => {
                                  changeYear(date.getFullYear() + year);
                                  changeMonth(month);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  background: '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#495057',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = '#007bff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = '#e9ecef';
                                  e.target.style.color = '#495057';
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #dee2e6'
                          }}>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '4px'
                            }}>
                              Quick Months:
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '3px',
                              flexWrap: 'wrap'
                            }}>
                              {/* All months for current year */}
                              {[
                                { label: 'Jan', month: 0 },
                                { label: 'Feb', month: 1 },
                                { label: 'Mar', month: 2 },
                                { label: 'Apr', month: 3 },
                                { label: 'May', month: 4 },
                                { label: 'Jun', month: 5 },
                                { label: 'Jul', month: 6 },
                                { label: 'Aug', month: 7 },
                                { label: 'Sep', month: 8 },
                                { label: 'Oct', month: 9 },
                                { label: 'Nov', month: 10 },
                                { label: 'Dec', month: 11 }
                              ].map(({ label, month }) => {
                                const isCurrentMonth = date.getMonth() === month;
                                return (
                                  <button
                                    key={label}
                                    onClick={() => changeMonth(month)}
                                    style={{
                                      padding: '3px 6px',
                                      fontSize: '0.75rem',
                                      background: isCurrentMonth ? '#007bff' : '#f8f9fa',
                                      border: `1px solid ${isCurrentMonth ? '#007bff' : '#dee2e6'}`,
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      color: isCurrentMonth ? '#fff' : '#6c757d',
                                      fontWeight: isCurrentMonth ? '600' : '500',
                                      transition: 'all 0.2s',
                                      minWidth: '28px',
                                      textAlign: 'center',
                                      position: 'relative'
                                    }}
                                    onMouseOver={e => {
                                      if (!isCurrentMonth) {
                                        e.target.style.background = '#28a745';
                                        e.target.style.color = '#fff';
                                        e.target.style.borderColor = '#28a745';
                                      }
                                    }}
                                    onMouseOut={e => {
                                      if (!isCurrentMonth) {
                                        e.target.style.background = '#f8f9fa';
                                        e.target.style.color = '#6c757d';
                                        e.target.style.borderColor = '#dee2e6';
                                      }
                                    }}
                                  >
                                    {label}
                                    {isCurrentMonth && (
                                      <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        width: '6px',
                                        height: '6px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        border: '1px solid #007bff'
                                      }} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    c.start
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <DatePicker
                      selected={editEOC}
                      onChange={date => setEditEOC(date)}
                      dateFormat="MMMM d, yyyy"
                      className="react-datepicker__input"
                      popperPlacement="bottom"
                      placeholderText="Type: MM/DD/YYYY or click to pick"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={20}
                      scrollableYearDropdown
                      customInput={
                        <input
                          style={{
                            padding: '0.5em 1em',
                            borderRadius: 8,
                            border: '1.5px solid #b6b6d8',
                            fontSize: '1rem',
                            minWidth: 120,
                            outline: 'none'
                          }}
                          placeholder="Type: MM/DD/YYYY or click to pick"
                        />
                      }
                      renderCustomHeader={({ date, changeYear, changeMonth }) => (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '8px',
                          background: '#f8f9fa',
                          borderBottom: '1px solid #e9ecef',
                          borderRadius: '4px 4px 0 0'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            <span>Quick Navigation:</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <button
                                onClick={() => changeYear(date.getFullYear() - 1)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  background: '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#495057',
                                  fontWeight: '500',
                                  transition: 'all 0.2s',
                                  minWidth: '32px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = '#007bff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = '#e9ecef';
                                  e.target.style.color = '#495057';
                                }}
                              >
                                ←
                              </button>
                              <span style={{ 
                                fontSize: '1rem', 
                                fontWeight: '600', 
                                color: '#495057',
                                minWidth: '60px',
                                textAlign: 'center'
                              }}>
                                {date.getFullYear()}
                              </span>
                              <button
                                onClick={() => changeYear(date.getFullYear() + 1)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  background: '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#495057',
                                  fontWeight: '500',
                                  transition: 'all 0.2s',
                                  minWidth: '32px'
                                }}
                                onMouseOver={e => {
                                  e.target.style.background = '#007bff';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.target.style.background = '#e9ecef';
                                  e.target.style.color = '#495057';
                                }}
                              >
                                →
                              </button>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            color: '#856404',
                            fontWeight: '700',
                            margin: '8px 0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            📅 {date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #dee2e6'
                          }}>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '4px'
                            }}>
                              Quick Months:
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '3px',
                              flexWrap: 'wrap'
                            }}>
                              {/* All months for current year */}
                              {[
                                { label: 'Jan', month: 0 },
                                { label: 'Feb', month: 1 },
                                { label: 'Mar', month: 2 },
                                { label: 'Apr', month: 3 },
                                { label: 'May', month: 4 },
                                { label: 'Jun', month: 5 },
                                { label: 'Jul', month: 6 },
                                { label: 'Aug', month: 7 },
                                { label: 'Sep', month: 8 },
                                { label: 'Oct', month: 9 },
                                { label: 'Nov', month: 10 },
                                { label: 'Dec', month: 11 }
                              ].map(({ label, month }) => {
                                const isCurrentMonth = date.getMonth() === month;
                                return (
                                  <button
                                    key={label}
                                    onClick={() => changeMonth(month)}
                                    style={{
                                      padding: '3px 6px',
                                      fontSize: '0.75rem',
                                      background: isCurrentMonth ? '#007bff' : '#f8f9fa',
                                      border: `1px solid ${isCurrentMonth ? '#007bff' : '#dee2e6'}`,
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      color: isCurrentMonth ? '#fff' : '#6c757d',
                                      fontWeight: isCurrentMonth ? '600' : '500',
                                      transition: 'all 0.2s',
                                      minWidth: '28px',
                                      textAlign: 'center',
                                      position: 'relative'
                                    }}
                                    onMouseOver={e => {
                                      if (!isCurrentMonth) {
                                        e.target.style.background = '#28a745';
                                        e.target.style.color = '#fff';
                                        e.target.style.borderColor = '#28a745';
                                      }
                                    }}
                                    onMouseOut={e => {
                                      if (!isCurrentMonth) {
                                        e.target.style.background = '#f8f9fa';
                                        e.target.style.color = '#6c757d';
                                        e.target.style.borderColor = '#dee2e6';
                                      }
                                    }}
                                  >
                                    {label}
                                    {isCurrentMonth && (
                                      <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        width: '6px',
                                        height: '6px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        border: '1px solid #007bff'
                                      }} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    c.eocDate || c.eoc || getEOC(c.start)
                  )}
                </td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => handleStatusChange(c.id, e.target.value)}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="OnHold">🟣 OnHold</option>
                  </select>
                </td>
                {taskKeys.map((key, i) => (
                  <td key={key} style={{ minWidth: key === 'businessProfileClaiming' ? 180 : 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={c.tasks?.[key] || 'Pending'}
                        onChange={e => handleTaskChange(c.id, key, e.target.value)}
                        style={{ minWidth: 120 }}
                      >
                        {(key === 'businessProfileClaiming' ? businessProfileClaimingOptions : taskOptions).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {key === 'businessProfileClaiming' && c.tasks?.[key] === 'Ticket' && c.ticketId && (
                        <button
                          onClick={() => window.location.href = `/tickets?ticket=${c.ticketId}`}
                          title="View Ticket in Tickets Page"
                          style={{
                            padding: '4px 8px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#0056b3';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = '#007bff';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          🎫 View
                        </button>
                      )}
                    </div>
                  </td>
                ))}
                <td>
                  <div className="action-btns">
                    {editId === c.id ? (
                      <>
                        <button className="hero-cta save" onClick={() => handleEditSave(c)}>Save</button>
                        <button className="delete-btn" style={{background:'#eee',color:'#232323'}} onClick={handleEditCancel}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="delete-btn edit-btn" onClick={() => handleEdit(c)}>Edit</button>
                        <button className="remove-btn" onClick={() => handleRemove(c)}>X</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        {pageCount > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: page === 1 ? '#f0f0f0' : 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                color: page === 1 ? '#bbb' : '#fff',
                border: page === 1 ? '1.5px solid #e0e0e0' : 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1em',
                padding: '0.5em 1.5em',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.7 : 1,
                transition: 'background 0.18s, color 0.18s',
              }}
            >Prev</button>
            <span>Page {page} of {pageCount}</span>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              style={{
                background: page === pageCount ? '#f0f0f0' : 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                color: page === pageCount ? '#bbb' : '#fff',
                border: page === pageCount ? '1.5px solid #e0e0e0' : 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1em',
                padding: '0.5em 1.5em',
                cursor: page === pageCount ? 'not-allowed' : 'pointer',
                opacity: page === pageCount ? 0.7 : 1,
                transition: 'background 0.18s, color 0.18s',
              }}
            >Next</button>
          </div>
        )}
      </div>
      {confirmRemoveId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to remove this company?</div>
            <div className="confirm-desc">It will be moved to Trash.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleRemoveConfirm}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {revertModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Revert Change?</div>
            <div className="confirm-desc">
              Are you sure you want to revert "{revertModal.companyName}" {revertModal.field} from "{revertModal.newValue}" back to "{revertModal.oldValue}"?
            </div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={confirmRevert}>Yes, Revert</button>
              <button className="confirm-btn cancel" onClick={() => setRevertModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Clear History?</div>
            <div className="confirm-desc">
              Are you sure you want to clear all history for {pkg}? This action cannot be undone.
            </div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleClearHistory}>Yes, Clear</button>
              <button className="confirm-btn cancel" onClick={() => setClearHistoryModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {ticketModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="confirm-title">
              Finalize Ticket Details
            </div>
            <div className="confirm-desc" style={{ marginBottom: '20px' }}>
              <strong>Company:</strong> {ticketModal.company.name}<br/>
              <strong>Package:</strong> {ticketModal.package}<br/>
              <strong>Ticket ID:</strong> {ticketModal.ticket.id}<br/>
              <em style={{ color: '#6c757d', fontSize: '0.9rem' }}>Please fill in the required details below. This ticket will be created once you click Save.</em>
            </div>
            
            <TicketModalForm 
              ticket={ticketModal.ticket}
              onSave={handleTicketModalSave}
              onCancel={handleTicketModalCancel}
              isViewMode={false}
            />
          </div>
        </div>
      )}

    </section>
  );
}
function Report({ packages, setPackages }) {
  // Store filters for each package in an object
  const [filterI, setFilterI] = useState({});
  const [filterII, setFilterII] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  // Remove confirmRemove state since we're removing X buttons
  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 15;
  
  // History system states
  const [history, setHistory] = useState([]); // Array of history entries
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set()); // Track recently changed companies
  const [confirmModal, setConfirmModal] = useState(null); // For confirmation modal
  const [revertModal, setRevertModal] = useState(null); // For revert confirmation modal
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('report');
      // Ensure we're getting the array from the log field
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  // Save history to Firestore on every change
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('report', history).catch(err => {
      });
    }
  }, [history]);

  useEffect(() => {
    // Monthly reset logic only
    const today = new Date();
    const firstOfMonth = today.getDate() === 1;
    const thisMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
    const lastReset = localStorage.getItem('report-last-reset');
    if (firstOfMonth && lastReset !== thisMonth) {
      // Reset all reportI and reportII to 'Pending'
      getPackages().then(pkgs => {
        Object.keys(pkgs).forEach(pkg => {
          pkgs[pkg] = (pkgs[pkg] || []).map(c => ({ ...c, reportI: 'Pending', reportII: 'Pending' }));
        });
        savePackages(pkgs);
        setPackages(pkgs);
        localStorage.setItem('report-last-reset', thisMonth);
      });
    }
  }, []);

  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // History entry structure
  const createHistoryEntry = (companyId, companyName, packageName, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    companyName,
    packageName,
    field,
    oldValue,
    newValue,
    action
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
    // Mark as recently changed
    setRecentChanges(prev => new Set([...prev, entry.companyId]));
    // Remove from recent changes after 5 seconds
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.companyId);
        return newSet;
      });
    }, 5000);
  };

  const revertChange = async (historyEntry) => {
    setRevertModal(historyEntry);
  };

  const confirmRevert = async () => {
    const historyEntry = revertModal;
    try {
      const field = historyEntry.field === 'Report I' ? 'reportI' : 'reportII';
      const value = historyEntry.oldValue;
      
      // Update in packages
      const updatedPackages = { ...packages };
      updatedPackages[historyEntry.packageName] = (updatedPackages[historyEntry.packageName] || []).map(c =>
        c.id === historyEntry.companyId ? { ...c, [field]: value } : c
      );
      setPackages(updatedPackages);
      await savePackages(updatedPackages);
      
      // Add revert entry to history
      const revertEntry = createHistoryEntry(
        historyEntry.companyId,
        historyEntry.companyName,
        historyEntry.packageName,
        historyEntry.field,
        historyEntry.newValue,
        historyEntry.oldValue,
        'reverted'
      );
      addToHistory(revertEntry);
      
      setRevertModal(null);
      
    } catch (err) {
      alert('Failed to revert change. Please try again.');
    }
  };

  // Helper to update report status in shared state
  const handleReportStatusChange = async (pkg, companyId, reportKey, value) => {
    const oldValue = packages[pkg]?.find(c => c.id === companyId)?.[reportKey] || 'Pending';
    const company = packages[pkg]?.find(c => c.id === companyId);
    
    if (value === 'Completed' && reportKey === 'reportII') {
      // Show confirmation modal only for Report II completion
      setConfirmModal({
        type: 'complete',
        company,
        packageName: pkg,
        field: 'Report II',
        oldValue,
        newValue: value
      });
      return;
    }
    
    // For Report I completion or reverting to Pending, proceed directly
    await performStatusUpdate(pkg, companyId, reportKey, value, company, oldValue);
  };

  const performStatusUpdate = async (pkg, companyId, reportKey, value, company, oldValue) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [reportKey]: value } : c
    );
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
    
    // Add to history
    const historyEntry = createHistoryEntry(
      companyId,
      company?.name || 'Unknown Company',
      pkg,
      reportKey === 'reportI' ? 'Report I' : 'Report II',
      oldValue,
      value
    );
    addToHistory(historyEntry);
  };

  const confirmStatusChange = async () => {
    const { company, packageName, field, newValue, oldValue } = confirmModal;
    const reportKey = field === 'Report I' ? 'reportI' : 'reportII';
    
    await performStatusUpdate(packageName, company.id, reportKey, newValue, company, oldValue);
    setConfirmModal(null);
  };

  // Helper for dropdown color
  const getDropdownStyle = value => ({
    borderRadius: 8,
    padding: '0.3em 1em',
    fontWeight: 600,
    fontSize: '1rem',
    background: value === 'Completed'
      ? 'linear-gradient(90deg, #eaffea 60%, #b6f5c3 100%)'
      : value === 'Pending'
      ? 'linear-gradient(90deg, #ffeaea 60%, #ffd6d6 100%)'
      : 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
    color: value === 'Completed' ? '#19744d' : value === 'Pending' ? '#c00' : '#232323',
    border: '1.5px solid #b6b6d8',
    outline: 'none',
    minWidth: 120,
    boxShadow: '0 1px 4px #ececec',
    transition: 'background 0.18s, color 0.18s',
  });

  // Handlers for per-package filters
  const handleFilterI = (pkg, value) => {
    setFilterI(f => ({ ...f, [pkg]: value }));
    setPage(p => ({ ...p, [pkg]: 1 }));
  };
  const handleFilterII = (pkg, value) => {
    setFilterII(f => ({ ...f, [pkg]: value }));
    setPage(p => ({ ...p, [pkg]: 1 }));
  };

  // Remove the remove functions since we're removing X buttons

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('report');
    setClearHistoryModal(false);
  };

  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
      <h1 className="fancy-title">Report for {currentMonth}</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 16px',
            background: showHistory ? '#007bff' : '#f8f9fa',
            color: showHistory ? '#ffffff' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
        </button>
      </div>
      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Clear History Log?</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to clear the entire history log? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={handleClearHistory}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setClearHistoryModal(false)}
                style={{
                  padding: '10px 25px',
                  background: '#6c757d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
      
      {/* History Panel */}
      {showHistory && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e0e7ef',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto 30px'
        }}>
          {/* Icon-only Clear History button in upper right */}
          <button
            onClick={() => setClearHistoryModal(true)}
            title="Clear History"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.18s',
              zIndex: 1
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8d7da'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {/* Trash can SVG icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <div style={{ paddingRight: '40px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#495057' }}>History Log</h3>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '16px', marginTop: '20px' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', margin: '30px 0', fontSize: '1.1rem' }}>
                No history entries yet
              </p>
            ) : (
              <div>
                {history.map((entry, index) => (
                                      <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                      borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : 
                                 entry.packageName === 'SEO - BASIC' ? '4px solid #4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '4px solid #00897B' :
                                 entry.packageName === 'SEO - PRO' ? '4px solid #8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '4px solid #1A237E' : '4px solid #007bff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#495057', 
                        marginBottom: '6px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          flex: '1', 
                          minWidth: 0, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#495057',
                          fontWeight: '600'
                        }}>
                          {entry.companyName}
                        </span>
                        <span style={{ 
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#6c757d',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.packageName}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        color: '#6c757d', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                        <span style={{ 
                          color: entry.oldValue === 'Completed' ? '#28a745' : entry.oldValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : entry.newValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.newValue}</span>
                        {entry.action === 'reverted' && (
                          <span style={{ 
                            color: '#ffc107', 
                            marginLeft: '4px', 
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#adb5bd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '0.9em' }}>🕒</span>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                    {entry.action !== 'reverted' && (
                      <button
                        onClick={() => revertChange(entry)}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#6c757d',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px',
                          alignSelf: 'center',
                          whiteSpace: 'nowrap',
                          height: '32px'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.color = '#495057';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#6c757d';
                        }}
                      >
                        <span style={{ fontSize: '1.1em', lineHeight: 1, marginRight: '1px' }}>↩️</span>
                        Revert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {packageNames.map(pkg => {
        // Filter companies by report status for this package
        const filtered = (packages[pkg] || [])
          .filter(c => c.status !== 'OnHold')
          .filter(c => {
            const matchI = !filterI[pkg] || (c.reportI || 'Pending') === filterI[pkg];
            const matchII = !filterII[pkg] || (c.reportII || 'Pending') === filterII[pkg];
            const matchSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
            return matchI && matchII && matchSearch;
          });
        // Pagination logic
        const currentPage = page[pkg] || 1;
        const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
        const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        // Count companies with Report I not completed (excluding OnHold)
        const pendingReportICount = (packages[pkg] || []).filter(c => c.status !== 'OnHold' && c.reportI !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {pendingReportICount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#fffbe6',
                color: '#b26a00',
                borderRadius: 999,
                padding: '0.5em 1.5em',
                fontWeight: 700,
                fontSize: '1.08em',
                border: '1.5px solid #ffe082',
                boxShadow: '0 1px 4px #fffbe6',
                marginBottom: 18,
                marginLeft: 2,
                letterSpacing: '0.03em',
              }}>
                <span style={{fontSize:'1.2em',marginRight:8}}>⚠️</span>
                {pendingReportICount} compan{pendingReportICount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package are still pending for Report I this month.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filtered.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <input
                name={`companySearch_${pkg}`}
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container table-responsive" style={{
              marginBottom: 0, height: 'auto', width: '100%'}}>
              <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th className="company-col">Company Name</th>
                    <th className="package-col">SEO Package</th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>Report I</span>
                        <select
                          value={filterI[pkg] || ''}
                          onChange={e => handleFilterI(pkg, e.target.value)}
                          style={{ borderRadius: 8, padding: '0.2em 0.7em', fontSize: '0.98em', marginTop: 2, border: '1.5px solid #b6b6d8', background:'#fff', color:'#232323', fontWeight:600 }}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>Report II</span>
                        <select
                          value={filterII[pkg] || ''}
                          onChange={e => handleFilterII(pkg, e.target.value)}
                          style={{ borderRadius: 8, padding: '0.2em 0.7em', fontSize: '0.98em', marginTop: 2, border: '1.5px solid #b6b6d8', background:'#fff', color:'#232323', fontWeight:600 }}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col" style={{minWidth:120}}>Start Date</th>
                    {/* Remove the action column header */}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {paginated.map(c => {
                    // Parse start date
                    let readyForReportII = false;
                    let startDateObj = null;
                    if (c.start) {
                      const match = c.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
                      if (match) {
                        const [_, month, day, year] = match;
                        startDateObj = new Date(`${month} ${day}, ${year}`);
                        const now = new Date();
                        if (startDateObj && !isNaN(startDateObj)) {
                          const diff = Math.floor((now - startDateObj) / (1000 * 60 * 60 * 24));
                          readyForReportII = diff >= 16 && c.reportII !== 'Completed';
                        }
                      }
                    }
                    const isRecentlyChanged = recentChanges.has(c.id);
                    
                    return (
                      <tr key={c.id} style={{ 
                        transition: 'background 0.18s',
                        background: isRecentlyChanged ? '#fff3cd' : 'transparent',
                        borderLeft: isRecentlyChanged ? '4px solid #ffc107' : 'none'
                      }}>
                        <td className="company-name company-col">
                          {c.name}
                          {isRecentlyChanged && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#ffc107' }}>🔄</span>}
                        </td>
                        <td className="package-col">
                          <span className={
                            c.package === 'SEO - BASIC' ? 'package-basic' :
                            c.package === 'SEO - PREMIUM' ? 'package-premium' :
                            c.package === 'SEO - PRO' ? 'package-pro' :
                            c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                          }>
                            {c.package}
                          </span>
                        </td>
                        <td className="report-col">
                          <select
                            value={c.reportI || 'Pending'}
                            onChange={e => handleReportStatusChange(pkg, c.id, 'reportI', e.target.value)}
                            style={getDropdownStyle(c.reportI || 'Pending')}
                          >
                            <option value="Pending">🔴 Pending</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        </td>
                        <td className="report-col">
                          {c.reportII === 'Completed' ? (
                            <span style={{
                              display: 'inline-block',
                              background: '#4caf50',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '0.3em 1.2em',
                              fontWeight: 700,
                              fontSize: '1em',
                              letterSpacing: '0.03em',
                              boxShadow: '0 1px 4px #e0ffe0',
                            }}>Completed</span>
                          ) : (
                            <select
                              value={c.reportII || 'Pending'}
                              onChange={e => handleReportStatusChange(pkg, c.id, 'reportII', e.target.value)}
                              style={getDropdownStyle(c.reportII || 'Pending')}
                            >
                              <option value="Pending">🔴 Pending</option>
                              <option value="Completed">🟢 Completed</option>
                            </select>
                          )}
                        </td>
                        <td className="report-col" style={{textAlign:'center', fontWeight:500, fontSize:'1em'}}>
                          {c.start || '-'}
                          {readyForReportII && (
                            <span style={{
                              display: 'inline-block',
                              marginLeft: 8,
                              background: '#fffbe6',
                              color: '#b26a00',
                              borderRadius: 8,
                              padding: '0.2em 0.9em',
                              fontWeight: 700,
                              fontSize: '0.98em',
                              border: '1.5px solid #ffe082',
                              boxShadow: '0 1px 4px #fffbe6',
                              verticalAlign: 'middle',
                            }}>Ready for Report II</span>
                          )}
                        </td>
                        {/* Remove the action column with X button */}
                      </tr>
                    );
                  })}
                  {filtered.length > PAGE_SIZE && filtered.slice(PAGE_SIZE).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 16 }}>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) - 1 }))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === 1 ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >Prev</button>
                <span style={{ fontWeight: 600, fontSize: '1.05em' }}>Page {currentPage} of {pageCount}</span>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) + 1 }))}
                  disabled={currentPage === pageCount}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === pageCount ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
                >Next</button>
              </div>
            )}
          </div>
        );
      })}
      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Report Completion</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to mark "{confirmModal.company?.name} - {confirmModal.packageName}" {confirmModal.field} as "{confirmModal.newValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmStatusChange}
                style={{
                  padding: '10px 25px',
                  background: '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Mark as {confirmModal.newValue}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {revertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Revert</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to revert "{revertModal.companyName} - {revertModal.packageName}" {revertModal.field} from "{revertModal.newValue}" back to "{revertModal.oldValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmRevert}
                style={{
                  padding: '10px 25px',
                  background: '#ffc107',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Revert
              </button>
              <button
                onClick={() => setRevertModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Bookmarking({ packages, setPackages }) {
  // Store filters for each package in an object
  const [filterCreation, setFilterCreation] = useState({});
  const [filterSubmission, setFilterSubmission] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  // Remove confirmRemove state since we're removing X buttons

  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 15;
  
  // History system states
  const [history, setHistory] = useState([]); // Array of history entries
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set()); // Track recently changed companies
  const [confirmModal, setConfirmModal] = useState(null); // For confirmation modal
  const [revertModal, setRevertModal] = useState(null); // For revert confirmation modal
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // History entry structure
  const createHistoryEntry = (companyId, companyName, packageName, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    companyName,
    packageName,
    field,
    oldValue,
    newValue,
    action
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
    // Mark as recently changed
    setRecentChanges(prev => new Set([...prev, entry.companyId]));
    // Remove from recent changes after 5 seconds
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.companyId);
        return newSet;
      });
    }, 5000);
  };

  const revertChange = async (historyEntry) => {
    setRevertModal(historyEntry);
  };

  const confirmRevert = async () => {
    const historyEntry = revertModal;
    try {
      const field = historyEntry.field === 'BM Creation' ? 'bmCreation' : 'bmSubmission';
      const value = historyEntry.oldValue;
      
      // Update in packages
      const updatedPackages = { ...packages };
      updatedPackages[historyEntry.packageName] = (updatedPackages[historyEntry.packageName] || []).map(c =>
        c.id === historyEntry.companyId ? { ...c, [field]: value } : c
      );
      setPackages(updatedPackages);
      await savePackages(updatedPackages);
      
      // Add revert entry to history
      const revertEntry = createHistoryEntry(
        historyEntry.companyId,
        historyEntry.companyName,
        historyEntry.packageName,
        historyEntry.field,
        historyEntry.newValue,
        historyEntry.oldValue,
        'reverted'
      );
      addToHistory(revertEntry);
      
      setRevertModal(null);
      
    } catch (err) {
      alert('Failed to revert change. Please try again.');
    }
  };

  // Helper to update BM status in shared state
  const handleBMStatusChange = async (pkg, companyId, bmKey, value) => {
    const oldValue = packages[pkg]?.find(c => c.id === companyId)?.[bmKey] || 'Pending';
    const company = packages[pkg]?.find(c => c.id === companyId);
    
    if (value === 'Completed' && bmKey === 'bmCreation') {
      // Show confirmation modal only for BM Creation completion
      setConfirmModal({
        type: 'complete',
        company,
        packageName: pkg,
        field: 'BM Creation',
        oldValue,
        newValue: value
      });
      return;
    }
    
    // For BM Submission completion or reverting to Pending, proceed directly
    await performStatusUpdate(pkg, companyId, bmKey, value, company, oldValue);
  };

  const performStatusUpdate = async (pkg, companyId, bmKey, value, company, oldValue) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [bmKey]: value } : c
    );
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
    
    // Add to history
    const historyEntry = createHistoryEntry(
      companyId,
      company?.name || 'Unknown Company',
      pkg,
      bmKey === 'bmCreation' ? 'BM Creation' : 'BM Submission',
      oldValue,
      value
    );
    addToHistory(historyEntry);
  };

  const confirmStatusChange = async () => {
    const { company, packageName, field, newValue, oldValue } = confirmModal;
    const bmKey = field === 'BM Creation' ? 'bmCreation' : 'bmSubmission';
    
    await performStatusUpdate(packageName, company.id, bmKey, newValue, company, oldValue);
    setConfirmModal(null);
  };

  // Handlers for per-package filters
  const handleFilterCreation = (pkg, value) => {
    setFilterCreation(f => ({ ...f, [pkg]: value }));
    setPage(p => ({ ...p, [pkg]: 1 }));
  };
  const handleFilterSubmission = (pkg, value) => {
    setFilterSubmission(f => ({ ...f, [pkg]: value }));
    setPage(p => ({ ...p, [pkg]: 1 }));
  };

  // Remove the remove functions since we're removing X buttons

  const getDropdownStyle = value => ({
    borderRadius: 8,
    padding: '0.3em 1em',
    fontWeight: 600,
    fontSize: '1rem',
    background: value === 'Completed'
      ? 'linear-gradient(90deg, #eaffea 60%, #b6f5c3 100%)'
      : value === 'Pending'
      ? 'linear-gradient(90deg, #ffeaea 60%, #ffd6d6 100%)'
      : 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
    color: value === 'Completed' ? '#19744d' : value === 'Pending' ? '#c00' : '#232323',
    border: '1.5px solid #b6b6d8',
    outline: 'none',
    minWidth: 120,
    boxShadow: '0 1px 4px #ececec',
    transition: 'background 0.18s, color 0.18s',
  });

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('bookmarking');
      // Ensure we're getting the array from the log field
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  // Save history to Firestore on every change
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('bookmarking', history).catch(err => {
      });
    }
  }, [history]);

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('bookmarking');
    setClearHistoryModal(false);
  };
  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
      <h1 className="fancy-title">Bookmarking for {currentMonth}</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 16px',
            background: showHistory ? '#007bff' : '#f8f9fa',
            color: showHistory ? '#ffffff' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
        </button>
      </div>
      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Clear History Log?</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to clear the entire history log? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={handleClearHistory}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setClearHistoryModal(false)}
                style={{
                  padding: '10px 25px',
                  background: '#6c757d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
      
      {/* History Panel */}
      {showHistory && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e0e7ef',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto 30px'
        }}>
          {/* Icon-only Clear History button in upper right */}
          <button
            onClick={() => setClearHistoryModal(true)}
            title="Clear History"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.18s',
              zIndex: 1
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8d7da'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {/* Trash can SVG icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <div style={{ paddingRight: '40px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#495057' }}>History Log</h3>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '16px', marginTop: '20px' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', margin: '30px 0', fontSize: '1.1rem' }}>
                No history entries yet
              </p>
            ) : (
              <div>
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                      borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : 
                                 entry.packageName === 'SEO - BASIC' ? '4px solid #4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '4px solid #00897B' :
                                 entry.packageName === 'SEO - PRO' ? '4px solid #8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '4px solid #1A237E' : '4px solid #007bff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#495057', 
                        marginBottom: '6px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          flex: '1', 
                          minWidth: 0, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#495057',
                          fontWeight: '600'
                        }}>
                          {entry.companyName}
                        </span>
                        <span style={{ 
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#6c757d',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.packageName}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        color: '#6c757d', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                        <span style={{ 
                          color: entry.oldValue === 'Completed' ? '#28a745' : entry.oldValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : entry.newValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.newValue}</span>
                        {entry.action === 'reverted' && (
                          <span style={{ 
                            color: '#ffc107', 
                            marginLeft: '4px', 
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#adb5bd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '0.9em' }}>🕒</span>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                    {entry.action !== 'reverted' && (
                      <button
                        onClick={() => revertChange(entry)}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#6c757d',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px',
                          alignSelf: 'center',
                          whiteSpace: 'nowrap',
                          height: '32px'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.color = '#495057';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#6c757d';
                        }}
                      >
                        ↩️ Revert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {packageNames.map(pkg => {
        // Filter companies by BM status for this package
        const filtered = (packages[pkg] || [])
          .filter(c => c.status !== 'OnHold')
          .filter(c => {
            const matchCreation = !filterCreation[pkg] || (c.bmCreation || 'Pending') === filterCreation[pkg];
            const matchSubmission = !filterSubmission[pkg] || (c.bmSubmission || 'Pending') === filterSubmission[pkg];
            const matchSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
            return matchCreation && matchSubmission && matchSearch;
          });
        // Pagination logic
        const currentPage = page[pkg] || 1;
        const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
        const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        // Count companies with BM Creation not completed (excluding OnHold)
        const pendingBMCreationCount = (packages[pkg] || []).filter(c => c.status !== 'OnHold' && c.bmCreation !== 'Completed').length;
        // Count companies with BM Submission not completed (excluding OnHold)
        const pendingBMSubmissionCount = (packages[pkg] || []).filter(c => c.status !== 'OnHold' && c.bmSubmission !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {/* BM Creation Alert Banner */}
            {pendingBMCreationCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#ffeaea',
                color: '#c00',
                borderRadius: 999,
                padding: '0.5em 1.5em',
                fontWeight: 700,
                fontSize: '1.08em',
                border: '1.5px solid #ffd6d6',
                boxShadow: '0 1px 4px #ffeaea',
                marginBottom: 18,
                marginLeft: 12,
                letterSpacing: '0.03em',
              }}>
                <span style={{fontSize:'1.2em',marginRight:8}}>📝</span>
                {pendingBMCreationCount} compan{pendingBMCreationCount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package are still pending for BM Creation this month.
              </div>
            )}
            {/* BM Submission Action Banner (distinct from notification bell) */}
            {pendingBMSubmissionCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #fffbe6 60%, #ffe0b2 100%)',
                color: '#b26a00',
                borderRadius: 12,
                border: '2.5px solid #ff9800',
                padding: '1em 2em',
                fontWeight: 700,
                fontSize: '1.13em',
                boxShadow: '0 2px 8px #ffe082',
                marginBottom: 18,
                marginLeft: 2,
                letterSpacing: '0.03em',
              }}>
                <span style={{fontSize:'1.4em',marginRight:12}}>🚩</span>
                Action Needed: You have <b>{pendingBMSubmissionCount}</b>&nbsp;compan{pendingBMSubmissionCount === 1 ? 'y' : 'ies'} in this package that still need BM Submission.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filtered.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <input
                name={`companySearch_${pkg}`}
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container table-responsive" style={{marginBottom: 0, height: 'auto', width: '100%'}}>
              <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th className="company-col">Company Name</th>
                    <th className="package-col">SEO Package</th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>BM Submission</span>
                        <select
                          value={filterSubmission[pkg] || ''}
                          onChange={e => handleFilterSubmission(pkg, e.target.value)}
                          style={getDropdownStyle(filterSubmission[pkg] || 'Pending')}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>BM Creation</span>
                        <select
                          value={filterCreation[pkg] || ''}
                          onChange={e => handleFilterCreation(pkg, e.target.value)}
                          style={getDropdownStyle(filterCreation[pkg] || 'Pending')}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col" style={{minWidth:120}}>Start Date</th>
                    {/* Remove the action column header */}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {paginated.map(c => {
                    const isRecentlyChanged = recentChanges.has(c.id);
                    
                    return (
                      <tr key={c.id} style={{ 
                        transition: 'background 0.18s',
                        background: isRecentlyChanged ? '#fff3cd' : 'transparent',
                        borderLeft: isRecentlyChanged ? '4px solid #ffc107' : 'none'
                      }}>
                        <td className="company-name company-col">
                          {c.name}
                          {isRecentlyChanged && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#ffc107' }}>🔄</span>}
                        </td>
                      <td className="package-col">
                        <span className={
                          c.package === 'SEO - BASIC' ? 'package-basic' :
                          c.package === 'SEO - PREMIUM' ? 'package-premium' :
                          c.package === 'SEO - PRO' ? 'package-pro' :
                          c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                        }>
                          {c.package}
                        </span>
                      </td>
                      <td className="report-col">
                        <select
                          value={c.bmSubmission || 'Pending'}
                          onChange={e => handleBMStatusChange(pkg, c.id, 'bmSubmission', e.target.value)}
                          style={getDropdownStyle(c.bmSubmission || 'Pending')}
                        >
                          <option value="Pending">🔴 Pending</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                      <td className="report-col">
                        {c.bmCreation === 'Completed' ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#4caf50',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '0.3em 1.2em',
                            fontWeight: 700,
                            fontSize: '1em',
                            letterSpacing: '0.03em',
                            boxShadow: '0 1px 4px #e0ffe0',
                          }}>Completed</span>
                        ) : (
                          <select
                            value={c.bmCreation || 'Pending'}
                            onChange={e => handleBMStatusChange(pkg, c.id, 'bmCreation', e.target.value)}
                            style={getDropdownStyle(c.bmCreation || 'Pending')}
                          >
                            <option value="Pending">🔴 Pending</option>
                            <option value="Completed">🟢 Completed</option>
                          </select>
                        )}
                      </td>
                      <td className="report-col" style={{textAlign:'center', fontWeight:500, fontSize:'1em'}}>
                        {c.start || '-'}
                      </td>
                        {/* Remove the action column with X button */}
                    </tr>
                    );
                  })}
                  {filtered.length > 15 && filtered.slice(15).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 16 }}>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) - 1 }))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === 1 ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >Prev</button>
                <span style={{ fontWeight: 600, fontSize: '1.05em' }}>Page {currentPage} of {pageCount}</span>
                <button
                  onClick={() => setPage(p => ({ ...p, [pkg]: (p[pkg] || 1) + 1 }))}
                  disabled={currentPage === pageCount}
                  style={{ padding: '0.4em 1.2em', borderRadius: 8, border: '1.5px solid #b6b6d8', background: currentPage === pageCount ? '#eee' : '#faf9f6', color: '#232323', fontWeight: 600, cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
                >Next</button>
              </div>
            )}
          </div>
        );
      })}
      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Bookmarking Creation</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to mark "{confirmModal.company?.name} - {confirmModal.packageName}" {confirmModal.field} as "{confirmModal.newValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmStatusChange}
                style={{
                  padding: '10px 25px',
                  background: '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Mark as {confirmModal.newValue}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {revertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Revert</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to revert "{revertModal.companyName} - {revertModal.packageName}" {revertModal.field} from "{revertModal.newValue}" back to "{revertModal.oldValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmRevert}
                style={{
                  padding: '10px 25px',
                  background: '#ffc107',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Revert
              </button>
              <button
                onClick={() => setRevertModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove the confirmation modal since we're removing X buttons */}

    </section>
  );
}

function Templates() {
  return (
    <section className="company-tracker-page">
      <TemplateManager />
    </section>
  );
}

function SocialBookmarking() {
  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title">Bookmarking</h1>
      <p className="hero-desc">This is the Bookmarking page. Add your content here.</p>
    </section>
  );
}
function TrashPage() {
  const [trash, setTrash] = useState([]);
  const [search, setSearch] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    getTrash().then(setTrash);
  }, []);

  const handleRestore = async (item) => {
    const updatedTrash = trash.filter(c => c.id !== item.id);
    setTrash(updatedTrash);
    await saveTrash(updatedTrash);
    if (item.type === 'template') {
      // Restore to templates in Firestore
      await saveTemplate({ id: item.id, title: item.title, content: item.content });
    } else if (item.type === 'ticket') {
      // Restore to tickets in Firestore
      await saveTicket({
        id: item.id,
        company: item.company,
        subject: item.subject,
        ticketId: item.ticketId,
        followUpDate: item.followUpDate
      });
    } else if (item.type === 'note') {
      // Restore to notes collection
      const user = getAuth().currentUser;
      if (user) {
        await setDoc(firestoreDoc(db, 'users', user.uid, 'notes', item.id), item);
        // Remove from trash subcollection if exists (legacy)
        try {
          await deleteDoc(firestoreDoc(db, 'users', user.uid, 'trash', item.id));
        } catch {}
      }
    } else {
      // Restore to original package in Firestore
      getPackages().then(packages => {
        if (!packages[item.originalPackage].some(c => c.id === item.id)) {
          packages[item.originalPackage].push(item);
          savePackages(packages);
        }
      });
    }
  };
  const handleDeleteForever = async (item) => {
    const updatedTrash = trash.filter(c => c.id !== item.id);
    setTrash(updatedTrash);
    await saveTrash(updatedTrash);
    // Extra cleanup for notes: remove from trash subcollection if exists
    if (item.type === 'note') {
      try {
        const user = getAuth().currentUser;
        if (user) {
          await deleteDoc(firestoreDoc(db, 'users', user.uid, 'trash', item.id));
        }
      } catch {}
    }
  };
  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = async () => {
    setTrash([]);
    await saveTrash([]);
    setShowDeleteAll(false);
  };
  const handleDeleteAllCancel = () => {
    setShowDeleteAll(false);
  };
  // Filtered trash based on search
  const filteredTrash = trash.filter(item =>
    (item.type === 'template'
      ? (item.title && item.title.toLowerCase().includes(search.toLowerCase())) || (item.content && item.content.toLowerCase().includes(search.toLowerCase()))
      : (item.name && item.name.toLowerCase().includes(search.toLowerCase())) || (item.originalPackage || '').toLowerCase().includes(search.toLowerCase()) || (item.status || '').toLowerCase().includes(search.toLowerCase())
    )
  );
  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title trash-header">Trash</h1>
      <div className="table-scroll-container">
        <table className="company-table trash-table">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>Item</span>
                  <input
                    name="trashSearch"
                    type="text"
                    className="package-search-input"
                    style={{ minWidth: 180, marginTop: 6 }}
                    placeholder="Search trash..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </th>
              <th>Type</th>
              <th style={{ minWidth: 120, textAlign: 'right' }}>
                {trash.length > 0 && (
                  <button className="trash-action-btn delete" style={{ minWidth: 100, marginLeft: 8 }} onClick={handleDeleteAll}>
                    Delete All
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTrash.length === 0 && (
              <tr><td colSpan={3} className="trash-empty">Trash is empty.</td></tr>
            )}
            {filteredTrash.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, fontSize: '1.13rem', color: '#232323', background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #4e342e', letterSpacing: '0.02em' }}>
                  {item.type === 'template' && item.title}
                  {item.type === 'note' && (
                    <>
                      <div>{item.title}</div>
                      <div style={{ fontWeight: 400, fontSize: '0.98em', color: '#888', marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.content}</div>
                    </>
                  )}
                  {item.type === 'ticket' && (
                    <>
                      <div><b>Company:</b> {item.company}</div>
                      <div><b>Subject:</b> {item.subject}</div>
                      <div><b>Ticket ID:</b> {item.ticketId}</div>
                      <div><b>Follow Up:</b> {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : ''}</div>
                    </>
                  )}
                  {item.type === 'resource' && (
                    <>
                      <div><b>Resource Name:</b> {item.name}</div>
                      <div><b>Section:</b> {item.section}</div>
                      <div><b>Link:</b> <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></div>
                    </>
                  )}
                  {(!item.type || item.type === 'company') && item.name}
                  {item.type === 'template' && (
                    <div style={{ fontWeight: 400, fontSize: '0.98em', color: '#888', marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.content}</div>
                  )}
                </td>
                <td style={{ background: '#fff8f8' }}>{item.type === 'template' ? 'Template' : item.type === 'note' ? 'Note' : item.type === 'ticket' ? 'Ticket' : item.type === 'resource' ? 'Resource' : (!item.type || item.type === 'company') ? 'Company' : 'Unknown'}</td>
                <td>
                  <button className="trash-action-btn restore" onClick={() => handleRestore(item)}>Restore</button>
                  <button className="trash-action-btn delete" onClick={() => handleDeleteForever(item)}>Delete Forever</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDeleteAll && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to permanently delete all items in the trash?</div>
            <div className="confirm-desc">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleDeleteAllConfirm}>Yes, Delete All</button>
              <button className="confirm-btn cancel" onClick={handleDeleteAllCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

let fetchAlertsRef = { current: null };

// This function will be set inside App to always have the latest packages and setAlerts
export function setFetchAlertsImpl(fn) {
  fetchAlertsRef.current = fn;
}

// Add caching for tickets to prevent excessive reads
const ticketsCache = {
  data: null,
  timestamp: 0,
  cacheDuration: 60000 // 60 seconds cache to reduce Firestore reads
};

export async function fetchAlerts() {
  if (!fetchAlertsRef.current) return;
  try {
    if (auth.currentUser) {
      await fetchAlertsRef.current();
    }
  } catch (e) {
    // Clear cache on error to prevent stale data
    ticketsCache.data = null;
    ticketsCache.timestamp = 0;
  }
}

// Global throttling and caching system
const GLOBAL_THROTTLE = {
  lastAlertUpdate: 0,
  lastPackageUpdate: 0,
  lastTicketUpdate: 0,
  lastUserUpdate: 0,
  lastStatusUpdate: 0,
  lastReadAlertsSave: 0,
  lastNotificationCheck: 0
};

// Emergency quota protection - if we detect quota issues, increase throttling
let EMERGENCY_MODE = false;
let QUOTA_ERROR_COUNT = 0;
const MAX_QUOTA_ERRORS = 3; // After 3 quota errors, enter emergency mode

// Daily usage tracking to prevent quota overruns
const DAILY_USAGE_KEY = 'firestore_daily_usage';
const DAILY_READ_LIMIT = 45000; // Conservative limit (90% of 50k)
const DAILY_WRITE_LIMIT = 18000; // Conservative limit (90% of 20k)

// Function to get daily usage
const getDailyUsage = () => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(DAILY_USAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === today) {
      return data;
    }
  }
  return { date: today, reads: 0, writes: 0 };
};

// Function to update daily usage
const updateDailyUsage = (type, count = 1) => {
  const usage = getDailyUsage();
  usage[type] += count;
  localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(usage));
  
  // Check if we're approaching limits
  if (usage.reads > DAILY_READ_LIMIT * 0.8 || usage.writes > DAILY_WRITE_LIMIT * 0.8) {
    if (!EMERGENCY_MODE) {
      EMERGENCY_MODE = true;
    }
  }
  
  return usage;
};

// Function to handle quota exceeded errors
const handleQuotaError = () => {
  QUOTA_ERROR_COUNT++;
  if (QUOTA_ERROR_COUNT >= MAX_QUOTA_ERRORS && !EMERGENCY_MODE) {
    EMERGENCY_MODE = true;
    // Clear all caches to force fresh data
    clearCache();
    // Reset all throttle timers to prevent immediate retries
    Object.keys(GLOBAL_THROTTLE).forEach(key => {
      GLOBAL_THROTTLE[key] = Date.now();
    });
  }
};

const GLOBAL_CACHE = {
  packages: null,
  tickets: null,
  users: null,
  alerts: null,
  cacheTimestamps: {}
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - doubled

const THROTTLE_INTERVALS = {
  ALERT_UPDATE: 30000, // 30 seconds - doubled
  PACKAGE_UPDATE: 20000, // 20 seconds - doubled
  TICKET_UPDATE: 25000, // 25 seconds - doubled
  USER_UPDATE: 40000, // 40 seconds - doubled
  STATUS_UPDATE: 60000, // 60 seconds - increased
  READ_ALERTS_SAVE: 30000, // 30 seconds - doubled
  NOTIFICATION_CHECK: 40000 // 40 seconds - doubled
};

// Global cache management
const getCachedData = (key) => {
  const cached = GLOBAL_CACHE[key];
  const timestamp = GLOBAL_CACHE.cacheTimestamps[key];
  if (cached && timestamp && (Date.now() - timestamp) < CACHE_DURATION) {
    return cached;
  }
  return null;
};

const setCachedData = (key, data) => {
  GLOBAL_CACHE[key] = data;
  GLOBAL_CACHE.cacheTimestamps[key] = Date.now();
};

const clearCache = (pattern) => {
  if (pattern) {
    Object.keys(GLOBAL_CACHE.cacheTimestamps).forEach(key => {
      if (key.includes(pattern)) {
        GLOBAL_CACHE[key] = null;
        delete GLOBAL_CACHE.cacheTimestamps[key];
      }
    });
  } else {
    Object.keys(GLOBAL_CACHE).forEach(key => {
      if (key !== 'cacheTimestamps') {
        GLOBAL_CACHE[key] = null;
      }
    });
    GLOBAL_CACHE.cacheTimestamps = {};
  }
};
  // Global throttling function with emergency mode
  const isThrottled = (operation) => {
    const now = Date.now();
    const lastUpdate = GLOBAL_THROTTLE[operation] || 0;
    let interval = THROTTLE_INTERVALS[operation];
    
    // Check daily usage and enable emergency mode if needed
    const usage = getDailyUsage();
    const readPercentage = (usage.reads / DAILY_READ_LIMIT) * 100;
    const writePercentage = (usage.writes / DAILY_WRITE_LIMIT) * 100;
    
    // Enable emergency mode if usage is high
    if (readPercentage > 70 || writePercentage > 70) {
      EMERGENCY_MODE = true;
    } else if (readPercentage < 50 && writePercentage < 50) {
      EMERGENCY_MODE = false;
    }
    
    // In emergency mode, multiply all intervals by 5
    if (EMERGENCY_MODE) {
      interval = interval * 5;
    }
    
    // Block all operations if over limit
    if (usage.reads > DAILY_READ_LIMIT || usage.writes > DAILY_WRITE_LIMIT) {
      return true; // Always throttled when over limit
    }
    
    if (now - lastUpdate < interval) {
      return true; // Throttled
    }
    
    GLOBAL_THROTTLE[operation] = now;
    return false; // Not throttled
  };

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const location = useLocation();
  const [editData, setEditData] = useState(null);
  // Shared packages state
  const [packages, setPackages] = useState({ 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [readAlerts, setReadAlerts] = useState(new Set());

  const [sessionTimeDisplay, setSessionTimeDisplay] = useState('');
  const [isUpdatingPackages, setIsUpdatingPackages] = useState(false);
  const bellRef = useRef();
  const dropdownRef = useRef();
  // Keep a ref to always have the latest packages and setAlerts
  const packagesRef = useRef(packages);
  const setAlertsRef = useRef(setAlerts);
  useEffect(() => { packagesRef.current = packages; }, [packages]);
  useEffect(() => { setAlertsRef.current = setAlerts; }, [setAlerts]);

  // Daily usage monitoring
  const [dailyUsage, setDailyUsage] = useState(getDailyUsage());
  
  // Cost monitoring - log usage every 5 minutes
  useEffect(() => {
    const usageInterval = setInterval(() => {
      const usage = getDailyUsage();
      const readPercentage = (usage.reads / DAILY_READ_LIMIT) * 100;
      const writePercentage = (usage.writes / DAILY_WRITE_LIMIT) * 100;
      
      if (readPercentage > 80 || writePercentage > 80) {
      }
      
      setDailyUsage(usage);
    }, 300000); // Every 5 minutes
    
    return () => clearInterval(usageInterval);
  }, []);
  
  // Handle window resize and daily usage monitoring
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Update daily usage display every minute
    const usageInterval = setInterval(() => {
      setDailyUsage(getDailyUsage());
    }, 60000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(usageInterval);
    };
  }, []);

  // Load read alerts from Firestore
  useEffect(() => {
    if (user?.uid) {
      getDoc(firestoreDoc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().readAlerts) {
          setReadAlerts(new Set(docSnap.data().readAlerts));
        }
      });
    }
  }, [user]);

  // Save read alerts to Firestore - with improved throttling
  const saveReadAlerts = async (readAlertsSet) => {
    if (user?.uid && !isThrottled('READ_ALERTS_SAVE')) {
      // Track this write operation
      updateDailyUsage('writes', 1);
      
      try {
        await updateDoc(firestoreDoc(db, 'users', user.uid), {
          readAlerts: Array.from(readAlertsSet)
        });
      } catch (error) {
      }
    } else if (isThrottled('READ_ALERTS_SAVE')) {
    }
  };

  // Mark all alerts as read
  const markAllAsRead = () => {
    const allAlertIds = alerts.map(alert => alert.id);
    const newReadAlerts = new Set([...readAlerts, ...allAlertIds]);
    setReadAlerts(newReadAlerts);
    saveReadAlerts(newReadAlerts);
  };

  // Mark single alert as read
  const markAsRead = (alertId) => {
    const newReadAlerts = new Set([...readAlerts, alertId]);
    setReadAlerts(newReadAlerts);
    saveReadAlerts(newReadAlerts);
  };

  // Get unread alerts count
  const unreadAlerts = alerts.filter(alert => alert && alert.id && !readAlerts.has(alert.id));

  // Track notification changes and handle read status intelligently
  const [previousAlerts, setPreviousAlerts] = useState([]);
  const [lastToastTime, setLastToastTime] = useState(0);
  const [alertContentHashes, setAlertContentHashes] = useState(new Map());

  const handleAlertChanges = (newAlerts) => {
    // Compare with previous alerts to detect changes
    const previousAlertIds = new Set(previousAlerts.map(alert => alert.id));
    
    // Find alerts that are new or have changed content
    const newOrChangedAlerts = newAlerts.filter(alert => {
      const previousAlert = previousAlerts.find(prev => prev.id === alert.id);
      return !previousAlert || previousAlert.message !== alert.message;
    });
    
    // Only show toast if there are genuinely new alerts (not just regeneration)
    if (newOrChangedAlerts.length > 0) {
      // console.log(`New/changed notifications: ${newOrChangedAlerts.map(a => a.id).join(', ')}`);
      
      // Only show toast if we have previous alerts (meaning this isn't the first load)
      // AND if the alerts are actually new (not just being regenerated)
      // AND if we haven't shown a toast in the last 5 seconds
      const now = Date.now();
      if (previousAlerts.length > 0 && 
          newOrChangedAlerts.some(alert => !previousAlertIds.has(alert.id)) &&
          now - lastToastTime > 5000) {
        if (newOrChangedAlerts.length === 1) {
          toast.info(`New notification: ${newOrChangedAlerts[0].message}`);
        } else if (newOrChangedAlerts.length > 1) {
          toast.info(`${newOrChangedAlerts.length} new notifications`);
        }
        setLastToastTime(now);
      }
      // New alerts are automatically unread (not in readAlerts set)
    }
    
    setPreviousAlerts(newAlerts);
  };

  // Smart function to mark notifications as unread when they have genuinely new content
  // Improved throttling for markNotificationsAsUnreadForNewContent
  const markNotificationsAsUnreadForNewContent = () => {
    if (isThrottled('NOTIFICATION_CHECK')) {
      return;
    }
    
    const relevantAlerts = alerts.filter(alert => alert.type !== 'tickets');
    
    // Check each alert for new content
    const alertsWithNewContent = relevantAlerts.filter(alert => {
      // Use dynamic content if available, otherwise fall back to message + timestamp
      const contentToHash = alert.dynamicContent || (alert.message + alert.timestamp);
      const currentHash = JSON.stringify(contentToHash);
      const previousHash = alertContentHashes.get(alert.id);
      
      // If this is a new alert or the content has changed
      if (!previousHash || previousHash !== currentHash) {
        // Update the hash for this alert
        setAlertContentHashes(prev => new Map(prev).set(alert.id, currentHash));
        return true;
      }
      return false;
    });
    
    if (alertsWithNewContent.length > 0) {
      // console.log(`Detected ${alertsWithNewContent.length} alerts with new content:`, alertsWithNewContent.map(a => a.id));
      
      // Mark these alerts as unread by removing them from readAlerts
      const newReadAlerts = new Set(readAlerts);
      alertsWithNewContent.forEach(alert => {
        newReadAlerts.delete(alert.id);
      });
      
      setReadAlerts(newReadAlerts);
      saveReadAlerts(newReadAlerts);
    }
  };

  useEffect(() => {
    setFetchAlertsImpl(async () => {
      try {
        // Check cache first
        const cachedAlerts = getCachedData('alerts');
        if (cachedAlerts && !isThrottled('ALERT_UPDATE')) {
          setAlertsRef.current(cachedAlerts);
          handleAlertChanges(cachedAlerts);
          return;
        }
        
        let allAlerts = [];
        
        // Use cached tickets data if available and fresh
        let tickets = getCachedData('tickets');
        if (!tickets) {
          tickets = await getTickets().catch(() => []);
          setCachedData('tickets', tickets);
        } else {
        }
        
        const today = new Date();
        const isToday = d => {
          if (!d) return false;
          const date = new Date(d);
          return date.toDateString() === today.toDateString();
        };
        const isYesterday = d => {
          if (!d) return false;
          const date = new Date(d);
          const yest = new Date(today);
          yest.setDate(today.getDate() - 1);
          return date.toDateString() === yest.toDateString();
        };
        const isOverdue = d => {
          if (!d) return false;
          const date = new Date(d);
          return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        };
        const todayFollowUps = tickets.filter(t => isToday(t.followUpDate) && (t.status || 'open') !== 'closed');
        const yesterdayFollowUps = tickets.filter(t => isYesterday(t.followUpDate) && (t.status || 'open') !== 'closed');
        const overdueFollowUps = tickets.filter(t => isOverdue(t.followUpDate) && (t.status || 'open') !== 'closed');
        if (yesterdayFollowUps.length > 0) {
          allAlerts.push({
            id: 'tickets-yesterday',
            type: 'tickets',
            message: `Missed follow up: ${yesterdayFollowUps.length} ticket${yesterdayFollowUps.length > 1 ? 's' : ''} (yesterday)` ,
            link: '/tickets',
            color: '#ff9800',
            icon: '⏰',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${yesterdayFollowUps.length}-${yesterdayFollowUps.map(t => t.id).join(',')}`
          });
        }
        if (todayFollowUps.length > 0) {
          allAlerts.push({
            id: 'tickets-today',
            type: 'tickets',
            message: `Follow up today: ${todayFollowUps.length} ticket${todayFollowUps.length > 1 ? 's' : ''}` ,
            link: '/tickets',
            color: '#d32f2f',
            icon: '⏰',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${todayFollowUps.length}-${todayFollowUps.map(t => t.id).join(',')}`
          });
        }
        if (overdueFollowUps.length > 0) {
          allAlerts.push({
            id: 'tickets-overdue',
            type: 'tickets',
            message: `Overdue: ${overdueFollowUps.length} ticket${overdueFollowUps.length > 1 ? 's' : ''}` ,
            link: '/tickets',
            color: '#b26a00',
            icon: '⚠️',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${overdueFollowUps.length}-${overdueFollowUps.map(t => t.id).join(',')}`
          });
        }
        // Summarize Report, Bookmarking, Link Building alerts by type
        const summary = {
          report: {},
          bm: {},
          linkbuilding: {},
        };
        if (!packagesRef.current) return;
        Object.entries(packagesRef.current).forEach(([pkg, companies]) => {
          // Report
          const pendingReport = (companies || []).filter(c => c.status !== 'OnHold' && c.reportI !== 'Completed').length;
          if (pendingReport > 0) summary.report[pkg] = pendingReport;
          // Bookmarking
          const pendingBM = (companies || []).filter(c => c.status !== 'OnHold' && c.bmSubmission !== 'Completed').length;
          if (pendingBM > 0) summary.bm[pkg] = pendingBM;
          // Link Building
          const pendingLB = (companies || []).filter(c => c.status !== 'OnHold' && c.linkBuildingStatus !== 'Completed').length;
          if (pendingLB > 0) summary.linkbuilding[pkg] = pendingLB;
        });
        // Add summarized alerts
        if (Object.keys(summary.report).length > 0) {
          const total = Object.values(summary.report).reduce((a, b) => a + b, 0);
          allAlerts.push({
            id: 'report-summary',
            type: 'report',
            message: `Report I: ${total} pending (${Object.entries(summary.report).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
            link: '/report',
            color: '#1976d2',
            icon: '📊',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${total}-${Object.entries(summary.report).map(([pkg, n]) => `${pkg}-${n}`).join(',')}`
          });
        }
        if (Object.keys(summary.bm).length > 0) {
          const total = Object.values(summary.bm).reduce((a, b) => a + b, 0);
          allAlerts.push({
            id: 'bm-summary',
            type: 'bm',
            message: `BM Submission: ${total} pending (${Object.entries(summary.bm).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
            link: '/social-bookmarking',
            color: '#388e3c',
            icon: '🔖',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${total}-${Object.entries(summary.bm).map(([pkg, n]) => `${pkg}-${n}`).join(',')}`
          });
        }
        // --- BM Creation Alert ---
        // Count all companies needing BM Creation (not Completed, not OnHold)
        const bmCreationCount = packagesRef.current ? Object.values(packagesRef.current).flat().filter(c => c.status !== 'OnHold' && c.bmCreation !== 'Completed').length : 0;
        if (bmCreationCount > 0) {
          allAlerts.push({
            id: 'bm-creation',
            type: 'bmcreation',
            message: `BM Creation: <b>${bmCreationCount}</b> compan${bmCreationCount === 1 ? 'y' : 'ies'} need creation`,
            link: '/social-bookmarking',
            color: '#c00',
            icon: '📝',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${bmCreationCount}`
          });
        }
        // --- BM Submission Alert ---
        // Count all companies needing BM Submission (not Completed, not OnHold)
        const bmSubmissionCount = packagesRef.current ? Object.values(packagesRef.current).flat().filter(c => c.status !== 'OnHold' && c.bmSubmission !== 'Completed').length : 0;
        if (bmSubmissionCount > 0) {
          allAlerts.push({
            id: 'bm-submission',
            type: 'bmsubmission',
            message: `BM Submission: <b>${bmSubmissionCount}</b> compan${bmSubmissionCount === 1 ? 'y' : 'ies'} need submission`,
            link: '/social-bookmarking',
            color: '#b26a00',
            icon: '🔖',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${bmSubmissionCount}`
          });
        }
        // --- Link Building Alert ---
        if (Object.keys(summary.linkbuilding).length > 0) {
          const total = Object.values(summary.linkbuilding).reduce((a, b) => a + b, 0);
          allAlerts.push({
            id: 'linkbuilding-summary',
            type: 'linkbuilding',
            message: `Link Building: ${total} pending (${Object.entries(summary.linkbuilding).map(([pkg, n]) => `${n} ${pkg.replace('SEO - ', '')}`).join(', ')})`,
            link: '/link-buildings',
            color: '#b26a00',
            icon: '🔗',
            timestamp: Date.now(),
            // Add dynamic content that changes when data changes
            dynamicContent: `${total}-${Object.entries(summary.linkbuilding).map(([pkg, n]) => `${pkg}-${n}`).join(',')}`
          });
        }
        // --- Site Audit Alerts ---
        const siteAuditB = [];
        const siteAuditC = [];
        if (packagesRef.current) {
          Object.values(packagesRef.current).flat().forEach(c => {
            if (!c.start) return;
            
            // Site Audit B: 183 active days (excluding OnHold periods)
            const activeDays = getActiveDays(c);
            if (activeDays >= 183 && c.siteAuditBStatus !== 'Completed') {
              siteAuditB.push(c);
            }
            
            // Site Audit C: 30 days before adjusted EOC date
            const adjustedEOC = getAdjustedEOC(c);
            if (adjustedEOC) {
              const eocDate = parseDisplayDateToInput(adjustedEOC);
              if (eocDate) {
                const daysUntilEOC = Math.floor((eocDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntilEOC <= 30 && daysUntilEOC > 0 && c.siteAuditCStatus !== 'Completed') {
                  siteAuditC.push(c);
                }
              }
            }
          });
        }
        if (siteAuditB.length > 0) {
          allAlerts.push({
            id: 'siteaudit-b',
            type: 'siteaudit',
            message: `Site Audit B: ${siteAuditB.length} compan${siteAuditB.length === 1 ? 'y' : 'ies'} need audit`,
            link: '/site-audits',
            color: '#b26a00',
            icon: '⚠️',
          });
        }
        if (siteAuditC.length > 0) {
          allAlerts.push({
            id: 'siteaudit-c',
            type: 'siteaudit',
            message: `Site Audit C: ${siteAuditC.length} compan${siteAuditC.length === 1 ? 'y' : 'ies'} need audit`,
            link: '/site-audits',
            color: '#1976d2',
            icon: '🔔',
          });
        }
        
        // Cache the alerts
        setCachedData('alerts', allAlerts);
        setAlertsRef.current(allAlerts);
        handleAlertChanges(allAlerts);
      } catch (error) {
        // Set empty alerts on error to prevent UI issues
        setAlertsRef.current([]);
      }
    });
  }, [packages, setAlerts]);

  // Check for unread messages when user logs in
  const checkUnreadMessagesOnLogin = async (userId) => {
    try {
      // Get conversations for the user
      const conversations = await getConversations(userId);
      let totalUnread = 0;
      
      conversations.forEach(conv => {
        const unreadCount = conv.unreadCount && conv.unreadCount[userId] ? conv.unreadCount[userId] : 0;
        totalUnread += unreadCount;
      });
      
      if (totalUnread > 0) {
        const messageText = totalUnread === 1 
          ? "You have 1 unread message!" 
          : `You have ${totalUnread} unread messages!`;
        
        toast.success(`Welcome back! ${messageText}`, {
          duration: 5000,
          action: {
            label: 'View Messages',
            onClick: () => navigate('/chat-users')
          }
        });
        
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setSessionStartTime(); // Reset session timer for the current user
        // Clear cache when user changes
        clearCache();
        
        // Fetch user data from Firestore including bio
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Merge Firestore data with Firebase Auth data
            const mergedUser = {
              ...firebaseUser,
              bio: userData.bio || '',
              displayName: userData.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: userData.photoURL || firebaseUser.photoURL || ''
            };
            
            setUser(mergedUser);
          } else {
            setUser(firebaseUser);
          }
        } catch (error) {
          setUser(firebaseUser);
        }
        
        // Set user status to online in Firestore
        try {
          const userData = {
            status: 'online',
            lastSeen: new Date().toISOString(),
            displayName: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });
          
          // Check for unread messages after a short delay to ensure data is loaded
          setTimeout(() => {
            checkUnreadMessagesOnLogin(firebaseUser.uid);
          }, 2000);
          
        } catch (error) {
        }
      } else {
        // Comprehensive cleanup when user logs out
        
        // Clear all cached data
        clearCache('*');
        
        // Reset all state to prevent stale data issues
        setUser(null);
        setPackages({ 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
        setAlerts([]);
        setReadAlerts(new Set());
        setShowAlerts(false);
        setEditData(null);
        setIsUpdatingPackages(false);
        
        // Clear session data
        clearSessionStartTime();
        
        // Clear any local storage items
        localStorage.removeItem('chat_user_cache_v1');
        
      }
    });
    return () => unsubscribe();
  }, []);

  // Fallback: If user is already authenticated but bio wasn't loaded, fetch it
  useEffect(() => {
    if (user && !user.bio) {
      const fetchUserBio = async () => {
        try {
          const userDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.bio) {
              setUser(prev => ({
                ...prev,
                bio: userData.bio
              }));
            }
          }
        } catch (error) {
        }
      };
      fetchUserBio();
    }
  }, [user]);

  // Periodic session check - runs every minute
  useEffect(() => {
    if (!user) return;
    
    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        clearSessionStartTime();
        signOut(auth);
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(sessionCheckInterval);
  }, [user]);

  // Update session time display - runs every minute
  useEffect(() => {
    const updateTimerDisplay = () => {
      const remainingTime = getTimeUntil6PM();
      setSessionTimeDisplay(formatRemainingTime(remainingTime));
    };
    
    // Update immediately
    updateTimerDisplay();
    
    // Then update every minute
    const timerDisplayInterval = setInterval(updateTimerDisplay, 60000);
    
    return () => clearInterval(timerDisplayInterval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/company-tracker' && location.state && location.state.editData) {
      setEditData(location.state.editData);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        if (auth.currentUser) {
          // Check cache first
          const cachedPackages = getCachedData('packages');
          if (cachedPackages) {
            setPackages(cachedPackages);
            return;
          }
          
          // Track this read operation
          updateDailyUsage('reads', 1);
          
          const pkgs = await getPackages();
          setPackages(pkgs);
          setCachedData(`packages_${user.uid}`, pkgs);
        }
      } catch (e) {
        setPackages({ 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
      }
    };
    fetchPackages();
  }, []);

  // Real-time listener for packages - with improved throttling and coordination
  useEffect(() => {
    if (!user) return;
    
    const packagesDocRef = collection(db, 'users', user.uid, 'meta');
    // Listen for changes in the 'packages' document
    const unsubscribe = onSnapshot(packagesDocRef, (snapshot) => {
      if (isThrottled('PACKAGE_UPDATE') || isUpdatingPackages) {
        return;
      }
      
      // Add a small delay to prevent overwriting optimistic updates
      setTimeout(() => {
        const pkgDoc = snapshot.docs.find(d => d.id === 'packages');
        if (pkgDoc) {
          const data = pkgDoc.data();
          if (data && data.packages) {
            // Only update if the data is actually different to prevent unnecessary re-renders
            const currentPackages = packagesRef.current;
            const newPackages = data.packages;
            
            // Deep comparison to check if packages actually changed
            const packagesChanged = JSON.stringify(currentPackages) !== JSON.stringify(newPackages);
            
            if (packagesChanged) {
              setPackages(newPackages);
              setCachedData(`packages_${user.uid}`, newPackages);
            }
          }
        }
      }, 1000); // 1 second delay to allow optimistic updates to complete
    }, (error) => {
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied' && !user) {
        return;
      }
      if (error.code === 'resource-exhausted') {
        handleQuotaError();
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Debounced alert generation to prevent excessive Firestore reads
  const [alertDebounceTimer, setAlertDebounceTimer] = useState(null);
  
  // Helper function to sync ticket status with package task status (efficient)
  const syncTicketWithPackage = async (ticket, newStatus) => {
    if (!ticket || ticket.taskType !== 'businessProfileClaiming' || !ticket.companyId) {
      return;
    }
    
    try {
      const { getPackages, savePackages } = await import('./firestoreHelpers');
      const packages = await getPackages();
      let updated = false;
      let updatedPackages = null;
      
      // Find the company in packages and update task status
      for (const [pkgName, pkgCompanies] of Object.entries(packages)) {
        const companyIndex = pkgCompanies.findIndex(c => c.ticketId === ticket.id);
        
        if (companyIndex !== -1) {
          const currentTaskStatus = pkgCompanies[companyIndex].tasks?.businessProfileClaiming;
          
          if (newStatus === 'closed' && currentTaskStatus !== 'Completed') {
            packages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Completed';
            updated = true;
            updatedPackages = packages;
          } else if (newStatus === 'open' && currentTaskStatus === 'Completed') {
            packages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Ticket';
            updated = true;
            updatedPackages = packages;
          }
          break;
        }
      }
      
      if (updated && updatedPackages) {
        // Set flag to prevent packages listener from interfering
        setIsUpdatingPackages(true);
        
        // Update local state immediately for real-time UI updates
        setPackages(updatedPackages);
        setCachedData(`packages_${user.uid}`, updatedPackages);
        
        // Save to Firestore in background
        await savePackages(updatedPackages);
        
        // Allow listener to update after a delay
        setTimeout(() => setIsUpdatingPackages(false), 2000);
        return true;
      }
    } catch (error) {
    }
    return false;
  };
  // Fetch alerts whenever packages change (for non-ticket alerts) - with improved debouncing
  useEffect(() => {
    if (alertDebounceTimer) clearTimeout(alertDebounceTimer);
    
    const timer = setTimeout(() => {
      fetchAlerts();
      // Use smart detection to mark notifications as unread only when they have new content
      markNotificationsAsUnreadForNewContent();
    }, 5000); // Increased debounce to 5 seconds to prevent excessive calls
    
    setAlertDebounceTimer(timer);
    
    return () => {
      if (alertDebounceTimer) clearTimeout(alertDebounceTimer);
    };
  }, [packages]);

  // Real-time listener for tickets (alerts) - with improved debouncing and throttling
  useEffect(() => {
    if (!user) return;
    
    let ticketDebounceTimer = null;
    const ticketsColRef = collection(db, 'users', user.uid, 'tickets');
    
    const unsubscribe = onSnapshot(ticketsColRef, (snapshot) => {
      // Check if any of the changes are Business Profile Claiming tickets
      const hasBusinessProfileClaimingChanges = snapshot.docChanges().some(change => {
        if (change.type === 'modified') {
          const ticket = change.doc.data();
          return ticket.taskType === 'businessProfileClaiming' && ticket.companyId;
        }
        return false;
      });
      
      // Bypass throttling for Business Profile Claiming tickets
      if (isThrottled('TICKET_UPDATE') && !hasBusinessProfileClaimingChanges) {
        return;
      }
      
      // Clear tickets cache when tickets change
      clearCache('tickets');
      
      // Check for Business Profile Claiming ticket status changes and sync with packages
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const ticket = change.doc.data();
          
          if (ticket.taskType === 'businessProfileClaiming' && ticket.companyId) {
            // For Business Profile Claiming tickets, sync immediately without debouncing
            syncTicketWithPackage(ticket, ticket.status);
          }
        }
      });
      
      // Debounce ticket alert updates to prevent excessive calls
      if (ticketDebounceTimer) clearTimeout(ticketDebounceTimer);
      ticketDebounceTimer = setTimeout(() => {
        fetchAlerts();
      }, 8000); // Increased debounce to 8 seconds for ticket changes
      
    }, (error) => {
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied' && !user) {
        return;
      }
      if (error.code === 'resource-exhausted') {
        handleQuotaError();
      }
    });
    
    return () => {
      unsubscribe();
      if (ticketDebounceTimer) clearTimeout(ticketDebounceTimer);
    };
  }, [user]);

  // --- User join notification state ---
  const [userJoinNotification, setUserJoinNotification] = useState(null);
  const loadedUserIds = useRef(new Set());

  useEffect(() => {
    // Listen for new users in real-time - with improved throttling
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      if (isThrottled('USER_UPDATE')) {
        return;
      }
      
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const newUser = { id: change.doc.id, ...change.doc.data() };
          // Only notify if this user wasn't already loaded
          if (!loadedUserIds.current.has(newUser.id)) {
            loadedUserIds.current.add(newUser.id);
            // Don't notify for yourself
            if (user && newUser.id !== user.uid) {
              setUserJoinNotification(`${newUser.displayName || newUser.email || 'A new user'} has joined!`);
              setTimeout(() => setUserJoinNotification(null), 3500);
            }
          }
        }
      });
    }, (error) => {
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied' && !user) {
        return;
      }
      if (error.code === 'resource-exhausted') {
        handleQuotaError();
      }
    });
    return () => unsubscribe();
  }, [user]);

  let sidebarClass = 'sidebar';
  if (windowWidth <= 700) {
    sidebarClass = sidebarOpen ? 'sidebar sidebar--open' : 'sidebar';
  } else {
    sidebarClass = sidebarCollapsed ? 'sidebar sidebar--collapsed' : 'sidebar';
  }

  // Dynamically set margin-left for main content
  let mainContentMarginLeft = 220;
  if (windowWidth <= 700) {
    mainContentMarginLeft = 0;
  } else {
    mainContentMarginLeft = sidebarCollapsed ? 56 : 220;
  }

  // Close alerts dropdown when clicking outside
  useEffect(() => {
    if (!showAlerts) return;
    
    function handleClick(e) {
      try {
        if (
          bellRef.current && bellRef.current.contains(e.target)
        ) {
          // Clicked the bell, let the bell handler toggle
          return;
        }
        if (
          dropdownRef.current && dropdownRef.current.contains(e.target)
        ) {
          // Clicked inside the dropdown
          return;
        }
        setShowAlerts(false);
      } catch (error) {
        setShowAlerts(false);
      }
    }
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAlerts]);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileBtnRef = useRef();
  const profileDropdownRef = useRef();
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(e.target)
      ) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // Helper for greeting
  function getGreeting(name) {
    const hour = new Date().getHours();
    let greet = 'Hello';
    if (hour < 12) greet = 'Good morning';
    else if (hour < 18) greet = 'Good afternoon';
    else greet = 'Good evening';
    return `${greet}${name ? ', ' + name : ''}!`;
  }

  if (!user && location.pathname === '/login') {
    return <Login />;
  }

  if (!user && location.pathname === '/') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* User join notification banner */}
      {userJoinNotification && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1976d2',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '1.1em',
          zIndex: 3000,
          boxShadow: '0 2px 12px #1976d244',
          letterSpacing: '0.02em',
          textAlign: 'center',
        }}>
          {userJoinNotification}
        </div>
      )}
      {user ? (
        <ChatManager sidebarCollapsed={sidebarCollapsed} mainContentMarginLeft={mainContentMarginLeft} currentUser={user}>
          {/* Top-right controls: Session Time, Notification Bell, Logout, Dark Mode Toggle */}
          <div style={{
            position: 'fixed',
            top: 18,
            right: 28,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            {/* Dark Mode Toggle - round icon button */}
            <button
              onClick={() => setDarkMode(dm => !dm)}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                background: darkMode ? 'var(--bg-card)' : 'var(--bg-main)',
                color: darkMode ? 'var(--accent)' : 'var(--accent)',
                border: '2px solid var(--accent)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5em',
                boxShadow: '0 2px 8px var(--shadow)',
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s, border 0.18s',
              }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            {/* Countdown Timer to 6 PM */}
            {sessionTimeDisplay && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1976d2',
                border: '1px solid #e0e7ef',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.9em',
                padding: '0.4em 0.8em',
                boxShadow: '0 2px 8px #e0e7ef',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginRight: 8,
              }}
              title="Time until 6 PM"
              >
                <span role="img" aria-label="clock">⏰</span>
                {sessionTimeDisplay}
              </div>
            )}
            {/* Notification Bell Icon/Button (restored) */}
            <button
              aria-label="Notifications"
              onClick={() => setShowAlerts(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1976d2',
                fontSize: 28,
                marginRight: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: 40,
                height: 40,
                padding: 0,
              }}
              ref={bellRef}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#ff4757',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  border: '2px solid #fff',
                  zIndex: 2,
                  boxShadow: '0 2px 8px #e0e7ef',
                  padding: '0 4px',
                }}>{unreadAlerts.length}</span>
              )}
            </button>
            {showAlerts && alerts.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: 58,
                  right: 0,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '2px solid #e0e7ef',
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
                  minWidth: 380,
                  maxWidth: 480,
                  padding: '0',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'slideDown 0.3s ease-out',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Enhanced Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  color: '#fff',
                  padding: '1.2em 1.5em',
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      🔔
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1.1em',
                        fontWeight: '700',
                        marginBottom: '2px'
                      }}>
                        Notifications
                      </div>
                      <div style={{
                        fontSize: '0.85em',
                        opacity: 0.9,
                        fontWeight: '500'
                      }}>
                        {unreadAlerts.length} unread • {alerts.length} total
                      </div>
                    </div>
                  </div>
                  {unreadAlerts.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.85em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseOver={e => {
                        e.target.style.background = 'rgba(255,255,255,0.25)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'rgba(255,255,255,0.15)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>✓</span>
                      Mark All Read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '0.8em 0'
                }}>
                  {alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    style={{
                        margin: '0.4em 1.2em',
                        padding: '1em 1.2em',
                        borderRadius: 12,
                        background: readAlerts.has(alert.id) 
                          ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' 
                          : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        border: readAlerts.has(alert.id) 
                          ? '1px solid #e9ecef' 
                          : '1px solid #e0e7ef',
                      cursor: 'pointer',
                        fontSize: '0.95em',
                      display: 'flex',
                        alignItems: 'flex-start',
                      gap: 12,
                        boxShadow: readAlerts.has(alert.id) 
                          ? '0 2px 8px rgba(0,0,0,0.04)' 
                          : '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        opacity: readAlerts.has(alert.id) ? 0.8 : 1,
                        animation: `slideInRight ${0.1 * (index + 1)}s ease-out`
                    }}
                    onClick={() => {
                        markAsRead(alert.id);
                      setShowAlerts(false);
                      navigate(alert.link);
                    }}
                      onMouseEnter={e => {
                        if (!readAlerts.has(alert.id)) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = readAlerts.has(alert.id) 
                          ? '0 2px 8px rgba(0,0,0,0.04)' 
                          : '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    tabIndex={0}
                      onKeyDown={e => { 
                        if (e.key === 'Enter') { 
                          markAsRead(alert.id);
                          setShowAlerts(false); 
                          navigate(alert.link); 
                        } 
                      }}
                    >
                      {/* Unread Indicator */}
                      {!readAlerts.has(alert.id) && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: '#ff4444',
                          flexShrink: 0,
                          zIndex: 1
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            borderRadius: '50%',
                            background: 'transparent',
                            boxShadow: '0 0 2px #ff4444, 0 0 4px #ff4444',
                            animation: 'pulse 2s infinite',
                            pointerEvents: 'none'
                          }} />
                        </div>
                      )}

                      {/* Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: readAlerts.has(alert.id) 
                          ? 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)' 
                          : `linear-gradient(135deg, ${alert.color}20 0%, ${alert.color}10 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        marginTop: '2px',
                        border: readAlerts.has(alert.id) 
                          ? '1px solid #dee2e6' 
                          : `1px solid ${alert.color}30`,
                        flexShrink: 0
                      }}>
                        {alert.icon}
                      </div>

                      {/* Content */}
                      <div style={{
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{
                          fontWeight: readAlerts.has(alert.id) ? '500' : '600',
                          color: readAlerts.has(alert.id) ? '#6c757d' : '#495057',
                          marginBottom: '4px',
                          lineHeight: '1.4'
                        }}>
                    <span dangerouslySetInnerHTML={{__html: alert.message}} />
                        </div>
                        
                        {/* Status indicator */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px'
                        }}>
                          <div style={{
                            fontSize: '0.8em',
                            color: readAlerts.has(alert.id) ? '#adb5bd' : '#6c757d',
                            fontWeight: '500'
                          }}>
                            {new Date().toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                          {readAlerts.has(alert.id) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75em',
                              color: '#28a745',
                              fontWeight: '600'
                            }}>
                              <span>✓</span>
                              <span>Read</span>
                            </div>
                          )}
                        </div>
                      </div>
                  </div>
                ))}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '1em 1.5em',
                  borderTop: '1px solid #e9ecef',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '0.85em',
                    color: '#6c757d',
                    fontWeight: '500'
                  }}>
                    Click to mark as read
                  </div>
                  <button
                    onClick={() => setShowAlerts(false)}
                    style={{
                      background: 'none',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.8em',
                      color: '#6c757d',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#e9ecef';
                      e.target.style.color = '#495057';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = 'none';
                      e.target.style.color = '#6c757d';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {/* Profile Icon with Mini Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                ref={profileBtnRef}
                onClick={() => setShowProfileDropdown(v => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginRight: 16,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Profile"
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#fff',
                  overflow: 'hidden',
                }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.slice(0,2).toUpperCase()}</span>
                  )}
                </div>
              </button>
              {showProfileDropdown && (
                <div
                  ref={profileDropdownRef}
                  style={{
                    position: 'absolute',
                    top: 48,
                    right: 0,
                    background: '#fff',
                    border: '1.5px solid #e0e7ef',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px #e0e7ef',
                    minWidth: 240,
                    padding: '1.2em 1.2em 1em 1.2em',
                    zIndex: 2002,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'fadeSlideIn 0.35s cubic-bezier(.4,0,.2,1)',
                  }}
                >
                  <style>{`
                    @keyframes fadeSlideIn {
                      from { opacity: 0; transform: translateY(-16px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                    .avatar-anim:hover {
                      box-shadow: 0 0 0 4px #1976d2aa, 0 2px 8px #e0e7ef;
                      transition: box-shadow 0.25s;
                    }
                    .divider-line { width: 100%; height: 1px; background: #e0e7ef; margin: 10px 0; border-radius: 2px; }
                  `}</style>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                    <div className="avatar-anim" style={{ width: 54, height: 54, borderRadius: '50%', background: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', overflow: 'hidden', marginBottom: 6, boxShadow: '0 2px 8px #e0e7ef', transition: 'box-shadow 0.25s' }}>
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.slice(0,2).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{getGreeting(user?.displayName || user?.email?.split('@')[0])}</div>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>{user?.email}</div>
                    <div style={{ color: '#888', fontSize: 14, fontWeight: 500, maxWidth: 260, whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', margin: '6px 0 0 0', textAlign: 'center' }}>
                      {(() => {
                        // Ensure we're working with the same user object for all calculations
                        const currentUser = user;
                        const currentBio = currentUser?.bio;
                        const bioCondition = !!currentBio;
                        const bioText = bioCondition ? currentBio.slice(0, 200) : 'This user has no bio yet.';
                        const bioTruthy = Boolean(currentBio);
                        
                        return bioText;
                      })()}
                    </div>
                  </div>
                  <div className="divider-line" />
                  <button
                    onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                    style={{ width: '100%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: '1em', marginBottom: 6, cursor: 'pointer' }}
                  >Profile</button>
                  <div className="divider-line" />
                  <button
                    onClick={async () => {
                      setShowProfileDropdown(false);
                      clearSessionStartTime();
                      
                      // Set user status to offline in Firestore
                      const auth = getAuth();
                      const user = auth.currentUser;
                      if (user) {
                        await setDoc(firestoreDoc(db, 'users', user.uid), { 
                          status: 'offline',
                          lastSeen: new Date().toISOString()
                        }, { merge: true });
                      }
                      // Clear chat user cache
                      localStorage.removeItem('chat_user_cache_v1');
                      
                      // Clear all cached data to prevent stale data issues
                      clearCache('*');
                      
                      // Sign out - this will trigger auth state change and clean up listeners
                      await signOut(auth);
                      
                      // Navigate to login page
                      navigate('/login', { replace: true });
                    }}
                    style={{ width: '100%', background: '#fff', color: '#d32f2f', border: '1.5px solid #e0e7ef', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: '1em', cursor: 'pointer' }}
                  >Logout</button>
                </div>
              )}
            </div>
          </div>
          <button
            className="hamburger"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <span />
          </button>
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}
          <div className="app-layout">
            <div
              onMouseEnter={() => windowWidth > 700 && setSidebarCollapsed(false)}
              onMouseLeave={() => windowWidth > 700 && setSidebarCollapsed(true)}
              style={{ height: '100vh' }}
            >
              <Sidebar className={sidebarClass} />
            </div>
            <div className="main-content-area" style={{ paddingLeft: mainContentMarginLeft, transition: 'padding-left 0.22s cubic-bezier(.4,0,.2,1)' }}>
              <div className="minimal-bg main-content">
                <header className="minimal-header">
                  <div className="header-content">
                    <span className="header-title">SEO TRACKER</span>
                    <nav>
                      <a href="#projects">Projects</a>
                      <Link to="/resources">Resources</Link>
                      <Link to="/gits">Gits</Link>
                      <Link to="/eoc-accounts">EOC Accounts</Link>
                    </nav>
                  </div>
                  
                </header>
                <div className="minimalist-divider" />
                <main className="main-seo-content">
                  <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
                    <Route path="/" element={user ? <HomeHero userEmail={user && user.email ? user.email.split('@')[0] : undefined} /> : <Navigate to="/login" replace />} />
                    <Route path="/da-pa-checker" element={user ? <DApaChecker darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/company-tracker" element={user ? <CompanyTracker editCompany setEditData={setEditData} editData={editData} clearEdit={() => setEditData(null)} packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-basic" element={user ? <PackagePage pkg="SEO - BASIC" packages={packages} setPackages={setPackages} setIsUpdatingPackages={setIsUpdatingPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-premium" element={user ? <PackagePage pkg="SEO - PREMIUM" packages={packages} setPackages={setPackages} setIsUpdatingPackages={setIsUpdatingPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-pro" element={user ? <PackagePage pkg="SEO - PRO" packages={packages} setPackages={setPackages} setIsUpdatingPackages={setIsUpdatingPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-ultimate" element={user ? <PackagePage pkg="SEO - ULTIMATE" packages={packages} setPackages={setPackages} setIsUpdatingPackages={setIsUpdatingPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/report" element={user ? <Report packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/link-buildings" element={user ? <LinkBuildings darkMode={darkMode} setDarkMode={setDarkMode} packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/templates" element={user ? <TemplateManager darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/social-bookmarking" element={user ? <Bookmarking packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/trash" element={user ? <TemplateTrash darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/tickets" element={user ? <Tickets darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/gits" element={user ? <GitsPage darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/site-audits" element={user ? <SiteAuditsPage darkMode={darkMode} setDarkMode={setDarkMode} packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/resources" element={user ? <ResourcesPage darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/company-overview" element={user ? <CompanyOverview darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/notes" element={user ? <NotesPage darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" replace />} />
                    <Route path="/profile" element={user ? <ProfilePage onProfileUpdate={u => setUser(prev => ({ ...prev, ...u }))} /> : <Navigate to="/login" replace />} />
                    <Route path="/chat-users" element={user ? <ChatUsersPage /> : <Navigate to="/login" replace />} />
                    <Route path="/eoc-accounts" element={user ? <EOCAccounts darkMode={darkMode} /> : <Navigate to="/login" replace />} />
                  </Routes>
                </main>
                <div className="minimalist-divider" />
                <footer className="minimal-footer">
                  <div className="footer-content">
                    <span>&copy; 2025 OPPA JEWO</span>
                    <span className="footer-tagline">Kung ang bayot ma amnesia, bayot gihapon?</span>
                    <a href="https://talhub-smakdat-team.netlify.app/" className="footer-link" target="_blank" rel="noopener noreferrer">TalHub Smak Dat</a>
                  </div>
                </footer>
              </div>
            </div>
          </div>
          {/* Floating Chat Users Button with online count */}
          <ChatUsersFloatingButton />
        </ChatManager>
      ) : null}
      
      {/* Sonner Toaster */}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        duration={3000}
        expand={true}
        limit={3}
      />
    </>
  );
}

// Floating chat button with online user count and unread message badge
function ChatUsersFloatingButton() {
  const navigate = useNavigate();
  const currentUser = getAuth().currentUser;
  const { userList, activeChats } = useChat(currentUser);
  
  // One-time cleanup of stale online statuses
  const [hasCleanedUp, setHasCleanedUp] = useState(() => {
    return localStorage.getItem('onlineStatusCleanupDone') === 'true';
  });
  
  useEffect(() => {
    if (!hasCleanedUp && currentUser && userList.length > 0) {
      const cleanupStaleOnlineStatuses = async () => {
        try {
          // Get all users who are currently marked as online
          const onlineUsers = userList.filter(u => u.status === 'online');
          
          // Reset all online users to offline (except current user)
          const resetPromises = onlineUsers
            .filter(u => u.id !== currentUser.uid)
            .map(async (user) => {
              const userRef = doc(db, 'users', user.id);
              await setDoc(userRef, {
                ...user,
                status: 'offline',
                lastSeen: new Date().toISOString()
              }, { merge: true });
            });
          
          await Promise.all(resetPromises);
          localStorage.setItem('onlineStatusCleanupDone', 'true');
          setHasCleanedUp(true);
        } catch (error) {
        }
      };
      
      cleanupStaleOnlineStatuses();
    }
  }, [hasCleanedUp, currentUser, userList]);
  
  // Calculate online users
  const onlineUsers = Array.isArray(userList)
    ? userList.filter(u => {
        // More robust comparison - check both id and uid fields
        const isCurrentUser = currentUser && (
          u.id === currentUser.uid || 
          u.uid === currentUser.uid ||
          u.email === currentUser.email
        );
        return u.status === 'online' && !isCurrentUser;
      })
    : [];
  const onlineCount = onlineUsers.length;
  
  let onlineText = '';
  if (onlineCount === 0) onlineText = 'No Users Online';
  else if (onlineCount === 1) onlineText = '1 User Online';
  else onlineText = `${onlineCount} Users Online`;
  
  // Calculate total unread messages
  const totalUnread = Array.isArray(activeChats) 
    ? activeChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
    : 0;
  
  return (
    <div style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => navigate('/chat-users')}
          aria-label="Chat Users"
          style={{
            background: 'none',
            color: '#1976d2',
            border: 'none',
            borderRadius: 0,
            width: 60,
            height: 60,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'color 0.18s',
            padding: 0,
          }}
        >
          {/* Feather MessageCircle icon, larger size */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4 8.5 8.5 0 0 1-6.6 3.1c-1.6 0-3.1-.4-4.4-1.2L3 21l1.2-4.1A8.5 8.5 0 1 1 21 11.5z"/>
          </svg>
        </button>
        {/* Unread message badge */}
        {totalUnread > 0 && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#ff4757',
            color: 'white',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            animation: totalUnread > 0 ? 'pulse 2s infinite' : 'none',
          }}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 16, color: '#43a047', background: '#fff', borderRadius: 16, padding: '4px 12px', boxShadow: '0 2px 8px #e0e7ef', border: '1.5px solid #e0e7ef' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#43a047', display: 'inline-block', marginRight: 6, border: '2px solid #fff', boxShadow: '0 1px 4px #e0e7ef' }} />
        {onlineText}
      </div>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}

export default App;