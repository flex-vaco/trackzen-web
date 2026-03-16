import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsService } from '../services/notifications.service';
import { Avatar } from './ui/Avatar';
import type { Notification, UserRole } from '../types';

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (simple 24x24 path-based)                        */
/* ------------------------------------------------------------------ */

const icons = {
  grid: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17V5h2v12H3zm6-4V3h2v10H9zm6 2V7h2v8h-2zm6-6v10h-2V9h2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4a4 4 0 10-8 0" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1.066.426 2.573-.104 2.573-1.066z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  help: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Nav item type                                                       */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  roles?: UserRole[];
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'TMS',
    items: [
      { label: 'Dashboard', icon: icons.grid, to: '/' },
      { label: 'My Timesheet', icon: icons.clock, to: '/timesheet' },
      { label: 'Approvals', icon: icons.checkCircle, to: '/approvals', roles: ['MANAGER', 'ADMIN'] },
      { label: 'Reports', icon: icons.chart, to: '/reports', roles: ['MANAGER', 'ADMIN'] },
    ],
  },
  {
    title: 'Leave',
    items: [
      { label: 'My Leave', icon: icons.calendar, to: '/leave' },
      { label: 'Leave Approvals', icon: icons.checkCircle, to: '/leave/approvals', roles: ['MANAGER', 'ADMIN'] },
      { label: 'Team Calendar', icon: icons.users, to: '/leave/calendar', roles: ['MANAGER', 'ADMIN'] },
    ],
  },
  {
    title: 'Admin',
    roles: ['ADMIN'],
    items: [
      { label: 'Admin', icon: icons.settings, to: '/admin' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help', icon: icons.help, to: '/help' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Layout component                                                    */
/* ------------------------------------------------------------------ */

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'EMPLOYEE';

  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Fetch notifications on mount */
  useEffect(() => {
    notificationsService
      .list({ limit: 10 })
      .then((res: { data: Notification[] }) => setNotifications(res.data))
      .catch(() => {});
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silent */
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const canSee = (roles?: UserRole[]) => !roles || roles.includes(role);

  const sectionVisible = (section: NavSection) => {
    if (!canSee(section.roles)) return false;
    return section.items.some((item) => canSee(item.roles));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ───── Sidebar ───── */}
      <aside
        className={`flex flex-col bg-brand-primary-dk text-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10">
          <span className="text-xl font-bold tracking-tight">T</span>
          {!collapsed && <span className="text-lg font-semibold tracking-tight">TrackZen</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {navSections.filter(sectionVisible).map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.filter((item) => canSee(item.roles)).map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md mx-2 transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center h-10 border-t border-white/10 text-white/60 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>
      </aside>

      {/* ───── Main area ───── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200">
          {/* Left: brand name (visible on small screens or when sidebar collapsed) */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-brand-primary-dk">TrackZen</span>
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                {icons.bell}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-brand-danger rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-6 text-center text-sm text-gray-400">
                        No notifications
                      </li>
                    ) : (
                      notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`px-4 py-3 text-sm ${n.read ? 'text-gray-500' : 'text-gray-800 bg-brand-primary/5'}`}
                        >
                          <p>{n.message}</p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="User menu"
              >
                <Avatar name={user?.name ?? 'U'} size="sm" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <ul>
                    <li>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {icons.user}
                        Profile
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-brand-danger hover:bg-gray-50"
                      >
                        {icons.logout}
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
