import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, BarChart2, User, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/schedule', icon: <Calendar size={22} />, label: 'Schedule' },
  { to: '/progress', icon: <BarChart2 size={22} />, label: 'Progress' },
  { to: '/assignments', icon: <FileText size={22} />, label: 'Tests' },
  { to: '/profile', icon: <User size={22} />, label: 'Profile' },
];

/**
 * Bottom navigation bar with three tabs: Schedule, Progress, Profile.
 * Uses NavLink so the active tab gets the --active modifier class.
 */
export const BottomNav: React.FC = () => (
  <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
        aria-label={label}
      >
        <span className="bottom-nav__icon">{icon}</span>
        <span className="bottom-nav__label">{label}</span>
      </NavLink>
    ))}
  </nav>
);
