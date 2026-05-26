"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

export default function ContactPage() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();

  const [formData, setFormData] = useState({
    user_name: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_name || !formData.message) {
      setError(t.contactFormError || "Please fill in your name and message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: formData.user_name,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send");
      }
      setSubmitted(true);
      setFormData({ user_name: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || "Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PublicHeader />

      {/* Hero */}
      <div style={heroSectionStyle}>
        <div style={heroOverlayStyle}>
          <h1 style={heroHeadingStyle}>{t.contactHeroTitle}</h1>
          <p style={heroSubStyle}>{t.contactHeroDesc}</p>
        </div>
      </div>

      {/* Contact Info + Form */}
      <section style={contactSectionStyle}>
        <div style={containerStyle}>
          <div style={twoColumnStyle}>
            {/* Left column – Info & Map */}
            <div style={contactInfoStyle}>
              <h2 style={infoTitleStyle}>{t.contactInfoTitle}</h2>
              <div style={infoItemStyle}>
                <span style={infoIconStyle}>📍</span>
                <div>
                  <strong>{t.officeAddress}</strong><br />
                  {t.address.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                </div>
              </div>
              <div style={infoItemStyle}>
                <span style={infoIconStyle}>📞</span>
                <div>
                  <strong>{t.phoneLabel}</strong><br />
                  {t.phone}
                </div>
              </div>
              <div style={infoItemStyle}>
                <span style={infoIconStyle}>✉️</span>
                <div>
                  <strong>{t.emailLabel}</strong><br />
                  {t.email}
                </div>
              </div>
              <div style={mapContainerStyle}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63741.28063066605!2d30.033333!3d-1.933333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca6f0b6f2d2f7%3A0x2b8f7c8b8b8b8b8b!2sNyacyonga%2C%20Rwanda!5e0!3m2!1sen!2srw!4v1712345678901!5m2!1sen!2srw"
                  width="100%"
                  height="250"
                  style={{ border: 0, borderRadius: "8px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nyacyonga Quarry Area"
                ></iframe>
              </div>
            </div>

            {/* Right column – Contact Form + Link to FAQ */}
            <div style={formContainerStyle}>
              <h2 style={formTitleStyle}>{t.contactFormTitle}</h2>
              {submitted && <div style={successMessageStyle}>✓ {t.contactFormSuccess}</div>}
              {error && <div style={errorMessageStyle}>⚠️ {error}</div>}
              <form onSubmit={handleSubmit} style={formStyle}>
                <input
                  type="text"
                  name="user_name"
                  placeholder={t.fullName}
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder={t.phoneLabel}
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <input
                  type="text"
                  name="subject"
                  placeholder={t.subject}
                  value={formData.subject}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <textarea
                  name="message"
                  placeholder={t.message}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={textareaStyle}
                />
                <button type="submit" disabled={sending} style={submitButtonStyle}>
                  {sending ? "Sending..." : t.sendButton}
                </button>
              </form>

              {/* Link to FAQ page */}
              <div style={faqLinkWrapperStyle}>
                <Link href="/faq" style={faqLinkStyle}>
                  📖 {t.faqTitle || "Frequently Asked Questions"} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Column Section (Services | Environmental | Contact) */}
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
              <svg width="120" height="34" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}

// ========== STYLE CONSTANTS ==========
const heroSectionStyle: React.CSSProperties = {
  height: "400px",
  backgroundImage: "url('https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1920&h=400&fit=crop')",
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
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};
const heroHeadingStyle: React.CSSProperties = {
  color: "white",
  fontSize: "3rem",
  fontWeight: "700",
  marginBottom: "1rem",
};
const heroSubStyle: React.CSSProperties = {
  color: "white",
  fontSize: "1.2rem",
  maxWidth: "700px",
};
const contactSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};
const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "3rem",
};
const contactInfoStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const infoTitleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "1.5rem",
  color: "#1f2937",
};
const infoItemStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  marginBottom: "1.5rem",
  alignItems: "flex-start",
};
const infoIconStyle: React.CSSProperties = {
  fontSize: "1.5rem",
};
const mapContainerStyle: React.CSSProperties = {
  marginTop: "1.5rem",
  borderRadius: "8px",
  overflow: "hidden",
};
const formContainerStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const formTitleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "1.5rem",
  color: "#1f2937",
};
const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};
const inputStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  outline: "none",
};
const textareaStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
};
const submitButtonStyle: React.CSSProperties = {
  backgroundColor: "#f59e0b",
  color: "#1f2937",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "none",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
};
const successMessageStyle: React.CSSProperties = {
  backgroundColor: "#10b981",
  color: "white",
  padding: "0.75rem",
  borderRadius: "8px",
  marginBottom: "1rem",
  textAlign: "center",
};
const errorMessageStyle: React.CSSProperties = {
  backgroundColor: "#ef4444",
  color: "white",
  padding: "0.75rem",
  borderRadius: "8px",
  marginBottom: "1rem",
  textAlign: "center",
};
const faqLinkWrapperStyle: React.CSSProperties = {
  marginTop: "2rem",
  textAlign: "center",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "1.5rem",
};
const faqLinkStyle: React.CSSProperties = {
  color: "#f59e0b",
  fontWeight: "500",
  fontSize: "0.9rem",
  textDecoration: "none",
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