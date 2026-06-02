/**
 * KEYpages — script.js
 * Performance-first: requestAnimationFrame, IntersectionObserver, GPU layers
 */

'use strict';

/* ═══════════════════════════════════
   CURSOR PERSONALIZADO (60 FPS)
═══════════════════════════════════ */
(function initCursor() {
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');

  if (!cursor || !follower) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  let rafId = null;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animateCursor() {
    cursor.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;

    followerX += (mouseX - followerX) * 0.18;
    followerY += (mouseY - followerY) * 0.18;
    follower.style.transform = `translate(${followerX - 14}px, ${followerY - 14}px)`;

    rafId = requestAnimationFrame(animateCursor);
  }

  animateCursor();

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity   = '0';
    follower.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity   = '1';
    follower.style.opacity = '0.5';
  });
})();


/* ═══════════════════════════════════
   NAVEGACIÓN — scroll effect + toggle
═══════════════════════════════════ */
(function initNav() {
  const nav       = document.getElementById('nav');
  const toggle    = document.getElementById('navToggle');
  const menu      = document.getElementById('navMenu');
  const navLinks  = document.querySelectorAll('.nav__link, .nav__cta');

  if (!nav || !toggle || !menu) return;

  let ticking = false;

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();


/* ═══════════════════════════════════
   INTERSECTION OBSERVER — reveal
═══════════════════════════════════ */
(function initReveal() {
  const elements = document.querySelectorAll('[data-reveal]');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(
            entry.target.parentElement?.querySelectorAll('[data-reveal]') || []
          );
          const index = siblings.indexOf(entry.target);
          const delay = Math.min(index * 80, 320);

          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════
   SMOOTH SCROLL — anclas
═══════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = document.getElementById('nav')?.offsetHeight || 64;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ═══════════════════════════════════
   TERMINAL — efecto de typing re-loop
═══════════════════════════════════ */
(function initTerminalLoop() {
  const terminal = document.getElementById('terminalBody');
  if (!terminal) return;

  const lines = [
    { text: '$ git init tu-negocio', type: 'cmd' },
    { text: 'Initialized empty Git repository', type: 'out' },
    { text: '$ git remote add origin github.com/tu-negocio', type: 'cmd' },
    { text: '$ git push -u origin main', type: 'cmd' },
    { text: "Branch 'main' set up to track remote", type: 'out' },
    { text: '✓ Tu sitio está en línea: tu-negocio.github.io', type: 'success' },
    { text: '✓ Código 100% tuyo · Propiedad absoluta', type: 'success' },
    { text: '✓ Sin intermediarios ocultos', type: 'success' },
  ];

  function typeChar(el, text, speed = 32) {
    return new Promise(resolve => {
      let i = 0;
      const interval = setInterval(() => {
        el.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  async function runTerminal() {
    await delay(4500);

    while (true) {
      await delay(3000);
      terminal.innerHTML = '';

      for (const line of lines) {
        const p = document.createElement('p');
        p.className = `terminal__line${
          line.type === 'out' ? ' terminal__line--out' :
          line.type === 'success' ? ' terminal__line--success' : ''
        }`;

        if (line.type === 'cmd') {
          const prompt = document.createElement('span');
          prompt.className = 'terminal__prompt';
          prompt.textContent = '$ ';
          p.appendChild(prompt);
        }

        const textNode = document.createTextNode('');
        p.appendChild(textNode);
        terminal.appendChild(p);

        if (line.type === 'cmd') {
          const content = line.text.replace('$ ', '');
          await typeChar(textNode, content, 30);
          await delay(200);
        } else {
          textNode.textContent = line.text;
          p.style.animation = 'terminalLine 0.2s ease forwards';
          await delay(150);
        }
      }

      const cursor = document.createElement('p');
      cursor.className = 'terminal__line';
      cursor.innerHTML = '<span class="terminal__prompt">$</span> <span class="terminal__cursor">▋</span>';
      terminal.appendChild(cursor);

      await delay(5000);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    runTerminal();
  }
})();


/* ═══════════════════════════════════
   ACTIVE NAV LINK — scroll spy
═══════════════════════════════════ */
(function initScrollSpy() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === `#${id}`;
            link.style.color = isActive ? 'var(--c-text)' : '';
          });
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: '-64px 0px 0px 0px',
    }
  );

  sections.forEach(section => observer.observe(section));
})();


/* ═══════════════════════════════════
   PERFORMANCE — GPU hints
═══════════════════════════════════ */
(function applyGPUHints() {
  const animated = document.querySelectorAll(
    '.terminal, .servicio-card, .membresia__card, .manifiesto__pillar'
  );

  animated.forEach(el => {
    el.style.willChange = 'transform';
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      animated.forEach(el => { el.style.willChange = 'auto'; });
    } else {
      animated.forEach(el => { el.style.willChange = 'transform'; });
    }
  });
})();