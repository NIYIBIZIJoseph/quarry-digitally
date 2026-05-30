"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus } from "@fortawesome/free-solid-svg-icons";

// Image Modal Component
function ImageModal({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        cursor: "pointer",
      }}
      onClick={onClose}
    >
      <div style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
        <img src={imageUrl} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Staff Card Component with hover state
function StaffCard({ member, onImageClick }: { member: any; onImageClick: (url: string, name: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: isHovered ? "0 8px 25px rgba(0,0,0,0.15)" : "0 4px 12px rgba(0,0,0,0.1)",
        textAlign: "center",
        paddingBottom: "1rem",
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: isHovered ? "translateY(-5px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          height: "280px",
        }}
        onClick={() => onImageClick(member.image_url || '/staff/placeholder.jpg', member.name)}
      >
        <img
          src={member.image_url || '/staff/placeholder.jpg'}
          alt={member.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
          onError={(e) => { e.currentTarget.src = '/staff/placeholder.jpg'; }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(245, 158, 11, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: "50%",
              padding: "12px",
              color: "white",
              fontSize: "1.5rem",
              transition: "transform 0.2s ease",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            <FontAwesomeIcon icon={faSearchPlus} />
          </div>
        </div>
      </div>
      <h3 style={{ fontSize: "1.3rem", margin: "1rem 0 0.25rem", color: "#1f2937", fontWeight: "700" }}>{member.name}</h3>
      <p style={{ fontSize: "1rem", color: "#f59e0b", fontWeight: "600", marginBottom: "0.5rem" }}>{member.role}</p>
      <p style={{ fontSize: "0.9rem", color: "#6b7280", padding: "0 1rem 1rem", lineHeight: "1.5" }}>{member.bio}</p>
    </div>
  );
}

export default function About() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();

  const [team, setTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  useEffect(() => {
    fetch('/api/public/team')
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

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  return (
    <div>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

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

      {/* STAFF SECTION */}
      <section style={staffSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>{t.staffTitle}</h2>
          {loadingTeam ? (
            <p style={{ textAlign: 'center', fontSize: "1rem" }}>Loading team members...</p>
          ) : team.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: "1rem" }}>No team members added yet.</p>
          ) : (
            <div style={staffGridStyle}>
              {team.map((member) => (
                <StaffCard key={member.id} member={member} onImageClick={openModal} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* THREE COLUMN SECTION */}
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

// ========== STYLES ==========
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
  fontSize: "2.2rem",
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
  fontSize: "1.05rem",
  lineHeight: "1.7",
  color: "#4b5563",
  marginBottom: "1rem",
};
const staffSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const staffGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2rem",
  marginTop: "2rem",
};
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
  fontSize: "1rem",
  color: "#f9fafd",
};
const columnHeadingStyle: React.CSSProperties = {
  fontSize: "1.6rem",
  marginBottom: "1rem",
  color: "#1f2937",
  borderLeft: "4px solid #f59e0b",
  paddingLeft: "0.75rem",
  fontWeight: "700",
};
const environmentalColumnStyle: React.CSSProperties = { textAlign: "center" };
const logoWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
  display: "flex",
  justifyContent: "center",
};
const environmentalHeadingStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  marginBottom: "0.75rem",
  color: "#f6f7f9",
  fontWeight: "600",
};
const environmentalTextStyle: React.CSSProperties = {
  fontSize: "1rem",
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
  fontSize: "1rem",
  lineHeight: "1.6",
};
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
  fontSize: "0.9rem",
};