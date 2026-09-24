/* ==========================================================================
   AltoFox Shared Client Script (templates/base.js)
   Vanilla JS only - Zero frameworks
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu (Drawer, Lock Scroll, Escape & Outside Click)
  const navToggle = document.getElementById('nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const siteHeader = document.getElementById('site-header');

  if (navToggle && mobileDrawer) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !mobileDrawer.classList.contains('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      mobileDrawer.classList.toggle('open', isOpen);
      if (siteHeader) siteHeader.classList.toggle('menu-open', isOpen);
      document.body.classList.toggle('menu-locked', isOpen);
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close when clicking any nav link
    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });

    // Close when clicking outside drawer
    document.addEventListener('click', (e) => {
      if (
        mobileDrawer.classList.contains('open') &&
        !mobileDrawer.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }

  // 2. Sticky Header Elevation on Scroll
  if (siteHeader) {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 20) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 3. FAQ Accordion (Accessible with aria-expanded)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close siblings
        faqItems.forEach((sibling) => {
          sibling.classList.remove('active');
          const siblingBtn = sibling.querySelector('.faq-question');
          if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // 4. Gallery Lightbox
  const galleryItems = document.querySelectorAll('.gallery-item');
  let lightboxModal = document.getElementById('lightbox-modal');

  // Create lightbox modal dynamically if not present in DOM
  if (!lightboxModal && galleryItems.length > 0) {
    lightboxModal = document.createElement('div');
    lightboxModal.id = 'lightbox-modal';
    lightboxModal.className = 'lightbox-modal';
    lightboxModal.innerHTML = `
      <button class="lightbox-close" aria-label="Close Lightbox">&times;</button>
      <img class="lightbox-img" src="" alt="Enlarged view">
    `;
    document.body.appendChild(lightboxModal);
  }

  if (lightboxModal) {
    const lightboxImg = lightboxModal.querySelector('.lightbox-img');
    const lightboxClose = lightboxModal.querySelector('.lightbox-close');

    const openLightbox = (src, alt) => {
      if (lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || 'Enlarged photo';
      }
      lightboxModal.classList.add('active');
      document.body.classList.add('menu-locked');
    };

    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      document.body.classList.remove('menu-locked');
    };

    galleryItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const img = item.querySelector('img');
        if (img) {
          openLightbox(img.src, img.alt);
        }
      });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // 5. Testimonial Slider
  const sliders = document.querySelectorAll('.testimonial-slider');
  sliders.forEach((slider) => {
    const track = slider.querySelector('.testimonial-track');
    const slides = slider.querySelectorAll('.testimonial-slide');
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');
    let currentIndex = 0;

    if (!track || slides.length <= 1) return;

    const updateSlider = () => {
      slides.forEach((s, idx) => {
        s.style.display = idx === currentIndex ? 'block' : 'none';
      });
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
      });
    }

    // Touch swipe support
    let startX = 0;
    slider.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].screenX;
      if (startX - endX > 50) {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
      } else if (endX - startX > 50) {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
      }
    }, { passive: true });

    updateSlider();
  });

  // 6. Scroll Reveal with IntersectionObserver
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach((el) => {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }

  // 7. Inject Current Year in Footer
  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // 8. Contact Form UX Feedback
  const contactForms = document.querySelectorAll('form[data-ajax-form]');
  contactForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
      if (submitBtn) {
        submitBtn.innerHTML = 'Sending...';
        submitBtn.disabled = true;
      }
      setTimeout(() => {
        alert('Thank you! Your request has been received. Our team will contact you shortly.');
        form.reset();
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }, 700);
    });
  });
});
