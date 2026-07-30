import mongoose from "mongoose";
import Product from "../models/product.model.js";
import localProducts from "../data/products.js";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const normalizeLocalProduct = (product, index) => ({
  ...product,
  _id: product._id || product.sku || `local-${index + 1}`,
});

const getLocalCatalog = () => localProducts.map(normalizeLocalProduct);

const parseList = (value) =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const applyLocalFilters = (catalog, query) => {
  let results = [...catalog];
  const {
    collection,
    size,
    color,
    gender,
    minPrice,
    maxPrice,
    sortBy,
    search,
    category,
    material,
    brand,
    limit,
  } = query;

  if (collection && collection.toLowerCase() !== "all") {
    results = results.filter(
      (product) => product.collections?.toLowerCase() === collection.toLowerCase()
    );
  }

  if (category && category.toLowerCase() !== "all") {
    results = results.filter(
      (product) => product.category?.toLowerCase() === category.toLowerCase()
    );
  }

  if (material) {
    const materials = parseList(material).map((item) => item.toLowerCase());
    results = results.filter((product) =>
      materials.includes(String(product.material || "").toLowerCase())
    );
  }

  if (brand) {
    const brands = parseList(brand).map((item) => item.toLowerCase());
    results = results.filter((product) =>
      brands.includes(String(product.brand || "").toLowerCase())
    );
  }

  if (size) {
    const sizes = parseList(size).map((item) => item.toLowerCase());
    results = results.filter((product) =>
      Array.isArray(product.sizes) &&
      product.sizes.some((item) => sizes.includes(String(item).toLowerCase()))
    );
  }

  if (color) {
    const colors = parseList(color).map((item) => item.toLowerCase());
    results = results.filter((product) =>
      Array.isArray(product.colors) &&
      product.colors.some((item) => colors.includes(String(item).toLowerCase()))
    );
  }

  if (gender) {
    results = results.filter(
      (product) => product.gender?.toLowerCase() === gender.toLowerCase()
    );
  }

  if (minPrice || maxPrice) {
    results = results.filter((product) => {
      const price = Number(product.price);
      if (minPrice && price < Number(minPrice)) {
        return false;
      }
      if (maxPrice && price > Number(maxPrice)) {
        return false;
      }
      return true;
    });
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    results = results.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
    );
  }

  if (sortBy) {
    const sortedResults = [...results];
    switch (sortBy) {
      case "priceAsc":
        sortedResults.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        sortedResults.sort((a, b) => b.price - a.price);
        break;
      case "popularity":
        sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    results = sortedResults;
  }

  if (limit) {
    results = results.slice(0, Number(limit));
  }

  return results;
};

export const createProduct = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ message: "Database is not connected" });
  }

  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      user: req.user._id,
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.log("Error in createdProduct Controller ", error);
    res.status(500).send("Server Error");
  }
};

export const updateProduct = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ message: "Database is not connected" });
  }

  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.discountPrice = discountPrice || product.discountPrice;
      product.countInStock = countInStock || product.countInStock;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.sizes = sizes || product.sizes;
      product.colors = colors || product.colors;
      product.collections = collections || product.collections;
      product.material = material || product.material;
      product.gender = gender || product.gender;
      product.images = images || product.images;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished =
        isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags || product.tags;
      product.dimensions = dimensions || product.dimensions;
      product.weight = weight || product.weight;
      product.sku = sku || product.sku;
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in updateProduct Controller ", error);
    res.status(500).send("Server Error");
  }
};

export const deleteProduct = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ message: "Database is not connected" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product Deleted" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in deleteProduct Controller ", error);
    res.status(500).send("Server Error");
  }
};

export const getProducts = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.json(applyLocalFilters(getLocalCatalog(), req.query));
  }

  try {
    const {
      collection,
      size,
      color,
      gender,
      minPrice,
      maxPrice,
      sortBy,
      search,
      category,
      material,
      brand,
      limit,
    } = req.query;

    let query = {};

    // Filter Logic
    if (collection && collection.toLowerCase() !== "all") {
      query.collections = collection;
    }
    if (category && category.toLowerCase() !== "all") {
      query.category = category;
    }
    if (material) {
      query.material = { $in: material.split(",") };
    }
    if (brand) {
      query.brand = { $in: brand.split(",") };
    }
    if (size) {
      query.sizes = { $in: size.split(",") };
    }
    if (color) {
      query.colors = { $in: [color] };
    }
    if (gender) {
      query.gender = gender;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "popularity":
          sort = { rating: -1 };
          break;
        default:
          break;
      }
    }

    // Fetch Products and Apply Sorting and Limit
    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit) || 0);

    res.json(products);
  } catch (error) {
    console.error("Error in getProducts Controller:", error);
    res.status(500).send("Server Error");
  }
};

export const getProductById = async (req, res) => {
  if (!isDatabaseReady()) {
    const product = getLocalCatalog().find(
      (item) => item._id === req.params.id || item.sku === req.params.id
    );

    if (product) {
      return res.json(product);
    }

    return res.status(404).json({ message: "Product not found" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error in getProductById Controller:", error);
    res.status(500).send("Server Error");
  }
};

export const getSimilarProducts = async (req, res) => {
  const { id } = req.params;

  if (!isDatabaseReady()) {
    const product = getLocalCatalog().find(
      (item) => item._id === id || item.sku === id
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const similarProducts = getLocalCatalog()
      .filter(
        (item) =>
          item._id !== product._id &&
          item.gender === product.gender &&
          item.category === product.category
      )
      .slice(0, 4);

    return res.json(similarProducts);
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    const similarProducts = await Product.find({
      _id: { $ne: id },
      gender: product.gender,
      category: product.category,
    }).limit(4);
    res.json(similarProducts);
  } catch (error) {
    console.error("Error in getSimilarProducts Controller:", error);
    res.status(500).send("Server Error");
  }
};

export const getBestSellingProducts = async (req, res) => {
  if (!isDatabaseReady()) {
    const bestSeller = getLocalCatalog().reduce((currentBest, product) => {
      if (!currentBest || (product.rating || 0) > (currentBest.rating || 0)) {
        return product;
      }
      return currentBest;
    }, null);

    if (bestSeller) {
      return res.json(bestSeller);
    }

    return res.status(404).json({ message: "No best seller found" });
  }

  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });
    if (bestSeller) {
      res.json(bestSeller);
    } else {
      res.status(404).json({ message: "No best seller found" });
    }
  } catch (error) {
    console.error("Error in getBestSellingProducts Controller:", error);
    res.status(500).send("Server Error");
  }
};

export const getNewArrivals = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.json(getLocalCatalog().slice(-8));
  }

  try {
    const newArrivals = await Product.find().sort({ created: -1 }).limit(8);
    res.json(newArrivals);
  } catch (error) {
    console.log("Error in getNewArrivals Controller ", error);
    res.status(500).send("Server Error");
  }
};

