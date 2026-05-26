"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/data/translations";
import PublicHeader from "@/components/PublicHeader";

export default function MarketCategory() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations];
  const router = useRouter();
  const { id } = router.query;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    productName: "",
    quantity: "",
    bargaining: "",
    location: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const isValidCategory = id === "sand" || id === "quarry";

  useEffect(() => {
    if (!router.isReady || !isValidCategory) return;
    fetch("/api/public/products")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((p: any) => p.category_name?.toLowerCase() === id);
        setProducts(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [router.isReady, id]);

  const handleOrderClick = (product: any) => {
    setActiveProduct(product);
    setFormData({
      name: "",
      phone: "",
      productName: product.name,
      quantity: "",
      bargaining: "",
      location: "",
      note: "",
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch("/api/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: activeProduct.id,
        client_name: formData.name,
        client_phone: formData.phone,
        quantity: parseInt(formData.quantity),
        delivery_location: formData.location,
        note: formData.note,
      }),
    });
    if (res.ok) {
      setSubmitted(true);
      setActiveProduct(null);
      setFormData({
        name: "",
        phone: "",
        productName: "",
        quantity: "",
        bargaining: "",
        location: "",
        note: "",
      });
      setTimeout(() => setSubmitted(false), 3000);
    } else {
      alert("Order submission failed. Please try again.");
    }
  };

  if (!router.isReady || !isValidCategory) {
    return (
      <div>
        <PublicHeader />
        <div style={{ padding: "4rem", textAlign: "center" }}>Page not found</div>
      </div>
    );
  }

  if (loading) return (
    <div>
      <PublicHeader />
      <div style={{ textAlign: "center", padding: "4rem" }}>Loading products...</div>
    </div>
  );

  return (
    <div>
      <PublicHeader />

      <div style={heroSectionStyle}>
        <div style={heroOverlayStyle}>
          <h1 style={heroHeadingStyle}>{t.marketHeroTitle}</h1>
          <p style={heroSubStyle}>{t.marketHeroDesc}</p>
        </div>
      </div>

      <section style={threePointsSectionStyle}>
        <div style={containerStyle}>
          <div style={threePointsGridStyle}>
            <div style={pointCardStyle}><h3>{t.goodPriceTitle}</h3><p>{t.goodPriceDesc}</p></div>
            <div style={pointCardStyle}><h3>{t.bestServicesTitle}</h3><p>{t.bestServicesDesc}</p></div>
            <div style={pointCardStyle}><h3>{t.quickDeliveryTitle}</h3><p>{t.quickDeliveryDesc}</p></div>
          </div>
        </div>
      </section>

      <section style={productsSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>{id === "sand" ? t.sandProductsTitle : t.quarryProductsTitle}</h2>
          {products.length === 0 ? (
            <p style={{ textAlign: "center" }}>No products in this category yet.</p>
          ) : (
            <div style={productsGridStyle}>
              {products.map((product) => (
                <div key={product.id} style={productCardMarketStyle}>
                  <img src={product.image_url || "/products/placeholder.jpg"} alt={product.name} style={productImageMarketStyle} />
                  <div style={productInfoStyle}>
                    <h3 style={productTitleStyle}>{product.name}</h3>
                    <p><strong>{t.categoryLabel}:</strong> {product.category_name}</p>
                    <p><strong>Price:</strong> {product.price?.toLocaleString()} RWF / m³</p>
                    <button onClick={() => handleOrderClick(product)} style={orderButtonStyle}>{t.orderNow}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Fixed Modal - Now appears on top */}
      {activeProduct && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
          onClick={() => setActiveProduct(null)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 30px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveProduct(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "1.8rem",
                cursor: "pointer",
                color: "#6b7280",
                zIndex: 100000,
              }}
            >
              ×
            </button>
            
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", paddingRight: "1.5rem" }}>
              {t.orderFormTitle}
            </h3>
            
            {submitted && (
              <div style={{ backgroundColor: "#10b981", color: "white", padding: "0.5rem", borderRadius: "6px", textAlign: "center", marginBottom: "1rem" }}>
                ✓ {t.requestSubmitted}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input 
                type="text" 
                name="name" 
                placeholder={t.fullName} 
                value={formData.name} 
                onChange={handleFormChange} 
                required 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
              />
              <input 
                type="tel" 
                name="phone" 
                placeholder={t.phoneLabel} 
                value={formData.phone} 
                onChange={handleFormChange} 
                required 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
              />
              <input 
                type="text" 
                name="productName" 
                value={formData.productName} 
                readOnly 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", backgroundColor: "#f3f4f6" }} 
              />
              <input 
                type="text" 
                name="quantity" 
                placeholder={t.quantity} 
                value={formData.quantity} 
                onChange={handleFormChange} 
                required 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
              />
              <input 
                type="text" 
                name="bargaining" 
                placeholder={t.bargaining} 
                value={formData.bargaining} 
                onChange={handleFormChange} 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
              />
              <input 
                type="text" 
                name="location" 
                placeholder={t.location} 
                value={formData.location} 
                onChange={handleFormChange} 
                required 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
              />
              <textarea 
                name="note" 
                placeholder={t.note} 
                value={formData.note} 
                onChange={handleFormChange} 
                rows={3} 
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", fontFamily: "inherit" }} 
              />
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setActiveProduct(null)} 
                  style={{ backgroundColor: "#e5e7eb", color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer" }}
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: "#f59e0b", color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" }}
                >
                  {t.submitRequest}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

// Styles remain the same as your original
const headerStyle: React.CSSProperties = { backgroundColor: "#3c516a", color: "white", padding: "0rem 2rem", borderBottom: "1px solid #374151", position: "sticky", top: 0, zIndex: 1000 };
const topBarStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" };
const logoAreaStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start" };
const logoContainerStyle: React.CSSProperties = { display: "flex", alignItems: "center" };
const taglineStyle: React.CSSProperties = { fontSize: "0.7rem", letterSpacing: "1px", color: "#faa106", fontWeight: "500", marginTop: "2px" };
const langGroupStyle: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const langButtonStyle: React.CSSProperties = { backgroundColor: "#374151", color: "white", border: "none", borderRadius: "4px", padding: "0.25rem 0.75rem", cursor: "pointer", fontSize: "0.9rem" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", alignItems: "center" };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600", padding: "0.5rem 0", borderBottom: "2px solid transparent", transition: "border-color 0.2s", cursor: "pointer", letterSpacing: "0.5px" };
const loginButtonStyle: React.CSSProperties = { backgroundColor: "#f59e0b", color: "#0b1c34", textDecoration: "none", fontSize: "0.9rem", fontWeight: "bold", padding: "0.5rem 1.2rem", borderRadius: "6px", transition: "background 0.2s", display: "inline-block", letterSpacing: "0.5px" };
const dropdownContainerStyle: React.CSSProperties = { position: "relative", display: "inline-block" };
const dropdownMenuStyle: React.CSSProperties = { position: "absolute", top: "100%", left: 0, backgroundColor: "white", minWidth: "120px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "6px", overflow: "hidden", zIndex: 10, marginTop: "0.5rem" };
const dropdownLinkStyle: React.CSSProperties = { display: "block", padding: "0.6rem 1rem", color: "#1f2937", textDecoration: "none", fontSize: "0.85rem", transition: "background 0.2s" };
const heroSectionStyle: React.CSSProperties = { height: "400px", backgroundImage: "url('/products/product2.jpg')", backgroundSize: "cover", backgroundPosition: "center", position: "relative" };
const heroOverlayStyle: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" };
const heroHeadingStyle: React.CSSProperties = { color: "white", fontSize: "3rem", fontWeight: "700", marginBottom: "1rem" };
const heroSubStyle: React.CSSProperties = { color: "white", fontSize: "1.2rem", maxWidth: "700px" };
const threePointsSectionStyle: React.CSSProperties = { padding: "4rem 2rem", backgroundColor: "#f9fafb" };
const threePointsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", maxWidth: "1200px", margin: "0 auto" };
const pointCardStyle: React.CSSProperties = { textAlign: "center", padding: "1.5rem", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" };
const containerStyle: React.CSSProperties = { maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" };
const productsSectionStyle: React.CSSProperties = { padding: "4rem 2rem", backgroundColor: "#f9fafb" };
const sectionTitleStyle: React.CSSProperties = { fontSize: "2rem", marginBottom: "2rem", color: "#1f2937", textAlign: "center", fontWeight: "700" };
const productsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", marginTop: "2rem" };
const productCardMarketStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" };
const productImageMarketStyle: React.CSSProperties = { width: "100%", height: "200px", objectFit: "cover" };
const productInfoStyle: React.CSSProperties = { padding: "1rem", textAlign: "left" };
const productTitleStyle: React.CSSProperties = { fontSize: "1.25rem", marginBottom: "0.5rem", color: "#1f2937", fontWeight: "600" };
const orderButtonStyle: React.CSSProperties = { backgroundColor: "#f59e0b", color: "#1f2937", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "0.5rem", width: "100%" };
const modalOverlayStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 };
const modalContentStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "500px", width: "90%", maxHeight: "85vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 30px rgba(0,0,0,0.3)" };
const modalTitleStyle: React.CSSProperties = { fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", paddingRight: "1.5rem" };
const formStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const inputStyle: React.CSSProperties = { padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" };
const textareaStyle: React.CSSProperties = { padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", fontFamily: "inherit" };
const modalButtonsStyle: React.CSSProperties = { display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" };
const submitButtonStyle: React.CSSProperties = { backgroundColor: "#f59e0b", color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" };
const cancelButtonStyle: React.CSSProperties = { backgroundColor: "#e5e7eb", color: "#1f2937", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer" };
const successMessageStyle: React.CSSProperties = { backgroundColor: "#10b981", color: "white", padding: "0.5rem", borderRadius: "6px", textAlign: "center", marginBottom: "1rem" };
const threeColumnSectionStyle: React.CSSProperties = { padding: "4rem 2rem", backgroundColor: "#4d5a67" };
const threeColumnContainerStyle: React.CSSProperties = { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "start" };
const servicesColumnStyle: React.CSSProperties = { textAlign: "left" };
const servicesListSingleStyle: React.CSSProperties = { listStyle: "none", paddingLeft: 0, margin: 0 };
const serviceItemStyle: React.CSSProperties = { marginBottom: "0.5rem", fontSize: "0.9rem", color: "#f9fafd" };
const columnHeadingStyle: React.CSSProperties = { fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", borderLeft: "4px solid #f59e0b", paddingLeft: "0.75rem" };
const environmentalColumnStyle: React.CSSProperties = { textAlign: "center" };
const logoWrapperStyle: React.CSSProperties = { marginBottom: "1rem", display: "flex", justifyContent: "center" };
const environmentalHeadingStyle: React.CSSProperties = { fontSize: "1.2rem", marginBottom: "0.75rem", color: "#f6f7f9", fontWeight: "600" };
const environmentalTextStyle: React.CSSProperties = { fontSize: "0.9rem", lineHeight: "1.5", color: "#f7f8f9" };
const contactColumnStyle: React.CSSProperties = { textAlign: "left", marginLeft: "40%" };
const contactAddressStyle: React.CSSProperties = { fontStyle: "normal", color: "#fbfcfe", fontSize: "0.9rem", lineHeight: "1.5" };
const contactDetailStyle: React.CSSProperties = { margin: "0.5rem 0" };
const footerStyle: React.CSSProperties = { backgroundColor: "#1f2937", color: "#9ca3af", textAlign: "center", padding: "2rem", borderTop: "1px solid #374151" };
const footerContainerStyle: React.CSSProperties = { maxWidth: "1200px", margin: "0 auto" };