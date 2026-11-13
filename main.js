/**
 * Intelligence Designed To Evolve - Landing Page Scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initStatCounters();
  initAutoplayAssurance();
});

/* -------------------------------------------------------------
   Mobile Hamburger Menu & Sheet Toggle
   ------------------------------------------------------------- */
function initMobileMenu() {
  const burgerBtn = document.getElementById("burgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link, .mobile-sign-in-btn");

  if (!burgerBtn || !mobileMenu || !mobileOverlay) return;

  function openMenu() {
    burgerBtn.setAttribute("aria-expanded", "true");
    mobileMenu.removeAttribute("hidden");
    mobileOverlay.removeAttribute("hidden");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    burgerBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("hidden", "");
    mobileOverlay.setAttribute("hidden", "");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    const isExpanded = burgerBtn.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  burgerBtn.addEventListener("click", toggleMenu);
  mobileOverlay.addEventListener("click", closeMenu);

  // Close on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  // Close when any mobile navigation link is clicked
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Close if window is resized above 720px
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });
}

/* -------------------------------------------------------------
   Stats Count-Up Animation (easeOutCubic, staggered)
   ------------------------------------------------------------- */
function initStatCounters() {
  const statNumbers = document.querySelectorAll(".stat-number");
  if (!statNumbers.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Immediate rendering if reduced motion is requested
  if (prefersReduced) {
    statNumbers.forEach((el) => {
      const target = parseFloat(el.getAttribute("data-target")) || 0;
      const decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
      el.textContent = target.toFixed(decimals);
    });
    return;
  }

  // Cubic easing: fast start with gentle landing
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function animateCount(el, target, decimals, duration, delay) {
    setTimeout(() => {
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentVal = target * easeOutCubic(progress);

        el.textContent = currentVal.toFixed(decimals);

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toFixed(decimals);
        }
      }

      requestAnimationFrame(update);
    }, delay);
  }

  // Run once via IntersectionObserver (threshold: 0.25)
  let animated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          statNumbers.forEach((el, i) => {
            const target = parseFloat(el.getAttribute("data-target")) || 0;
            const decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
            const duration = 1500 + i * 80;
            const delay = 480 + i * 90;
            animateCount(el, target, decimals, duration, delay);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );

  const statsFooter = document.querySelector(".stats-footer");
  if (statsFooter) {
    observer.observe(statsFooter);
  } else {
    // Fallback: trigger directly
    statNumbers.forEach((el, i) => {
      const target = parseFloat(el.getAttribute("data-target")) || 0;
      const decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
      const duration = 1500 + i * 80;
      const delay = 480 + i * 90;
      animateCount(el, target, decimals, duration, delay);
    });
  }
}

/* -------------------------------------------------------------
   Autoplay Assurance for Full-Bleed Video
   ------------------------------------------------------------- */
function initAutoplayAssurance() {
  const video = document.querySelector(".bg-video");
  if (video) {
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay may be restricted by low-power mode or browser policy
        document.addEventListener("click", () => video.play(), { once: true });
        document.addEventListener("touchstart", () => video.play(), { once: true });
      });
    }
  }
}
