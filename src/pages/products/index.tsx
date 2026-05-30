"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

// Product Item Component with hover state
function ProductItem({ product, onImageClick, viewDetailsText }: { product: any; onImageClick: (url: string, name: string) => void; viewDetailsText: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #e5e7eb",
        alignItems: "center",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          borderRadius: "8px",
          width: "120px",
          height: "120px",
          flexShrink: 0,
        }}
        onClick={() => onImageClick(product.img, product.title)}
      >
        <img
          src={product.img}
          alt={product.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
          onError={(e) => { e.currentTarget.src = "/products/placeholder.jpg"; }}
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
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#1f2937", fontWeight: "600" }}>{product.title}</h3>
        <p style={{ fontSize: "1rem", color: "#4b5563", marginBottom: "0.75rem", lineHeight: "1.5" }}>{product.desc}</p>
        <Link href={`/products/${product.id}`} style={viewDetailsButtonStyle}>{viewDetailsText}</Link>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.substring(1);
      setActiveHash(hash);
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  const sandProducts = [
    { id: "sand", title: t.sandTitle, desc: t.sandDesc, img: "/products/product2.jpg" },
    { id: "fine-sand", title: t.fineSandTitle, desc: t.fineSandDesc, img: "/products/product3.jpg" },
  ];

  const quarryProducts = [
    { id: "aggregates", title: t.aggregatesTitle, desc: t.aggregatesDesc, img: "/products/product1.jpg" },
    { id: "crusher-run", title: t.crusherRunTitle, desc: t.crusherRunDesc, img: "/products/product6.jpg" },
    { id: "quarry-dust", title: t.quarryDustTitle, desc: t.quarryDustDesc, img: "/products/product4.jpg" },
    { id: "ballast", title: t.ballastTitle, desc: t.ballastDesc, img: "/products/product5.jpg" },
    { id: "road-base", title: t.roadBaseTitle, desc: t.roadBaseDesc, img: "/products/product7.jpg" },
    { id: "fill-material", title: t.fillMaterialTitle, desc: t.fillMaterialDesc, img: "/products/product8.jpg" },
  ];

  return (
    <div>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

      {/* Hero Section */}
      <div style={heroSectionStyle}>
        <div style={heroOverlayStyle}>
          <h1 style={heroHeadingStyle}>{t.productsTitle}</h1>
          <p style={heroSubStyle}>{t.productsDesc}</p>
        </div>
      </div>

      {/* Three Points Section */}
      <section style={threePointsSectionStyle}>
        <div style={containerStyle}>
          <div style={threePointsGridStyle}>
            <div style={pointCardStyle}><h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{t.goodPriceTitle}</h3><p style={{ fontSize: "0.95rem" }}>{t.goodPriceDesc}</p></div>
            <div style={pointCardStyle}><h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{t.bestQualityTitle}</h3><p style={{ fontSize: "0.95rem" }}>{t.bestQualityDesc}</p></div>
            <div style={pointCardStyle}><h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{t.efficientTitle}</h3><p style={{ fontSize: "0.95rem" }}>{t.efficientDesc}</p></div>
          </div>
        </div>
      </section>

      {/* Sand Products */}
      <section id="sand" style={sectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>{t.sandProductsTitle}</h2>
          <div style={productListStyle}>
            {sandProducts.map((product) => (
              <ProductItem key={product.id} product={product} onImageClick={openModal} viewDetailsText={t.viewDetails} />
            ))}
          </div>
          <div style={requestButtonWrapper}>
            <Link href="/market/sand" style={requestButtonStyle}>{t.requestSandQuote}</Link>
          </div>
        </div>
      </section>

      {/* Quarry Products */}
      <section id="quarry" style={sectionStyleAlt}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>{t.quarryProductsTitle}</h2>
          <div style={productListStyle}>
            {quarryProducts.map((product) => (
              <ProductItem key={product.id} product={product} onImageClick={openModal} viewDetailsText={t.viewDetails} />
            ))}
          </div>
          <div style={requestButtonWrapper}>
            <Link href="/market/quarry" style={requestButtonStyle}>{t.requestQuarryQuote}</Link>
          </div>
        </div>
      </section>

      {/* Three Column Footer */}
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

      {/* Footer */}
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
  height: "400px",
  backgroundImage: "url('/products/product2.jpg')",
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
const threePointsSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const threePointsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
};
const pointCardStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "1.5rem",
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};
const sectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const sectionStyleAlt: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "2rem",
  color: "#1f2937",
  textAlign: "center",
  fontWeight: "700",
};
const productListStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto",
};
const viewDetailsButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "transparent",
  color: "#f59e0b",
  border: "2px solid #f59e0b",
  padding: "0.5rem 1.2rem",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500",
  fontSize: "0.9rem",
  transition: "all 0.2s",
};
const requestButtonWrapper: React.CSSProperties = {
  textAlign: "center",
  marginTop: "2rem",
};
const requestButtonStyle: React.CSSProperties = {
  backgroundColor: "#f59e0b",
  color: "#1f2937",
  padding: "0.75rem 2rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  fontSize: "1rem",
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