"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

// ========== ALL STYLE CONSTANTS (copy from your original about.tsx) ==========
// I have used the exact style constants from your original file.
const headerStyle: React.CSSProperties = {
  backgroundColor: "#3c516a",
  color: "white",
  padding: "0rem 2rem",
  borderBottom: "1px solid #374151",
  position: "sticky",
  top: 0,
  zIndex: 1000,
};
const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "1rem",
};
const logoAreaStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};
const logoContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};
const taglineStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "1px",
  color: "#faa106",
  fontWeight: "500",
  marginTop: "2px",
};
const langGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};
const langButtonStyle: React.CSSProperties = {
  backgroundColor: "#374151",
  color: "white",
  border: "none",
  borderRadius: "4px",
  padding: "0.25rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.9rem",
};
const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "1.5rem",
  alignItems: "center",
};
const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: "600",
  padding: "0.5rem 0",
  borderBottom: "2px solid transparent",
  transition: "border-color 0.2s",
  cursor: "pointer",
  letterSpacing: "0.5px",
};
const loginButtonStyle: React.CSSProperties = {
  backgroundColor: "#f59e0b",
  color: "#0b1c34",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: "bold",
  padding: "0.5rem 1.2rem",
  borderRadius: "6px",
  transition: "background 0.2s",
  display: "inline-block",
  letterSpacing: "0.5px",
};
const dropdownContainerStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};
const dropdownMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  backgroundColor: "white",
  minWidth: "120px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  borderRadius: "6px",
  overflow: "hidden",
  zIndex: 10,
  marginTop: "0.5rem",
};
const dropdownLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "0.6rem 1rem",
  color: "#1f2937",
  textDecoration: "none",
  fontSize: "0.85rem",
  transition: "background 0.2s",
};

// Hero styles
const heroSectionStyle: React.CSSProperties = {
  height: "500px",
  backgroundImage: "url('/operations/facility2.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};
const heroOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const heroHeadingStyle: React.CSSProperties = {
  color: "white",
  fontSize: "3rem",
  fontWeight: "700",
  textAlign: "center",
  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
  margin: 0,
  padding: "0 1rem",
};

// Story styles
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};
const storySectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "2rem",
  color: "#1f2937",
  textAlign: "center",
  fontWeight: "700",
};
const storyTextStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
};
const paragraphStyle: React.CSSProperties = {
  fontSize: "1rem",
  lineHeight: "1.7",
  color: "#4b5563",
  marginBottom: "1rem",
};

// Staff styles
const staffSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const staffGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "2rem",
  marginTop: "2rem",
};
const staffCardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  textAlign: "center",
  paddingBottom: "1rem",
};
const staffImageStyle: React.CSSProperties = {
  width: "100%",
  height: "250px",
  objectFit: "cover",
};
const staffNameStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  margin: "1rem 0 0.25rem",
  color: "#1f2937",
  fontWeight: "600",
};
const staffRoleStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#f59e0b",
  fontWeight: "500",
  marginBottom: "0.5rem",
};
const staffBioStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#6b7280",
  padding: "0 1rem 1rem",
  lineHeight: "1.4",
};

// Three column section styles
const threeColumnSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#4d5a67",
};
const threeColumnContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2rem",
  alignItems: "start",
};
const servicesColumnStyle: React.CSSProperties = { textAlign: "left" };
const servicesListSingleStyle: React.CSSProperties = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
};
const serviceItemStyle: React.CSSProperties = {
  marginBottom: "0.5rem",
  fontSize: "0.9rem",
  color: "#f9fafd",
};
const columnHeadingStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "1rem",
  color: "#1f2937",
  borderLeft: "4px solid #f59e0b",
  paddingLeft: "0.75rem",
};
const environmentalColumnStyle: React.CSSProperties = { textAlign: "center" };
const logoWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
  display: "flex",
  justifyContent: "center",
};
const environmentalHeadingStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  marginBottom: "0.75rem",
  color: "#f6f7f9",
  fontWeight: "600",
};
const environmentalTextStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  lineHeight: "1.5",
  color: "#f7f8f9",
};
const contactColumnStyle: React.CSSProperties = {
  textAlign: "left",
  marginLeft: "40%",
};
const contactAddressStyle: React.CSSProperties = {
  fontStyle: "normal",
  color: "#fbfcfe",
  fontSize: "0.9rem",
  lineHeight: "1.5",
};
const contactDetailStyle: React.CSSProperties = {
  margin: "0.5rem 0",
};

// Footer styles
const footerStyle: React.CSSProperties = {
  backgroundColor: "#1f2937",
  color: "#9ca3af",
  textAlign: "center",
  padding: "2rem",
  borderTop: "1px solid #374151",
};
const footerContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

// ========== COMPONENT ==========
export default function About() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();

  const [productsOpen, setProductsOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    fetch('/api/team-members')
      .then(res => res.json())
      .then(data => {
        setTeam(Array.isArray(data) ? data : []);
        setLoadingTeam(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingTeam(false);
      });
  }, []);

  const activeLinkStyle: React.CSSProperties = {
    borderBottomColor: "#f59e0b",
    color: "#f59e0b",
  };

  return (
    <div>
      <PublicHeader />

      {/* HERO SECTION */}
      <div style={heroSectionStyle}>
        <div style={heroOverlayStyle}>
          <h1 style={heroHeadingStyle}>{t.aboutTitle}</h1>
        </div>
      </div>

      {/* COMPANY STORY */}
      <section style={storySectionStyle}>
        <div style={containerStyle}>
          <div style={storyTextStyle}>
            {t.aboutStory.split('\n').map((para, i) => (
              <p key={i} style={paragraphStyle}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* STAFF SECTION – DYNAMIC */}
      <section style={staffSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>{t.staffTitle}</h2>
          {loadingTeam ? (
            <p style={{ textAlign: 'center' }}>Loading team members...</p>
          ) : team.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No team members added yet.</p>
          ) : (
            <div style={staffGridStyle}>
              {team.map(member => (
                <div key={member.id} style={staffCardStyle}>
                  <img
                    src={member.image_url || '/staff/placeholder.jpg'}
                    alt={member.name}
                    style={staffImageStyle}
                    onError={(e) => { e.currentTarget.src = '/staff/placeholder.jpg'; }}
                  />
                  <h3 style={staffNameStyle}>{member.name}</h3>
                  <p style={staffRoleStyle}>{member.role}</p>
                  <p style={staffBioStyle}>{member.bio}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* THREE COLUMN SECTION (Services | Environmental | Contact) */}
      <section style={threeColumnSectionStyle}>
        <div style={threeColumnContainerStyle}>
          <div style={servicesColumnStyle}>
            <h3 style={columnHeadingStyle}>{t.servicesTitle}</h3>
            <ul style={servicesListSingleStyle}>
              {(t.servicesList || []).map((service, idx) => (
                <li key={idx} style={serviceItemStyle}>{service}</li>
              ))}
            </ul>
          </div>
          <div style={environmentalColumnStyle}>
            <div style={logoWrapperStyle}>
              <svg width="120" height="34" viewBox="0 0 160 45" fill="none">
                <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
                <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
              </svg>
            </div>
            <h4 style={environmentalHeadingStyle}>{t.environmentalTitle}</h4>
            <p style={environmentalTextStyle}>{t.environmentalText}</p>
          </div>
          <div style={contactColumnStyle}>
            <h3 style={columnHeadingStyle}>{t.contactUsHeading}</h3>
            <address style={contactAddressStyle}>
              <div>{(t.address || "").split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> {t.phone}</p>
              <p><strong>{t.emailLabel}:</strong> {t.email}</p>
            </address>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}