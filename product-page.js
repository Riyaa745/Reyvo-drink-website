const productHeader = document.querySelector(".site-header");

function updateProductHeader() {
  if (!productHeader) return;
  productHeader.classList.toggle("is-scrolled", window.scrollY > 40);
}

function initPurchaseScroll() {
  const purchaseSection = document.querySelector("#product-showcase");
  if (!purchaseSection) return;

  document.querySelectorAll("[data-scroll-purchase]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const headerOffset = productHeader?.offsetHeight ?? 0;
      const targetTop = purchaseSection.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: targetTop,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  });
}

function initProductScrollAnimations() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    document.querySelectorAll(".product-transition-story-copy").forEach((copy) => {
      copy.style.opacity = "1";
      copy.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const transition = document.querySelector(".product-transition-section");
  const transitionPin = transition?.querySelector(".product-transition-pin");
  const transitionVisual = transition?.querySelector(".product-transition-visual");
  const heroCopy = transition?.querySelector(".product-transition-hero-copy");
  const storyCopy = transition?.querySelector(".product-transition-story-copy");
  const mobile = window.matchMedia("(max-width: 991px)").matches;

  if (transition && transitionPin && transitionVisual && heroCopy && storyCopy && !mobile) {
    const introTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: transition,
        start: "top top",
        end: "+=1400",
        pin: transitionPin,
        scrub: 0.9,
        anticipatePin: 1,
      },
    });

    introTimeline
      .to(heroCopy, {
        x: 80,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.out",
      }, 0)
      .to(transitionVisual, {
        xPercent: 116,
        duration: 1,
        ease: "power3.inOut",
      }, 0.04)
      .to(storyCopy, {
        x: 0,
        autoAlpha: 1,
        duration: 0.72,
        ease: "power3.out",
      }, 0.42)
      .to({}, { duration: 0.35 });
  } else if (transition && transitionVisual && heroCopy && storyCopy && mobile) {
    gsap.timeline({
      scrollTrigger: {
        trigger: transition,
        start: "top 76%",
        end: "bottom 35%",
        scrub: 0.65,
      },
    })
      .fromTo(heroCopy, { x: -28, autoAlpha: 0.35 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out" })
      .fromTo(transitionVisual, { xPercent: -14, autoAlpha: 0.55 }, { xPercent: 0, autoAlpha: 1, duration: 0.55, ease: "power2.out" }, 0.08)
      .fromTo(storyCopy, { x: 34, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.42);
  } else if (storyCopy) {
    storyCopy.style.opacity = "1";
    storyCopy.style.transform = "none";
  }

}

function initProductDetailSwitch() {
  document.querySelectorAll("[data-product-switch]").forEach((switcher) => {
    const defaultPanel = switcher.querySelector("[data-product-panel='default']");
    const ingredientsPanel = switcher.querySelector("[data-product-panel='ingredients']");
    const showIngredients = switcher.querySelector("[data-show-ingredients]");
    const showDefault = switcher.querySelector("[data-show-default]");

    if (!defaultPanel || !ingredientsPanel || !showIngredients || !showDefault) return;

    const setState = (showingIngredients) => {
      const outgoingPanel = showingIngredients ? defaultPanel : ingredientsPanel;
      const incomingPanel = showingIngredients ? ingredientsPanel : defaultPanel;

      switcher.classList.toggle("is-showing-ingredients", showingIngredients);
      defaultPanel.setAttribute("aria-hidden", showingIngredients ? "true" : "false");
      ingredientsPanel.setAttribute("aria-hidden", showingIngredients ? "false" : "true");

      outgoingPanel.classList.remove("is-active");
      outgoingPanel.hidden = true;
      incomingPanel.hidden = false;
      requestAnimationFrame(() => incomingPanel.classList.add("is-active"));
    };

    showIngredients.addEventListener("click", () => setState(true));
    showDefault.addEventListener("click", () => setState(false));
  });
}

function initZestivaGallery() {
  const gallery = document.querySelector("[data-zestiva-gallery]");
  if (!gallery) return;

  const mainImage = gallery.querySelector("[data-zestiva-main]");
  const thumbnails = [...gallery.querySelectorAll("[data-zestiva-image]")];
  let activeIndex = 0;

  const showImage = (index) => {
    activeIndex = (index + thumbnails.length) % thumbnails.length;
    const thumbnail = thumbnails[activeIndex];
    mainImage.classList.add("is-changing");

    window.setTimeout(() => {
      mainImage.src = thumbnail.dataset.zestivaImage;
      mainImage.alt = thumbnail.dataset.zestivaAlt;
      mainImage.classList.remove("is-changing");
    }, 120);

    thumbnails.forEach((button, buttonIndex) => {
      button.classList.toggle("is-active", buttonIndex === activeIndex);
    });
  };

  thumbnails.forEach((button, index) => button.addEventListener("click", () => showImage(index)));
  gallery.querySelector(".is-prev")?.addEventListener("click", () => showImage(activeIndex - 1));
  gallery.querySelector(".is-next")?.addEventListener("click", () => showImage(activeIndex + 1));

  let touchStartX = 0;
  gallery.querySelector(".zestiva-gallery-main")?.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  gallery.querySelector(".zestiva-gallery-main")?.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 45) return;
    showImage(activeIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
}

function initProductMobileSliders() {
  if (!window.matchMedia("(max-width: 760px)").matches) return;

  document.querySelectorAll(".zestiva-feature-grid, .zestiva-review-grid").forEach((slider) => {
    if (slider.children.length < 2) return;
    let timer;

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        const card = slider.firstElementChild;
        const gap = parseFloat(getComputedStyle(slider).gap) || 14;
        const step = card.getBoundingClientRect().width + gap;
        const atEnd = slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 5;
        slider.scrollTo({ left: atEnd ? 0 : slider.scrollLeft + step, behavior: "smooth" });
      }, 3600);
    };

    const pause = () => window.clearInterval(timer);
    slider.addEventListener("touchstart", pause, { passive: true });
    slider.addEventListener("touchend", () => window.setTimeout(start, 1800), { passive: true });
    slider.addEventListener("pointerenter", pause);
    slider.addEventListener("pointerleave", start);
    start();
  });
}

function initZestivaPackSelector() {
  const selector = document.querySelector("[data-zestiva-pack-selector]");
  if (!selector) return;

  const options = [...selector.querySelectorAll("[data-pack-size]")];
  const selectedPrice = selector.querySelector("[data-selected-price]");
  const selectedUnit = selector.querySelector("[data-selected-unit]");
  const selectedSaving = selector.querySelector("[data-selected-saving]");
  const firstOption = options[0];
  const baseUnitPrice = firstOption
    ? Number(firstOption.dataset.packPrice) / Number(firstOption.dataset.packSize)
    : 0;

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const packSize = Number(option.dataset.packSize);
      const packPrice = Number(option.dataset.packPrice);
      const regularPrice = baseUnitPrice * packSize;
      const savedAmount = Math.max(0, Math.round(regularPrice - packPrice));
      const savedPercent = Math.max(0, Math.round((savedAmount / regularPrice) * 100));

      options.forEach((button) => button.classList.toggle("is-selected", button === option));
      selectedPrice.textContent = `₹${packPrice.toLocaleString("en-IN")}`;
      selectedUnit.textContent = `That's ₹${(packPrice / packSize).toFixed(2)} per serve`;
      selectedSaving.textContent = savedAmount
        ? `You Save ₹${savedAmount.toLocaleString("en-IN")} (${savedPercent}%)`
        : "No savings on trial pack";
    });
  });
}

function initZestivaFaq() {
  const faqItems = [...document.querySelectorAll(".zestiva-faq-list details")];

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.open = false;
      });
    });
  });
}

updateProductHeader();
window.addEventListener("scroll", updateProductHeader, { passive: true });
initPurchaseScroll();
initProductDetailSwitch();
initProductScrollAnimations();
initZestivaGallery();
initZestivaPackSelector();
initZestivaFaq();
initProductMobileSliders();
