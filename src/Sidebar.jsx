import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';

// You can use emoji or replace with SVG/icon components
const navLinks = [
  { icon: '🏢', text: 'Company Overview', href: '/company-overview', aria: 'Company Overview' },
  { icon: '📦', text: 'Packages', href: '/packages', aria: 'Packages' },
  { icon: '📅', text: 'Monthly Tasks', href: '/monthly-tasks', aria: 'Monthly Tasks' },
  { icon: '📝', text: 'Site Audits', href: '/site-audits', aria: 'Site Audits' },
  { icon: '📄', text: 'Templates', href: '/templates', aria: 'Templates' },
  { icon: '🎫', text: 'Tickets', href: '/tickets', aria: 'Tickets' },
  { icon: '🗒️', text: 'Notes & Reminders', href: '/notes', aria: 'Notes & Reminders' },
  { icon: '🗑️', text: 'Trash', href: '/trash', aria: 'Trash' },
];

const Sidebar = ({ className = 'sidebar' }) => {
  // Determine if collapsed by className
  const isCollapsed = className.includes('sidebar--collapsed');
  return (
    <aside className={className}>
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <span className="sidebar-logo-icon" aria-label="Logo">🧭</span>
        <span className="sidebar-logo-text">TRACKER</span>
      </Link>
      <nav className="sidebar-nav">
        {navLinks.map(link => (
          <Link
            to={link.href}
            key={link.text}
            aria-label={link.aria}
            className="sidebar-link"
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-text" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset', width: '100%' }}>{link.text}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar; 