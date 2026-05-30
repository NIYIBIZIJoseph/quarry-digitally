// DashboardHeader.tsx - no changes needed, it's fine
import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface UserInfo {
  name: string;
  branch: string;
}

export default function DashboardHeader() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserInfo>({ name: '', branch: '' });
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.fullName || parsed.full_name || '',
          branch: t('kigaliBranch') || 'Kigali Branch',
        });
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setUser(prev => ({
            name: data.fullName || data.full_name || data.name || prev.name,
            branch: data.branch || prev.branch,
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setDataLoaded(true);
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateDateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      let greetingText = '';
      if (hour < 12) greetingText = 'goodMorning';
      else if (hour < 18) greetingText = 'goodAfternoon';
      else greetingText = 'goodEvening';
      setGreeting(greetingText);
      setFormattedDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString());
    };
    
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000);
    
    return () => clearInterval(timer);
  }, [mounted]);

  const displayName = user.name || t('user') || 'User';
  const displayBranch = user.branch || t('kigaliBranch') || 'Kigali Branch';

  const getGreetingText = () => {
    switch (greeting) {
      case 'goodMorning': return t('goodMorning');
      case 'goodAfternoon': return t('goodAfternoon');
      case 'goodEvening': return t('goodEvening');
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
          {getGreetingText()}, {displayName}
        </h1>
        <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>
          {displayBranch}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1rem', fontWeight: '500' }}>{formattedDate}</div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{currentTime}</div>
      </div>
    </div>
  );
}