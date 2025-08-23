/* ============================================
   BlackWood — sticky header + smooth reveals + robust video loop
   ============================================ */
'use strict';

/* ---------- Header: solid on scroll ---------- */
(function setupHeaderScroll(){
  const header = document.getElementById('topbar');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Mobile menu: close on link tap ---------- */
(function setupMobileMenuClose(){
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;
  document.querySelectorAll('.menu a').forEach(a =>
    a.addEventListener('click', () => { if (toggle.checked) toggle.checked = false; })
  );
})();

/* ---------- HERO video: force reliable autoplay + loop ---------- */
(function setupHeroVideo(){
  const v = document.getElementById('heroVideo');
  if (!v) return;

  // Ensure muted for autoplay policies
  v.muted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');

  // Try to play as early as possible
  const tryPlay = () => v.play().catch(()=>{ /* ignore gesture gate; will retry */ });

  v.addEventListener('loadedmetadata', tryPlay, { once:true });
  document.addEventListener('DOMContentLoaded', tryPlay, { once:true });

  // Double-ensure loop even if the 'loop' attr fails on some browsers
  v.addEventListener('ended', () => {
    try { v.currentTime = 0.01; } catch(e) {}
    tryPlay();
  });

  // When tab becomes visible again, resume
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });

  // If the video stalls due to network hiccup, attempt resume
  v.addEventListener('pause', () => {
    if (!document.hidden) tryPlay();
  });
})();

/* ---------- About section reveal ---------- */
(function setupAboutReveal(){
  const section = document.querySelector('#about');
  if (!section) return;

  const items = Array.from(section.querySelectorAll('.anim-item'));
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    items.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  section.querySelectorAll('.about-divider, .about-mark')
    .forEach(el => el.style.setProperty('filter', 'none', 'important'));

  items.forEach(el => {
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.willChange = 'transform, opacity';
  });

  const animations = new Map();
  const ENTER_RATIO = 0.18;
  const EXIT_RATIO  = 0.02;

  function makeAnimation(el){
    let keyframes, options;

    if (el.classList.contains('about-copy')) {
      keyframes = [
        { transform: 'translateX(26px)', opacity: 0, filter: 'blur(3px)' },
        { transform: 'translateX(0)',    opacity: 1, filter: 'blur(0)' }
      ];
      options = { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' };
    } else if (el.classList.contains('about-divider')) {
      el.style.transformOrigin = 'center top';
      keyframes = [
        { transform: 'scaleY(0.05)', opacity: 0 },
        { transform: 'scaleY(1.06)', opacity: 1 },
        { transform: 'scaleY(1)',    opacity: 1 }
      ];
      options = { duration: 700, easing: 'ease-out', fill: 'both' };
    } else if (el.classList.contains('about-mark')) {
      keyframes = [
        { transform: 'translateY(12px) scale(.9)',   opacity: 0 },
        { transform: 'translateY(-2px) scale(1.04)', opacity: 1 },
        { transform: 'translateY(0) scale(1)',       opacity: 1 }
      ];
      options = { duration: 680, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'both' };
    } else {
      keyframes = [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ];
      options = { duration: 500, easing: 'ease-out', fill: 'both' };
    }

    const a = el.animate(keyframes, options);
    a.pause();
    a.currentTime = 0;
    animations.set(el, a);
    return a;
  }

  function getAnim(el){ return animations.get(el) || makeAnimation(el); }
  function play(el){
    const a = getAnim(el);
    if (a.playState === 'finished') a.currentTime = 0;
    a.play();
  }
  function reset(el){
    const a = getAnim(el);
    a.pause(); a.currentTime = 0;
    el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none';
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const ratio = entry.intersectionRatio;
      if (ratio >= ENTER_RATIO) {
        play(el);
      } else if (ratio <= EXIT_RATIO) {
        reset(el);
      }
    });
  }, { threshold: [0, 0.02, 0.1, 0.18, 0.25, 0.5, 0.75, 1], rootMargin: '0px 0px -5% 0px' });

  items.forEach(el => io.observe(el));

  window.addEventListener('load', () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      const visible = r.top < vh * 0.9 && r.bottom > vh * 0.1;
      if (visible) play(el);
    });
  });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const into = 1 - Math.min(Math.max(rect.top / window.innerHeight, 0), 1);
      section.style.setProperty('--about-shift', `${Math.round(into * 8)}px`);
      section.classList.add('parallax-on');
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();




/* ===================== CAROUSEL LOGIC (scoped) ===================== */
(() => {
  const root = document.getElementById('our-team');

  const cards = root.querySelectorAll('.team__card');
  const dots  = root.querySelectorAll('.team__dot');
  const nameEl = root.querySelector('.team__name');
  const roleEl = root.querySelector('.team__role');
  const left  = root.querySelector('.team__arrow--left');
  const right = root.querySelector('.team__arrow--right');
  const track = root.querySelector('.team__track');

  const teamMembers = [
    { name: "PRODUCTION",        role: "BLACKWOOD" },
    { name: "PRODUCTION",  role: "BLACKWOOD" },
    { name: "PRODUCTION",   role: "BLACKWOOD" },
    { name: "PRODUCTION",     role: "BLACKWOOD" },
    { name: "PRODUCTION",    role: "BLACKWOOD" },
    { name: "JPRODUCTION",     role: "BLACKWOOD" }
  ];

  let currentIndex = 0;
  let isAnimating  = false;

  function updateCarousel(newIndex){
    if (isAnimating) return;
    isAnimating = true;

    currentIndex = (newIndex + cards.length) % cards.length;

    cards.forEach((card, i) => {
      const offset = (i - currentIndex + cards.length) % cards.length;
      card.classList.remove('center','left-1','left-2','right-1','right-2','hidden');

      if (offset === 0) card.classList.add('center');
      else if (offset === 1) card.classList.add('right-1');
      else if (offset === 2) card.classList.add('right-2');
      else if (offset === cards.length - 1) card.classList.add('left-1');
      else if (offset === cards.length - 2) card.classList.add('left-2');
      else card.classList.add('hidden');
    });

    dots.forEach((d,i) => {
      d.classList.toggle('is-active', i === currentIndex);
      d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });

    // Update text with a short fade
    nameEl.style.opacity = roleEl.style.opacity = '0';
    setTimeout(() => {
      nameEl.textContent = teamMembers[currentIndex].name;
      roleEl.textContent = teamMembers[currentIndex].role;
      nameEl.style.opacity = roleEl.style.opacity = '1';
    }, 250);

    setTimeout(() => { isAnimating = false; }, 800);
  }

  // Nav
  left.addEventListener('click',  () => updateCarousel(currentIndex - 1));
  right.addEventListener('click', () => updateCarousel(currentIndex + 1));

  // Click/tap cards & dots
  cards.forEach((card, i) => card.addEventListener('click', () => updateCarousel(i)));
  cards.forEach((card, i) => card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateCarousel(i); }
  }));
  dots.forEach((dot, i) => dot.addEventListener('click', () => updateCarousel(i)));

  // Keyboard arrows
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') updateCarousel(currentIndex - 1);
    if (e.key === 'ArrowRight') updateCarousel(currentIndex + 1);
  });

  // Swipe on mobile (track the section only)
  let startX = 0;
  root.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, {passive:true});
  root.addEventListener('touchend',   (e) => {
    const dx = e.changedTouches[0].screenX - startX;
    if (Math.abs(dx) > 50) updateCarousel(currentIndex + (dx < 0 ? 1 : -1));
  }, {passive:true});

  // Init
  updateCarousel(0);
})();