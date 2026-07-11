/* ============================================================
   Nikhil Komakula — Portfolio interactions
   ============================================================ */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  const onScrollNav = () => {
    nav.classList.toggle("nav--scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  if (burger && navLinks) {
    const closeMenu = (refocus = false) => {
      navLinks.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      if (refocus) burger.focus();
    };
    burger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => closeMenu())
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) closeMenu(true);
    });
  }

  /* ---------- Scroll progress bar ---------- */
  const scrollBar = document.getElementById("scrollBar");
  const onScrollBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };
  window.addEventListener("scroll", onScrollBar, { passive: true });
  onScrollBar();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 6) * 60, 300)}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Typing effect ---------- */
  const typedEl = document.getElementById("typed");
  const phrases = [
    "Generative AI Solutions",
    "Agentic AI Systems",
    "RAG Pipelines",
    "MLOps & LLMOps Platforms",
    "AI Governance Frameworks",
    "Production-Ready ML",
  ];
  if (typedEl) {
    if (prefersReducedMotion) {
      typedEl.textContent = phrases[0];
    } else {
      let pi = 0, ci = 0, deleting = false;
      const tick = () => {
        const phrase = phrases[pi];
        ci += deleting ? -1 : 1;
        typedEl.textContent = phrase.slice(0, ci);

        let delay = deleting ? 34 : 68;
        if (!deleting && ci === phrase.length) {
          delay = 1800;
          deleting = true;
        } else if (deleting && ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          delay = 380;
        }
        setTimeout(tick, delay);
      };
      tick();
    }
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll(".stat__num");
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Neural network canvas (hero) ---------- */
  const canvas = document.getElementById("neuralCanvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, nodes, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: null, y: null };

    const NODE_COLOR = "rgba(148, 163, 197, 0.9)";
    const LINK_DIST = 150;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initNodes();
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    function initNodes() {
      const maxNodes = coarsePointer ? 45 : 90;
      const count = Math.min(Math.floor((width * height) / 16000), maxNodes);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      // Links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.35;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
        // Mouse links
        if (mouse.x !== null) {
          const dx = nodes[i].x - mouse.x;
          const dy = nodes[i].y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST * 1.2) {
            const alpha = (1 - dist / (LINK_DIST * 1.2)) * 0.5;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      ctx.fillStyle = NODE_COLOR;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    const hero = document.getElementById("hero");
    hero.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Pause when hero is off-screen or tab is hidden
    let heroVisible = true;
    const setRunning = () => {
      const shouldRun = heroVisible && document.visibilityState === "visible";
      if (shouldRun && !raf) {
        raf = requestAnimationFrame(draw);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            heroVisible = entry.isIntersecting;
            setRunning();
          });
        },
        { threshold: 0 }
      ).observe(canvas);
    }
    document.addEventListener("visibilitychange", setRunning);

    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
      },
      { passive: true }
    );
    resize();
    raf = requestAnimationFrame(draw);
  }
})();
