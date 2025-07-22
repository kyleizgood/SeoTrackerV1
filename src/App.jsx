import { useState, useEffect, useRef } from 'react';
import './App.css'
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
import { getCompanies, saveCompany, deleteCompany } from './firestoreHelpers';
import { getPackages, savePackages, getTrash, saveTrash, getTemplates, saveTemplate, deleteTemplate, getTickets, saveTicket, deleteTicket } from './firestoreHelpers';
import { onSnapshot, collection, doc as firestoreDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import GitsPage from './GitsPage';
import SiteAuditsPage from './SiteAuditsPage';
import { setSessionStartTime, getSessionStartTime, isSessionExpired, clearSessionStartTime, getRemainingSessionTime, formatRemainingTime } from './sessionUtils';
import ResourcesPage from './ResourcesPage';
import CompanyOverview from './CompanyOverview';
import NotesPage from './NotesPage';
import TemplateTrash from './TemplateTrash';
import ProfilePage from './ProfilePage';
import ChatManager from './ChatSystem/ChatManager';
import ChatUsersPage from './ChatSystem/ChatUsersPage';
import { useChat } from './ChatSystem/ChatManager';

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
    "🧑‍🎤 Sing your own song.",
    "🧑‍🔧 Tinker until it works.",
    "🧑‍🚒 Put out fires with calm.",
    "🧑‍✈️ Fly above negativity.",
    "🧑‍🌾 Harvest your efforts.",
    "🧑‍🍳 Taste the fruits of labor.",
    "🧑‍🔬 Discover your strengths.",
    "🧑‍🎨 Draw outside the lines.",
    "🧑‍🚀 Launch your ideas.",
    "🧑‍💻 Hack your habits.",
    "🧑‍🏫 Inspire others by example.",
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
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);

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

function CompanyTracker({ editCompany, setEditData, editData, clearEdit, packages, setPackages }) {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: '',
    startDate: null,
    status: 'Active',
  });
  const [editId, setEditId] = useState(null);
  const [showAddToPackage, setShowAddToPackage] = useState(null); // company id

  // Always fetch companies from Firestore on mount
  useEffect(() => {
    getCompanies().then(all => {
      setCompanies(all.filter(c => c.name && c.name.trim() !== ''));
    });
  }, []);

  // Load companies from Firestore on mount and whenever packages change
  useEffect(() => {
    async function loadUnassignedCompanies() {
      const all = await getCompanies();
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
          await saveCompany({ ...c, siteAuditBStatus: c.siteAuditBStatus || 'Pending', siteAuditCStatus: c.siteAuditCStatus || 'Pending' });
        }
      }
      // Now reload with all fields present
      const updated = await getCompanies();
      // Get all companies in all packages
      const pkgs = await getPackages();
      const packagedIds = new Set();
      Object.values(pkgs).forEach(arr => arr.forEach(c => packagedIds.add(c.id)));
      // Only show companies not in any package
      setCompanies(updated.filter(c => c.name && c.name.trim() !== '' && !packagedIds.has(c.id)));
    }
    loadUnassignedCompanies();
  }, [packages]);

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

  useEffect(() => {
    getCompanies().then(async (all) => {
      // One-time cleanup: delete companies with blank names
      const blanks = all.filter(c => !c.name || c.name.trim() === '');
      for (const c of blanks) {
        if (c.id) {
          await deleteCompany(c.id);
        }
      }
      setCompanies(all.filter(c => c.name && c.name.trim() !== ''));
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = date => {
    setForm({ ...form, startDate: date });
  };

  const updatePackages = (updatedCompany) => {
    getPackages().then(packages => {
      const saved = packages ? JSON.stringify(packages) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
      Object.keys(packages).forEach(pkg => {
        packages[pkg] = packages[pkg].map(c => c.id === updatedCompany.id ? updatedCompany : c);
      });
      savePackages(packages);
    });
  };

  const handleAddOrEdit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) return;
    const start = form.startDate ? `${months[form.startDate.getMonth()]} ${form.startDate.getDate()}, ${form.startDate.getFullYear()}` : '';
    if (editId) {
      const updated = { ...form, start, id: editId };
      await saveCompany(updated);
      setCompanies(await getCompanies());
      setEditId(null);
    } else {
      const newCompany = { ...form, start, id: Date.now(), siteAuditBStatus: 'Pending', siteAuditCStatus: 'Pending' };
      await saveCompany(newCompany);
      setCompanies(await getCompanies());
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
          businessProfileClaiming: 'Ticket',
        },
        reportI: 'Pending',
        reportII: 'Pending',
        bmCreation: 'Pending',
        bmSubmission: 'Pending',
      });
      setPackages(updatedPackages);
      await savePackages(updatedPackages);
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
        />
        <DatePicker
          selected={form.startDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText="Start Date"
          className="company-form-datepicker"
          required
          style={{ fontSize: '1.1rem', width: '100%' }}
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="OnHold">OnHold</option>
        </select>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" onClick={handleCancel} style={{background:'#eee',color:'#232323',marginLeft:8}}>Cancel</button>}
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
                        const updatedCompanies = (packages[pkg] || []).map(row =>
                          row.id === c.id ? { ...row, status: newStatus } : row
                        );
                        packages[pkg] = updatedCompanies;
                        savePackages(packages);
                        setCompanies(updatedCompanies);
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

function PackagePage({ pkg, packages, setPackages }) {
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
  const navigate = useNavigate();

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
    { value: 'Ticket', label: '🔴 Ticket' },
    { value: 'Completed', label: '🟢 Completed' },
  ];

  // Load companies from Firestore and ensure tasks are initialized
  useEffect(() => {
    getPackages().then(packages => {
      let pkgCompanies = (packages[pkg] || []).map(c => ({
        ...c,
        tasks: {
          forVSO: c.tasks?.forVSO || 'Pending',
          forRevision: c.tasks?.forRevision || 'Pending',
          ra: c.tasks?.ra || 'Pending',
          distribution: c.tasks?.distribution || 'Pending',
          businessProfileClaiming: c.tasks?.businessProfileClaiming === 'Pending' || !c.tasks?.businessProfileClaiming ? 'Ticket' : c.tasks?.businessProfileClaiming,
        },
      }));
      setCompanies(pkgCompanies);
      // Save back if any tasks were missing or changed
      if (pkgCompanies.some((c, i) => JSON.stringify(c.tasks) !== JSON.stringify((packages[pkg][i]||{}).tasks))) {
        packages[pkg] = pkgCompanies;
        savePackages(packages);
      }
    });
  }, [pkg]);

  // Handle dropdown change
  const handleTaskChange = async (companyId, taskKey, value) => {
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
  };

  const handleEdit = (company) => {
    setEditId(company.id);
    setEditName(company.name);
    setEditStart(parseDisplayDateToInput(company.start));
    setEditEOC(parseDisplayDateToInput(company.eoc || getEOC(company.start)));
  };

  const handleEditSave = async (company) => {
    const updatedPackages = { ...packages };
    const updatedCompanies = (updatedPackages[pkg] || []).map(c =>
      c.id === company.id ? {
        ...c,
        name: editName,
        start: formatDateToDisplay(editStart),
        eoc: formatDateToDisplay(editEOC),
      } : c
    );
    updatedPackages[pkg] = updatedCompanies;
    setPackages(updatedPackages);
    await savePackages(updatedPackages);
    setCompanies(updatedCompanies);
    setEditId(null);
    setEditName('');
    setEditStart(null);
    setEditEOC(null);
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
    const updatedPackages = { ...packages };
    const companyToRemove = (updatedPackages[pkg] || []).find(c => c.id === confirmRemoveId);
    const updatedCompanies = (updatedPackages[pkg] || []).filter(c => c.id !== confirmRemoveId);
    updatedPackages[pkg] = updatedCompanies;
    setPackages(updatedPackages);
    await savePackages(updatedPackages);
    setCompanies(updatedCompanies);
    // Add to trash
    if (companyToRemove) {
      const trash = await getTrash();
      trash.push({ ...companyToRemove, originalPackage: pkg, type: 'company' });
      await saveTrash(trash);
    }
    setConfirmRemoveId(null);
  };
  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  // Filtered companies for this package
  const filteredCompanies = (packages[pkg] || [])
    .filter(c => c.name && c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !filterStatus || c.status === filterStatus)
    .filter(c => !filterVSO || (c.tasks?.forVSO || 'Pending') === filterVSO)
    .filter(c => !filterRevision || (c.tasks?.forRevision || 'Pending') === filterRevision)
    .filter(c => !filterRA || (c.tasks?.ra || 'Pending') === filterRA)
    .filter(c => !filterDistribution || (c.tasks?.distribution || 'Pending') === filterDistribution)
    .filter(c => !filterBusinessProfileClaiming || (c.tasks?.businessProfileClaiming || 'Ticket') === filterBusinessProfileClaiming);

  const pageCount = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = filteredCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="company-tracker-page">
      <h2 className="fancy-subtitle">{pkg} Companies</h2>
      <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filteredCompanies.length}</div>
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
                      placeholderText="Select start date"
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
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
                      placeholderText="Select EOC date"
                      style={{ padding: '0.5em 1em', borderRadius: 8, border: '1.5px solid #b6b6d8', fontSize: '1rem', minWidth: 120 }}
                    />
                  ) : (
                    c.eoc || getEOC(c.start)
                  )}
                </td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      // Update in localStorage and state
                      getPackages().then(packages => {
                        const updatedCompanies = (packages[pkg] || []).map(row =>
                          row.id === c.id ? { ...row, status: newStatus } : row
                        );
                        packages[pkg] = updatedCompanies;
                        savePackages(packages);
                        setCompanies(updatedCompanies);
                      });
                    }}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="OnHold">🟣 OnHold</option>
                  </select>
                </td>
                {taskKeys.map((key, i) => (
                  <td key={key} style={{ minWidth: key === 'businessProfileClaiming' ? 180 : 140 }}>
                    <select
                      value={c.tasks?.[key] || (key === 'businessProfileClaiming' ? 'Ticket' : 'Pending')}
                      onChange={e => handleTaskChange(c.id, key, e.target.value)}
                      style={{ minWidth: 120 }}
                    >
                      {(key === 'businessProfileClaiming' ? businessProfileClaimingOptions : taskOptions).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
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
    </section>
  );
}

function Report({ packages, setPackages }) {
  // Store filters for each package in an object
  const [filterI, setFilterI] = useState({});
  const [filterII, setFilterII] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });
  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 15;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

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

  // Helper to update report status in shared state
  const handleReportStatusChange = async (pkg, companyId, reportKey, value) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [reportKey]: value } : c
    );
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
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

  // Remove company from package in Report page
  const handleRemoveFromReport = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };
  const handleRemoveConfirm = async () => {
    const { pkg, companyId } = confirmRemove;
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).filter(c => c.id !== companyId);
    setPackages(updatedPackages);
    if (window.fetchAlerts) fetchAlerts();
    await savePackages(updatedPackages);
    setConfirmRemove({ pkg: null, companyId: null, companyName: '' });
  };
  const handleRemoveCancel = () => setConfirmRemove({ pkg: null, companyId: null, companyName: '' });

  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      <h1 className="fancy-title">Report for {currentMonth}</h1>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
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
                    <th className="report-col" style={{minWidth:60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
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
                    return (
                      <tr key={c.id}>
                        <td className="company-name company-col">{c.name}</td>
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
                        <td className="report-col" style={{textAlign:'center'}}>
                          <button
                            className="remove-btn"
                            style={{ background: '#ffeaea', color: '#c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.2em', cursor: 'pointer', padding: '0.2em 0.8em', marginLeft: 4 }}
                            title="Remove company from report"
                            onClick={() => handleRemoveFromReport(pkg, c.id, c.name)}
                          >
                            ×
                          </button>
                        </td>
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
      {/* Confirmation Modal for Remove in Report page */}
      {confirmRemove.companyId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Remove Company?</div>
            <div className="confirm-desc">Are you sure you want to remove <b>{confirmRemove.companyName}</b> from <b>{confirmRemove.pkg}</b>?</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleRemoveConfirm}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
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
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 15;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // Helper to update BM status in shared state
  const handleBMStatusChange = async (pkg, companyId, bmKey, value) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [bmKey]: value } : c
    );
    setPackages(updatedPackages); // Optimistically update UI
    await savePackages(updatedPackages); // Persist to Firestore
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

  // Remove company from package in Bookmarking page
  const handleRemoveFromBM = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };

  const handleRemoveConfirm = async () => {
    const { pkg, companyId } = confirmRemove;
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).filter(c => c.id !== companyId);
    setPackages(updatedPackages);
    if (window.fetchAlerts) fetchAlerts();
    savePackages(updatedPackages);
    setConfirmRemove({ pkg: null, companyId: null, companyName: '' });
    setShowDeleteToast(true);
    setTimeout(() => setShowDeleteToast(false), 1800);
  };
  const handleRemoveCancel = () => setConfirmRemove({ pkg: null, companyId: null, companyName: '' });

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

  return (
    <section className="company-tracker-page" style={{paddingTop: 12}}>
      <h1 className="fancy-title">Bookmarking for {currentMonth}</h1>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, sorted by SEO package.</p>
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
                    <th className="report-col" style={{minWidth:60}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {paginated.map(c => (
                    <tr key={c.id}>
                      <td className="company-name company-col">{c.name}</td>
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
                      <td className="report-col" style={{textAlign:'center'}}>
                        <button
                          className="remove-btn"
                          style={{ background: '#ffeaea', color: '#c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.2em', cursor: 'pointer', padding: '0.2em 0.8em', marginLeft: 4 }}
                          title="Remove company from bookmarking"
                          onClick={() => handleRemoveFromBM(pkg, c.id, c.name)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
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
      {/* Confirmation Modal for Remove in Bookmarking page */}
      {confirmRemove.companyId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Remove Company?</div>
            <div className="confirm-desc">Are you sure you want to remove <b>{confirmRemove.companyName}</b> from <b>{confirmRemove.pkg}</b>?</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleRemoveConfirm}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteToast && (
        <div className="copy-toast-dialog" style={{zIndex:2002}}>Company moved to Trash.</div>
      )}
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
        } catch (e) {}
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
      } catch (e) {}
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

export async function fetchAlerts() {
  if (!fetchAlertsRef.current) return;
  try {
    if (auth.currentUser) {
      await fetchAlertsRef.current();
    }
  } catch (e) {
    // Optionally log or handle the error
  }
}

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
  const [ticketsChanged, setTicketsChanged] = useState(0);
  const [sessionTimeDisplay, setSessionTimeDisplay] = useState('');
  const bellRef = useRef();
  const dropdownRef = useRef();
  // Keep a ref to always have the latest packages and setAlerts
  const packagesRef = useRef(packages);
  const setAlertsRef = useRef(setAlerts);
  useEffect(() => { packagesRef.current = packages; }, [packages]);
  useEffect(() => { setAlertsRef.current = setAlerts; }, [setAlerts]);
  useEffect(() => {
    setFetchAlertsImpl(async () => {
      let allAlerts = [];
      // Tickets alerts
      const tickets = await getTickets();
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
        });
      }
      // Summarize Report, Bookmarking, Link Building alerts by type
      const summary = {
        report: {},
        bm: {},
        linkbuilding: {},
      };
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
        });
      }
      // --- BM Creation Alert ---
      // Count all companies needing BM Creation (not Completed, not OnHold)
      const bmCreationCount = Object.values(packagesRef.current).flat().filter(c => c.status !== 'OnHold' && c.bmCreation !== 'Completed').length;
      if (bmCreationCount > 0) {
        allAlerts.push({
          id: 'bm-creation',
          type: 'bmcreation',
          message: `BM Creation: <b>${bmCreationCount}</b> compan${bmCreationCount === 1 ? 'y' : 'ies'} need creation`,
          link: '/social-bookmarking',
          color: '#c00',
          icon: '📝',
        });
      }
      // --- BM Submission Alert ---
      // Count all companies needing BM Submission (not Completed, not OnHold)
      const bmSubmissionCount = Object.values(packagesRef.current).flat().filter(c => c.status !== 'OnHold' && c.bmSubmission !== 'Completed').length;
      if (bmSubmissionCount > 0) {
        allAlerts.push({
          id: 'bm-submission',
          type: 'bmsubmission',
          message: `BM Submission: <b>${bmSubmissionCount}</b> compan${bmSubmissionCount === 1 ? 'y' : 'ies'} need submission`,
          link: '/social-bookmarking',
          color: '#b26a00',
          icon: '🔖',
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
        });
      }
      // --- Site Audit Alerts ---
      const siteAuditB = [];
      const siteAuditC = [];
      Object.values(packagesRef.current).flat().forEach(c => {
        if (!c.start) return;
        const startDate = new Date(c.start);
        if (isNaN(startDate)) return;
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        if (daysSinceStart >= 183 && c.siteAuditBStatus !== 'Completed') siteAuditB.push(c);
        if (daysSinceStart >= 334 && c.siteAuditCStatus !== 'Completed') siteAuditC.push(c);
      });
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
      setAlertsRef.current(allAlerts);
    });
  }, [packages, setAlerts]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setSessionStartTime(); // Reset session timer for the current user
      }
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Periodic session check - runs every minute
  useEffect(() => {
    if (!user) return;
    
    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        console.log('Session expired during periodic check - logging out user');
        clearSessionStartTime();
        signOut(auth);
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(sessionCheckInterval);
  }, [user]);

  // Update session time display - runs every minute
  useEffect(() => {
    if (!user) {
      setSessionTimeDisplay('');
      return;
    }
    
    const updateSessionDisplay = () => {
      const remainingTime = getRemainingSessionTime();
      setSessionTimeDisplay(formatRemainingTime(remainingTime));
    };
    
    // Update immediately
    updateSessionDisplay();
    
    // Then update every minute
    const sessionDisplayInterval = setInterval(updateSessionDisplay, 60000);
    
    return () => clearInterval(sessionDisplayInterval);
  }, [user]);

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
          const pkgs = await getPackages();
          setPackages(pkgs);
        }
      } catch (e) {
        setPackages({ 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
      }
    };
    fetchPackages();
  }, []);

  // Real-time listener for packages
  useEffect(() => {
    if (!user) return;
    const packagesDocRef = collection(db, 'users', user.uid, 'meta');
    // Listen for changes in the 'packages' document
    const unsubscribe = onSnapshot(packagesDocRef, (snapshot) => {
      const pkgDoc = snapshot.docs.find(d => d.id === 'packages');
      if (pkgDoc) {
        const data = pkgDoc.data();
        if (data && data.packages) {
          setPackages(data.packages);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch alerts whenever packages change (for non-ticket alerts)
  useEffect(() => {
    fetchAlerts();
  }, [packages]);

  // Real-time listener for tickets (alerts)
  useEffect(() => {
    if (!user) return;
    const ticketsColRef = collection(db, 'users', user.uid, 'tickets');
    const unsubscribe = onSnapshot(ticketsColRef, () => {
      fetchAlerts();
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

  // --- User join notification state ---
  const [userJoinNotification, setUserJoinNotification] = useState(null);
  const loadedUserIds = useRef(new Set());

  useEffect(() => {
    // Listen for new users in real-time
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
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
    });
    return () => unsubscribe();
  }, [user]);

  const [userBio, setUserBio] = useState('');
  useEffect(() => {
    if (user && user.uid) {
      // Try to get bio from user object first
      if (user.bio) {
        setUserBio(user.bio);
      } else {
        // Fetch from Firestore
        getDoc(firestoreDoc(db, 'users', user.uid)).then(docSnap => {
          if (docSnap.exists()) {
            setUserBio(docSnap.data().bio || '');
          } else {
            setUserBio('');
          }
        });
      }
    }
  }, [user]);

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
        <ChatManager sidebarCollapsed={sidebarCollapsed} mainContentMarginLeft={mainContentMarginLeft}>
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
            {/* Session Time Display */}
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
              title="Session Time Remaining"
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
              {alerts && alerts.length > 0 && (
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
                }}>{alerts.length}</span>
              )}
            </button>
            {showAlerts && alerts.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: 58,
                  right: 0,
                  background: '#fff',
                  border: '1.5px solid #e0e7ef',
                  borderRadius: 12,
                  boxShadow: '0 4px 24px #e0e7ef',
                  minWidth: 320,
                  maxWidth: 420,
                  padding: '0.7em 0.5em',
                  zIndex: 2001,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '0.7em 1.2em',
                      margin: '2px 0',
                      borderRadius: 10,
                      fontWeight: 600,
                      color: alert.color,
                      background: '#f7f6f2',
                      cursor: 'pointer',
                      fontSize: '1.08em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 1px 6px #ececec',
                      borderLeft: `5px solid ${alert.color}`,
                      transition: 'background 0.18s',
                    }}
                    onClick={() => {
                      setShowAlerts(false);
                      navigate(alert.link);
                    }}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') { setShowAlerts(false); navigate(alert.link); } }}
                  >
                    <span style={{fontSize:'1.3em',marginRight:4}}>{alert.icon}</span>
                    <span dangerouslySetInnerHTML={{__html: alert.message}} />
                  </div>
                ))}
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
                      {userBio ? userBio.slice(0, 200) : 'This user has no bio yet.'}
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
                      try {
                        // Set user status to offline in Firestore
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (user) {
                          await setDoc(firestoreDoc(db, 'users', user.uid), { status: 'offline' }, { merge: true });
                        }
                        // Clear chat user cache
                        localStorage.removeItem('chat_user_cache_v1');
                        await signOut(auth);
                        navigate('/login', { replace: true });
                      } catch (err) {
                        console.error('Logout failed:', err);
                        alert('Logout failed. Please try again.');
                      }
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
                    <Route path="/seo-basic" element={user ? <PackagePage pkg="SEO - BASIC" packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-premium" element={user ? <PackagePage pkg="SEO - PREMIUM" packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-pro" element={user ? <PackagePage pkg="SEO - PRO" packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
                    <Route path="/seo-ultimate" element={user ? <PackagePage pkg="SEO - ULTIMATE" packages={packages} setPackages={setPackages} /> : <Navigate to="/login" replace />} />
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
                    <Route path="/chat-users" element={<ChatUsersPage />} />
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
    </>
  );
}

// Floating chat button with online user count
function ChatUsersFloatingButton() {
  const navigate = useNavigate();
  const { userList } = useChat();
  const currentUser = getAuth().currentUser;
  const onlineUsers = Array.isArray(userList)
    ? userList.filter(u => u.status === 'online' && (!currentUser || u.id !== currentUser.uid))
    : [];
  const onlineCount = onlineUsers.length;
  let onlineText = '';
  if (onlineCount === 0) onlineText = 'No Users Online';
  else if (onlineCount === 1) onlineText = '1 User Online';
  else onlineText = `${onlineCount} Users Online`;
  return (
    <div style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 3000, display: 'flex', alignItems: 'center', gap: 10 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 16, color: '#43a047', background: '#fff', borderRadius: 16, padding: '4px 12px', boxShadow: '0 2px 8px #e0e7ef', border: '1.5px solid #e0e7ef' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#43a047', display: 'inline-block', marginRight: 6, border: '2px solid #fff', boxShadow: '0 1px 4px #e0e7ef' }} />
        {onlineText}
      </div>
    </div>
  );
}

export default App
