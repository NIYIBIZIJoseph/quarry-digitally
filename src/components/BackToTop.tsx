'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Find the scrollable container (the <main> element with class "main-content" or "main")
    const scrollContainer = document.querySelector('.main-content, .main') || window;
    const handleScroll = () => {
      const scrollTop = scrollContainer === window
        ? window.scrollY
        : (scrollContainer as HTMLElement).scrollTop;
      setVisible(scrollTop > 300);
    };
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('.main-content, .main');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }}
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
}