"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAuthHeaders, getUserRoleFromToken } from "@/lib/auth-client";
import BackToTop from "@/components/BackToTop";
import styles from './DashboardLayout.module.css';
import {
  faHome, faBox, faShoppingCart, faWarehouse, faUsers,
  faCalendarAlt, faChartLine, faComments, faCog, faSignOutAlt,
  faUserCircle, faBars, faChevronLeft, faChevronRight, faBell, faGlobe,
  faEye, faUserShield
} from '@fortawesome/free-solid-svg-icons';

const Logo = () => (
  <svg width="120" height="34" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 160 L80 80 L120 120 L160 40 L180 80 L140 160 Z" stroke="#f59e0b" strokeWidth="3" fill="none"/>
    <circle cx="100" cy="100" r="30" stroke="#f59e0b" strokeWidth="2" fill="none"/>
    <text x="100" y="180" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">HENG YUN</text>
    <text x="100" y="200" textAnchor="middle" fill="#cbd5e1" fontSize="14">Quarry ERP System</text>
  </svg>
);

interface Notification {
  id: number;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  // Start with undefined to prevent hydration mismatch
  const [sidebarOpen, setSidebarOpen] = useState<boolean | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = sidebarOpen === true ? 260 : (isMobile ? 0 : 70);
  const sidebarOpenActual = sidebarOpen !== undefined ? sidebarOpen : true;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [router.pathname, isMobile]);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/");
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) setLangMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load preferences from API and apply them
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
        if (res.ok) {
          const prefs = await res.json();
          // Apply theme
          if (prefs.theme) document.documentElement.setAttribute('data-theme', prefs.theme);
          // Apply compact mode
          if (prefs.compact_mode === 'true') {
            document.body.classList.add('compact-mode');
          } else {
            document.body.classList.remove('compact-mode');
          }
          // Apply sidebar preference - only after mount
          if (prefs.sidebar_collapsed === 'true') {
            setSidebarOpen(false);
            localStorage.setItem('sidebar_collapsed', 'true');
          } else if (prefs.sidebar_collapsed === 'false') {
            setSidebarOpen(true);
            localStorage.setItem('sidebar_collapsed', 'false');
          } else {
            // Default to expanded
            setSidebarOpen(true);
          }
        } else {
          // Default to expanded
          setSidebarOpen(true);
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
        setSidebarOpen(true);
      }
    };
    loadPreferences();
  }, []);

  // Listen for sidebar preference changes from UI Preferences page
  useEffect(() => {
    const handleSidebarPreference = (e: CustomEvent) => {
      setSidebarOpen(!e.detail);
      localStorage.setItem('sidebar_collapsed', String(e.detail));
    };
    window.addEventListener('sidebar-preference', handleSidebarPreference as EventListener);
    return () => window.removeEventListener('sidebar-preference', handleSidebarPreference as EventListener);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (err) {
      console.error(err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case "superadmin": return t('roleSuperAdmin') || "Super Admin";
      case "admin": return t('roleAdmin') || "Admin";
      case "service_provider": return t('roleServiceProvider') || "Service Provider";
      case "supervisor": return t('roleSupervisor') || "Supervisor";
      default: return userRole || t('user') || "User";
    }
  };

  // Navigation items with role-based visibility and translations
  const navSections = [
    {
      items: [{ href: "/dashboard", label: t('dashboardOverview') || "Overview", icon: faHome, roles: ["superadmin", "admin", "service_provider", "supervisor"] }]
    },
    {
      items: [
        { href: "/dashboard/products", label: t('products') || "Products", icon: faBox, roles: ["superadmin", "admin", "service_provider"] },
        { href: "/dashboard/orders", label: t('orders') || "Orders", icon: faShoppingCart, roles: ["superadmin", "admin", "service_provider"] },
        { href: "/dashboard/inventory", label: t('inventory') || "Inventory", icon: faWarehouse, roles: ["superadmin", "admin"] }
      ]
    },
    {
      items: [
        { href: "/dashboard/workers", label: t('workers') || "Workers", icon: faUsers, roles: ["superadmin", "admin", "supervisor"] },
        { href: "/dashboard/attendance/weekly", label: t('attendance') || "Attendance", icon: faCalendarAlt, roles: ["superadmin", "admin", "supervisor"] }
      ]
    },
    {
      items: [
        { href: "/dashboard/analytics", label: t('analytics') || "Analytics", icon: faChartLine, roles: ["superadmin", "admin"] },
        { href: "/dashboard/support", label: t('support') || "Support", icon: faComments, roles: ["superadmin", "admin", "service_provider"] }
      ]
    },
    {
      items: [
        { href: "/dashboard/settings", label: t('settings') || "Settings", icon: faCog, roles: ["superadmin", "admin", "service_provider", "supervisor"] },
        { href: "/dashboard/admin/users", label: t('user_management') || "User Management", icon: faUserShield, roles: ["superadmin", "admin"] }
      ]
    }
  ];

  const filteredSections = navSections.map(section => ({
    items: section.items.filter(item => userRole && item.roles.includes(userRole))
  })).filter(section => section.items.length > 0);

  // Don't render sidebar until mounted to prevent hydration mismatch
  if (sidebarOpen === undefined) {
    return (
      <div className={styles.layout}>
        <main className={`${styles.main} main-content`}>
          <div className={`${styles.header} ${styles.stickyHeader}`}>
            <div className={styles.headerLeft}>
              <Logo />
            </div>
          </div>
          {children}
          <BackToTop />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {isMobile && sidebarOpenActual && <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpenActual ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
        {sidebarOpenActual && (
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeText}>{t('welcome') || "Welcome"},</div>
            <div className={styles.systemName}>{getRoleDisplay()}</div>
          </div>
        )}
        <nav className={styles.nav}>
          {filteredSections.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              {section.items.map(item => {
                const isActive = router.pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                    {sidebarOpenActual && <span className={styles.linkText}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className={`${styles.main} main-content`} style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <div className={`${styles.header} ${styles.stickyHeader}`}>
          <div className={styles.headerLeft}>
            {!isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpenActual)} className={styles.collapseButton}>
                <FontAwesomeIcon icon={sidebarOpenActual ? faChevronLeft : faChevronRight} />
              </button>
            )}
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className={styles.collapseButton}>
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
            <Logo />
          </div>

          <div className={styles.headerRight}>
            <div ref={langMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => setLangMenuOpen(!langMenuOpen)} className={styles.iconButton}>
                <FontAwesomeIcon icon={faGlobe} />
              </button>
              {langMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <button onClick={() => { setLocale("en"); setLangMenuOpen(false); }} className={styles.dropdownItem}>English</button>
                  <button onClick={() => { setLocale("rw"); setLangMenuOpen(false); }} className={styles.dropdownItem}>Kinyarwanda</button>
                  <button onClick={() => { setLocale("zh"); setLangMenuOpen(false); }} className={styles.dropdownItem}>中文</button>
                </div>
              )}
            </div>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)} className={styles.iconButton}>
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <span>{t('notifications') || "Notifications"}</span>
                    <button className={styles.markReadButton} onClick={markAllAsRead}>{t('markAllRead') || "Mark all read"}</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyNotifications}>{t('noNotifications') || "No new notifications"}</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`${styles.notificationItem} ${!notif.is_read ? styles.notificationItemUnread : ''} ${styles[`priority${notif.priority.charAt(0).toUpperCase() + notif.priority.slice(1)}`]}`}>
                        <div className={styles.notificationTitle}>{notif.title}</div>
                        <div className={styles.notificationMessage}>{notif.message}</div>
                        <div className={styles.notificationTime}>{new Date(notif.created_at).toLocaleString()}</div>
                        {!notif.is_read && (
                          <button className={styles.markReadButton} onClick={() => markAsRead(notif.id)}>
                            <FontAwesomeIcon icon={faEye} /> {t('markRead') || "Mark as read"}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={styles.userAvatar}>
                <FontAwesomeIcon icon={faUserCircle} size="lg" />
              </button>
              {userMenuOpen && (
                <div className={styles.userMenu}>
                  <Link href="/dashboard/settings?tab=account" className={styles.userMenuItem}>
                    <FontAwesomeIcon icon={faUserCircle} fixedWidth /> {t('myProfile') || "My Profile"}
                  </Link>
                  <Link href="/dashboard/settings" className={styles.userMenuItem}>
                    <FontAwesomeIcon icon={faCog} fixedWidth /> {t('settings') || "Settings"}
                  </Link>
                  <button onClick={() => setShowLogoutConfirm(true)} className={`${styles.userMenuItem} ${styles.userMenuItemLogout}`}>
                    <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> {t('logout') || "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {children}
        <BackToTop />
      </main>

      {showLogoutConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirmLogout') || "Confirm Logout"}</h3>
            <p>{t('logoutConfirmMessage') || "Are you sure you want to logout from the system?"}</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setShowLogoutConfirm(false)} className={styles.modalCancelButton}>{t('cancel') || "Cancel"}</button>
              <button onClick={handleLogout} className={styles.modalConfirmButton}>{t('logout') || "Logout"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}