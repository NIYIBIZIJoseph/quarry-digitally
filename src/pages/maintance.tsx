import Head from 'next/head';
import { useLanguage } from '@/contexts/LanguageContext';
import PublicHeader from '@/components/PublicHeader';

export default function MaintenancePage() {
  const { locale } = useLanguage();
  const t = (key: string) => {
    const translations: any = {
      en: { title: 'System Under Maintenance', desc: 'We are currently updating the system. Please check back later.', adminNote: 'Only administrators can access the dashboard during this time.' },
      rw: { title: 'Sisitemu Iri mu Kazi', desc: 'Turimo dutezimbere sisitemu. Nyamuneka garura nyuma.', adminNote: 'Abayobozi gusa barashobora kwinjira muri dashboard mugihe kiriho.' },
      zh: { title: '系统维护中', desc: '我们正在更新系统，请稍后再来。', adminNote: '维护期间只有管理员可以访问仪表板。' }
    };
    return translations[locale]?.[key] || translations.en[key];
  };

  return (
    <>
      <Head>
        <title>{t('title')} - HENG YUN</title>
      </Head>
      <PublicHeader />
      <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
        <svg width="160" height="60" viewBox="0 0 160 60" fill="none" style={{ marginBottom: '2rem' }}>
          <path d="M8 36 L25 14 L38 27 L52 9 L70 31 L84 18 L102 36" stroke="#f59e0b" strokeWidth="3" fill="none"/>
          <path d="M102 36 L115 22 L128 34 L142 18 L155 36" stroke="#f59e0b" strokeWidth="3" fill="none"/>
          <text x="24" y="20" fontFamily="serif" fontSize="18" fill="#f59e0b" fontWeight="bold">恒</text>
          <text x="52" y="25" fontFamily="Arial, sans-serif" fontSize="14" fill="currentColor" fontWeight="bold">HENG YUN</text>
        </svg>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧 {t('title')}</h1>
        <p style={{ fontSize: '1.2rem', color: '#4b5563', marginBottom: '1rem' }}>{t('desc')}</p>
        <small style={{ color: '#6b7280' }}>{t('adminNote')}</small>
      </div>
    </>
  );
}