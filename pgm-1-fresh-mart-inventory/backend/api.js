/*
  APIs used in this program

  Task 1 - Display a welcome message for customers
    GET    /api/welcome?name=Ravi              -> welcome message

  Task 2 - Calculate total purchase amount
    GET    /api/products                       -> list of products
    POST   /api/purchase/total                 -> calculate the bill and total amount

  Task 3 - Manage product categories using arrays
    GET    /api/categories                     -> show the categories array

  Task 4 - Add and remove categories dynamically
    POST   /api/categories                     -> add a category      (push)
    DELETE /api/categories/:name               -> remove a category   (splice)

  Task 5 - Search a category and show its position
    GET    /api/categories/search?name=Dairy   -> search a category   (findIndex)
*/

const express = require("express");
const { Store } = require("./db/schema");
const { findCategoryIndex } = require("./helper");

const router = express.Router();

router.get("/api/welcome", async function (req, res) {
  try {
    const store = await Store.findOne();
    let name = req.query.name;
    if (!name) {
      name = "Guest";
    }
    res.json({ message: `Hello ${name}! Welcome to ${store.storeName}. Happy shopping!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/products", async function (req, res) {
  try {
    const store = await Store.findOne();
    res.json(store.products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/purchase/total", async function (req, res) {
  try {
    const items = req.body.items;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Please enter a quantity for at least one product" });
    }

    const store = await Store.findOne();
    let totalAmount = 0;
    const bill = [];

    for (const item of items) {
      const product = store.products.id(item.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} of ${product.name} left in stock` });
      }

      const amount = product.price * item.quantity;
      totalAmount = totalAmount + amount;
      bill.push({ name: product.name, price: product.price, quantity: item.quantity, amount: amount });
    }

    res.json({ bill: bill, totalAmount: totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/categories", async function (req, res) {
  try {
    const store = await Store.findOne();
    res.json({ categories: store.categories, count: store.categories.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/categories", async function (req, res) {
  try {
    const name = req.body.name;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const store = await Store.findOne();
    if (findCategoryIndex(store.categories, name) !== -1) {
      return res.status(400).json({ message: `Category "${name}" already exists` });
    }

    store.categories.push(name);
    await store.save();
    res.status(201).json({
      message: `Category "${name}" added at position ${store.categories.length}`,
      categories: store.categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/api/categories/:name", async function (req, res) {
  try {
    const name = req.params.name;
    const store = await Store.findOne();
    const index = findCategoryIndex(store.categories, name);
    if (index === -1) {
      return res.status(404).json({ message: `Category "${name}" not found` });
    }

    store.categories.splice(index, 1);
    await store.save();
    res.json({ message: `Category "${name}" removed`, categories: store.categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/categories/search", async function (req, res) {
  try {
    const name = req.query.name;
    const store = await Store.findOne();
    const index = findCategoryIndex(store.categories, name);
    if (index === -1) {
      return res.status(404).json({ message: `Category "${name}" not found` });
    }

    const position = index + 1;
    res.json({
      category: store.categories[index],
      index: index,
      position: position,
      message: `"${store.categories[index]}" found at position ${position} (array index ${index})`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
