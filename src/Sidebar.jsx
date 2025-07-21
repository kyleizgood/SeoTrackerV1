import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';

// You can use emoji or replace with SVG/icon components
const navLinks = [
  { icon: '🏢', text: 'Company Overview', href: '/company-overview', aria: 'Company Overview' },
  { icon: '📦', text: 'SEO - BASIC', href: '/seo-basic', aria: 'SEO - BASIC' },
  { icon: '\u2b50', text: 'SEO - PREMIUM', href: '/seo-premium', aria: 'SEO - PREMIUM' },
  { icon: '🚀', text: 'SEO - PRO', href: '/seo-pro', aria: 'SEO - PRO' },
  { icon: '💎', text: 'SEO - ULTIMATE', href: '/seo-ultimate', aria: 'SEO - ULTIMATE' },
  { icon: '📊', text: 'Report', href: '/report', aria: 'Report' },
  { icon: '🔗', text: 'Link Buildings', href: '/link-buildings', aria: 'Link Buildings' },
  { icon: '🔖', text: 'Bookmarking', href: '/social-bookmarking', aria: 'Bookmarking' },
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