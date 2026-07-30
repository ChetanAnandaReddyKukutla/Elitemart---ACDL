import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import products from "../data/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedCheckoutsFilePath = path.join(__dirname, "../data/local-checkouts.json");
const seedOrdersFilePath = path.join(__dirname, "../data/local-orders.json");
const checkoutsFilePath =
  process.env.LOCAL_CHECKOUTS_FILE ||
  path.join(os.tmpdir(), "elitemart-local-checkouts.json");
const ordersFilePath =
  process.env.LOCAL_ORDERS_FILE || path.join(os.tmpdir(), "elitemart-local-orders.json");

const getProductById = (productId) =>
  products.find(
    (product) =>
      String(product._id || product.sku) === String(productId) ||
      product.sku === productId
  );

const enrichCheckoutItem = (item) => {
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
    name: item.name || product.name,
    image: item.image || product.images?.[0]?.url || "",
    price: item.price || product.price,
    sku: item.sku || product.sku,
    category: item.category || product.category,
    brand: item.brand || product.brand,
    currencyCode: item.currencyCode || "USD",
  };
};

const readJsonFile = async (filePath, seedFilePath) => {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsedContent = JSON.parse(fileContent);
    return Array.isArray(parsedContent) ? parsedContent : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      if (seedFilePath) {
        try {
          const seedContent = await fs.readFile(seedFilePath, "utf8");
          const parsedSeed = JSON.parse(seedContent);
          return Array.isArray(parsedSeed) ? parsedSeed : [];
        } catch {
          return [];
        }
      }

      return [];
    }

    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const upsertById = (records, record) => {
  const nextRecord = { ...record };
  const index = records.findIndex(
    (item) => String(item._id) === String(nextRecord._id)
  );

  if (index > -1) {
    records[index] = nextRecord;
  } else {
    records.push(nextRecord);
  }

  return nextRecord;
};

const getCheckoutDefaults = (checkout) => ({
  ...checkout,
  checkoutItems: Array.isArray(checkout.checkoutItems)
    ? checkout.checkoutItems.map(enrichCheckoutItem)
    : [],
  isPaid: Boolean(checkout.isPaid),
  isFinalized: Boolean(checkout.isFinalized),
});

export const createLocalCheckout = async ({
  user,
  checkoutItems,
  shippingAddress,
  paymentMethod,
  totalPrice,
}) => {
  const checkouts = await readJsonFile(checkoutsFilePath, seedCheckoutsFilePath);
  const checkout = getCheckoutDefaults({
    _id: randomUUID(),
    user,
    checkoutItems,
    shippingAddress,
    paymentMethod,
    totalPrice,
    isPaid: false,
    paymentStatus: "Pending",
    isFinalized: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  upsertById(checkouts, checkout);
  await writeJsonFile(checkoutsFilePath, checkouts);
  return checkout;
};

export const findLocalCheckoutById = async (id) => {
  const checkouts = await readJsonFile(checkoutsFilePath, seedCheckoutsFilePath);
  return checkouts.find((checkout) => String(checkout._id) === String(id)) || null;
};

export const updateLocalCheckoutPayment = async (id, { paymentStatus, paymentDetails }) => {
  const checkouts = await readJsonFile(checkoutsFilePath, seedCheckoutsFilePath);
  const index = checkouts.findIndex((checkout) => String(checkout._id) === String(id));

  if (index === -1) {
    return null;
  }

  checkouts[index] = {
    ...checkouts[index],
    isPaid: paymentStatus === "paid",
    paymentStatus,
    paymentDetails,
    paidAt: paymentStatus === "paid" ? new Date().toISOString() : checkouts[index].paidAt,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(checkoutsFilePath, checkouts);
  return checkouts[index];
};

export const finalizeLocalCheckout = async (id) => {
  const checkouts = await readJsonFile(checkoutsFilePath, seedCheckoutsFilePath);
  const checkoutIndex = checkouts.findIndex((checkout) => String(checkout._id) === String(id));

  if (checkoutIndex === -1) {
    return null;
  }

  const checkout = checkouts[checkoutIndex];
  if (!checkout.isPaid) {
    const error = new Error("Checkout is not paid");
    error.statusCode = 400;
    throw error;
  }

  if (checkout.isFinalized) {
    const error = new Error("Checkout already finalized");
    error.statusCode = 400;
    throw error;
  }

  const orders = await readJsonFile(ordersFilePath, seedOrdersFilePath);
  const order = {
    _id: randomUUID(),
    user: checkout.user,
    orderItems: checkout.checkoutItems,
    shippingAddress: checkout.shippingAddress,
    paymentMethod: checkout.paymentMethod,
    totalPrice: checkout.totalPrice,
    isPaid: true,
    paidAt: checkout.paidAt || new Date().toISOString(),
    isDelivered: false,
    paymentStatus: "paid",
    paymentDetails: checkout.paymentDetails,
    status: "Processing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(order);
  await writeJsonFile(ordersFilePath, orders);

  checkouts[checkoutIndex] = {
    ...checkout,
    isFinalized: true,
    finalizedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFile(checkoutsFilePath, checkouts);

  return order;
};

export const listLocalOrdersForUser = async (userId) => {
  const orders = await readJsonFile(ordersFilePath, seedOrdersFilePath);
  return orders.filter((order) => String(order.user) === String(userId));
};

export const findLocalOrderById = async (id) => {
  const orders = await readJsonFile(ordersFilePath, seedOrdersFilePath);
  return orders.find((order) => String(order._id) === String(id)) || null;
};
