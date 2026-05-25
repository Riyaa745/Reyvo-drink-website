const siteHeader = document.querySelector(".site-header");
const isLandingPage = document.body.classList.contains("landing-page");

function applyBrandFont(root = document.body) {
  const brandPattern = /(?<![@\w.])reyvo(?![\w.-])/gi;
  const skipTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!parent || skipTags.has(parent.tagName) || parent.closest(".brand-word")) {
        return NodeFilter.FILTER_REJECT;
      }

      brandPattern.lastIndex = 0;
      return brandPattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const brandNodes = [];

  while (walker.nextNode()) {
    brandNodes.push(walker.currentNode);
  }

  brandNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    node.nodeValue.replace(brandPattern, (match, offset) => {
      fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex, offset)));

      const brandWord = document.createElement("span");
      brandWord.className = "brand-word";
      brandWord.textContent = match;
      fragment.append(brandWord);

      lastIndex = offset + match.length;
      return match;
    });

    fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex)));
    node.replaceWith(fragment);
  });
}

function updateHeaderStyle() {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
}

function initCursor() {
  if (!isLandingPage || !window.matchMedia("(pointer: fine)").matches) return;

  const cursor = document.createElement("span");
  const cursorDot = document.createElement("span");
  cursor.className = "custom-cursor";
  cursorDot.className = "custom-cursor-dot";
  cursor.setAttribute("aria-hidden", "true");
  cursorDot.setAttribute("aria-hidden", "true");
  document.body.append(cursor, cursorDot);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let cursorStarted = false;

  function moveCursor() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
    cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate3d(-50%, -50%, 0)`;
    requestAnimationFrame(moveCursor);
  }

  requestAnimationFrame(moveCursor);

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;

    if (!cursorStarted) {
      ringX = targetX;
      ringY = targetY;
      cursorStarted = true;
    }

    cursor.classList.add("is-visible");
    cursorDot.classList.add("is-visible");
  }, { passive: true });

  document.addEventListener("mouseover", (event) => {
    cursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, input, select, textarea")));
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible", "is-hovering");
    cursorDot.classList.remove("is-visible");
  });
}

function initReveals() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length || !("IntersectionObserver" in window)) {
    reveals.forEach((section) => section.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  reveals.forEach((section) => observer.observe(section));
}

function initContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = contactForm.querySelector("button");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending...";

    try {
      const response = await fetch("signup.php", {
        method: "POST",
        body: new FormData(contactForm),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      contactForm.reset();
      button.textContent = "Message sent";
    } catch (error) {
      button.textContent = "Try again";
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 2200);
    }
  });
}

function initSystemIntro() {
  const section = document.querySelector(".system-showcase");
  const video = section?.querySelector(".system-video");
  const content = section?.querySelector(".system-content");

  if (!section || !video || !content) return;

  let hasCompleted = false;
  let fallbackTimer;

  function revealSystem() {
    if (hasCompleted) return;
    hasCompleted = true;
    clearTimeout(fallbackTimer);
    video.pause();
    video.removeAttribute("loop");
    section.classList.add("video-complete");
    content.classList.add("show");
  }

  video.loop = false;
  video.currentTime = 0;

  video.addEventListener("ended", revealSystem, { once: true });
  video.addEventListener("error", revealSystem, { once: true });

  video.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(video.duration) ? video.duration * 1000 : 5000;
    fallbackTimer = setTimeout(revealSystem, duration + 900);
  }, { once: true });

  const playPromise = video.play();

  if (playPromise) {
    playPromise.catch(() => {
      fallbackTimer = setTimeout(revealSystem, 500);
    });
  }
}

function initStackStory() {
  const section = document.querySelector(".stack-story-section");
  const cards = [...document.querySelectorAll(".stack-card")];
  const dots = [...document.querySelectorAll(".stack-progress-dots span")];

  if (!section || !cards.length) return;

  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  if (isMobile) {
    if (typeof Swiper !== "undefined") {
      new Swiper(".stack-mobile-swiper", {
        slidesPerView: 1.08,
        spaceBetween: 18,
        speed: 760,
        grabCursor: true,
        autoplay: false,
        pagination: {
          el: ".stack-mobile-pagination",
          clickable: true,
        },
      });
    }
    return;
  }

  cards.forEach((card, index) => {
    card.style.zIndex = String(cards.length - index);
    card.classList.toggle("is-active", index === 0);
  });

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(cards, {
    y: (index) => index * 34,
    scale: (index) => Math.max(1 - index * 0.05, 0.76),
    opacity: (index) => index === 0 ? 1 : Math.max(0.78 - index * 0.14, 0.16),
    zIndex: (index) => cards.length - index,
  });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: `+=${cards.length * 620}`,
      pin: true,
      scrub: 0.85,
      anticipatePin: 1,
      onUpdate(self) {
        const activeIndex = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
        dots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeIndex));
        cards.forEach((card, index) => card.classList.toggle("is-active", index === activeIndex));
      },
    },
  });

  cards.forEach((card, index) => {
    if (index === 0) return;
    timeline
      .to(cards[index - 1], {
        y: -520,
        scale: 0.86,
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
      })
      .fromTo(card, {
        y: 160,
        scale: 0.9,
        opacity: 0.24,
      }, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "power2.inOut",
      }, "<0.18");

    cards.slice(index + 1).forEach((queuedCard, queuedIndex) => {
      timeline.to(queuedCard, {
        y: (queuedIndex + 1) * 34,
        scale: Math.max(0.95 - queuedIndex * 0.05, 0.76),
        opacity: Math.max(0.72 - queuedIndex * 0.16, 0.16),
        duration: 1,
        ease: "power2.inOut",
      }, "<");
    });
  });
}

function initJournalCards() {
  const section = document.querySelector(".news-section");
  const cards = [...document.querySelectorAll(".news-card")];

  if (!section || !cards.length) return;

  cards.forEach((card) => card.classList.add("is-prepping"));

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.remove("is-prepping");
        card.classList.add("is-visible");
      }, index * 140);
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(cards, {
    y: 72,
    opacity: 0,
    scale: 0.96,
    rotateX: 4,
    transformOrigin: "50% 100%",
  });

  gsap.to(cards, {
    y: 0,
    opacity: 1,
    scale: 1,
    rotateX: 0,
    duration: 1,
    stagger: 0.18,
    ease: "power3.out",
    scrollTrigger: {
      trigger: section,
      start: "top 78%",
      once: true,
    },
    onComplete: () => {
      cards.forEach((card) => {
        card.classList.remove("is-prepping");
        card.classList.add("is-visible");
      });
    },
  });

  ScrollTrigger.refresh();
}

function initPricingToggle() {
  const buttons = [...document.querySelectorAll(".pricing-toggle-btn")];

  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    });
  });
}

function initFormulationDeck() {
  const deck = document.querySelector(".formulation-deck");
  const cards = [...document.querySelectorAll(".formulation-card")];
  const prev = document.querySelector(".formulation-prev");
  const next = document.querySelector(".formulation-next");

  if (!deck || !cards.length || !prev || !next) return;

  let activeIndex = 0;
  let isAnimating = false;

  const paintDeck = () => {
    cards.forEach((card, index) => {
      const offset = (index - activeIndex + cards.length) % cards.length;
      card.classList.toggle("is-active", offset === 0);
      card.classList.toggle("is-next", offset === 1);
      card.classList.toggle("is-after", offset === 2);
      card.style.zIndex = String(cards.length - offset);
      card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
    });
  };

  const moveDeck = (direction) => {
    if (isAnimating) return;
    isAnimating = true;
    const current = cards[activeIndex];
    activeIndex = (activeIndex + direction + cards.length) % cards.length;

    if (typeof gsap !== "undefined") {
      gsap.to(current, {
        x: direction > 0 ? -130 : 130,
        y: -20,
        opacity: 0,
        rotate: direction > 0 ? -5 : 5,
        duration: 0.36,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(current, { clearProps: "transform,opacity" });
          paintDeck();
          gsap.fromTo(cards[activeIndex], {
            x: direction > 0 ? 96 : -96,
            y: 34,
            opacity: 0,
            scale: 0.94,
          }, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.58,
            ease: "power3.out",
            onComplete: () => {
              isAnimating = false;
            },
          });
        },
      });
      return;
    }

    paintDeck();
    setTimeout(() => {
      isAnimating = false;
    }, 420);
  };

  prev.addEventListener("click", () => moveDeck(-1));
  next.addEventListener("click", () => moveDeck(1));
  paintDeck();
}

applyBrandFont();
updateHeaderStyle();
window.addEventListener("scroll", updateHeaderStyle, { passive: true });

initCursor();
initReveals();
initContactForm();
initSystemIntro();
initStackStory();
initJournalCards();
initPricingToggle();
initFormulationDeck();
