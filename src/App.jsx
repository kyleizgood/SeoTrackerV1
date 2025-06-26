import { useState, useEffect } from 'react';
import './App.css'
import Sidebar from './Sidebar';
import TemplateManager from './TemplateManager';
import TemplateTrash from './TemplateTrash';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DApaChecker from './DApaChecker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Tickets from './Tickets';
import LinkBuildings from './LinkBuildings';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthPage from './AuthPage';
import Login from './Login';
import Register from './Register';

function HomeHero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <h1 className="fancy-title">Welcome to Your Personal Tracker</h1>
      <p className="hero-desc">Customize this space for your daily routine, notes, or anything you want!</p>
      <button className="hero-cta" onClick={() => navigate('/company-tracker')}>Go to Company Tracker</button>
    </section>
  );
}

const COMPANY_KEY = 'company-tracker-list';
const PACKAGE_KEY = 'company-package-pages';
const TRASH_KEY = 'company-trash';
const ALL_PACKAGES = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);

function getEOC(start) {
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

function CompanyTracker({ editCompany, setEditData, editData, clearEdit }) {
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem(COMPANY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({
    name: '',
    package: 'SEO - BASIC',
    day: '',
    month: '',
    year: '',
    status: 'Active',
  });
  const [editId, setEditId] = useState(null);
  const [showAddToPackage, setShowAddToPackage] = useState(null); // company id

  // If editData is provided (from package page), load it into the form
  useEffect(() => {
    if (editData) {
      setEditId(editData.id);
      let day = '', month = '', year = '';
      if (editData.start) {
        const match = editData.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
        if (match) {
          month = months.indexOf(match[1]).toString();
          day = match[2];
          year = match[3];
        }
      }
      setForm({
        name: editData.name,
        package: editData.package,
        day,
        month,
        year,
        status: editData.status,
      });
      if (clearEdit) clearEdit();
    }
    // eslint-disable-next-line
  }, [editData]);

  useEffect(() => {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(companies));
  }, [companies]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updatePackages = (updatedCompany) => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    Object.keys(packages).forEach(pkg => {
      packages[pkg] = packages[pkg].map(c => c.id === updatedCompany.id ? updatedCompany : c);
    });
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
  };

  const handleAddOrEdit = e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    let start = '';
    if (form.day && form.month && form.year) {
      start = `${months[parseInt(form.month, 10)]} ${form.day}, ${form.year}`;
    }
    if (editId) {
      const updated = { ...form, start, id: editId };
      setCompanies(companies.map(c => c.id === editId ? updated : c));
      updatePackages(updated);
      setEditId(null);
    } else {
      setCompanies([
        ...companies,
        { ...form, start, id: Date.now() }
      ]);
    }
    setForm({ name: '', package: 'SEO - BASIC', day: '', month: '', year: '', status: 'Active' });
  };

  const handleDelete = id => {
    setCompanies(companies.filter(c => c.id !== id));
    if (editId === id) {
      setEditId(null);
      setForm({ name: '', package: 'SEO - BASIC', day: '', month: '', year: '', status: 'Active' });
    }
    // Remove from all package pages
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    Object.keys(packages).forEach(pkg => {
      packages[pkg] = packages[pkg].filter(c => c.id !== id);
    });
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
  };

  const handleEdit = c => {
    setEditId(c.id);
    let day = '', month = '', year = '';
    if (c.start) {
      const match = c.start.match(/^(\w+) (\d{1,2}), (\d{4})$/);
      if (match) {
        month = months.indexOf(match[1]).toString();
        day = match[2];
        year = match[3];
      }
    }
    setForm({
      name: c.name,
      package: c.package,
      day,
      month,
      year,
      status: c.status,
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm({ name: '', package: 'SEO - BASIC', day: '', month: '', year: '', status: 'Active' });
  };

  // Add to package pages
  const handleAddToPackage = (company, pkg) => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    if (!packages[pkg]) packages[pkg] = [];
    if (!packages[pkg].some(c => c.id === company.id)) {
      packages[pkg].push({
        ...company,
        package: pkg,
        tasks: {
          forVSO: 'Pending',
          forRevision: 'Pending',
          ra: 'Pending',
          distribution: 'Pending',
          businessProfileClaiming: 'Ticket',
        },
      });
      localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    }
    // Remove from tracker
    const updatedCompanies = companies.filter(c => c.id !== company.id);
    setCompanies(updatedCompanies);
    localStorage.setItem(COMPANY_KEY, JSON.stringify(updatedCompanies));
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
        <select name="package" value={form.package} onChange={handleChange}>
          <option value="SEO - BASIC">SEO - BASIC</option>
          <option value="SEO - PREMIUM">SEO - PREMIUM</option>
          <option value="SEO - PRO">SEO - PRO</option>
          <option value="SEO - ULTIMATE">SEO - ULTIMATE</option>
        </select>
        <select name="month" value={form.month} onChange={handleChange} required>
          <option value="">Month</option>
          {months.map((m, i) => (
            <option value={i} key={m}>{m}</option>
          ))}
        </select>
        <select name="day" value={form.day} onChange={handleChange} required>
          <option value="">Day</option>
          {days.map(d => (
            <option value={d} key={d}>{d}</option>
          ))}
        </select>
        <select name="year" value={form.year} onChange={handleChange} required>
          <option value="">Year</option>
          {years.map(y => (
            <option value={y} key={y}>{y}</option>
          ))}
        </select>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="OnHold">OnHold</option>
        </select>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" onClick={handleCancel} style={{background:'#eee',color:'#232323',marginLeft:8}}>Cancel</button>}
      </form>
      <div className="table-scroll-container">
        <table className="company-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>SEO Package</th>
              <th>Start Date</th>
              <th>EOC</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa' }}>No companies yet.</td></tr>
            )}
            {companies.map(c => (
              <tr key={c.id} style={{ position: 'relative' }}>
                <td className="company-name">{c.name}</td>
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
                <td>{c.start}</td>
                <td>{getEOC(c.start)}</td>
                <td>
                  <select
                    className={`status-select ${c.status === 'Active' ? 'status-active' : 'status-onhold'}`}
                    value={c.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      // Update in localStorage and state
                      const saved = localStorage.getItem(PACKAGE_KEY);
                      const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
                      const updatedCompanies = (packages[pkg] || []).map(row =>
                        row.id === c.id ? { ...row, status: newStatus } : row
                      );
                      packages[pkg] = updatedCompanies;
                      localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
                      setCompanies(updatedCompanies);
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

function PackagePage({ pkg }) {
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

  // Load companies from localStorage and ensure tasks are initialized
  useEffect(() => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
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
      localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    }
  }, [pkg]);

  // Handle dropdown change
  const handleTaskChange = (companyId, taskKey, value) => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    let pkgCompanies = (packages[pkg] || []).map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          tasks: { ...c.tasks, [taskKey]: value },
        };
      }
      return c;
    });
    packages[pkg] = pkgCompanies;
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    setCompanies(pkgCompanies);
  };

  const handleEdit = (company) => {
    setEditId(company.id);
    setEditName(company.name);
    setEditStart(parseDisplayDateToInput(company.start));
    setEditEOC(parseDisplayDateToInput(company.eoc || getEOC(company.start)));
  };

  const handleEditSave = (company) => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    const updatedCompanies = (packages[pkg] || []).map(c =>
      c.id === company.id ? {
        ...c,
        name: editName,
        start: formatDateToDisplay(editStart),
        eoc: formatDateToDisplay(editEOC),
      } : c
    );
    packages[pkg] = updatedCompanies;
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
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
  const handleRemoveConfirm = (company) => {
    // Remove from package
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    const updatedCompanies = (packages[pkg] || []).filter(c => c.id !== company.id);
    packages[pkg] = updatedCompanies;
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    setCompanies(updatedCompanies);
    // Add to trash
    const trash = JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
    trash.push({ ...company, originalPackage: pkg });
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    setConfirmRemoveId(null);
  };
  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  // Filter companies by search and dropdowns
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesVSO = !filterVSO || (c.tasks?.forVSO || 'Pending') === filterVSO;
    const matchesRevision = !filterRevision || (c.tasks?.forRevision || 'Pending') === filterRevision;
    const matchesRA = !filterRA || (c.tasks?.ra || 'Pending') === filterRA;
    const matchesDistribution = !filterDistribution || (c.tasks?.distribution || 'Pending') === filterDistribution;
    let matchesBusinessProfileClaiming;
    if (!filterBusinessProfileClaiming) {
      matchesBusinessProfileClaiming = true;
    } else if (filterBusinessProfileClaiming === 'Ticket') {
      matchesBusinessProfileClaiming = c.tasks?.businessProfileClaiming === 'Ticket' || c.tasks?.businessProfileClaiming === 'Pending';
    } else {
      matchesBusinessProfileClaiming = c.tasks?.businessProfileClaiming === filterBusinessProfileClaiming;
    }
    return matchesSearch && matchesStatus && matchesVSO && matchesRevision && matchesRA && matchesDistribution && matchesBusinessProfileClaiming;
  });

  return (
    <section className="company-tracker-page">
      <h1 className="fancy-title">SEO Packages</h1>
      <h2 className="fancy-subtitle">{pkg} Companies</h2>
      <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filteredCompanies.length}</div>
      <div className="table-scroll-container">
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
                  onChange={e => setFilterStatus(e.target.value)}
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
                  type="text"
                  className="package-search-input"
                  placeholder="Search company..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 && (
              <tr>
                <td className="no-companies" colSpan={6 + taskLabels.length + 2}>No companies found.</td>
              </tr>
            )}
            {filteredCompanies.map(c => (
              <tr key={c.id}>
                <td className="company-name">
                  {editId === c.id ? (
                    <input
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
                      const saved = localStorage.getItem(PACKAGE_KEY);
                      const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
                      const updatedCompanies = (packages[pkg] || []).map(row =>
                        row.id === c.id ? { ...row, status: newStatus } : row
                      );
                      packages[pkg] = updatedCompanies;
                      localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
                      setCompanies(updatedCompanies);
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
      </div>
      {confirmRemoveId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to remove this company?</div>
            <div className="confirm-desc">It will be moved to Trash.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={() => handleRemoveConfirm(companies.find(c => c.id === confirmRemoveId))}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Report() {
  // Load all companies from localStorage PACKAGE_KEY
  const [packages, setPackages] = useState(() => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    return saved ? JSON.parse(saved) : {
      'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': []
    };
  });
  // Store filters for each package in an object
  const [filterI, setFilterI] = useState({});
  const [filterII, setFilterII] = useState({});
  // Add search state for each package
  const [search, setSearch] = useState({});
  const [confirmRemove, setConfirmRemove] = useState({ pkg: null, companyId: null, companyName: '' });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  useEffect(() => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    setPackages(saved ? JSON.parse(saved) : {
      'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] });
    // Monthly reset logic
    const today = new Date();
    const firstOfMonth = today.getDate() === 1;
    const thisMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
    const lastReset = localStorage.getItem('report-last-reset');
    if (firstOfMonth && lastReset !== thisMonth) {
      // Reset all reportI and reportII to 'Pending'
      const pkgs = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
      Object.keys(pkgs).forEach(pkg => {
        pkgs[pkg] = (pkgs[pkg] || []).map(c => ({ ...c, reportI: 'Pending', reportII: 'Pending' }));
      });
      localStorage.setItem(PACKAGE_KEY, JSON.stringify(pkgs));
      setPackages(pkgs);
      localStorage.setItem('report-last-reset', thisMonth);
    }
  }, []);

  const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];

  // Helper to update report status in localStorage
  const handleReportStatusChange = (pkg, companyId, reportKey, value) => {
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    packages[pkg] = (packages[pkg] || []).map(c =>
      c.id === companyId ? { ...c, [reportKey]: value } : c
    );
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    setPackages(packages);
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
  const handleFilterI = (pkg, value) => setFilterI(f => ({ ...f, [pkg]: value }));
  const handleFilterII = (pkg, value) => setFilterII(f => ({ ...f, [pkg]: value }));

  // Remove company from package in Report page
  const handleRemoveFromReport = (pkg, companyId, companyName) => {
    setConfirmRemove({ pkg, companyId, companyName });
  };
  const handleRemoveConfirm = () => {
    const { pkg, companyId } = confirmRemove;
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    // Find the company to remove
    const companyToRemove = (packages[pkg] || []).find(c => c.id === companyId);
    // Remove from package
    packages[pkg] = (packages[pkg] || []).filter(c => c.id !== companyId);
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    setPackages(packages);
    // Add to trash if found
    if (companyToRemove) {
      const trash = JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
      trash.push({ ...companyToRemove, originalPackage: pkg });
      localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    }
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
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container" style={{
              marginBottom: 0, minHeight: 0, maxHeight: 540, height: 'auto', width: '100%', overflowY: filtered.length > 15 ? 'auto' : 'visible'}}>
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
                  {filtered.slice(0, 15).map(c => {
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
                  {filtered.length > 15 && filtered.slice(15).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  const [trash, setTrash] = useState(() => JSON.parse(localStorage.getItem(TRASH_KEY) || '[]'));
  const [search, setSearch] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const handleRestore = (company) => {
    // Remove from trash
    const updatedTrash = trash.filter(c => c.id !== company.id);
    setTrash(updatedTrash);
    localStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
    // Restore to original package
    const saved = localStorage.getItem(PACKAGE_KEY);
    const packages = saved ? JSON.parse(saved) : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
    if (!packages[company.originalPackage].some(c => c.id === company.id)) {
      packages[company.originalPackage].push(company);
      localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
    }
  };
  const handleDeleteForever = (company) => {
    const updatedTrash = trash.filter(c => c.id !== company.id);
    setTrash(updatedTrash);
    localStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
  };
  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = () => {
    setTrash([]);
    localStorage.setItem(TRASH_KEY, JSON.stringify([]));
    setShowDeleteAll(false);
  };
  const handleDeleteAllCancel = () => {
    setShowDeleteAll(false);
  };
  // Filtered trash based on search
  const filteredTrash = trash.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.originalPackage || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.status || '').toLowerCase().includes(search.toLowerCase())
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
                  <span>Company Name</span>
                  <input
                    type="text"
                    className="package-search-input"
                    style={{ minWidth: 180, marginTop: 6 }}
                    placeholder="Search trash..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                      </div>
                    </th>
              <th>Original Package</th>
              <th>Status</th>
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
              <tr><td colSpan={4} className="trash-empty">Trash is empty.</td></tr>
            )}
            {filteredTrash.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, fontSize: '1.13rem', color: '#232323', background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #4e342e', letterSpacing: '0.02em' }}>{c.name}</td>
                <td style={{ background: '#fff8f8' }}>{c.originalPackage}</td>
                <td style={{ background: '#fff8f8' }}>{c.status}</td>
                <td>
                  <button className="trash-action-btn restore" onClick={() => handleRestore(c)}>Restore</button>
                  <button className="trash-action-btn delete" onClick={() => handleDeleteForever(c)}>Delete Forever</button>
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

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const location = useLocation();
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location.pathname === '/company-tracker' && location.state && location.state.editData) {
      setEditData(location.state.editData);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location]);

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
  } else if (sidebarCollapsed) {
    mainContentMarginLeft = 56;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <button
        onClick={() => signOut(auth)}
        style={{
          position: 'fixed',
          top: 18,
          right: 28,
          zIndex: 2000,
          background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '1.08em',
          padding: '0.6em 1.5em',
          boxShadow: '0 2px 8px #e0e7ef',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.18s, color 0.18s',
        }}
        title="Logout"
      >
        Logout
      </button>
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
      <div style={{ display: 'flex' }}>
        <div
          onMouseEnter={() => windowWidth > 700 && setSidebarCollapsed(false)}
          onMouseLeave={() => windowWidth > 700 && setSidebarCollapsed(true)}
          style={{ height: '100vh' }}
        >
          <Sidebar className={sidebarClass} />
        </div>
        <div
          className="minimal-bg main-content"
          style={{ marginLeft: mainContentMarginLeft, transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)' }}
        >
          <header className="minimal-header">
            <div className="header-content">
              <span className="header-title">SEO TRACKER</span>
              <nav>
                <a href="#projects">Projects</a>
                <a href="#info">Info</a>
              </nav>
            </div>
          </header>
          <div className="minimalist-divider" />
          <main className="main-seo-content">
            <Routes>
              <Route path="/" element={<HomeHero />} />
              <Route path="/da-pa-checker" element={<DApaChecker />} />
              <Route path="/company-tracker" element={<CompanyTracker editCompany setEditData={setEditData} editData={editData} clearEdit={() => setEditData(null)} />} />
              <Route path="/seo-basic" element={<PackagePage pkg="SEO - BASIC" />} />
              <Route path="/seo-premium" element={<PackagePage pkg="SEO - PREMIUM" />} />
              <Route path="/seo-pro" element={<PackagePage pkg="SEO - PRO" />} />
              <Route path="/seo-ultimate" element={<PackagePage pkg="SEO - ULTIMATE" />} />
              <Route path="/report" element={<Report />} />
              <Route path="/link-buildings" element={<LinkBuildings />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/template-trash" element={<TemplateTrash />} />
              <Route path="/social-bookmarking" element={<SocialBookmarking />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/tickets" element={<Tickets />} />
            </Routes>
          </main>
          <div className="minimalist-divider" />
          <footer className="minimal-footer">
            <div className="footer-content">
              <span>&copy; 2025 OPPA JEWO</span>
              <span className="footer-tagline">Kung ang bayot ma amnesia, bayot gihapon?</span>
              <a href="#website" className="footer-link">Website</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

export default App
