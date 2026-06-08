const productHeader = document.querySelector(".site-header");

function updateProductHeader() {
  if (!productHeader) return;
  productHeader.classList.toggle("is-scrolled", window.scrollY > 40);
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

updateProductHeader();
window.addEventListener("scroll", updateProductHeader, { passive: true });
initProductDetailSwitch();
initProductScrollAnimations();
