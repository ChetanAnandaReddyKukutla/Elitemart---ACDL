import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import products from "../data/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedCartsFilePath = path.join(__dirname, "../data/local-carts.json");
const cartsFilePath =
  process.env.LOCAL_CARTS_FILE || path.join(os.tmpdir(), "elitemart-local-carts.json");

const getLocalProducts = () =>
  products.map((product) => ({
    ...product,
    _id: product._id || product.sku,
  }));

const readCartsFile = async () => {
  try {
    const fileContent = await fs.readFile(cartsFilePath, "utf8");
    const parsedCarts = JSON.parse(fileContent);
    return Array.isArray(parsedCarts) ? parsedCarts : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        const seedContent = await fs.readFile(seedCartsFilePath, "utf8");
        const seedCarts = JSON.parse(seedContent);
        return Array.isArray(seedCarts) ? seedCarts : [];
      } catch {
        return [];
      }
    }

    throw error;
  }
};

const writeCartsFile = async (carts) => {
  await fs.mkdir(path.dirname(cartsFilePath), { recursive: true });
  const tempFilePath = `${cartsFilePath}.${process.pid}.tmp`;
  await fs.writeFile(tempFilePath, `${JSON.stringify(carts, null, 2)}\n`, "utf8");
  await fs.rename(tempFilePath, cartsFilePath);
};

const getCartKey = ({ userId, guestId }) => userId || guestId || null;

const getProductById = (productId) =>
  getLocalProducts().find(
    (product) => String(product._id) === String(productId) || product.sku === productId
  );

const enrichCartItem = (item) => {
  const product = getProductById(item.productId);
  if (!product) {
    return {
      ...item,
      sku: item.sku || String(item.productId || ""),
      category: item.category || "unknown",
      brand: item.brand || "unknown",
      currencyCode: item.currencyCode || "USD",
    };
  }

  return {
    ...item,
    productId: item.productId || product._id,
    name: item.name || product.name,
    image: item.image || product.images?.[0]?.url || "",
    price: item.price || product.price,
    sku: item.sku || product.sku,
    category: item.category || product.category,
    brand: item.brand || product.brand,
    currencyCode: item.currencyCode || "USD",
  };
};

const sanitizeCart = (cart) => ({
  ...cart,
  products: Array.isArray(cart.products) ? cart.products.map(enrichCartItem) : [],
  totalPrice: Number(cart.totalPrice || 0),
});

const recalculateCartTotal = (cart) => {
  cart.totalPrice = cart.products.reduce(
    (accumulator, item) => accumulator + Number(item.price) * Number(item.quantity),
    0
  );
  return cart;
};

export const getLocalCart = async ({ userId, guestId }) => {
  const key = getCartKey({ userId, guestId });
  if (!key) {
    return null;
  }

  const carts = await readCartsFile();
  const cart = carts.find(
    (item) => String(item.user || item.guestId) === String(key)
  );
  return cart ? sanitizeCart(cart) : null;
};

export const saveLocalCart = async (cart) => {
  const carts = await readCartsFile();
  const nextCart = sanitizeCart(cart);
  const existingIndex = carts.findIndex(
    (item) =>
      String(item.user || item.guestId) === String(nextCart.user || nextCart.guestId)
  );

  if (existingIndex > -1) {
    carts[existingIndex] = nextCart;
  } else {
    carts.push(nextCart);
  }

  await writeCartsFile(carts);
  return nextCart;
};

export const addLocalCartItem = async ({ productId, quantity, size, color, userId, guestId }) => {
  const product = getProductById(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 400;
    throw error;
  }

  const existingCart = (await getLocalCart({ userId, guestId })) || {
    user: userId || undefined,
    guestId: guestId || undefined,
    products: [],
    totalPrice: 0,
  };

  const productIndex = existingCart.products.findIndex(
    (item) =>
      String(item.productId) === String(productId) &&
      item.size === size &&
      item.color === color
  );

  if (productIndex > -1) {
    existingCart.products[productIndex].quantity += Number(quantity);
  } else {
    existingCart.products.push({
      productId: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      price: product.price,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      currencyCode: "USD",
      size,
      color,
      quantity: Number(quantity),
    });
  }

  recalculateCartTotal(existingCart);
  return saveLocalCart(existingCart);
};

export const updateLocalCartItem = async ({ productId, quantity, size, color, userId, guestId }) => {
  const cart = await getLocalCart({ userId, guestId });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const productIndex = cart.products.findIndex(
    (item) =>
      String(item.productId) === String(productId) &&
      item.size === size &&
      item.color === color
  );

  if (productIndex === -1) {
    const error = new Error("Product not found in cart");
    error.statusCode = 404;
    throw error;
  }

  if (Number(quantity) > 0) {
    cart.products[productIndex].quantity = Number(quantity);
  } else {
    cart.products.splice(productIndex, 1);
  }

  recalculateCartTotal(cart);
  return saveLocalCart(cart);
};

export const deleteLocalCartItem = async ({ productId, size, color, userId, guestId }) => {
  const cart = await getLocalCart({ userId, guestId });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const productIndex = cart.products.findIndex(
    (item) =>
      String(item.productId) === String(productId) &&
      item.size === size &&
      item.color === color
  );

  if (productIndex === -1) {
    const error = new Error("Product not found in cart");
    error.statusCode = 404;
    throw error;
  }

  cart.products.splice(productIndex, 1);
  recalculateCartTotal(cart);
  return saveLocalCart(cart);
};

export const mergeLocalCart = async ({ guestId, user }) => {
  const guestCart = await getLocalCart({ guestId });
  const userCart = await getLocalCart({ userId: user?._id });

  if (!guestCart) {
    const error = new Error("Guest Cart not found");
    error.statusCode = 404;
    throw error;
  }

  if (guestCart.products.length === 0) {
    const error = new Error("Guest Cart is Empty");
    error.statusCode = 400;
    throw error;
  }

  const nextUserCart = userCart || {
    user: user?._id,
    products: [],
    totalPrice: 0,
  };

  guestCart.products.forEach((guestItem) => {
    const productIndex = nextUserCart.products.findIndex(
      (item) =>
        String(item.productId) === String(guestItem.productId) &&
        item.size === guestItem.size &&
        item.color === guestItem.color
    );

    if (productIndex > -1) {
      nextUserCart.products[productIndex].quantity += guestItem.quantity;
    } else {
      nextUserCart.products.push(guestItem);
    }
  });

  recalculateCartTotal(nextUserCart);
  await saveLocalCart(nextUserCart);

  const carts = await readCartsFile();
  const filteredCarts = carts.filter(
    (item) => String(item.guestId || "") !== String(guestId)
  );
  await writeCartsFile(filteredCarts);

  return nextUserCart;
};
