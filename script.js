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
  const cards = [...document.querySelectorAll(".pricing-card[data-pack]")];
  const productImages = {
    zestiva: {
      6: { src: "Assets/pack of 6.png", alt: "Zestiva 6 pack" },
      12: { src: "Assets/pack of 12.png", alt: "Zestiva 12 pack" },
      30: { src: "Assets/packof 30.png", alt: "Zestiva 30 pack" },
    },
    velora: {
      6: { src: "Assets/v-pack of 6.png", alt: "Velora 6 pack" },
      12: { src: "Assets/v-pack of 12.png", alt: "Velora 12 pack" },
      30: { src: "Assets/v-pack of 30.png", alt: "Velora 30 pack" },
    },
  };

  if (!buttons.length) return;

  const setProduct = (product) => {
    buttons.forEach((item) => {
      const isActive = item.dataset.product === product;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    cards.forEach((card) => {
      const image = card.querySelector(".pricing-product-shot img");
      const imageData = productImages[product]?.[card.dataset.pack];
      if (!image || !imageData) return;

      card.classList.add("is-switching");
      window.setTimeout(() => {
        image.src = imageData.src;
        image.alt = imageData.alt;
        card.classList.remove("is-switching");
      }, 140);
    });
  };

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setProduct(button.dataset.product || "zestiva"));
  });
}

function initPackSelectors() {
  const productCards = [...document.querySelectorAll(".product-card")];

  productCards.forEach((card) => {
    const select = card.querySelector(".pack-select");
    const price = card.querySelector(".selected-pack-price");
    const unit = card.querySelector(".selected-pack-unit");
    const save = card.querySelector(".selected-pack-save");

    if (!select || !price || !unit) return;

    const setPack = () => {
      const option = select.selectedOptions[0];
      if (!option) return;

      price.textContent = `\u20B9${option.dataset.price}`;
      unit.textContent = option.dataset.unit || "";

      if (save) {
        save.textContent = option.dataset.save || "";
      }
    };

    select.addEventListener("change", setPack);
    setPack();
  });
}

function initFitSplitAccordion() {
  const accordions = [...document.querySelectorAll("[data-fit-accordion]")];

  accordions.forEach((accordion) => {
    const items = [...accordion.querySelectorAll(".fit-accordion-item")];

    items.forEach((item) => {
      const button = item.querySelector(".fit-accordion-head");
      if (!button) return;

      button.addEventListener("click", () => {
        const shouldOpen = !item.classList.contains("is-open");

        items.forEach((otherItem) => {
          const isActive = otherItem === item && shouldOpen;
          otherItem.classList.toggle("is-open", isActive);
          otherItem.querySelector(".fit-accordion-head")?.setAttribute("aria-expanded", String(isActive));
        });
      });
    });
  });
}

function initIngredientStory() {
  const section = document.querySelector(".ingredient-story");
  if (!section) return;

  const pin = section.querySelector(".ingredient-story-pin");
  const copy = section.querySelector(".ingredient-story-copy");
  const zVisual = section.querySelector("[data-visual='z-product']");
  const vVisual = section.querySelector("[data-visual='v-product']");
  const zTitle = zVisual?.querySelector(".ingredient-product-name");
  const vTitle = vVisual?.querySelector(".ingredient-product-name");
  const zCards = [...section.querySelectorAll("[data-card^='z-']")];
  const vCards = [...section.querySelectorAll("[data-card^='v-'], [data-card='both']")];
  const allCards = [...section.querySelectorAll(".story-ingredient-card")];
  const mobile = window.matchMedia("(max-width: 980px)").matches;

  const showStatic = () => {
    [zVisual, vVisual].forEach((visual) => {
      if (!visual) return;
      visual.style.opacity = "1";
      visual.style.transform = "none";
      visual.style.filter = "none";
    });

    [zTitle, vTitle].forEach((title) => {
      if (title) title.style.opacity = "1";
    });

    allCards.forEach((card) => {
      card.style.opacity = "1";
      card.style.transform = "none";
      card.style.filter = "none";
    });
  };

  if (mobile || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    showStatic();
    return;
  }

  section.classList.add("is-animated");
  gsap.registerPlugin(ScrollTrigger);

  gsap.set(zVisual, { xPercent: -50, yPercent: -50, x: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
  gsap.set(vVisual, { xPercent: -50, yPercent: -50, x: 320, scale: 0.8, opacity: 0, filter: "blur(18px)" });
  gsap.set([zTitle, vTitle], { opacity: 0, y: -8 });
  gsap.set(allCards, { y: 96, scale: 0.9, opacity: 0, filter: "blur(10px)", transformOrigin: "50% 100%" });

  const revealCard = (card, index, at, group) => {
    const earlierCards = group.slice(0, index);
    return gsap.timeline()
      .to(card, {
        y: -index * 22,
        scale: 1 - index * 0.035,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.72,
        ease: "power3.out",
      }, at)
      .to(earlierCards, {
        y: (i) => -(i + 1) * 28,
        scale: (i) => 0.96 - i * 0.035,
        opacity: (i) => Math.max(0.58 - i * 0.12, 0.32),
        filter: (i) => `blur(${Math.min((i + 1) * 1.2, 4)}px)`,
        duration: 0.72,
        ease: "power3.out",
      }, at);
  };

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=4300",
      pin,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  timeline.to(copy, { autoAlpha: 0, y: -44, duration: 0.75, ease: "power2.out" }, 0.15)
    .to(zVisual, { x: -410, scale: 0.9, duration: 1, ease: "power3.inOut" }, 0.22)
    .to(zTitle, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.72)
    .to(vVisual, { opacity: 0.34, x: 250, scale: 0.78, filter: "blur(16px)", duration: 0.85, ease: "power2.out" }, 0.7);

  zCards.forEach((card, index) => {
    timeline.add(revealCard(card, index, 0, zCards), 1.1 + index * 0.42);
  });

  timeline.to(zCards, {
    y: -150,
    opacity: 0,
    scale: 0.82,
    filter: "blur(10px)",
    duration: 0.75,
    ease: "power2.inOut",
  }, 2.1)
    .to(zVisual, { opacity: 0, x: -540, scale: 0.76, filter: "blur(18px)", duration: 0.9, ease: "power2.inOut" }, 2.1)
    .to(zTitle, { opacity: 0, y: -10, duration: 0.35 }, 2.12)
    .to(vVisual, { opacity: 1, x: -410, scale: 0.9, filter: "blur(0px)", duration: 1, ease: "power3.inOut" }, 2.15)
    .to(vTitle, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 2.65);

  vCards.forEach((card, index) => {
    timeline.add(revealCard(card, index, 0, vCards), 2.95 + index * 0.42);
  });

  timeline.to({}, { duration: 0.6 });
}

applyBrandFont();
updateHeaderStyle();
window.addEventListener("scroll", updateHeaderStyle, { passive: true });

initCursor();
initReveals();
initContactForm();
initSystemIntro();
initJournalCards();
initPricingToggle();
initPackSelectors();
initFitSplitAccordion();
initIngredientStory();
