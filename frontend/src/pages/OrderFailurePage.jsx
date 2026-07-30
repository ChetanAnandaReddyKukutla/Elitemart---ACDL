import React from "react";
import { Link, useNavigate } from "react-router-dom";

const OrderFailurePage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Payment Failed
        </p>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Your payment did not go through.
        </h1>
        <p className="mt-4 text-gray-700">
          You can retry the checkout flow or go back to continue shopping.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="rounded bg-black px-5 py-3 text-white font-semibold hover:bg-gray-800 transition"
          >
            Try Again
          </button>
          <Link
            to="/collections/all"
            className="rounded border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-white transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderFailurePage;