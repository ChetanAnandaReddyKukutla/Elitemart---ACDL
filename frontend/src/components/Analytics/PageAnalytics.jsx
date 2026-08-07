import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  buildCustomer,
  buildPage,
  buildCart,
  buildProductListItems,
  enableDelegatedClickTracking,
  setAnalyticsContext,
  trackPageLoad,
} from "../../utils/analytics.js";

const PageAnalytics = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { checkout } = useSelector((state) => state.checkout);

  useEffect(() => {
    enableDelegatedClickTracking();
  }, []);

  useEffect(() => {
    const page = buildPage(location.pathname, location.search);
    const custData = buildCustomer(user);

    if (location.pathname.startsWith("/product/")) {
      setAnalyticsContext({ page, custData });
      return;
    }

    if (location.pathname.startsWith("/checkout")) {
      trackPageLoad({
        page,
        custData,
        cart: buildCart(cart),
        productListItems: buildProductListItems(cart?.products || []),
      });
      return;
    }

    if (location.pathname.startsWith("/order-confirmation")) {
      trackPageLoad({
        page,
        custData,
        cart: buildCart({
          products: checkout?.checkoutItems || [],
          totalPrice: checkout?.totalPrice,
        }),
        productListItems: buildProductListItems(checkout?.checkoutItems || []),
        order: checkout
          ? {
              orderId: checkout._id,
              paymentMethod: checkout.paymentMethod,
              paymentStatus: checkout.paymentStatus,
              status: checkout.status,
              isPaid: checkout.isPaid,
              paidAt: checkout.paidAt,
              finalizedAt: checkout.finalizedAt,
              totalPrice: checkout.totalPrice,
              shippingAddress: checkout.shippingAddress,
              createdAt: checkout.createdAt,
            }
          : null,
      });
      return;
    }

    trackPageLoad({
      page,
      custData,
    });
  }, [location.pathname, location.search, cart, checkout]);

  useEffect(() => {
    const page = buildPage(location.pathname, location.search);
    const custData = buildCustomer(user);
    setAnalyticsContext({ page, custData });
  }, [user, location.pathname, location.search]);

  return null;
};

export default PageAnalytics;
