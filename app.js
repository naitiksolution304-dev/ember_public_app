document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- FAQ Accordion Toggle ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other open FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      // Toggle active state of clicked item
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      }
    });
  });

  // --- Animated Number Counter ---
  function animateCounter(element, target) {
    const duration = 2000; // ms
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for a smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (target >= 1000) {
        element.textContent = current.toLocaleString('en-IN') + '+';
      } else {
        element.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // --- Intersection Observer for All Animated Elements ---
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left');
  let statsAnimated = false;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Trigger counter animation for stat numbers
        if (!statsAnimated && entry.target.closest('.stats-section')) {
          statsAnimated = true;
          document.querySelectorAll('.stat-number[data-target]').forEach(num => {
            const target = parseInt(num.getAttribute('data-target'), 10);
            animateCounter(num, target);
          });
        }

        // Same treatment for pricing amounts as they scroll into view.
        if (entry.target.classList.contains('pricing-card')) {
          const amountEl = entry.target.querySelector('.price-amount[data-target]');
          if (amountEl) {
            const target = parseInt(amountEl.getAttribute('data-target'), 10);
            animateCounter(amountEl, target);
          }
        }

        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  animatedElements.forEach(el => {
    observer.observe(el);
  });

  // --- Scrollspy: highlight the current section in the nav ---
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const spySections = Array.from(navLinks)
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (spySections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0,
    });

    spySections.forEach(section => spyObserver.observe(section));
  }

  // --- Interactive Phone Mockup Journey (Discover -> Match -> Call) ---
  const phoneDemo = document.getElementById('phoneDemo');

  if (phoneDemo) {
    const profiles = [
      { name: 'Aanya, 23', bio: 'Active now · New Delhi', img: 'profile.png', initials: null },
      { name: 'Rohan, 26', bio: 'Online · Mumbai', img: null, initials: 'R' },
      { name: 'Meera, 24', bio: 'Online · Bengaluru', img: null, initials: 'M' },
    ];

    const demoHint = document.getElementById('demoHint');
    const cardImg = document.getElementById('demoCardImg');
    const matchOverlay = document.getElementById('matchOverlay');
    const callOverlay = document.getElementById('callOverlay');
    const callAvatar = document.getElementById('callAvatar');
    const callName = document.getElementById('callName');
    const callStatus = document.getElementById('callStatus');
    const callTimer = document.getElementById('callTimer');
    const demoCredits = document.getElementById('demoCredits');
    const btnSkip = document.getElementById('btnSkip');
    const btnLike = document.getElementById('btnLike');
    const btnCall = document.getElementById('btnCall');
    const callEndBtn = document.getElementById('callEndBtn');

    const AD_CREDIT_SECONDS = 120; // ties to the "2 min per ad" feature copy
    let current = 0;
    let phase = 'browsing'; // browsing | matched | calling | connected
    let autoTimer = null;
    let phaseTimer = null;
    let callInterval = null;
    let callSeconds = 0;

    function dismissHint() {
      if (demoHint) demoHint.classList.add('hidden');
    }

    function renderProfile(idx) {
      const p = profiles[idx];
      cardImg.classList.toggle('avatar-placeholder', !p.img);
      cardImg.style.background = p.img
        ? `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%), url('${p.img}') center/cover no-repeat`
        : 'var(--accent-gradient)';
      cardImg.innerHTML =
        (p.img ? '' : `<div class="avatar-initials">${p.initials}</div>`) +
        `<div class="card-details"><div class="card-name">${p.name}</div><div class="card-bio">${p.bio}</div></div>`;
    }

    function formatCredits(remainingSeconds) {
      return Math.max(0, remainingSeconds / 60).toFixed(1) + 'm';
    }

    function clearTimers() {
      clearTimeout(autoTimer);
      clearTimeout(phaseTimer);
      clearInterval(callInterval);
    }

    function scheduleAutoPlay() {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (phase === 'browsing') doLike();
      }, 4500);
    }

    function doSkip() {
      if (phase !== 'browsing') return;
      dismissHint();
      clearTimers();
      cardImg.classList.add('swipe-out-left');
      phaseTimer = setTimeout(() => {
        current = (current + 1) % profiles.length;
        renderProfile(current);
        cardImg.classList.remove('swipe-out-left');
        cardImg.classList.add('swipe-in');
        setTimeout(() => cardImg.classList.remove('swipe-in'), 400);
        scheduleAutoPlay();
      }, 350);
    }

    function doLike() {
      if (phase !== 'browsing') return;
      dismissHint();
      clearTimers();
      phase = 'matched';
      matchOverlay.classList.add('show');
      phaseTimer = setTimeout(startCall, 1300);
    }

    function startCall() {
      dismissHint();
      clearTimeout(phaseTimer);
      phase = 'calling';
      matchOverlay.classList.remove('show');
      const p = profiles[current];
      callName.textContent = p.name.split(',')[0];
      callAvatar.style.background = p.img
        ? `url('${p.img}') center/cover no-repeat`
        : 'var(--accent-gradient)';
      callAvatar.textContent = p.img ? '' : p.initials;
      callAvatar.classList.add('ringing');
      callStatus.textContent = 'Calling…';
      callTimer.textContent = '';
      callOverlay.classList.add('show');
      phaseTimer = setTimeout(connectCall, 1800);
    }

    function connectCall() {
      phase = 'connected';
      callAvatar.classList.remove('ringing');
      callStatus.textContent = 'Connected';
      callSeconds = 0;
      callTimer.textContent = '00:00';
      callInterval = setInterval(() => {
        callSeconds += 1;
        const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const ss = String(callSeconds % 60).padStart(2, '0');
        callTimer.textContent = `${mm}:${ss}`;
        if (demoCredits) {
          demoCredits.textContent = formatCredits(AD_CREDIT_SECONDS - callSeconds);
        }
        if (callSeconds >= 5) endCall();
      }, 1000);
    }

    function endCall() {
      clearTimers();
      callOverlay.classList.remove('show');
      if (demoCredits) demoCredits.textContent = '2.0m';
      phase = 'browsing';
      current = (current + 1) % profiles.length;
      renderProfile(current);
      cardImg.classList.add('swipe-in');
      setTimeout(() => cardImg.classList.remove('swipe-in'), 400);
      scheduleAutoPlay();
    }

    btnSkip.addEventListener('click', doSkip);
    btnLike.addEventListener('click', doLike);
    btnCall.addEventListener('click', () => {
      if (phase !== 'browsing') return;
      dismissHint();
      clearTimers();
      startCall();
    });
    callEndBtn.addEventListener('click', () => {
      if (phase === 'calling' || phase === 'connected') endCall();
    });

    renderProfile(current);
    scheduleAutoPlay();
    setTimeout(dismissHint, 7000);
  }

  // --- Live Pricing (falls back to the static cards already in the HTML) ---
  const PLANS_API_URL = 'https://api.emberconnect.in/v1/plans';
  const pricingGrid = document.getElementById('pricingGrid');

  function buildPlanCard(plan, isBest) {
    const card = document.createElement('div');
    card.className = 'pricing-card fade-in visible' + (isBest ? ' featured' : '');

    if (isBest) {
      const badge = document.createElement('div');
      badge.className = 'pricing-badge';
      badge.textContent = 'Best Value';
      card.appendChild(badge);
    }

    const h3 = document.createElement('h3');
    h3.textContent = plan.name;
    card.appendChild(h3);

    const priceInr = Number(plan.price_inr);
    const priceDiv = document.createElement('div');
    priceDiv.className = 'price';
    const currency = document.createElement('span');
    currency.className = 'price-currency';
    currency.textContent = '₹';
    const amount = document.createElement('span');
    amount.className = 'price-amount';
    amount.dataset.target = String(Math.round(priceInr));
    amount.textContent = String(Math.round(priceInr));
    priceDiv.append(currency, amount);
    card.appendChild(priceDiv);

    const desc = document.createElement('p');
    desc.className = 'price-desc';
    desc.textContent = `${plan.duration_minutes} minutes of call time.`;
    card.appendChild(desc);

    const ratePerMinute = priceInr / plan.duration_minutes;
    const ul = document.createElement('ul');
    ul.className = 'pricing-features';
    [
      `${plan.duration_minutes} minutes of calling`,
      `₹${ratePerMinute.toFixed(2)} per minute`,
      'One-time purchase',
    ].forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    card.appendChild(ul);

    return card;
  }

  function renderLivePlans(plans) {
    if (!pricingGrid) return;
    const activePlans = plans.filter((p) => p.is_active);
    if (!activePlans.length) return;

    // Remove the static (hardcoded) paid-plan cards, keep the free/Casual card.
    pricingGrid.querySelectorAll('.pricing-card:not([data-static])').forEach((el) => el.remove());

    const sorted = [...activePlans].sort((a, b) => Number(a.price_inr) - Number(b.price_inr));

    // Dynamically update the "Starting Price" stat in the hero statistics section
    const cheapestPlan = sorted[0];
    const cheapestPrice = Math.round(Number(cheapestPlan.price_inr));
    const statStartingPriceEl = document.getElementById('statStartingPrice');
    if (statStartingPriceEl) {
      statStartingPriceEl.setAttribute('data-target', String(cheapestPrice));
      if (statsAnimated) {
        statStartingPriceEl.textContent = String(cheapestPrice);
      }
    }

    const bestPlanId = sorted.reduce((best, p) => {
      const rate = Number(p.price_inr) / p.duration_minutes;
      const bestRate = Number(best.price_inr) / best.duration_minutes;
      return rate < bestRate ? p : best;
    }, sorted[0]).id;

    sorted.forEach((plan) => {
      const card = buildPlanCard(plan, plan.id === bestPlanId);
      card.classList.add('visible');
      pricingGrid.appendChild(card);
      observer.observe(card);
    });
  }

  if (pricingGrid) {
    fetch(PLANS_API_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
      .then(renderLivePlans)
      .catch(() => {
        // API unreachable — keep the static fallback pricing already in the HTML.
      });
  }

  // --- Live Earner Revenue Share (fetches active percentage from database) ---
  const COMMISSION_API_URL = 'https://api.emberconnect.in/v1/commission/public';
  const statEarnerRevenueShareEl = document.getElementById('statEarnerRevenueShare');

  if (statEarnerRevenueShareEl) {
    fetch(COMMISSION_API_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
      .then((data) => {
        if (data && typeof data.female_rate_pct === 'number') {
          const pct = Math.round(data.female_rate_pct);
          statEarnerRevenueShareEl.setAttribute('data-target', String(pct));
          statEarnerRevenueShareEl.textContent = String(pct);
        }
      })
      .catch(() => {
        // Fallback to static HTML value
      });
  }

  // --- "Download" links point to and highlight the store badges ---
  const downloadTriggers = document.querySelectorAll('a[href="#download"], .nav-btn');
  const storeBadges = document.querySelectorAll('#badgeGooglePlay, #badgeAppStore');

  downloadTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      storeBadges.forEach((badge) => badge.classList.remove('highlight-pulse'));
      setTimeout(() => {
        storeBadges.forEach((badge) => {
          badge.classList.add('highlight-pulse');
        });
        setTimeout(() => {
          storeBadges.forEach((badge) => badge.classList.remove('highlight-pulse'));
        }, 2200);
      }, 400);
    });
  });

  // --- Consolidated scroll handler: header compact state, scroll progress
  // bar, back-to-top visibility, and the --scroll-y custom property that
  // drives the hero parallax/tilt in CSS. rAF-throttled since scroll fires
  // far more often than the browser can usefully repaint. ---
  const header = document.querySelector('header');
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');
  const root = document.documentElement;

  let scrollTicking = false;

  function updateOnScroll() {
    const scrollY = window.scrollY;

    if (header) header.classList.toggle('scrolled', scrollY > 60);

    if (scrollProgress) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
      scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    if (backToTop) backToTop.classList.toggle('show', scrollY > 600);

    if (!prefersReducedMotion) {
      root.style.setProperty('--scroll-y', String(Math.min(scrollY, 700)));
    }

    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateOnScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  updateOnScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // --- Click ripple for the primary CTA buttons ---
  document.querySelectorAll('.cta-btn, .nav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // --- Magnetic hover for the primary CTA buttons ---
  if (!prefersReducedMotion) {
    document.querySelectorAll('.cta-btn, .nav-btn').forEach((btn) => {
      const strength = 0.3;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y - 2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // --- 3D tilt-on-hover for the feature cards ---
  if (!prefersReducedMotion) {
    document.querySelectorAll('.feature-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.classList.add('tilting');
        card.style.transform =
          `perspective(700px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-8px) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });
  }
});
