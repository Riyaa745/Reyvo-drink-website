


(() => {
  const USER_KEY = "reyvoUser", SESSION_KEY = "reyvoSession", CART_KEY = "reyvoCart", ORDERS_KEY = "reyvoOrders";
  const read = (key, fallback = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const accountHeader = document.querySelector(".site-header");
  if (accountHeader) {
    const menuButton=accountHeader.querySelector(".header-menu-toggle"),nav=accountHeader.querySelector(".header-nav");
    menuButton?.addEventListener("click",()=>{const open=accountHeader.classList.toggle("menu-open");document.body.classList.toggle("mobile-menu-open",open);menuButton.setAttribute("aria-expanded",String(open));});
    nav?.addEventListener("click",()=>{accountHeader.classList.remove("menu-open");document.body.classList.remove("mobile-menu-open");menuButton?.setAttribute("aria-expanded","false");});
  }
  const showMessage = (form, text, success = false) => { const node = form?.querySelector(".form-message"); if (node) { node.textContent = text; node.classList.toggle("success", success); } };
  const fieldName = input => input.closest(".account-field")?.querySelector("label")?.textContent || "this field";
  const validate = form => {
    for (const input of form.querySelectorAll("input, textarea, select")) {
      if (input.disabled || input.closest("[hidden]")) continue;
      if (input.required && !input.value.trim()) { showMessage(form, `Please fill in ${fieldName(input).toLowerCase()}.`); input.focus(); return false; }
      if (input.value && !input.checkValidity()) { showMessage(form, `Please enter a valid ${fieldName(input).toLowerCase()}.`); input.focus(); return false; }
    }
    showMessage(form, ""); return true;
  };
  const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));
  const signIn = (email, form) => { localStorage.setItem(SESSION_KEY, JSON.stringify({ email })); showMessage(form, "Login successful! Opening your dashboard…", true); setTimeout(() => location.href = "profile.html", 800); };

  const registerForm = document.querySelector("[data-register-form]");
  registerForm?.addEventListener("submit", event => {
    event.preventDefault(); if (!validate(registerForm)) return;
    const data = new FormData(registerForm);
    if (data.get("password") !== data.get("confirmPassword")) return showMessage(registerForm, "Passwords do not match. Please enter them again.");
    const user = { name:data.get("name").trim(), email:data.get("email").trim().toLowerCase(), phone:data.get("phone").trim(), password:data.get("password") };
    localStorage.setItem(USER_KEY, JSON.stringify(user)); localStorage.setItem(SESSION_KEY, JSON.stringify({ email:user.email }));
    showMessage(registerForm, "Account created successfully! Opening your dashboard…", true); setTimeout(() => location.href = "profile.html", 900);
  });

  const loginForm = document.querySelector("[data-login-form]");
  let loginMode = "password", loginOtp = "", resetOtp = "";
  document.querySelectorAll("[data-login-tab]").forEach(button => button.addEventListener("click", () => {
    loginMode = button.dataset.loginTab; document.querySelectorAll("[data-login-tab]").forEach(tab => tab.classList.toggle("is-active", tab === button));
    document.querySelector("[data-password-login]").hidden = loginMode !== "password"; document.querySelector("[data-otp-login]").hidden = loginMode !== "otp";
    document.querySelector("#login-password").required = loginMode === "password"; document.querySelector("#login-otp").required = loginMode === "otp"; showMessage(loginForm, "");
  }));
  document.querySelector("[data-send-login-otp]")?.addEventListener("click", () => {
    const emailInput = document.querySelector("#login-email"), user = read(USER_KEY);
    if (!emailInput.value.trim()) return showMessage(loginForm, "Please fill in email address.");
    if (!emailInput.checkValidity()) return showMessage(loginForm, "Please enter a valid email address.");
    if (!user || user.email !== emailInput.value.trim().toLowerCase()) return showMessage(loginForm, "No account was found with this email. Please register first.");
    loginOtp = createOtp(); document.querySelector("[data-login-otp-field]").hidden = false; showMessage(loginForm, `OTP sent. Development OTP: ${loginOtp}`, true);
  });
  loginForm?.addEventListener("submit", event => {
    event.preventDefault(); if (!validate(loginForm)) return;
    const data = new FormData(loginForm), user = read(USER_KEY), email = data.get("email").trim().toLowerCase();
    if (!user || user.email !== email) return showMessage(loginForm, "No account was found with this email. Please register first.");
    if (loginMode === "password" && user.password !== data.get("password")) return showMessage(loginForm, "The password is incorrect. Please try again.");
    if (loginMode === "otp" && (!loginOtp || data.get("otp") !== loginOtp)) return showMessage(loginForm, "The OTP is incorrect or has not been sent yet.");
    signIn(email, loginForm);
  });

  const resetForm = document.querySelector("[data-reset-form]");
  document.querySelector("[data-forgot-open]")?.addEventListener("click", () => { loginForm.hidden = true; resetForm.hidden = false; document.querySelector("#reset-email").value = document.querySelector("#login-email").value; });
  document.querySelector("[data-forgot-close]")?.addEventListener("click", () => { resetForm.hidden = true; loginForm.hidden = false; });
  document.querySelector("[data-send-reset-otp]")?.addEventListener("click", () => {
    const email = document.querySelector("#reset-email"), user = read(USER_KEY);
    if (!email.value.trim()) return showMessage(resetForm, "Please fill in registered email.");
    if (!email.checkValidity()) return showMessage(resetForm, "Please enter a valid email address.");
    if (!user || user.email !== email.value.trim().toLowerCase()) return showMessage(resetForm, "No account was found with this email.");
    resetOtp = createOtp(); document.querySelector("[data-reset-details]").hidden = false; showMessage(resetForm, `Reset OTP sent. Development OTP: ${resetOtp}`, true);
  });
  resetForm?.addEventListener("submit", event => {
    event.preventDefault(); if (!validate(resetForm)) return; const data = new FormData(resetForm), user = read(USER_KEY);
    if (!resetOtp || data.get("otp") !== resetOtp) return showMessage(resetForm, "The reset OTP is incorrect.");
    user.password = data.get("password"); localStorage.setItem(USER_KEY, JSON.stringify(user)); showMessage(resetForm, "Password updated successfully. You can now login.", true);
    setTimeout(() => { resetForm.hidden = true; loginForm.hidden = false; }, 1000);
  });

  const profileRoot = document.querySelector("[data-profile]");
  if (profileRoot) {
    const user=read(USER_KEY), session=read(SESSION_KEY), orders=read(ORDERS_KEY,[]);
    if (!user || !session || session.email !== user.email) location.replace("login.html");
    else {
      document.querySelectorAll("[data-user-name]").forEach(n=>n.textContent=user.name); document.querySelectorAll("[data-user-email]").forEach(n=>n.textContent=user.email); document.querySelectorAll("[data-user-phone]").forEach(n=>n.textContent=user.phone||"Not added");
      document.querySelector("[data-order-count]").textContent=orders.length;
      const renderOrders=node=>{if(!node||!orders.length)return;node.replaceChildren();orders.forEach(order=>{const card=document.createElement("article"),image=document.createElement("img"),copy=document.createElement("div"),title=document.createElement("h3"),detail=document.createElement("p"),price=document.createElement("strong");card.className="profile-order-card";image.src=order.items[0]?.image||"Assets/reyvo-logo.png";image.alt="";title.textContent=`Order #${order.id}`;detail.textContent=`${order.date} · ${order.items.length} product(s) · Confirmed`;price.textContent=`₹${order.total.toLocaleString("en-IN")}`;copy.append(title,detail);card.append(image,copy,price);node.append(card);});};
      renderOrders(document.querySelector("[data-recent-orders]"));renderOrders(document.querySelector("[data-all-orders]"));
    }
    document.querySelectorAll("[data-profile-tab]").forEach(button=>button.addEventListener("click",()=>{const tab=button.dataset.profileTab;document.querySelectorAll("[data-profile-tab]").forEach(item=>item.classList.toggle("is-active",item===button));document.querySelectorAll("[data-profile-panel]").forEach(panel=>panel.hidden=panel.dataset.profilePanel!==tab);profileRoot.scrollIntoView({behavior:"smooth",block:"start"});}));
  }
  document.querySelectorAll("[data-logout]").forEach(button=>button.addEventListener("click",()=>{localStorage.removeItem(SESSION_KEY);location.href="login.html";}));

  const checkoutItems = document.querySelector("[data-checkout-items]");
  if (checkoutItems) {
    const cart=read(CART_KEY,[]), subtotal=cart.reduce((sum,item)=>sum+item.price*item.qty,0), shipping=subtotal===0||subtotal>=499?0:49; let discount=0;
    const updateTotal=()=>document.querySelector("[data-checkout-total]").textContent=`₹${Math.max(subtotal+shipping-discount,0).toLocaleString("en-IN")}`;
    checkoutItems.replaceChildren();
    if(cart.length){cart.forEach(item=>{const card=document.createElement("article"),image=document.createElement("img"),copy=document.createElement("div"),title=document.createElement("h3"),detail=document.createElement("p"),price=document.createElement("strong");card.className="checkout-item";image.src=item.image;image.alt=item.name;title.textContent=item.name;detail.textContent=`${item.pack} sachets · Qty ${item.qty}`;price.textContent=`₹${(item.price*item.qty).toLocaleString("en-IN")}`;copy.append(title,detail);card.append(image,copy,price);checkoutItems.append(card);});}else{const empty=document.createElement("div"),note=document.createElement("p"),link=document.createElement("a");empty.className="summary-empty";note.textContent="Your cart is empty.";link.href="index.html#pricing";link.textContent="Shop products";empty.append(note,link);checkoutItems.append(empty);}
    document.querySelector("[data-checkout-subtotal]").textContent=`₹${subtotal.toLocaleString("en-IN")}`; document.querySelector("[data-checkout-shipping]").textContent=shipping?`₹${shipping}`:"Free"; updateTotal();
    const couponForm=document.querySelector("[data-coupon-form]"); couponForm?.addEventListener("submit",event=>{event.preventDefault();const code=new FormData(couponForm).get("coupon").trim().toUpperCase(),rates={REYVO10:.10,WELCOME15:.15},note=couponForm.querySelector("[data-coupon-message]");note.classList.remove("success");if(!code){note.textContent="Please enter a coupon code.";return}if(!cart.length){note.textContent="Add products before applying a coupon.";return}if(!rates[code]){discount=0;document.querySelector("[data-discount-row]").hidden=true;note.textContent="This coupon code is not valid.";updateTotal();return}discount=Math.round(subtotal*rates[code]);document.querySelector("[data-checkout-discount]").textContent=`−₹${discount.toLocaleString("en-IN")}`;document.querySelector("[data-discount-row]").hidden=false;note.textContent=`${code} applied successfully.`;note.classList.add("success");updateTotal();});
    const billingToggle=document.querySelector("[data-billing-toggle]"),billingFields=document.querySelector("[data-billing-fields]"); billingToggle?.addEventListener("change",()=>{const show=!billingToggle.checked;billingFields.hidden=!show;billingFields.querySelectorAll("textarea,input").forEach(input=>input.required=show);});
    const user=read(USER_KEY); if(user){document.querySelector("[name=name]").value=user.name||"";document.querySelector("[name=email]").value=user.email||"";document.querySelector("[name=phone]").value=user.phone||"";}
    const checkoutForm=document.querySelector("[data-checkout-form]"); checkoutForm?.addEventListener("submit",event=>{event.preventDefault();if(!validate(checkoutForm))return;if(!cart.length)return showMessage(checkoutForm,"Please add a product before placing your order.");showMessage(checkoutForm,"Order placed successfully! Preparing your confirmation…",true);const orders=read(ORDERS_KEY,[]);orders.unshift({id:String(Date.now()).slice(-6),date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),items:cart,total:Math.max(subtotal+shipping-discount,0)});localStorage.setItem(ORDERS_KEY,JSON.stringify(orders));localStorage.removeItem(CART_KEY);setTimeout(()=>{const confirmation=document.createElement("div"),title=document.createElement("strong"),detail=document.createElement("p");confirmation.className="order-success";title.textContent="Order confirmed!";detail.textContent="Your REYVO routine is being prepared. A confirmation will be sent to your email.";confirmation.append(title,detail);checkoutForm.replaceChildren(confirmation);},700);});
  }
})();
