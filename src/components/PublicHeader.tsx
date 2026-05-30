"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faBars, faTimes, faSearchPlus } from "@fortawesome/free-solid-svg-icons";

export default function PublicHeader() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  const currentPath = router.asPath.split('?')[0].split('#')[0];

  // Add CSS for image hover effect and larger text
  useEffect(() => {
    // Add global styles for image hover effect
    const style = document.createElement('style');
    style.textContent = `
      /* Image hover overlay effect */
      .image-container {
        position: relative;
        overflow: hidden;
        cursor: pointer;
      }
      .image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      .image-container:hover img {
        transform: scale(1.05);
      }
      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(245, 158, 11, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .image-container:hover .image-overlay {
        opacity: 1;
      }
      .zoom-icon {
        background-color: rgba(8, 8, 8, 0.5);
        border-radius: 50%;
        padding: 12px;
        color: white;
        font-size: 1.5rem;
        transition: transform 0.2s ease;
      }
      .image-container:hover .zoom-icon {
        transform: scale(1.1);
      }
      
      /* Larger text styles */
      .public-header .main-nav a,
      .public-header .main-nav .dropdown > a,
      .public-header .main-nav .login-btn {
        font-size: 1rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.3px !important;
      }
      .public-header .logo .tagline {
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        letter-spacing: 1px !important;
      }
      .public-header .dropdown-content a {
        font-size: 0.9rem !important;
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <header className="public-header" style={{ backgroundColor: "#0f2b3d" }}>
      <div className="header-row">
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
        </button>
        <div className="logo">
          <svg width="140" height="38" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
            <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="white" fontWeight="bold">HENG YUN</text>
          </svg>
          <div className="tagline">SAND AND QUARRY SUPPLIES</div>
        </div>
        <div className="lang-dropdown" ref={langRef}>
          <button onClick={() => setLangOpen(!langOpen)} className="lang-btn" aria-label="Language">
            <FontAwesomeIcon icon={faGlobe} />
          </button>
          {langOpen && (
            <div className="dropdown-menu">
              <button onClick={() => { setLocale("en"); setLangOpen(false); }}>English</button>
              <button onClick={() => { setLocale("rw"); setLangOpen(false); }}>Kinyarwanda</button>
              <button onClick={() => { setLocale("zh"); setLangOpen(false); }}>中文</button>
            </div>
          )}
        </div>
      </div>

      <nav className={`main-nav ${menuOpen ? "open" : ""}`}>
        <Link href="/" className={currentPath === "/" ? "active" : ""}>{t.home}</Link>
        <Link href="/about" className={currentPath === "/about" ? "active" : ""}>{t.about}</Link>
        <div className="dropdown">
          <Link href="/products" className={currentPath === "/products" ? "active" : ""}>{t.products} ▼</Link>
          <div className="dropdown-content">
            <Link href="/products#sand">{t.sand}</Link>
            <Link href="/products#quarry">{t.quarry}</Link>
          </div>
        </div>
        <div className="dropdown">
          <Link href="/market" className={currentPath === "/market" ? "active" : ""}>{t.market} ▼</Link>
          <div className="dropdown-content">
            <Link href="/market/sand">{t.sand}</Link>
            <Link href="/market/quarry">{t.quarry}</Link>
          </div>
        </div>
        <Link href="/contact" className={currentPath === "/contact" ? "active" : ""}>{t.contact}</Link>
        <Link href="/faq" className={currentPath === "/faq" ? "active" : ""}>{t.faq || "FAQ"}</Link>
        <Link href="/login" className="login-btn">{t.login}</Link>
      </nav>
    </header>
  );
}