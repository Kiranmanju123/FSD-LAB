# Lab Record – Program 1

Write these **8 parts in this order** in the record book.
Text, tables and code go on the **right page** (ruled). Diagrams go on the **left page** (blank, in pencil).

| Part | What to write | Page |
|------|---------------|------|
| 1 | Question | Right |
| 2 | Database design | Right |
| 3 | API design | Right |
| 4 | Architecture | Left |
| 5 | Frontend design | Left |
| 6 | Code – MongoDB connection, Node server, APIs | Right |
| 7 | Output | Left |
| 8 | Result | Right |

---

## 1. Question

**Online Grocery Store Inventory Management (Fresh Mart Supermarket)**

Fresh Mart Supermarket wants to digitize its inventory system. The store manager needs a web app
that shows product categories, calculates customer purchase totals, and updates categories as
products are added or discontinued.

**Tasks:**
1. Display a welcome message for customers.
2. Calculate the total purchase amount.
3. Manage product categories using arrays.
4. Add and remove categories dynamically.
5. Search a category and show its position.

---

## 2. Database Design

**Database:** `freshmart`  **Collection:** `stores` (one document for the one store)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | unique id (added by MongoDB) |
| `storeName` | String | name of the store |
| `categories` | Array of String | product categories |
| `products` | Array of Object | each product: `name`, `category`, `price`, `stock` |
| `createdAt` | Date | created time (automatic) |
| `updatedAt` | Date | last changed time (automatic) |

**Sample document:**
```
{
  storeName  : "Fresh Mart Supermarket",
  categories : [ "Fruits", "Vegetables", "Dairy", "Bakery", ... ],
  products   : [ { name: "Apple (1 kg)", category: "Fruits", price: 180, stock: 40 },
                 { name: "Milk (1 litre)", category: "Dairy", price: 56, stock: 30 }, ... ],
  createdAt  : Date,
  updatedAt  : Date
}
```

---

## 3. API Design

| Task | Method | URL | Input | Output |
|------|--------|-----|-------|--------|
| 1 | GET | `/api/welcome?name=Ravi` | name | welcome message |
| 2 | GET | `/api/products` | – | list of products |
| 2 | POST | `/api/purchase/total` | product id + quantity | bill and total amount |
| 3 | GET | `/api/categories` | – | categories array and count |
| 4 | POST | `/api/categories` | category name | category added (`push`) |
| 4 | DELETE | `/api/categories/:name` | category name | category removed (`splice`) |
| 5 | GET | `/api/categories/search?name=Dairy` | category name | position (`findIndex`) |

---

## 4. Architecture

```
 +--------------+   request (fetch)   +-------------------+   Mongoose   +-------------+
 |   FRONTEND   | ------------------> |      BACKEND      | -----------> |  DATABASE   |
 |  index.html  |                     |  server.js        |              |  MongoDB    |
 |  script.js   | <------------------ |  api.js           | <----------- |  freshmart  |
 |  (browser)   |   response (JSON)   |  Express, port    |   document   |  └ stores   |
 +--------------+                     |  3000             |              +-------------+
                                      +-------------------+
```

---

## 5. Frontend Design

```
+------------------------------------------------------+
|     FRESH MART SUPERMARKET - Inventory Management    |
+------------------------------------------------------+
| Task 1: Welcome    [ Name       ] (Show Welcome)     |
|   Hello Ravi! Welcome to Fresh Mart Supermarket.     |
+------------------------------------------------------+
| Task 2: Purchase                                     |
|   Product      | Price | Stock | Quantity            |
|   Apple (1 kg) |  180  |  40   | [ 2 ]               |
|   Milk         |   56  |  30   | [ 3 ]               |
|   (Calculate Total)        TOTAL = Rs. 528           |
+------------------------------------------------------+
| Task 3: Categories   1. Fruits  2. Vegetables  ...   |
+------------------------------------------------------+
| Task 4: [ Category   ]  (Add)  (Remove)              |
+------------------------------------------------------+
| Task 5: [ Category   ]  (Search)                     |
|   "Dairy" found at position 3                        |
+------------------------------------------------------+
```

---

## 6. Code

### 6a. MongoDB connection – `backend/db/schema.js`
```js
const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/freshmart";

async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    categories: { type: [String], default: [] },
    products: [
      {
        name: String,
        category: String,
        price: Number,
        stock: Number
      }
    ]
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);

module.exports = { connectDB, Store };
```

### 6b. Node server – `backend/server.js`
```js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db/schema");
const { addStartingData } = require("./helper");
const apiRoutes = require("./api");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(apiRoutes);

async function startServer() {
  try {
    await connectDB();
    await addStartingData();
    app.listen(PORT, function () {
      console.log(`Server is running. Open http://localhost:${PORT} in your browser`);
    });
  } catch (error) {
    console.log("Could not connect to MongoDB:", error.message);
  }
}

startServer();
```

### 6c. APIs – `backend/api.js`
(The comment at the top of `api.js` is the same as Part 3, so it is not written again.)

```js
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
```

**Helper function used by the APIs** (in `backend/helper.js`):
```js
function findCategoryIndex(categories, name) {
  const searchName = String(name).trim().toLowerCase();
  return categories.findIndex(function (category) {
    return category.toLowerCase() === searchName;
  });
}
```

---

## 7. Output

```
Connected to MongoDB -> mongodb://127.0.0.1:27017/freshmart
Server is running. Open http://localhost:3000 in your browser
```

| Task | Input | Output |
|------|-------|--------|
| 1 | name = `Ravi` | Hello Ravi! Welcome to Fresh Mart Supermarket. Happy shopping! |
| 2 | Apple = 2, Milk = 3 | Total purchase amount: Rs. 528 |
| 3 | open the page | 8 categories: Fruits, Vegetables, Dairy, ... |
| 4 | add `Personal Care` | Category "Personal Care" added at position 9 |
| 4 | remove `Household` | Category "Household" removed |
| 5 | search `Dairy` | "Dairy" found at position 3 (array index 2) |

---

## 8. Result

The Fresh Mart inventory web application was developed using Node.js, Express.js and MongoDB,
and all five tasks were executed successfully.
