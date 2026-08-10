import React from 'react';
import { BottomNav as SharedBottomNav } from '@shared-ui/core';
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
export const BottomNav: React.FC = () => <SharedBottomNav items={NAV_ITEMS} />;
