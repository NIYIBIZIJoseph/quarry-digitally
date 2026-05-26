"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

export default function ProductDetail() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const { id } = router.query;

  // Static product data (from your original file)
  const productImageMap: Record<string, string> = {
    sand: "/products/product2.jpg",
    "fine-sand": "/products/product3.jpg",
    aggregates: "/products/product1.jpg",
    "crusher-run": "/products/product6.jpg",
    "quarry-dust": "/products/product4.jpg",
    ballast: "/products/product5.jpg",
    "road-base": "/products/product7.jpg",
    "fill-material": "/products/product8.jpg",
  };

  const productDetails: Record<string, { titleKey: string; descKey: string; fullDescKey: string }> = {
    sand: { titleKey: "sandTitle", descKey: "sandDesc", fullDescKey: "sandFullDesc" },
    "fine-sand": { titleKey: "fineSandTitle", descKey: "fineSandDesc", fullDescKey: "fineSandFullDesc" },
    aggregates: { titleKey: "aggregatesTitle", descKey: "aggregatesDesc", fullDescKey: "aggregatesFullDesc" },
    "crusher-run": { titleKey: "crusherRunTitle", descKey: "crusherRunDesc", fullDescKey: "crusherRunFullDesc" },
    "quarry-dust": { titleKey: "quarryDustTitle", descKey: "quarryDustDesc", fullDescKey: "quarryDustFullDesc" },
    ballast: { titleKey: "ballastTitle", descKey: "ballastDesc", fullDescKey: "ballastFullDesc" },
    "road-base": { titleKey: "roadBaseTitle", descKey: "roadBaseDesc", fullDescKey: "roadBaseFullDesc" },
    "fill-material": { titleKey: "fillMaterialTitle", descKey: "fillMaterialDesc", fullDescKey: "fillMaterialFullDesc" },
  };

  const product = productDetails[id as string];
  const productImage = productImageMap[id as string];

  if (!product && router.isReady) {
    return (
      <div>
        <PublicHeader />
        <div style={{ padding: "4rem", textAlign: "center" }}>Product not found</div>
      </div>
    );
  }
  if (!product) return null;

  const title = t[product.titleKey as keyof typeof t] as string;
  const desc = t[product.descKey as keyof typeof t] as string;
  const fullDesc = t[product.fullDescKey as keyof typeof t] as string;

  return (
    <div>
      <PublicHeader />

      {/* ========== PRODUCT DETAIL ========== */}
      <section style={detailSectionStyle}>
        <div style={containerStyle}>
          <Link href="/products" style={backButtonStyle}>← {t.backToProducts}</Link>
          <div style={detailCardStyle}>
            <img
              src={productImage}
              alt={title}
              style={detailImageStyle}
              onError={(e) => {
                e.currentTarget.src = "/products/placeholder.jpg";
                e.currentTarget.onerror = null;
              }}
            />
            <h1 style={detailTitleStyle}>{title}</h1>
            <p style={detailDescStyle}>{desc}</p>
            <div style={detailFullDescStyle}>
              {fullDesc.split("\n").map((para: string, idx: number) => (
                <p key={idx} style={{ marginBottom: "0.75rem" }}>{para}</p>
              ))}
            </div>
            <Link href="/contact" style={ctaButtonStyle}>{t.requestQuote}</Link>
          </div>
        </div>
      </section>

      {/* ========== THREE COLUMN FOOTER ========== */}
      <section style={threeColumnSectionStyle}>
        <div style={threeColumnContainerStyle}>
          <div style={servicesColumnStyle}>
            <h3 style={columnHeadingStyle}>{t.servicesTitle}</h3>
            <ul style={servicesListSingleStyle}>
              {(t.servicesList || []).map((service: string, idx: number) => (
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
              <div>{(t.address || "").split('\n').map((line: string, i: number) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> {t.phone}</p>
              <p><strong>{t.emailLabel}:</strong> {t.email}</p>
            </address>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={footerStyle}>
        <div style={footerContainerStyle}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}

// ========== STYLE CONSTANTS (same as original detail styles) ==========
const detailSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
  minHeight: "60vh",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};
const backButtonStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "2rem",
  color: "#f59e0b",
  textDecoration: "none",
  fontWeight: "500",
};
const detailCardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};
const detailImageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  borderRadius: "8px",
  marginBottom: "1.5rem",
  objectFit: "cover",
};
const detailTitleStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "1rem",
  color: "#1f2937",
};
const detailDescStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#4b5563",
  marginBottom: "1rem",
};
const detailFullDescStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#6b7280",
  lineHeight: "1.6",
  marginBottom: "1.5rem",
  maxWidth: "800px",
  textAlign: "left",
};
const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: "#f59e0b",
  color: "#1f2937",
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
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