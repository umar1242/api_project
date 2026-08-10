import React from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export interface BottomNavProps {
  items: NavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ items }) => (
  <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
    {items.map(({ to, icon, label }) => (
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
