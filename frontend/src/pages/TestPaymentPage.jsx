import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import axios from "axios";
import { setCheckout } from "../../redux/slices/checkoutSlice";

const TestPaymentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { checkoutId } = location.state || {};
  const { user } = useSelector((state) => state.auth);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!checkoutId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>No checkout ID found. Please return to checkout.</p>
        <button
          onClick={() => navigate("/cart")}
          className="mt-4 bg-black text-white py-2 px-4 rounded"
        >
          Return to Cart
        </button>
      </div>
    );
  }

  const handlePaymentSuccess = async (details) => {
    setPaymentLoading(true);
    setSubmitError("");

    try {
      const { data: paidCheckout } = await axios.put(
        apiUrl(`/api/checkout/${checkoutId}/pay`),
        { paymentStatus: "paid", paymentDetails: details },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      await handleFinalizeCheckout(checkoutId, paidCheckout);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Payment was captured, but we could not complete your order.";
      setSubmitError(message);
      toast.error(message);
      setPaymentLoading(false);
    }
  };

  const handleFinalizeCheckout = async (checkoutId, paidCheckout) => {
    try {
      const { data: order } = await axios.post(
        apiUrl(`/api/checkout/${checkoutId}/finalize`),
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      const confirmedOrder = {
        ...(paidCheckout || {}),
        ...(order || {}),
        checkoutItems: order?.orderItems || paidCheckout?.checkoutItems || [],
        orderItems: order?.orderItems || paidCheckout?.checkoutItems || [],
        checkoutId,
        orderId: order?._id,
        isPaid: true,
        paymentStatus: "paid",
      };

      dispatch(setCheckout(confirmedOrder));
      sessionStorage.setItem(
        "lastConfirmedOrder",
        JSON.stringify(confirmedOrder)
      );
      navigate("/order-confirmation");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to finalize your order. Please contact support.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleTestPaymentSubmit = async () => {
    await handlePaymentSuccess({
      id: `TEST-${Date.now()}`,
      status: "COMPLETED",
      source: "test-payment",
    });
  };

  const handlePaymentFailure = () => {
    navigate("/order-failure");
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8 mt-16">
      <h2 className="text-2xl font-bold text-center mb-6">Test Payment</h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Mock Bank Details</h3>
        <p>
          <strong>Bank:</strong> Test Bank
        </p>
        <p>
          <strong>Account Number:</strong> **** **** **** 1234
        </p>
        <p>
          <strong>Name:</strong> {user?.name || "Test User"}
        </p>
      </div>

      {submitError && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <button
          onClick={handleTestPaymentSubmit}
          disabled={paymentLoading}
          className="w-full bg-black text-white py-3 rounded disabled:bg-gray-400"
        >
          {paymentLoading ? "Processing..." : "Submit Payment"}
        </button>
        <button
          onClick={handlePaymentFailure}
          className="w-full bg-red-600 text-white py-3 rounded"
        >
          Simulate Payment Failure
        </button>
      </div>
    </div>
  );
};

export default TestPaymentPage;
