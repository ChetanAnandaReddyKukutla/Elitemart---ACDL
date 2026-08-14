import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  buildCustomer,
  buildPage,
  enableDelegatedClickTracking,
  setAnalyticsContext,
  trackPageLoad,
} from "../../utils/analytics.js";

const PageAnalytics = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

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

    trackPageLoad({
      page,
      custData,
    });
  }, [location.pathname, location.search, user]);

  return null;
};

export default PageAnalytics;
