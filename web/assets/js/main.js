/**
 * Bible Unlock — Web Core Logic & Theme Engine
 */

(function () {
  'use strict';

  // 1. Theme Management (Dual-Theme: Celestial Dark & Parchment Light)
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  function getPreferredTheme() {
    const saved = localStorage.getItem('bu_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '🌙';
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '☀️';
        themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
      }
    }
    localStorage.setItem('bu_theme', theme);
  }

  // Initial apply
  applyTheme(getPreferredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  }

  // 2. FAQ Accordion Interaction
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close others
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 3. Brand Video Preview Play/Pause
  const heroVideo = document.getElementById('hero-brand-video');
  if (heroVideo) {
    heroVideo.addEventListener('click', () => {
      if (heroVideo.paused) {
        heroVideo.play();
      } else {
        heroVideo.pause();
      }
    });
  }
})();
