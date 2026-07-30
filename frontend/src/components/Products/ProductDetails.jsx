import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductDetails,
  fetchSimilarProduct,
} from "../../redux/slices/productsSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import {
  buildProduct,
  pushDataLayerEvent,
  trackAddToCart,
  trackProductPageLoad,
} from "../../utils/analytics";

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedProduct, loading, error, similarProducts } = useSelector(
    (state) => state.products
  );
  const { user, guestId } = useSelector((state) => state.auth);
  const images = Array.isArray(selectedProduct?.images)
    ? selectedProduct.images
    : [];
  const colors = Array.isArray(selectedProduct?.colors)
    ? selectedProduct.colors
    : [];
  const sizes = Array.isArray(selectedProduct?.sizes)
    ? selectedProduct.sizes
    : [];
  const [mainImage, setMainImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const productPageLoadKey = useRef("");

  const productFetchId = productId || id;
  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProduct({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
    const nextImages = Array.isArray(selectedProduct?.images)
      ? selectedProduct.images
      : [];
    const nextSizes = Array.isArray(selectedProduct?.sizes)
      ? selectedProduct.sizes
      : [];
    const nextColors = Array.isArray(selectedProduct?.colors)
      ? selectedProduct.colors
      : [];

    setMainImage(nextImages[0]?.url || null);
    setSelectedSize(nextSizes[0] || "");
    setSelectedColor(nextColors[0] || "");
    setSelectedQuantity(1);
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const nextProductKey = selectedProduct._id || selectedProduct.id || productFetchId;
    if (productPageLoadKey.current === nextProductKey) return;
    productPageLoadKey.current = nextProductKey;

    trackProductPageLoad({
      product: {
        ...selectedProduct,
        selectedSize: Array.isArray(selectedProduct.sizes)
          ? selectedProduct.sizes[0]
          : "",
        quantity: 1,
      },
    });
  }, [productFetchId, selectedProduct]);

  const handleQuantityChange = (action) => {
    if (action === "plus") setSelectedQuantity((prev) => prev + 1);
    if (action === "minus" && selectedQuantity > 1)
      setSelectedQuantity((prev) => prev - 1);
  };
  const handleAddToCart = () => {
    const size = selectedSize || sizes[0] || "";
    const color = selectedColor || colors[0] || "";

    if (!size || !color) {
      toast.error("Please select a size and color before adding to cart.", {
        duration: 1000,
      });
      return;
    }
    setIsButtonDisabled(true);
    dispatch(
      addToCart({
        productId: productFetchId,
        quantity:selectedQuantity,
        size,
        color,
        guestId,
        userId: user?._id,
      })
    )
      .unwrap()
      .then(() => {
        trackAddToCart({
          product: {
            ...selectedProduct,
            size,
            color,
            quantity: selectedQuantity,
          },
        });
        toast.success("Product added to cart!", { duration: 1000 });
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to add product to cart.", {
          duration: 1500,
        });
      })
      .finally(() => {
        setIsButtonDisabled(false);
      });
  };
  if(loading){
    return <p>Loading...</p>
  }
  if(error){
    return <p>Error:{error}</p>
  }
  return (
    <div className="p-6">
      {selectedProduct && (
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
        <div className="flex flex-col md:flex-row">
          <div className="hidden md:flex flex-col space-y-4 mr-6">
            {images.map((image, idx) => (
              <img
                key={idx}
                src={image.url}
                alt={image.altText || `Thumbnail ${idx}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                  mainImage === image.url ? "border-black" : "border-gray-300"
                }`}
                onClick={() => {
                  setMainImage(image.url);
                  pushDataLayerEvent({
                    event: "linkClick",
                    product: buildProduct({
                      ...selectedProduct,
                      selectedSize,
                      quantity: selectedQuantity,
                    }),
                    linkInfo: {
                      linkName: image.altText || selectedProduct.name || "product image",
                      linkType: "product image",
                      linkPosition: "product detail thumbnails",
                      linkURL: image.url,
                    },
                  });
                }}
              />
            ))}
          </div>
          <div className="md:w-1/2">
            <div className="mb-4 h-full">
              <img
                src={mainImage}
                alt="Main Product"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
          {/* Mobile Thumbnail */}
          <div className="md:hidden flex overscroll-x-scroll space-x-4 mb-4">
            {images.map((image, idx) => (
              <img
                key={idx}
                src={image.url}
                alt={image.altText || `Thumbnail ${idx}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                  mainImage === image.url ? "border-black" : "border-gray-300"
                }`}
                onClick={() => {
                  setMainImage(image.url);
                  pushDataLayerEvent({
                    event: "linkClick",
                    product: buildProduct({
                      ...selectedProduct,
                      selectedSize,
                      quantity: selectedQuantity,
                    }),
                    linkInfo: {
                      linkName: image.altText || selectedProduct.name || "product image",
                      linkType: "product image",
                      linkPosition: "product detail thumbnails",
                      linkURL: image.url,
                    },
                  });
                }}
              />
            ))}
          </div>
          <div className="md:w-1/2 md:ml-10">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">
              {selectedProduct.name}
            </h1>
            <p className="text-lg text-gray-600 mb-1 line-through">
              {selectedProduct.originalPrice &&
                `$ ${selectedProduct.originalPrice}`}
            </p>
            <p className="text-xl mb-2 text-gray-500">
              $ {selectedProduct.price}
            </p>
            <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
            <div className="mb-4">
              <p className="text-gray-700">Color:</p>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      pushDataLayerEvent({
                        event: "linkClick",
                        product: buildProduct({
                          ...selectedProduct,
                          selectedSize,
                          quantity: selectedQuantity,
                        }),
                        linkInfo: {
                          linkName: color,
                          linkType: "product option",
                          linkPosition: "product detail color",
                          linkURL: window.location.href,
                        },
                      });
                    }}
                    data-analytics-skip="true"
                    className={`w-8 h-8 rounded-full border cursor-pointer ${
                      selectedColor === color
                        ? "border-4 border-black"
                        : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: color.toLowerCase(),
                      filter: "brightness(0.5)",
                    }}
                  ></button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Size:</p>
              <div className="flex gap-2 mt-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      pushDataLayerEvent({
                        event: "linkClick",
                        product: buildProduct({
                          ...selectedProduct,
                          selectedSize: size,
                          quantity: selectedQuantity,
                        }),
                        linkInfo: {
                          linkName: size,
                          linkType: "product option",
                          linkPosition: "product detail size",
                          linkURL: window.location.href,
                        },
                      });
                    }}
                    data-analytics-skip="true"
                    className={`px-4 py-2 rounded border cursor-pointer ${
                      selectedSize === size ? "bg-black text-white" : ""
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">Quantity:</p>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg cursor-pointer"
                  onClick={() => handleQuantityChange("minus")}
                >
                  -
                </button>
                <span className="text-lg">{selectedQuantity}</span>
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg cursor-pointer"
                  onClick={() => handleQuantityChange("plus")}
                >
                  +
                </button>
              </div>
            </div>
            <button
              className={`bg-black text-white py-2 px-6 rounded w-full mb-4 ${
                isButtonDisabled
                  ? "disabled:bg-gray-300 cursor-not-allowed"
                  : "hover:bg-gray-900"
              }`}
              onClick={handleAddToCart}
              disabled={isButtonDisabled}
              data-analytics-name="add to cart"
              data-analytics-type="product cta"
              data-analytics-position="product detail"
              data-analytics-product={JSON.stringify(
                buildProduct({
                  ...selectedProduct,
                  selectedSize,
                  quantity: selectedQuantity,
                })
              )}
            >
              {isButtonDisabled ? "Adding..." : "ADD TO CART"}
            </button>
            <div className="mt-10 text-gray-700">
              <h3 className="text-xl font-bold mb-4">Characteristics:</h3>
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  <tr>
                    <td className="py-1">Brand</td>
                    <td className="py-1">{selectedProduct.brand}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Material</td>
                    <td className="py-1">{selectedProduct.material}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-20">
          <h2 className="text-2xl text-center font-medium mb-4">
            You May Also Like
          </h2>
          <ProductGrid products={similarProducts} loading={loading} error={error} />
        </div>
      </div>)}
    </div>
  );
};

export default ProductDetails;
