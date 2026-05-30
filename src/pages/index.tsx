"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchPlus } from "@fortawesome/free-solid-svg-icons";

// ========== CSS STYLES FOR HOVER EFFECTS ==========
const globalStyles = `
  /* Image hover container */
  .image-hover-container {
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .image-hover-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .image-hover-container:hover img {
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
  
  .image-hover-container:hover .image-overlay {
    opacity: 1;
  }
  
  .zoom-icon {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    padding: 12px;
    color: white;
    font-size: 1.5rem;
    transition: transform 0.2s ease;
  }
  
  .image-hover-container:hover .zoom-icon {
    transform: scale(1.1);
  }
  
  /* Product card styles */
  .product-card-hover {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .product-card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  /* Facility card hover */
  .facility-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .facility-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  /* Gallery image hover */
  .gallery-image-container {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .gallery-image-container img {
    transition: transform 0.3s ease;
  }
  
  .gallery-image-container:hover img {
    transform: scale(1.05);
  }
  
  .gallery-overlay {
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
  
  .gallery-image-container:hover .gallery-overlay {
    opacity: 1;
  }
  
  /* Larger text styles */
  .section-title {
    font-size: 2.2rem !important;
    font-weight: 700 !important;
    margin-bottom: 1.5rem !important;
  }
  
  .section-subtitle {
    font-size: 1.1rem !important;
    line-height: 1.6 !important;
  }
  
  .card-title {
    font-size: 1.3rem !important;
    font-weight: 700 !important;
  }
  
  .card-description {
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
  }
  
  .service-text {
    font-size: 1rem !important;
  }
`;

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

// ========== COMPONENT ==========
export default function Home() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

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

  const openModal = (imageUrl: string, alt: string) => {
    setModalImage(imageUrl);
    setModalAlt(alt);
  };

  return (
    <div>
      <style>{globalStyles}</style>
      <PublicHeader />

      {/* Image Modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} alt={modalAlt} onClose={() => setModalImage(null)} />
      )}

      {/* ========== CAROUSEL (HERO SLIDER) ========== */}
      <div className="carousel-container" style={{ position: "relative", width: "100%", height: "550px", overflow: "hidden" }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transition: "opacity 0.6s ease-in-out",
              opacity: index === currentSlide ? 1 : 0,
              zIndex: index === currentSlide ? 2 : 1,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1 }} />
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "white",
              zIndex: 2,
              width: "80%",
              maxWidth: "800px",
            }}>
              {slide.heading && <h1 style={{ fontSize: "3rem", marginBottom: "1rem", fontWeight: "700" }}>{slide.heading}</h1>}
              {slide.paragraph && <p style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>{slide.paragraph}</p>}
              {slide.button === "contact" && (
                <Link href="/contact" style={{ backgroundColor: "transparent", color: "#f59e0b", border: "2px solid #f59e0b", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>{t.contactButton}</Link>
              )}
              {slide.button === "services" && (
                <Link href="#services-section" style={{ backgroundColor: "transparent", color: "#f59e0b", border: "2px solid #f59e0b", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>{t.servicesButton}</Link>
              )}
            </div>
          </div>
        ))}
        <button onClick={prevSlide} style={{ position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1rem", cursor: "pointer", zIndex: 10, borderRadius: "4px" }}>❮</button>
        <button onClick={nextSlide} style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "2rem", padding: "0.5rem 1rem", cursor: "pointer", zIndex: 10, borderRadius: "4px" }}>❯</button>
        <div style={{ position: "absolute", bottom: "15px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", zIndex: 10 }}>
          {slides.map((_, idx) => (
            <span key={idx} onClick={() => setCurrentSlide(idx)} style={{ width: "12px", height: "12px", borderRadius: "50%", cursor: "pointer", background: idx === currentSlide ? "#f59e0b" : "rgba(255,255,255,0.5)" }} />
          ))}
        </div>
      </div>

      {/* ABOUT SECTION */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "#f9fafb" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center" }}>
          <div style={{ flex: "1", minWidth: "250px" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "1rem", color: "#1f2937", borderLeft: "4px solid #f59e0b", paddingLeft: "1rem", fontWeight: "700" }}>{t.aboutTitle}</h2>
            <p style={{ fontSize: "1.05rem", lineHeight: "1.6", color: "#4b5563" }}>{t.aboutText}</p>
          </div>
          <div style={{ flex: "1", minWidth: "250px" }}>
            <video width="100%" controls style={{ borderRadius: "8px", display: "block", aspectRatio: "16/9", objectFit: "cover" }}>
              <source src="/video/video1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem", color: "#6b7280" }}>{t.watchVideo}</div>
          </div>
        </div>
      </section>

      {/* FACILITIES SECTION WITH HOVER EFFECT */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title" style={{ fontSize: "2.2rem", marginBottom: "2rem", fontWeight: "700" }}>{t.facilitiesTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {/* Card 1 */}
            <div className="facility-card" style={{ backgroundColor: "#f9fafb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <div className="image-hover-container" onClick={() => openModal("https://images.pexels.com/photos/162639/digger-machine-machinery-construction-162639.jpeg", "Meticulous Planning")} style={{ height: "220px" }}>
                <img src="https://images.pexels.com/photos/162639/digger-machine-machinery-construction-162639.jpeg" alt="Meticulous Planning" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="image-overlay">
                  <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                </div>
              </div>
              <h3 className="card-title" style={{ fontSize: "1.3rem", margin: "1rem 0 0.5rem", fontWeight: "700" }}>{t.meticulousPlanningTitle}</h3>
              <p className="card-description" style={{ fontSize: "0.95rem", color: "#6b7280", padding: "0 1rem 1.5rem" }}>{t.meticulousPlanningDesc}</p>
            </div>
            {/* Card 2 */}
            <div className="facility-card" style={{ backgroundColor: "#f9fafb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <div className="image-hover-container" onClick={() => openModal("https://images.pexels.com/photos/31925745/pexels-photo-31925745.jpeg", "Perfect Execution")} style={{ height: "220px" }}>
                <img src="https://images.pexels.com/photos/31925745/pexels-photo-31925745.jpeg" alt="Perfect Execution" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="image-overlay">
                  <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                </div>
              </div>
              <h3 className="card-title" style={{ fontSize: "1.3rem", margin: "1rem 0 0.5rem", fontWeight: "700" }}>{t.perfectExecutionTitle}</h3>
              <p className="card-description" style={{ fontSize: "0.95rem", color: "#6b7280", padding: "0 1rem 1.5rem" }}>{t.perfectExecutionDesc}</p>
            </div>
            {/* Card 3 */}
            <div className="facility-card" style={{ backgroundColor: "#f9fafb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <div className="image-hover-container" onClick={() => openModal("https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg", "Completion On Time")} style={{ height: "220px" }}>
                <img src="https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg" alt="Completion On Time" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="image-overlay">
                  <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                </div>
              </div>
              <h3 className="card-title" style={{ fontSize: "1.3rem", margin: "1rem 0 0.5rem", fontWeight: "700" }}>{t.completionOnTimeTitle}</h3>
              <p className="card-description" style={{ fontSize: "0.95rem", color: "#6b7280", padding: "0 1rem 1.5rem" }}>{t.completionOnTimeDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* OPERATION FACILITIES SECTION WITH HOVER EFFECT */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "#f9fafb" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title" style={{ fontSize: "2.2rem", marginBottom: "2rem", fontWeight: "700" }}>{t.operationFacilitiesTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {["/operations/facility1.jpg", "/operations/facility2.jpg", "/operations/facility3.jpg", "/operations/facility4.jpg", "/operations/facility5.jpg", "/operations/facility6.jpg"].map((img, idx) => (
              <div key={idx} className="gallery-image-container" onClick={() => openModal(img, `Facility ${idx + 1}`)}>
                <img src={img} alt={`Facility ${idx + 1}`} style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "8px" }} />
                <div className="gallery-overlay">
                  <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION WITH HOVER EFFECT */}
      <section style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 className="section-title" style={{ fontSize: "2.2rem", marginBottom: "1rem", fontWeight: "700" }}>{t.productsTitle}</h2>
          <p className="section-subtitle" style={{ fontSize: "1.05rem", maxWidth: "700px", margin: "0 auto 2rem auto", color: "#6b7280" }}>{t.productsDesc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
            {[
              { img: "/products/product1.jpg", title: t.aggregatesTitle, desc: t.aggregatesDesc },
              { img: "/products/product2.jpg", title: t.sandTitle, desc: t.sandDesc },
              { img: "/products/product3.jpg", title: t.otherSandTitle, desc: t.otherSandDesc },
              { img: "/products/product4.jpg", title: t.quarryDustTitle, desc: t.quarryDustDesc },
              { img: "/products/product5.jpg", title: t.ballastTitle, desc: t.ballastDesc },
              { img: "/products/product6.jpg", title: t.crusherRunTitle, desc: t.crusherRunDesc },
              { img: "/products/product7.jpg", title: t.roadBaseTitle, desc: t.roadBaseDesc },
              { img: "/products/product8.jpg", title: t.fillMaterialTitle, desc: t.fillMaterialDesc },
            ].map((product, idx) => (
              <div key={idx} className="product-card-hover" style={{ backgroundColor: "#f9fafb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <div className="image-hover-container" onClick={() => openModal(product.img, product.title)} style={{ height: "220px" }}>
                  <img src={product.img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="image-overlay">
                    <div className="zoom-icon"><FontAwesomeIcon icon={faSearchPlus} /></div>
                  </div>
                </div>
                <h3 className="card-title" style={{ fontSize: "1.25rem", margin: "1rem 0 0.5rem", fontWeight: "700" }}>{product.title}</h3>
                <p className="card-description" style={{ fontSize: "0.9rem", color: "#6b7280", padding: "0 1rem 1rem" }}>{product.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/products" style={{ backgroundColor: "#f59e0b", color: "#1f2937", padding: "0.75rem 2rem", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>{t.seeAllProducts}</Link>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services-section" style={{ padding: "4rem 2rem", backgroundColor: "#4d5a67" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" }}>
          <div>
            <h3 style={{ fontSize: "1.6rem", marginBottom: "1rem", color: "#1f2937", borderLeft: "4px solid #f59e0b", paddingLeft: "0.75rem", fontWeight: "700" }}>{t.servicesTitle}</h3>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {(t.servicesList || []).map((service, idx) => (
                <li key={idx} className="service-text" style={{ marginBottom: "0.5rem", fontSize: "1rem", color: "#f9fafd" }}>{service}</li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <svg width="120" height="34" viewBox="0 0 160 45" fill="none">
                <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="20" fontFamily="serif" fontSize="16" fill="#f59e0b" fontWeight="bold">恒</text>
                <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">HENG YUN</text>
              </svg>
            </div>
            <h4 style={{ fontSize: "1.3rem", marginBottom: "0.75rem", color: "#f6f7f9", fontWeight: "600" }}>{t.environmentalTitle}</h4>
            <p style={{ fontSize: "1rem", lineHeight: "1.5", color: "#f7f8f9" }}>{t.environmentalText}</p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.6rem", marginBottom: "1rem", color: "#1f2937", borderLeft: "4px solid #f59e0b", paddingLeft: "0.75rem", fontWeight: "700" }}>{t.contactUsHeading}</h3>
            <address style={{ fontStyle: "normal", color: "#fbfcfe", fontSize: "1rem", lineHeight: "1.6" }}>
              <div>{(t.address || "").split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</div>
              <p><strong>{t.phoneLabel}:</strong> {t.phone}</p>
              <p><strong>{t.emailLabel}:</strong> {t.email}</p>
            </address>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#1f2937", color: "#9ca3af", textAlign: "center", padding: "2rem", borderTop: "1px solid #374151" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.9rem" }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}