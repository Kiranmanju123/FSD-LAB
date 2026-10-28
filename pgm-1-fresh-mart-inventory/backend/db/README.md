# backend/db folder – the database part

This folder has only **one file**: `schema.js`.
It tells our program **where** MongoDB is and **what shape** our data has.

It is inside `backend` because only the backend talks to MongoDB, and `schema.js`
uses the `mongoose` package installed in `backend/node_modules`.

---

## 1. Why only ONE collection?

Fresh Mart has only **one store**. So we keep **everything in one document**:

- the store name
- the **categories** (an array of strings)
- the **products** (an array of objects)

```
Database:    freshmart
Collection:  stores
Documents:   only 1  (Fresh Mart Supermarket)
```

---

## 2. How the ONE document looks inside MongoDB

```js
{
  _id: ObjectId("6ac69c4b..."),             // MongoDB adds this id itself
  storeName: "Fresh Mart Supermarket",
  categories: ["Fruits", "Vegetables", "Dairy", "Bakery",
               "Beverages", "Snacks", "Frozen Foods", "Household"],
  products: [
    { _id: ObjectId("6ac6a1..."), name: "Apple (1 kg)",   category: "Fruits", price: 180, stock: 40 },
    { _id: ObjectId("6ac6a2..."), name: "Milk (1 litre)", category: "Dairy",  price: 56,  stock: 30 },
    ...
  ],
  createdAt: ISODate("2026-10-28T09:00:00Z"),  // added by { timestamps: true }
  updatedAt: ISODate("2026-10-28T09:00:00Z"),  // changes every time we save
  __v: 0                                       // version number, Mongoose adds it
}
```

Every product inside the `products` array also gets its **own `_id`**.
We use this `_id` to know **which** product the customer is buying (Task 2).

---

## 3. The fields

| Field | Type | Example | Used in |
|-------|------|---------|---------|
| `storeName` | String (required) | `"Fresh Mart Supermarket"` | Task 1 – welcome message |
| `categories` | Array of Strings | `["Fruits", "Dairy"]` | Tasks 3, 4, 5 |
| `products` | Array of Objects | see below | Task 2 – bill |
| `createdAt` | Date (automatic) | `2026-10-28T09:00:00Z` | when the store was created |
| `updatedAt` | Date (automatic) | `2026-10-28T09:30:00Z` | when it was last changed |

Each object in `products`:

| Field | Type | Example |
|-------|------|---------|
| `_id` | ObjectId (automatic) | `6ac6a1...` |
| `name` | String | `"Milk (1 litre)"` |
| `category` | String | `"Dairy"` |
| `price` | Number | `56` (price of 1 unit, in ₹) |
| `stock` | Number | `30` (how many we have) |

---

## 4. The code, line by line

```js
const mongoose = require("mongoose");
```
Loads **Mongoose**. Mongoose is a package that lets us use MongoDB with normal JavaScript objects.

```js
const MONGO_URL = "mongodb://127.0.0.1:27017/freshmart";
```
The address of our database:

| Part | Meaning |
|------|---------|
| `mongodb://` | we are talking to MongoDB |
| `127.0.0.1` | this computer (we use it instead of `localhost`, which sometimes fails with new Node versions) |
| `27017` | the port MongoDB runs on (default) |
| `freshmart` | our database name. MongoDB creates it by itself the first time we save data |

```js
async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}
```
Connects to MongoDB. `await` waits until the connection is ready.
`serverSelectionTimeoutMS: 5000` means: if MongoDB is not running, stop trying after 5 seconds and show an error (instead of waiting 30 seconds).

```js
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
```
The **schema** is the "shape" of our document: which fields it has and their types.

- `required: true` → `storeName` must be given, or Mongoose will not save.
- `[String]` → an **array of strings**. `default: []` → start with an empty array.
- `products: [ { ... } ]` → an **array of objects**. Each object is one product.
- `{ timestamps: true }` → Mongoose adds `createdAt` and `updatedAt` for us and fills them in.

```js
const Store = mongoose.model("Store", storeSchema);
```
The **model** is what we use in the code to read and save data.
Mongoose names the collection from the model name: `"Store"` → small letters + plural → **`stores`**.

Model functions we use in the backend:

| Function | What it does |
|----------|--------------|
| `Store.findOne()` | get the store document |
| `Store.create({...})` | insert the store document (first time only) |
| `store.save()` | save the changes we made to the document |
| `store.products.id(id)` | find one product inside the array by its `_id` |

```js
module.exports = { connectDB, Store };
```
Shares `connectDB` and `Store` with other files. The backend files get them with:
```js
const { connectDB } = require("./db/schema");   // in server.js
const { Store } = require("./db/schema");       // in api.js and helper.js
```

---

## 5. Where does the starting data come from?

We do **not** have a separate migration script.
When the server starts, `addStartingData()` in `backend/helper.js` checks:

- **no store in the database** → it inserts Fresh Mart with 8 categories and 9 products
- **store already there** → it does nothing (so our changes are kept)

---

## 6. See the data yourself

```bash
mongosh
```
```
use freshmart
db.stores.find()
```

**Reset to the starting data:** run `db.stores.drop()` in mongosh, then restart the server (`npm start`). The store is created again.
