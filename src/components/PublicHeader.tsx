"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

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

  return (
    <header className="public-header">
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