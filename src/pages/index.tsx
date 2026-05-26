"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

// ========== ALL STYLE CONSTANTS MOVED TO THE TOP ==========
const carouselContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "550px",
  overflow: "hidden",
};
const slideStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  transition: "opacity 0.6s ease-in-out",
};
const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.55)",
  zIndex: 1,
};
const textContainerStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center",
  color: "white",
  zIndex: 2,
  width: "80%",
  maxWidth: "800px",
  opacity: 0,
  animation: "fadeInUp 0.6s ease-out 0.3s forwards",
};
const headingStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  marginBottom: "1rem",
  textTransform: "uppercase",
  letterSpacing: "2px",
  fontWeight: "700",
  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
};
const paragraphStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  marginBottom: "1.5rem",
  lineHeight: "1.5",
  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
};
const contactButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#f59e0b",
  border: "2px solid #f59e0b",
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  transition: "all 0.2s",
};
const servicesButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#f59e0b",
  border: "2px solid #f59e0b",
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  transition: "all 0.2s",
};
const arrowLeftStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "10px",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  border: "none",
  fontSize: "2rem",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  zIndex: 10,
  borderRadius: "4px",
};
const arrowRightStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "10px",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  border: "none",
  fontSize: "2rem",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  zIndex: 10,
  borderRadius: "4px",
};
const dotsContainerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "15px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "12px",
  zIndex: 10,
};
const dotStyle: React.CSSProperties = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  cursor: "pointer",
  transition: "background 0.2s",
};
const aboutSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const aboutContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "flex",
  flexWrap: "wrap",
  gap: "2rem",
  alignItems: "center",
};
const aboutTextStyle: React.CSSProperties = {
  flex: "1",
  minWidth: "250px",
};
const aboutHeadingStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "1rem",
  color: "#1f2937",
  borderLeft: "4px solid #f59e0b",
  paddingLeft: "1rem",
};
const aboutParagraphStyle: React.CSSProperties = {
  fontSize: "1rem",
  lineHeight: "1.6",
  color: "#4b5563",
};
const aboutMediaStyle: React.CSSProperties = {
  flex: "1",
  minWidth: "250px",
};
const facilitiesSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const facilitiesContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  textAlign: "center",
};
const facilitiesHeadingStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "2rem",
  color: "#1f2937",
  fontWeight: "700",
  letterSpacing: "1px",
};
const cardsContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "2rem",
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  transition: "transform 0.2s, box-shadow 0.2s",
};
const cardImageStyle: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  margin: "1rem 0 0.5rem",
  color: "#1f2937",
  fontWeight: "600",
};
const cardDescStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#6b7280",
  padding: "0 1rem 1.5rem",
  lineHeight: "1.5",
};
const operationSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "#f9fafb",
};
const operationContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  textAlign: "center",
};
const operationHeadingStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "2rem",
  color: "#1f2937",
  fontWeight: "700",
  letterSpacing: "1px",
};
const galleryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.5rem",
};
const galleryImageStyle: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  transition: "transform 0.2s",
};
const productsSectionStyle: React.CSSProperties = {
  padding: "4rem 2rem",
  backgroundColor: "white",
};
const productsContainerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  textAlign: "center",
};
const productsHeadingStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "1rem",
  color: "#1f2937",
  fontWeight: "700",
  letterSpacing: "1px",
};
const productsParagraphStyle: React.CSSProperties = {
  fontSize: "1rem",
  maxWidth: "700px",
  margin: "0 auto 2rem auto",
  color: "#6b7280",
  lineHeight: "1.6",
};
const productsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2rem",
  marginBottom: "2rem",
};
const productCardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  transition: "transform 0.2s",
};
const productImageStyle: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
};
const productTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  margin: "1rem 0 0.5rem",
  color: "#1f2937",
  fontWeight: "600",
};
const productDescStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#6b7280",
  padding: "0 1rem 1rem",
  lineHeight: "1.5",
};
const seeAllButtonStyle: React.CSSProperties = {
  backgroundColor: "#f59e0b",
  color: "#1f2937",
  padding: "0.75rem 2rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  transition: "background 0.2s",
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
const servicesColumnStyle: React.CSSProperties = {
  textAlign: "left",
};
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
const environmentalColumnStyle: React.CSSProperties = {
  textAlign: "center",
};
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
export default function Home() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/homeslide/slide1imageofcrusher.jpg",
      heading: t.slide1Heading,
      paragraph: t.slide1Paragraph,
      button: "contact",
    },
    {
      image: "/homeslide/slide2image.jpg",
      heading: t.slide2Heading,
      paragraph: t.slide2Paragraph,
      button: "services",
    },
    {
      image: "/homeslide/slide3image.jpg",
      heading: t.slide3Heading,
      paragraph: "",
      button: "none",
    },
  ];

  // Prevent automatic scroll to any hash on page load
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div>
      <PublicHeader />

      {/* ========== CAROUSEL (HERO SLIDER) ========== */}
      <div className="carousel-container" style={carouselContainerStyle}>
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              ...slideStyle,
              opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 2 : 1,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div style={overlayStyle} />
            <div style={textContainerStyle}>
              {slide.heading && <h1 style={headingStyle}>{slide.heading}</h1>}
              {slide.paragraph && <p style={paragraphStyle}>{slide.paragraph}</p>}
              {slide.button === "contact" && (
                <Link href="/contact" style={contactButtonStyle}>{t.contactButton}</Link>
              )}
              {slide.button === "services" && (
                <Link href="#services-section" style={servicesButtonStyle}>{t.servicesButton}</Link>
              )}
            </div>
          </div>
        ))}
        <button onClick={prevSlide} style={arrowLeftStyle}>❮</button>
        <button onClick={nextSlide} style={arrowRightStyle}>❯</button>
        <div style={dotsContainerStyle}>
          {slides.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                ...dotStyle,
                background: idx === currentSlide ? "#f59e0b" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Rest of your sections – unchanged */}
      <section className="about-section" style={aboutSectionStyle}>
        <div style={aboutContainerStyle}>
          <div style={aboutTextStyle}>
            <h2 style={aboutHeadingStyle}>{t.aboutTitle}</h2>
            <p style={aboutParagraphStyle}>{t.aboutText}</p>
          </div>
          <div style={{ ...aboutMediaStyle, position: "relative" }}>
            <video
              width="100%"
              controls
              style={{ borderRadius: "8px", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
            >
              <source src="/video/video1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                color: "#f9f9f8",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              HENG YUN
            </div>
            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
              {t.watchVideo}
            </div>
          </div>
        </div>
      </section>

      <section style={facilitiesSectionStyle}>
        <div style={facilitiesContainerStyle}>
          <h2 style={facilitiesHeadingStyle}>{t.facilitiesTitle}</h2>
          <div style={cardsContainerStyle}>
            <div style={cardStyle}>
              <img
                src="https://images.pexels.com/photos/162639/digger-machine-machinery-construction-162639.jpeg"
                alt="Meticulous Planning"
                style={cardImageStyle}
              />
              <h3 style={cardTitleStyle}>{t.meticulousPlanningTitle}</h3>
              <p style={cardDescStyle}>{t.meticulousPlanningDesc}</p>
            </div>
            <div style={cardStyle}>
              <img
                src="https://images.pexels.com/photos/31925745/pexels-photo-31925745.jpeg"
                alt="Perfect Execution"
                style={cardImageStyle}
              />
              <h3 style={cardTitleStyle}>{t.perfectExecutionTitle}</h3>
              <p style={cardDescStyle}>{t.perfectExecutionDesc}</p>
            </div>
            <div style={cardStyle}>
              <img
                src="https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop"
                alt="Completion On Time"
                style={cardImageStyle}
              />
              <h3 style={cardTitleStyle}>{t.completionOnTimeTitle}</h3>
              <p style={cardDescStyle}>{t.completionOnTimeDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={operationSectionStyle}>
        <div style={operationContainerStyle}>
          <h2 style={operationHeadingStyle}>{t.operationFacilitiesTitle}</h2>
          <div style={galleryGridStyle}>
            <img src="/operations/facility1.jpg" alt="Facility 1" style={galleryImageStyle} />
            <img src="/operations/facility2.jpg" alt="Facility 2" style={galleryImageStyle} />
            <img src="/operations/facility3.jpg" alt="Facility 3" style={galleryImageStyle} />
            <img src="/operations/facility4.jpg" alt="Facility 4" style={galleryImageStyle} />
            <img src="/operations/facility5.jpg" alt="Facility 5" style={galleryImageStyle} />
            <img src="/operations/facility6.jpg" alt="Facility 6" style={galleryImageStyle} />
          </div>
        </div>
      </section>

      <section style={productsSectionStyle}>
        <div style={productsContainerStyle}>
          <h2 style={productsHeadingStyle}>{t.productsTitle}</h2>
          <p style={productsParagraphStyle}>{t.productsDesc}</p>
          <div style={productsGridStyle}>
            <div style={productCardStyle}>
              <img src="/products/product1.jpg" alt={t.aggregatesTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.aggregatesTitle}</h3>
              <p style={productDescStyle}>{t.aggregatesDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product2.jpg" alt={t.sandTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.sandTitle}</h3>
              <p style={productDescStyle}>{t.sandDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product3.jpg" alt={t.otherSandTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.otherSandTitle}</h3>
              <p style={productDescStyle}>{t.otherSandDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product4.jpg" alt={t.quarryDustTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.quarryDustTitle}</h3>
              <p style={productDescStyle}>{t.quarryDustDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product5.jpg" alt={t.ballastTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.ballastTitle}</h3>
              <p style={productDescStyle}>{t.ballastDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product6.jpg" alt={t.crusherRunTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.crusherRunTitle}</h3>
              <p style={productDescStyle}>{t.crusherRunDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product7.jpg" alt={t.roadBaseTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.roadBaseTitle}</h3>
              <p style={productDescStyle}>{t.roadBaseDesc}</p>
            </div>
            <div style={productCardStyle}>
              <img src="/products/product8.jpg" alt={t.fillMaterialTitle} style={productImageStyle} />
              <h3 style={productTitleStyle}>{t.fillMaterialTitle}</h3>
              <p style={productDescStyle}>{t.fillMaterialDesc}</p>
            </div>
          </div>
          <Link href="/products" style={seeAllButtonStyle}>{t.seeAllProducts}</Link>
        </div>
      </section>

      <section id="services-section" style={threeColumnSectionStyle}>
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

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}