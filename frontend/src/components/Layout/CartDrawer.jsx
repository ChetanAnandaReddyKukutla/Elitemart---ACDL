import React from "react";
import { HiMiniXMark } from "react-icons/hi2";
import CartContents from "../Cart/CartContents";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { trackCartView } from "../../utils/analytics";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const userId = user ? user._id : null;
  React.useEffect(() => {
    if (drawerOpen && cart?.products?.length > 0) {
      trackCartView({ cart });
    }
  }, [cart, drawerOpen]);

  const handleCheckout = () => {
    toggleCartDrawer("");
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };
  return (
    <div
      className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-[30rem] h-full bg-white shadow-lg transform transition-transform duration-300 flex flex-col z-50 ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer}>
          <HiMiniXMark className="w-6 h-6 text-gray-300 cursor-pointer hover:text-gray-800" />
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {cart && cart?.products?.length > 0 ? (
          <CartContents cart={cart} userId={userId} guestId={guestId} />
        ) : (
          <p>Your Cart is empty.</p>
        )}
      </div>
      <div className="p-4 bg-white sticky bottom-0">
        {cart && cart?.products?.length > 0 && (
          <>
            <button
              onClick={handleCheckout}
              data-analytics-name="checkout"
              data-analytics-type="cta"
              data-analytics-position="cart drawer"
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              Checkout
            </button>
            <p className="text-sm tracking-tighter text-gray-500 mt-2 text-center">
              Shipping, taxes, and discount codes calculated at checkout
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
