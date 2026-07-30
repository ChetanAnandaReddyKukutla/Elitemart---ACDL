import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";
import {
  buildProduct,
  trackRemoveFromCart,
} from "../../utils/analytics";

const CartContents = ({ cart, userId, guestId }) => {
  const dispatch = useDispatch();
  const products = Array.isArray(cart?.products) ? cart.products : [];
  // Handle Adding or Subtracting to cart
  const handleAddToCart = (productId, delta, quantity, size, color) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: newQuantity,
          guestId,
          userId,
          size,
          color,
        })
      );
    }
  };
  const handleRemoveFromCart = (productId, size, color) => {
    const product = products.find(
      (item) =>
        item.productId === productId && item.size === size && item.color === color
    );
    dispatch(removeFromCart({ productId, guestId, userId, size, color }))
      .unwrap()
      .then(() => {
        trackRemoveFromCart({ product });
      });
  };

  return (
    <div>
      {products.map((product, index) => (
        <div
          key={index}
          className="flex justify-between items-start py-4 border-b"
        >
          <div className="flex items-start">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-24 object-cover mr-4 rounded"
            />
            <div>
              <h3>{product.name}</h3>
              <p className="text-sm text-gray-500">
                size: {product.size} | color: {product.color}
              </p>
              <div className="flex items-center mt-2">
                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      -1,
                      product.quantity,
                      product.size,
                      product.color
                    )
                  }
                  data-analytics-name="decrease quantity"
                  data-analytics-type="cart interaction"
                  data-analytics-position="cart drawer"
                  data-analytics-product={JSON.stringify(buildProduct(product))}
                  className="border rounded px-2 py-1 text-xl font-medium"
                >
                  -
                </button>
                <span className="mx-4 ">{product.quantity}</span>
                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      1,
                      product.quantity,
                      product.size,
                      product.color
                    )
                  }
                  data-analytics-name="increase quantity"
                  data-analytics-type="cart interaction"
                  data-analytics-position="cart drawer"
                  data-analytics-product={JSON.stringify(buildProduct(product))}
                  className="border rounded px-2 py-1 text-xl font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div>
            <p>${product.price.toLocaleString()}</p>
            <button
              onClick={() =>
                handleRemoveFromCart(
                  product.productId,
                  product.size,
                  product.color
                )
              }
              data-analytics-name="remove from cart"
              data-analytics-type="cart interaction"
              data-analytics-position="cart drawer"
              data-analytics-product={JSON.stringify(buildProduct(product))}
            >
              <RiDeleteBin3Line className="h-6 w-6 text-red-600 mt-2 cursor-pointer" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;
