"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/public/faq")
      .then((res) => res.json())
      .then((data) => {
        setFaqs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
      <Head>
        <title>{t.faqTitle || "Frequently Asked Questions"} | HENG YUN</title>
        <meta name="description" content={t.faqDesc || "Find answers to common questions about our quarry and sand products."} />
      </Head>

      <PublicHeader />

      {/* Hero section – consistent with other pages */}
      <div style={heroSectionStyle}>
        <div style={heroOverlayStyle}>
          <h1 style={heroHeadingStyle}>{t.faqTitle || "Frequently Asked Questions"}</h1>
          <p style={heroSubStyle}>{t.faqDesc || "Find quick answers to common questions about our products and services."}</p>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <section style={faqSectionStyle}>
        <div style={containerStyle}>
          {loading ? (
            <p className="text-center">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center">No FAQs found.</p>
          ) : (
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={faq.id} style={faqItemStyle}>
                  <button
                    onClick={() => toggle(idx)}
                    style={faqQuestionStyle}
                  >
                    {faq.question}
                    <FontAwesomeIcon icon={openIndex === idx ? faChevronUp : faChevronDown} />
                  </button>
                  {openIndex === idx && (
                    <div style={faqAnswerStyle}>
                      {faq.answer.split("\n").map((line, i) => (
                        <p key={i} style={{ marginBottom: "0.5rem" }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={contactLinkWrapper}>
          <Link href="/contact" style={contactButtonStyle}>
  {t.faqContactText || "Still have questions? Contact us"}
</Link>
          </div>
        </div>
      </section>

      {/* Three Column Section (Services | Environmental | Contact) – same as all pages */}
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
    </>
  );
}

// ========== STYLE CONSTANTS (matching other pages) ==========
const heroSectionStyle: React.CSSProperties = {
  height: "400px",
  backgroundImage: "url('homeslide/faqimage.jpg')", // change to your image or use a default
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

const faqSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "0 1rem",
};
const faqItemStyle: React.CSSProperties = {
  marginBottom: "1rem",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};
const faqQuestionStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "1rem",
  backgroundColor: "#f9fafb",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "1rem",
};
const faqAnswerStyle: React.CSSProperties = {
  padding: "1rem",
  borderTop: "1px solid #e5e7eb",
  backgroundColor: "white",
};
const contactLinkWrapper: React.CSSProperties = {
  textAlign: "center",
  marginTop: "2rem",
};
const contactButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#f59e0b",
  color: "#1f2937",
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
};

// Three column and footer styles (identical to other pages)
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