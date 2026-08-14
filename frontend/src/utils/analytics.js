const BRAND_NAME = "elitemart";
const DEFAULT_CURRENCY = "USD";
const UNKNOWN_VALUE = "unknown";

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

const toAnalyticsValue = (value, fallback = UNKNOWN_VALUE) => {
  if (value === 0) return "0";
  if (value === false) return "false";
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue || normalizedValue.startsWith("<")) return fallback;
  return normalizedValue;
};

const toAnalyticsNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const getTimestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const getEventType = (eventName, eventType) => {
  if (eventType) return eventType;
  if (eventName === "purchase") return "commerce.purchases";
  if (eventName === "pageLoad") return "application.screenView";
  return "web.webInteraction.linkClicks";
};

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
  customerID: toAnalyticsValue(user?._id || user?.id, "anonymous"),
  customerType: toAnalyticsValue(
    user?.customerType || user?.type || user?.role || "guest"
  ),
});

export const buildPage = (pathname = "/", search = "") => {
  const cleanPath = pathname === "/" ? "home" : pathname.replace(/^\/+/, "");
  const [firstSegment, secondSegment] = cleanPath.split("/");
  const searchParams = new URLSearchParams(search);
  const collection = secondSegment || searchParams.get("category") || searchParams.get("gender") || "all";

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
      pageName: `${BRAND_NAME}:order confirmation`,
      pageType: "order confirmation",
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
  const eventPayload = {
    ...payload,
    timestamp: payload.timestamp || getTimestamp(),
    eventType: getEventType(payload.event, payload.eventType),
    page: payload.page || page,
    custData: payload.custData || custData,
  };
  window.dataLayer.push(eventPayload);
  if (window.adobeDataLayer && window.adobeDataLayer !== window.dataLayer) {
    window.adobeDataLayer.push(eventPayload);
  }
};

export const buildProduct = (product = {}) => {
  const quantity = toAnalyticsNumber(product.quantity, 1);
  const price = toAnalyticsNumber(product.price || product.priceTotal, 0);
  const selectedSize =
    product.selectedSize ||
    product.size ||
    (Array.isArray(product.sizes) ? product.sizes[0] : undefined);

  return {
    productName: toAnalyticsValue(product.name || product.productName),
    productSKU: toAnalyticsValue(
      product.sku || product.SKU || product.productSKU || product.productId || product._id || product.id
    ),
    price: toAnalyticsValue(price),
    quantity,
    category: toAnalyticsValue(product.category || product.productCategory || product.collections),
    brand: toAnalyticsValue(product.brand),
    selectedSize: toAnalyticsValue(selectedSize),
    currencyCode: toAnalyticsValue(product.currencyCode || product.currency, DEFAULT_CURRENCY),
  };
};

const buildProductListItem = (product = {}) => {
  const builtProduct = buildProduct(product);
  return {
    name: builtProduct.productName,
    SKU: builtProduct.productSKU,
    quantity: builtProduct.quantity,
    priceTotal: toAnalyticsValue(
      toAnalyticsNumber(builtProduct.price) * toAnalyticsNumber(builtProduct.quantity, 1)
    ),
    selectedSize: builtProduct.selectedSize,
    category: builtProduct.category,
    brand: builtProduct.brand,
    currencyCode: builtProduct.currencyCode,
  };
};

export const buildCart = (cart = {}) => {
  const products = Array.isArray(cart.products) ? cart.products : [];
  const cartValue =
    cart.totalPrice ??
    products.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const totalItems =
    cart.totalItems ??
    products.reduce((total, item) => total + Number(item.quantity || 0), 0);

  return {
    cartValue: toAnalyticsValue(cartValue),
    totalItems: toAnalyticsValue(totalItems),
  };
};

export const buildProducts = (products = []) =>
  products.map((product) => buildProduct(product));

export const buildProductListItems = (products = []) =>
  products.map((product) => buildProductListItem(product));

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

const handleDelegatedClick = (event) => {
  const element = event.target.closest("a, button, [role='button']");
  if (!element || element.dataset.analyticsSkip === "true") return;

  const product = readJson(element.dataset.analyticsProduct);
  pushDataLayerEvent({
    event: "linkClick",
    ...(product ? { product: buildProduct(product) } : {}),
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
  const pageLoadKey = `${page?.pageName}|${custData?.customerID}|${window.location.href}`;
  if (pageLoadKey === lastPageLoadKey) return;
  lastPageLoadKey = pageLoadKey;
  setAnalyticsContext({ page, custData });
  pushDataLayerEvent({
    event: "pageLoad",
    page,
    custData,
  });
};

export const trackSearchSubmit = ({ searchTerm, resultCount }) => {
  pushDataLayerEvent({
    event: "linkClick",
    search: {
      searchTerm: toAnalyticsValue(searchTerm),
      resultCount: toAnalyticsValue(resultCount),
    },
  });
};

export const trackProductPageLoad = ({ product }) => {
  pushDataLayerEvent({
    event: "pageLoad",
    product: buildProduct(product),
  });
};

export const trackAddToCart = ({ product }) => {
  const productWithQuantity = {
    ...product,
    quantity: product?.quantity || 1,
  };
  pushDataLayerEvent({
    event: "linkClick",
    product: buildProduct(productWithQuantity),
    productListItems: buildProductListItems([productWithQuantity]),
    commerce: {
      productListAdds: {
        value: 1,
      },
    },
  });
};

export const trackRemoveFromCart = ({ product }) => {
  pushDataLayerEvent({
    event: "linkClick",
    product: buildProduct(product),
  });
};

export const trackCartView = ({ cart }) => {
  const products = Array.isArray(cart?.products) ? cart.products : [];
  pushDataLayerEvent({
    event: "pageLoad",
    cart: buildCart(cart),
    productListItems: buildProductListItems(products),
  });
};

export const trackCheckoutStart = ({ cart }) => {
  const products = Array.isArray(cart?.products) ? cart.products : [];
  pushDataLayerEvent({
    event: "pageLoad",
    cart: buildCart(cart),
    productListItems: buildProductListItems(products),
  });
};

export const trackPaymentSelection = ({ paymentMethod }) => {
  pushDataLayerEvent({
    event: "linkClick",
    payment: {
      paymentMethod: toAnalyticsValue(paymentMethod),
    },
  });
};

export const trackOrderReview = () => {
  pushDataLayerEvent({
    event: "linkClick",
    linkInfo: {
      linkName: "order review",
      linkType: "checkout step",
      linkPosition: "checkout payment",
      linkURL: typeof window !== "undefined" ? window.location.href : "",
    },
  });
};

export const trackPurchase = ({ checkout }) => {
  const orderId = checkout?.orderId || checkout?._id;
  if (orderId && trackedPurchaseIds.has(orderId)) return;
  if (orderId) trackedPurchaseIds.add(orderId);
  const checkoutItems = Array.isArray(checkout?.checkoutItems)
    ? checkout.checkoutItems
    : checkout?.orderItems || [];
  pushDataLayerEvent({
    event: "purchase",
    cart: buildCart({
      products: checkoutItems,
      totalPrice: checkout?.totalPrice,
    }),
    productListItems: buildProductListItems(checkoutItems),
    transaction: {
      orderId: toAnalyticsValue(orderId),
      revenue: toAnalyticsValue(checkout?.totalPrice),
      tax: toAnalyticsValue(checkout?.tax || 0),
      shipping: toAnalyticsValue(checkout?.shipping || 0),
      discount: toAnalyticsValue(checkout?.discount || 0),
      currency: toAnalyticsValue(checkout?.currency || "USD"),
    },
    commerce: {
      purchases: {
        value: 1,
      },
    },
  });
};
