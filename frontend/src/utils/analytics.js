const BRAND_NAME = "elitemart";

let currentPage = null;
let currentCustomer = null;
let delegatedClickTrackingEnabled = false;
let lastPageLoadKey = "";
const trackedPurchaseIds = new Set();

const toKebabLabel = (value) =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase();

const toTextValue = (value, fallback = "") => {
  if (value === 0 || value === false) return String(value);
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const toNumberValue = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const getPageEventName = (page = {}) => {
  const pageType = toKebabLabel(page.pageType || page.pageCategory || "page");

  switch (pageType) {
    case "home":
      return "home page load";
    case "product listing":
      return "product listing page load";
    case "product detail":
      return "product detail page load";
    case "checkout":
      return "checkout page load";
    case "thank you":
    case "order confirmation":
      return "thank you page load";
    case "order failure":
      return "order failure page load";
    case "cart":
      return "cart page load";
    case "account":
      return "account page load";
    default:
      return `${toKebabLabel(page.pageName || "page")} page load`;
  }
};

const EVENT_TYPE_MAP = {
  pageLoad: "application.screenView",
  linkClick: "web.webInteraction.linkClicks",
  purchase: "commerce.purchases",
};

const nowTimestamp = () => new Date().toISOString();

const readJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const initializeDataLayer = () => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.adobeDataLayer = window.adobeDataLayer || window.dataLayer;
};

export const buildCustomer = (user) => ({
  loginStatus: user ? "loggedin" : "guest",
  customerId: toTextValue(user?._id || user?.id),
  customerType: toTextValue(
    user?.customerType || user?.type || user?.role || "guest"
  ),
});

export const buildPage = (pathname = "/", search = "") => {
  const cleanPath = pathname === "/" ? "home" : pathname.replace(/^\/+/, "");
  const [firstSegment, secondSegment] = cleanPath.split("/");
  const searchParams = new URLSearchParams(search);
  const collection =
    secondSegment ||
    searchParams.get("category") ||
    searchParams.get("gender") ||
    "all";

  if (pathname.startsWith("/product/")) {
    return {
      pageName: `${BRAND_NAME}:product detail`,
      pageType: "product detail",
      pageCategory: "product",
      platform: "web",
      language: "en",
      journeyType: "shopping",
    };
  }

  if (pathname.startsWith("/collections/")) {
    return {
      pageName: `${BRAND_NAME}:collections:${toKebabLabel(collection)}`,
      pageType: "product listing",
      pageCategory: "collections",
      platform: "web",
      language: "en",
      journeyType: "shopping",
    };
  }

  if (pathname.startsWith("/checkout")) {
    return {
      pageName: `${BRAND_NAME}:checkout`,
      pageType: "checkout",
      pageCategory: "checkout",
      platform: "web",
      language: "en",
      journeyType: "checkout",
    };
  }

  if (pathname.startsWith("/order-confirmation")) {
    return {
      pageName: `${BRAND_NAME}:thank you`,
      pageType: "thank you",
      pageCategory: "checkout",
      platform: "web",
      language: "en",
      journeyType: "checkout",
    };
  }

  if (pathname.startsWith("/order-failure")) {
    return {
      pageName: `${BRAND_NAME}:order failure`,
      pageType: "order failure",
      pageCategory: "checkout",
      platform: "web",
      language: "en",
      journeyType: "checkout",
    };
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return {
      pageName: `${BRAND_NAME}:${toKebabLabel(firstSegment)}`,
      pageType: "account",
      pageCategory: "account",
      platform: "web",
      language: "en",
      journeyType: "account",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      pageName: `${BRAND_NAME}:admin:${toKebabLabel(secondSegment || "dashboard")}`,
      pageType: "admin",
      pageCategory: "admin",
      platform: "web",
      language: "en",
      journeyType: "admin",
    };
  }

  return {
    pageName: `${BRAND_NAME}:${toKebabLabel(cleanPath)}`,
    pageType: cleanPath === "home" ? "home" : "content",
    pageCategory: cleanPath === "home" ? "home" : toKebabLabel(firstSegment),
    platform: "web",
    language: "en",
    journeyType: cleanPath === "home" ? "homepage" : "shopping",
  };
};

export const setAnalyticsContext = ({ page, custData }) => {
  currentPage = page || currentPage;
  currentCustomer = custData || currentCustomer;
};

export const getAnalyticsContext = () => ({
  page: currentPage || buildPage(window.location.pathname, window.location.search),
  custData: currentCustomer || buildCustomer(null),
});

export const pushDataLayerEvent = (payload = {}) => {
  if (typeof window === "undefined") return;
  initializeDataLayer();
  const { page, custData } = getAnalyticsContext();
  const eventType = payload.eventType || EVENT_TYPE_MAP[payload.event] || "web.webInteraction.linkClicks";
  const eventPayload = {
    ...payload,
    eventType,
    timestamp: payload.timestamp || nowTimestamp(),
    page: payload.page || page,
    custData: payload.custData || custData,
  };
  window.dataLayer.push(eventPayload);
  if (window.adobeDataLayer && window.adobeDataLayer !== window.dataLayer) {
    window.adobeDataLayer.push(eventPayload);
  }
};

export const buildProduct = (product = {}) => ({
  productName: toTextValue(product.name || product.productName),
  productSKU: toTextValue(
    product.sku || product.productSKU || product.productId || product._id || product.id
  ),
  brand: toTextValue(product.brand),
  category: toTextValue(
    product.category || product.productCategory || product.collections || product.collection
  ),
  price: toNumberValue(product.price),
  currencyCode: toTextValue(product.currencyCode || "USD", "USD"),
  quantity: toNumberValue(product.quantity ?? 1, 1),
  selectedSize: toTextValue(product.selectedSize || product.size),
  selectedColor: toTextValue(product.selectedColor || product.color),
});

export const buildProductListItems = (products = []) =>
  (Array.isArray(products) ? products : []).map((product) => buildProduct(product));

export const buildCart = (cart = {}) => {
  const products = Array.isArray(cart.products) ? cart.products : [];
  const cartValue =
    cart.totalPrice ??
    products.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const totalItems =
    cart.totalItems ??
    products.reduce((total, item) => total + Number(item.quantity || 0), 0);

  return {
    cartValue: toNumberValue(cartValue),
    totalItems: toNumberValue(totalItems),
  };
};

export const buildProducts = buildProductListItems;

const normalizeEventName = (value) => toKebabLabel(value || "");

const getLinkURL = (element) => {
  if (element.dataset.analyticsUrl) return element.dataset.analyticsUrl;

  const explicitUrl = element.getAttribute("href");
  if (!explicitUrl) return window.location.href;
  try {
    return new URL(explicitUrl, window.location.origin).href;
  } catch {
    return explicitUrl;
  }
};

const getLinkPosition = (element) => {
  const section = element.closest("[data-analytics-position]");
  if (section?.dataset.analyticsPosition) return section.dataset.analyticsPosition;
  if (element.closest("header")) return "header";
  if (element.closest("nav")) return "navigation";
  if (element.closest("footer")) return "footer";
  if (element.closest("form")) return "form";
  if (element.closest("aside")) return "sidebar";
  return "main content";
};

const inferLinkType = (element) => {
  if (element.dataset.analyticsType) return element.dataset.analyticsType;
  if (element.closest("footer") && element.closest("a[href^='http']")) return "social media";
  if (element.closest("form")) return "form interaction";
  if (element.closest("nav")) return "navigation";
  if (element.tagName === "BUTTON") return "button";
  return "link";
};

const inferLinkName = (element) => {
  const dataName = element.dataset.analyticsName;
  if (dataName) return dataName;

  const label =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.innerText ||
    element.textContent;
  return toAnalyticsValue(toKebabLabel(label), "<clicked element>");
};

const inferEventName = (element) => {
  const explicitEventName = element.dataset.analyticsEventName;
  if (explicitEventName) return explicitEventName;

  const analyticsName = normalizeEventName(element.dataset.analyticsName);
  const analyticsType = normalizeEventName(element.dataset.analyticsType);
  const analyticsPosition = normalizeEventName(element.dataset.analyticsPosition);
  const href = element.getAttribute("href") || "";

  if (href === "/") return "home";

  if (analyticsType === "product card") return "view product";
  if (analyticsType === "product option") {
    if (analyticsPosition.includes("color")) return "color selection";
    if (analyticsPosition.includes("size")) return "size selection";
  }

  if (analyticsName === "shop now") return "shop now";
  if (analyticsName === "add to cart") return "add to cart";
  if (analyticsName === "buy now") return "buy now";
  if (analyticsName === "cart icon") return "cart click";
  if (analyticsName === "account icon") return "account click";
  if (analyticsName === "search icon" || analyticsName === "search submit" || analyticsName === "close search") return "search";
  if (analyticsName === "mobile menu" || analyticsName === "close menu") return "navigation";
  if (analyticsName === "previous arrow" || analyticsName === "next arrow") return "carousel navigation";
  if (analyticsName === "increase quantity") return "quantity increase";
  if (analyticsName === "decrease quantity") return "quantity decrease";
  if (analyticsName === "remove from cart") return "remove product";
  if (analyticsName === "checkout") return "proceed to checkout";
  if (analyticsName === "continue to payment") return "continue to payment";
  if (analyticsName === "newsletter subscribe") return "newsletter subscribe";
  if (analyticsType === "social media") return "social media";
  if (href.includes("/collections/")) return "category selection";
  if (href.includes("/product/")) return "view product";
  if (href.startsWith("tel:")) return "contact";

  const label = normalizeEventName(element.innerText || element.textContent);
  return analyticsName || analyticsType || label || "link click";
};

const handleDelegatedClick = (event) => {
  const element = event.target.closest("a, button, [role='button']");
  if (!element || element.dataset.analyticsSkip === "true") return;

  const product = readJson(element.dataset.analyticsProduct);
  pushDataLayerEvent({
    event: "linkClick",
    eventName: inferEventName(element),
    ...(product ? { product } : {}),
    linkInfo: {
      linkName: inferLinkName(element),
      linkType: inferLinkType(element),
      linkPosition: getLinkPosition(element),
      linkURL: getLinkURL(element),
    },
  });
};

export const enableDelegatedClickTracking = () => {
  if (typeof document === "undefined" || delegatedClickTrackingEnabled) return;
  document.addEventListener("click", handleDelegatedClick, true);
  delegatedClickTrackingEnabled = true;
};

export const trackPageLoad = ({ page, custData }) => {
  const pageLoadKey = `${window.location.pathname}|${window.location.search}|${page?.pageName}`;
  if (pageLoadKey === lastPageLoadKey) return;
  lastPageLoadKey = pageLoadKey;
  setAnalyticsContext({ page, custData });
  pushDataLayerEvent({
    event: "pageLoad",
    eventName: getPageEventName(page),
    page,
    custData,
  });
};

export const trackSearchSubmit = ({ searchTerm, resultCount }) => {
  pushDataLayerEvent({
    event: "linkClick",
    eventName: "search",
    linkInfo: {
      linkName: "search",
      linkType: "form interaction",
      linkPosition: "header search",
      linkURL: window.location.href,
    },
    search: {
      searchTerm: toTextValue(searchTerm),
      resultCount: toNumberValue(resultCount),
    },
  });
};

export const trackLinkClick = ({ eventName, linkInfo, product, page, custData }) => {
  pushDataLayerEvent({
    event: "linkClick",
    eventName,
    linkInfo,
    ...(product ? { product: buildProduct(product) } : {}),
    ...(page ? { page } : {}),
    ...(custData ? { custData } : {}),
  });
};

export const trackAddToCart = ({ product }) => {
  trackLinkClick({ eventName: "add to cart", product });
};

export const trackRemoveFromCart = ({ product }) => {
  trackLinkClick({ eventName: "remove product", product });
};

export const trackCartView = ({ cart }) => {
  pushDataLayerEvent({
    event: "pageLoad",
    eventName: "cart page load",
    page: buildPage("/cart"),
    cart: buildCart(cart),
    productListItems: buildProductListItems(cart?.products || []),
  });
};

export const trackCheckoutStart = ({ cart }) => {
  trackLinkClick({
    eventName: "proceed to checkout",
    linkInfo: {
      linkName: "checkout",
      linkType: "cta",
      linkPosition: "cart drawer",
      linkURL: window.location.href,
    },
    productListItems: buildProductListItems(cart?.products || []),
  });
};

export const trackPaymentSelection = ({ paymentMethod }) => {
  trackLinkClick({
    eventName: "payment selection",
    linkInfo: {
      linkName: toTextValue(paymentMethod),
      linkType: "checkout step",
      linkPosition: "checkout payment",
      linkURL: window.location.href,
    },
  });
};

export const trackOrderReview = () => {
  trackLinkClick({
    eventName: "order review",
    linkInfo: {
      linkName: "order review",
      linkType: "checkout step",
      linkPosition: "checkout shipping form",
      linkURL: window.location.href,
    },
  });
};

export const trackPurchase = ({ checkout }) => {
  const orderId = checkout?._id;
  if (orderId && trackedPurchaseIds.has(orderId)) return;
  if (orderId) trackedPurchaseIds.add(orderId);
  const checkoutItems = Array.isArray(checkout?.checkoutItems) ? checkout.checkoutItems : [];
  pushDataLayerEvent({
    event: "purchase",
    eventName: "purchase",
    cart: buildCart({
      _id: checkout?._id,
      products: checkoutItems,
      totalPrice: checkout?.totalPrice,
    }),
    productListItems: buildProductListItems(checkoutItems),
    order: {
      orderId: toTextValue(checkout?._id),
      paymentMethod: toTextValue(checkout?.paymentMethod),
      paymentStatus: toTextValue(checkout?.paymentStatus),
      status: toTextValue(checkout?.status),
      isPaid: Boolean(checkout?.isPaid),
      paidAt: checkout?.paidAt || null,
      finalizedAt: checkout?.finalizedAt || null,
      totalPrice: toNumberValue(checkout?.totalPrice),
      shippingAddress: checkout?.shippingAddress || null,
      createdAt: checkout?.createdAt || null,
    },
  });
};
