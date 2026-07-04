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

function initCartDrawer() {
  const products = {
    zestiva: {
      name: "Zestiva",
      label: "Day formula",
      flavor: "Citrus Zing",
      image: "Assets/zestiva-img-removed.png",
      relatedImage: "Assets/velora-img-removed.png",
      accent: "zestiva",
    },
    velora: {
      name: "Velora",
      label: "Evening formula",
      flavor: "Berry Bliss",
      image: "Assets/velora-img-removed.png",
      relatedImage: "Assets/zestiva-img-removed.png",
      accent: "velora",
    },
    mix: {
      name: "Mix Pack",
      label: "Complete routine",
      flavor: "Zestiva + Velora",
      image: "Assets/pack of 12.png",
      relatedImage: "Assets/velora-img-removed.png",
      accent: "mix",
    },
  };

  const cart = [];

  const iconSvg = {
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6h14l-1.6 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.2 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  };

  function ensureHeaderIcons() {
    document.querySelectorAll(".header-nav").forEach((nav) => {
      if (nav.querySelector(".header-actions")) return;

      const actions = document.createElement("div");
      actions.className = "header-actions";
      actions.innerHTML = `
        <button class="header-icon-btn wishlist-icon-btn" type="button" aria-label="Wishlist">${iconSvg.heart}</button>
        <button class="header-icon-btn profile-icon-btn" type="button" aria-label="Profile">${iconSvg.user}</button>
        <button class="header-icon-btn cart-icon-btn" type="button" aria-label="Open cart">
          ${iconSvg.cart}
          <span class="cart-count" aria-label="Cart item count">0</span>
        </button>
      `;

      nav.append(actions);
    });
  }

  function ensureDrawer() {
    if (document.querySelector(".cart-drawer-shell")) return;

    const drawer = document.createElement("div");
    drawer.className = "cart-drawer-shell";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = `
      <button class="cart-overlay" type="button" aria-label="Close cart"></button>
      <aside class="cart-drawer" aria-label="Shopping cart">
        <section class="cart-related-panel">
          <div class="cart-panel-head">
            <h2>You Might Like</h2>
            <button class="cart-close-btn" type="button" aria-label="Close cart">${iconSvg.close}</button>
          </div>
          <div class="cart-related-list"></div>
        </section>

        <section class="cart-main-panel">
          <div class="cart-panel-head">
            <h2>Shopping Cart</h2>
            <button class="cart-close-btn" type="button" aria-label="Close cart">${iconSvg.close}</button>
          </div>

          <div class="cart-shipping-meter">
            <p><strong class="cart-shipping-text">Add to your routine</strong></p>
            <span><i></i></span>
          </div>

          <div class="cart-items" aria-live="polite"></div>

          <div class="cart-footer">
            <div class="cart-subtotal">
              <span>Subtotal</span>
              <strong class="cart-subtotal-price">₹0</strong>
            </div>
            <label class="cart-terms">
              <input type="checkbox">
              <span>I agree with Terms &amp; Conditions</span>
            </label>
            <div class="cart-actions">
              <a class="cart-outline-btn" href="index.html#pricing">View cart</a>
              <a class="cart-solid-btn" href="index.html#pricing">Check Out</a>
            </div>
            <button class="cart-continue-btn" type="button">Or Continue Shopping</button>
          </div>
        </section>
      </aside>
    `;

    document.body.append(drawer);
  }

  function getProductFromCard(card) {
    if (card.classList.contains("product-card-velora")) return "velora";
    if (card.classList.contains("product-card-mix")) return "mix";
    return "zestiva";
  }

  function getHomeCartItem(button) {
    const card = button.closest(".product-card");
    if (!card) return null;

    const key = getProductFromCard(card);
    const select = card.querySelector(".pack-select");
    const option = select?.selectedOptions?.[0];
    const pack = option?.value || "6";
    const price = Number(option?.dataset.price || 399);

    return {
      key,
      id: `${key}-${pack}`,
      name: products[key].name,
      label: products[key].label,
      flavor: products[key].flavor,
      pack,
      unit: option?.dataset.unit || "",
      price,
      image: products[key].image,
      qty: 1,
    };
  }

  function getDetailCartItem(button) {
    const block = button.closest("[data-zestiva-pack-selector]");
    if (!block) return null;

    const title = block.querySelector("h2")?.textContent.trim().toLowerCase() || "zestiva";
    const key = title.includes("velora") ? "velora" : "zestiva";
    const selected = block.querySelector(".zestiva-pack-options .is-selected");
    const pack = selected?.dataset.packSize || "6";
    const price = Number(selected?.dataset.packPrice || 399);
    const unit = block.querySelector("[data-selected-unit]")?.textContent.trim() || "";

    return {
      key,
      id: `${key}-${pack}`,
      name: products[key].name,
      label: products[key].label,
      flavor: products[key].flavor,
      pack,
      unit,
      price,
      image: products[key].image,
      qty: 1,
    };
  }

  function addItem(item) {
    if (!item) return;
    const existing = cart.find((entry) => entry.id === item.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(item);
    }

    renderCart(item.key);
    openCart();
  }

  function getRelatedKeys(lastKey) {
    const productKeysInCart = new Set(cart.filter((item) => item.key !== "mix").map((item) => item.key));

    if (productKeysInCart.has("zestiva") && productKeysInCart.has("velora")) {
      return ["zestiva", "velora"];
    }

    if (productKeysInCart.has("zestiva")) return ["velora"];
    if (productKeysInCart.has("velora")) return ["zestiva"];
    if (lastKey === "velora") return ["zestiva"];
    return ["velora"];
  }

  function renderCart(lastKey = cart[cart.length - 1]?.key || "zestiva") {
    const drawer = document.querySelector(".cart-drawer-shell");
    const itemsNode = drawer?.querySelector(".cart-items");
    const relatedNode = drawer?.querySelector(".cart-related-list");
    const subtotalNode = drawer?.querySelector(".cart-subtotal-price");
    const meterText = drawer?.querySelector(".cart-shipping-text");
    const meterBar = drawer?.querySelector(".cart-shipping-meter i");

    if (!drawer || !itemsNode || !relatedNode || !subtotalNode || !meterText || !meterBar) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const remaining = Math.max(499 - subtotal, 0);
    const progress = Math.min((subtotal / 499) * 100, 100);

    itemsNode.innerHTML = cart.length ? cart.map((item) => `
      <article class="cart-item" data-id="${item.id}">
        <figure><img src="${item.image}" alt="${item.name}"></figure>
        <div class="cart-item-copy">
          <div class="cart-item-top">
            <h3>${item.name}</h3>
            <button type="button" class="cart-remove-btn" data-cart-action="remove">Remove</button>
          </div>
          <p>${item.label} · ${item.flavor}</p>
          <span>${item.pack} sachets ${item.unit ? `· ${item.unit}` : ""}</span>
          <div class="cart-item-bottom">
            <div class="cart-qty">
              <button type="button" data-cart-action="decrease" aria-label="Decrease ${item.name} quantity">${iconSvg.minus}</button>
              <strong>${item.qty}</strong>
              <button type="button" data-cart-action="increase" aria-label="Increase ${item.name} quantity">${iconSvg.plus}</button>
            </div>
            <strong>₹${item.price * item.qty}</strong>
          </div>
        </div>
      </article>
    `).join("") : `
      <div class="cart-empty-state">
        <h3>Your cart is waiting.</h3>
        <p>Add Zestiva, Velora, or the complete routine to start building your daily system.</p>
      </div>
    `;

    relatedNode.innerHTML = getRelatedKeys(lastKey).map((relatedKey) => {
      const related = products[relatedKey];
      return `
        <article class="cart-related-card">
          <figure><img src="${related.image}" alt="${related.name}"></figure>
          <span>${related.label}</span>
          <h3>${related.name}</h3>
          <p>${related.flavor}</p>
          <button type="button" data-related-product="${relatedKey}">Add ${related.name}</button>
        </article>
      `;
    }).join("");

    subtotalNode.textContent = `₹${subtotal}`;
    meterText.innerHTML = remaining > 0 ? `Buy <b>₹${remaining}</b> more for free shipping` : "Free shipping unlocked";
    meterBar.style.width = `${progress}%`;

    document.querySelectorAll(".cart-count").forEach((count) => {
      count.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
    });
  }

  function openCart() {
    document.body.classList.add("cart-drawer-open");
    document.querySelector(".cart-drawer-shell")?.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    document.body.classList.remove("cart-drawer-open");
    document.querySelector(".cart-drawer-shell")?.setAttribute("aria-hidden", "true");
  }

  ensureHeaderIcons();
  ensureDrawer();
  renderCart();

  document.addEventListener("click", (event) => {
    const homeButton = event.target.closest(".pricing-btn");
    const detailButton = event.target.closest(".zestiva-cart-btn");
    const cartButton = event.target.closest(".cart-icon-btn");
    const closeButton = event.target.closest(".cart-close-btn, .cart-overlay, .cart-continue-btn");
    const actionButton = event.target.closest("[data-cart-action]");
    const relatedButton = event.target.closest("[data-related-product]");

    if (homeButton) {
      event.preventDefault();
      addItem(getHomeCartItem(homeButton));
      return;
    }

    if (detailButton) {
      event.preventDefault();
      addItem(getDetailCartItem(detailButton));
      return;
    }

    if (cartButton) {
      openCart();
      return;
    }

    if (closeButton) {
      closeCart();
      return;
    }

    if (actionButton) {
      const itemNode = actionButton.closest(".cart-item");
      const item = cart.find((entry) => entry.id === itemNode?.dataset.id);
      if (!item) return;

      const action = actionButton.dataset.cartAction;
      if (action === "increase") item.qty += 1;
      if (action === "decrease") item.qty -= 1;
      if (action === "remove" || item.qty <= 0) {
        cart.splice(cart.indexOf(item), 1);
      }
      renderCart(item.key);
      return;
    }

    if (relatedButton) {
      const key = relatedButton.dataset.relatedProduct || "zestiva";
      addItem({
        key,
        id: `${key}-6`,
        name: products[key].name,
        label: products[key].label,
        flavor: products[key].flavor,
        pack: "6",
        unit: key === "velora" ? "₹66.5 / sachet" : "₹66.5 / sachet",
        price: 399,
        image: products[key].image,
        qty: 1,
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
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

function initHomepageRefresh() {
  const lines = [...document.querySelectorAll(".home-manifesto-line")];
  let activeLine = 0;

  if (lines.length > 1) {
    setInterval(() => {
      lines.forEach((line) => line.classList.remove("is-active"));
      activeLine = (activeLine + 1) % lines.length;
      lines[activeLine].classList.add("is-active");
    }, 1800);
  }

  const tabButtons = [...document.querySelectorAll("[data-home-product]")];
  const ingredientGrid = document.querySelector("[data-home-ingredient-grid]");

  if (!tabButtons.length || !ingredientGrid) return;

  const ingredientCards = {
    z: [
      {
        name: "Natural Caffeine",
        strength: "70mg",
        image: "Assets/natural-caffeine.jpg",
        description: "Green Coffee Bean + Green Tea Extract. Steady energy, not a rush.",
      },
      {
        name: "L-Theanine",
        strength: "70mg",
        image: "Assets/L-Theanine.jpg",
        description: "From Green Tea. Calm alertness without the edge.",
      },
      {
        name: "Electrolytes",
        strength: "Na + K + Mg",
        image: "Assets/Electrolytes.jpg",
        description: "Sodium, Potassium, and Magnesium support fluid balance, hydration, and daily muscle function.",
      },
      {
        name: "Green Tea Extract",
        strength: "EGCG",
        image: "Assets/Green Tea Extract.jpg",
        description: "Rich in EGCG polyphenols for antioxidant support and cleaner daily performance.",
      },
      {
        name: "Vitamins + Zinc",
        strength: "Full Complex",
        image: "Assets/vitamin+zince.jpg",
        description: "B-vitamins, Vitamin C, and Zinc support energy metabolism, immunity, and daily resilience.",
      },
    ],
    v: [
      {
        name: "L-Theanine",
        strength: "100mg",
        image: "Assets/L-Theanine.jpg",
        description: "Higher dose than Zestiva for relaxation support and a calm, alert evening state.",
      },
      {
        name: "Magnesium Gluconate",
        strength: "66mg",
        image: "Assets/Magnesium Gluconate.jpg",
        description: "Highly bioavailable organic magnesium that supports calm, body relaxation, and normal muscle function.",
      },
      {
        name: "Natural Caffeine",
        strength: "30mg",
        image: "Assets/natural-caffeine.jpg",
        description: "Lower caffeine than Zestiva, supporting mental clarity without disrupting your wind-down.",
      },
      {
        name: "Electrolytes",
        strength: "Na + K",
        image: "Assets/Electrolytes.jpg",
        description: "Sodium and Potassium support normal fluid balance and gentle restoration after long days.",
      },
      {
        name: "Vitamins + Zinc",
        strength: "Full Complex",
        image: "Assets/vitamin+zince.jpg",
        description: "Support recovery, immune function, and normal psychological function after demanding days.",
      },
    ],
  };

  const renderIngredientCards = (product) => {
    ingredientGrid.innerHTML = ingredientCards[product].map((card) => `
      <article class="zestiva-flip-card" tabindex="0">
        <div class="zestiva-flip-card-inner">
          <div class="zestiva-flip-card-front" style="--card-image: url('${card.image}')">
            <h3>${card.name}</h3><strong>${card.strength}</strong>
          </div>
          <div class="zestiva-flip-card-back">
            <h3>${card.name}</h3>
            <p>${card.description}</p>
          </div>
        </div>
      </article>
    `).join("");
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.dataset.homeProduct === "v" ? "v" : "z";

      tabButtons.forEach((tab) => {
        tab.classList.remove("is-z-active", "is-v-active");
      });

      button.classList.add(product === "z" ? "is-z-active" : "is-v-active");
      renderIngredientCards(product);
    });
  });
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
initCartDrawer();
initFitSplitAccordion();
initIngredientStory();
initHomepageRefresh();
