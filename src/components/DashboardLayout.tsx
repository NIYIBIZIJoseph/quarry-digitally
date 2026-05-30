"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBox,
  faShoppingCart,
  faWarehouse,
  faUsers,
  faCalendarAlt,
  faChartLine,
  faComments,
  faCog,
  faSignOutAlt,
  faUserCircle,
  faBars,
  faChevronLeft,
  faChevronRight,
  faBell,
  faGlobe,
  faEye,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./DashboardLayout.module.css";
import DashboardHeader from "./dashboard/DashboardHeader";
import BackToTop from "@/components/BackToTop";
import { getUserRoleFromToken, getAuthHeaders } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

// Local ROLES definition - lowercase to match token from backend
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SERVICE_PROVIDER: 'service_provider',
} as const;

type RoleId = typeof ROLES[keyof typeof ROLES];

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
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<RoleId | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = sidebarOpen ? 260 : isMobile ? 0 : 70;

  useEffect(() => {
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
    const normalizedRole = role ? role.toLowerCase() as RoleId : null;
    setUserRole(normalizedRole);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
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
    document.cookie = "token=; path=/; max-age=0";
    router.push("/");
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case ROLES.SUPERADMIN:
        return t('roleSuperAdmin') || "Super Admin";
      case ROLES.ADMIN:
        return t('roleAdmin') || "Admin";
      case ROLES.SUPERVISOR:
        return t('roleSupervisor') || "Supervisor";
      case ROLES.SERVICE_PROVIDER:
        return t('roleServiceProvider') || "Service Provider";
      default:
        return t('user') || "User";
    }
  };

 const navItems = [
  // Overview - Everyone
  { href: "/dashboard", label: t('dashboardOverview') || "Overview", icon: faHome, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
  
  // Products - Only Admin and Super Admin
  { href: "/dashboard/products", label: t('products') || "Products", icon: faBox, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  
  // Orders - Only Admin and Super Admin
  { href: "/dashboard/orders", label: t('orders') || "Orders", icon: faShoppingCart, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  
  // Inventory - Only Admin and Super Admin
  { href: "/dashboard/inventory", label: t('inventory') || "Inventory", icon: faWarehouse, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  
  // Workers - Admin, Super Admin, Supervisor
  { href: "/dashboard/workers", label: t('workers') || "Workers", icon: faUsers, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR] },
  
  // Attendance - Admin, Super Admin, Supervisor
  { href: "/dashboard/attendance/weekly", label: t('attendance') || "Attendance", icon: faCalendarAlt, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR] },
  
  // Analytics - Only Admin and Super Admin
  { href: "/dashboard/analytics", label: t('analytics') || "Analytics", icon: faChartLine, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
  
  // Support - Everyone
  { href: "/dashboard/support", label: t('support') || "Support", icon: faComments, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
  
  // Settings - Everyone (role-based tabs inside settings page)
  { href: "/dashboard/settings", label: t('settings') || "Settings", icon: faCog, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER] },
  
  // User Management - Only Admin and Super Admin
  { href: "/dashboard/admin/users", label: t('user_management') || "User Management", icon: faUserShield, roles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
];

  const visibleNavItems = navItems.filter(item =>
    userRole !== null && item.roles.includes(userRole)
  );

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
        {sidebarOpen && (
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeText}>{t('welcome') || "Welcome"},</div>
            <div className={styles.systemName}>{getRoleDisplay()}</div>
          </div>
        )}
        <nav className={styles.nav}>
          {visibleNavItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                {sidebarOpen && <span className={styles.linkText}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main} style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        {/* Header */}
        <div className={`${styles.header} ${styles.stickyHeader}`}>
          <div className={styles.headerLeft}>
            {!isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={styles.collapseButton}>
                <FontAwesomeIcon icon={sidebarOpen ? faChevronLeft : faChevronRight} />
              </button>
            )}
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className={styles.collapseButton}>
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
          </div>

          <div className={styles.headerRight}>
            {/* Language Menu */}
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

            {/* Notifications */}
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
                      <div key={notif.id} className={`${styles.notificationItem} ${!notif.is_read ? styles.notificationItemUnread : ''}`}>
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

            {/* User Menu */}
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

        {/* Page content */}
        <div className={styles.content}>
          {children}
        </div>
        
        {/* Back to Top Button */}
        <BackToTop />
      </main>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirmLogout') || "Confirm Logout"}</h3>
            <p>{t('logoutConfirmMessage') || "Are you sure you want to logout?"}</p>
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