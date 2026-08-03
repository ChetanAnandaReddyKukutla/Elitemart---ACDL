import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import { logout } from "../../redux/slices/authSlice";
import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL, apiUrl, isLocalBackend } from "../../config/api";
import {
  buildCustomer,
  trackCheckoutStart,
  trackOrderReview,
  trackPaymentSelection,
  pushDataLayerEvent,
} from "../../utils/analytics.js";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { loading: checkoutLoading, error: checkoutError } = useSelector(
    (state) => state.checkout
  );
  const { user } = useSelector((state) => state.auth);
  const cartProducts = Array.isArray(cart?.products) ? cart.products : [];
  const [checkoutId, setCheckoutId] = useState(null);
  const [checkoutSubmitError, setCheckoutSubmitError] = useState("");
  const checkoutStartTracked = useRef(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  // Ensure cart is loaded before proceeding
  useEffect(() => {
    if (!loading && cartProducts.length === 0) {
      navigate("/");
    }
  }, [cartProducts.length, loading, navigate]);

  useEffect(() => {
    if (!checkoutStartTracked.current && cartProducts.length > 0) {
      trackCheckoutStart({ cart });
      checkoutStartTracked.current = true;
    }
  }, [cart, cartProducts.length]);

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    setCheckoutSubmitError("");

    if (!user || !localStorage.getItem("userToken")) {
      const message = "Please sign in again to continue to payment.";
      setCheckoutSubmitError(message);
      toast.error(message);
      navigate("/login?redirect=checkout");
      return;
    }

    if (cartProducts.length > 0) {
      try {
        const checkout = await dispatch(
          createCheckout({
            checkoutItems: cartProducts,
            shippingAddress,
            paymentMethod: "Paypal",
            totalPrice: cart.totalPrice,
          })
        ).unwrap();

        if (!checkout?._id) {
          throw new Error("Checkout was created without a payment session.");
        }

        setCheckoutId(checkout._id);
        pushDataLayerEvent({
          event: "linkClick",
          custData: buildCustomer(user),
          shipping: {
            shippingMethod: "standard",
            shippingCountry: shippingAddress.country || "unknown",
            shippingCity: shippingAddress.city || "unknown",
          },
          linkInfo: {
            linkName: "shipping selected",
            linkType: "checkout step",
            linkPosition: "checkout shipping form",
            linkURL: window.location.href,
          },
        });
        trackPaymentSelection({ paymentMethod: "Paypal" });
        trackOrderReview();
      } catch (error) {
        const message =
          error?.message || "Unable to continue to payment. Please try again.";
        const isAuthError =
          error?.status === 401 ||
          error?.status === 403 ||
          /token|unauthorized|forbidden|sign in/i.test(message);

        setCheckoutSubmitError(message);
        toast.error(message);

        if (isAuthError) {
          dispatch(logout());
          navigate("/login?redirect=checkout");
        }
      }
    }
  };
  const handlePaymentSuccess = async (details) => {
    try {
      await axios.put(
        apiUrl(`/api/checkout/${checkoutId}/pay`),
        { paymentStatus: "paid", paymentDetails: details },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      await handleFinalizeCheckout(checkoutId);
    } catch (error) {
      console.log(error);
    }
  };

  const handleContinueToBuy = async () => {
    if (!checkoutId) {
      return;
    }

    await handlePaymentSuccess({
      id: `LOCAL-${Date.now()}`,
      status: "COMPLETED",
      source: "local-test",
    });
  };

  const handleOrderFailure = () => {
    navigate("/order-failure");
  };

  const handleFinalizeCheckout = async (checkoutId) => {
    try {
      await axios.post(
        apiUrl(`/api/checkout/${checkoutId}/finalize`),
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      navigate("/order-confirmation");
    } catch (error) {
      console.error(error);
    }
  };
  if (loading) return <p>Loading Cart...</p>;
  if (error) return <p>Error:{error}</p>;
  if (cartProducts.length === 0) {
    return <p>Your cart is empty.</p>;
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user ? user.email : ""}
              className="w-full border p-2 rounded"
              disabled
            />
          </div>
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) => {
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                });
              }}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Postal Code</label>
              <input
                type="text"
                value={shippingAddress.postalCode}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    postalCode: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              value={shippingAddress.country}
              onChange={(e) => {
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                });
              }}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => {
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                });
              }}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {(checkoutSubmitError || checkoutError) && (
            <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {checkoutSubmitError || checkoutError}
            </p>
          )}
          <div className="mt-6">
            {!checkoutId ? (
              <button
                type="submit"
                disabled={checkoutLoading}
                data-analytics-name="continue to payment"
                data-analytics-type="form interaction"
                data-analytics-position="checkout shipping form"
                className="w-full bg-black text-white py-3 rounded disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {checkoutLoading ? "Continuing..." : "Continue to Payment"}
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4">Pay With Paypal</h3>
                <PayPalButton
                  amount={cart.totalPrice}
                  onSuccess={handlePaymentSuccess}
                  onError={() => {
                    alert("Payment failed. Try again.");
                  }}
                />
                  {isLocalBackend ? (
                    <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-3">
                        Local test actions
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleContinueToBuy}
                          data-analytics-name="continue to buy"
                          data-analytics-type="cta"
                          data-analytics-position="checkout payment"
                          className="w-full rounded bg-black px-4 py-3 text-white font-semibold hover:bg-gray-800 transition"
                        >
                          Continue to Buy
                        </button>
                        <button
                          type="button"
                          onClick={handleOrderFailure}
                          data-analytics-name="order failure"
                          data-analytics-type="cta"
                          data-analytics-position="checkout payment"
                          className="w-full rounded border border-red-500 px-4 py-3 text-red-600 font-semibold hover:bg-red-50 transition"
                        >
                          Order Failure
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        Use these buttons to simulate success or failure during local testing.
                      </p>
                    </div>
                  ) : null}
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Right Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t py-4 mb-4">
          {cartProducts.map((product, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between py-2 border-b"
            >
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover border-b"
                />
                <div>
                  <h3 className="text-md ">{product.name}</h3>
                  <p className="text-gray-500">Size: {product.size}</p>
                  <p className="text-gray-500">Color: {product.color}</p>
                </div>
              </div>
              <p className="text-xl">${product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>${cart.totalPrice?.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t">
          <p>Total</p>
          <p>${cart.totalPrice?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
