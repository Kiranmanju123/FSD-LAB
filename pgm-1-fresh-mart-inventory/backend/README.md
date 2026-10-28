# backend folder – the server part

| File | What is inside |
|------|----------------|
| `server.js` | only the server: Express setup + start the server |
| `api.js` | **all 7 APIs** (the list of APIs is written at the top as a comment) |
| `helper.js` | small helper functions + starting data |
| `db/schema.js` | MongoDB connection + Store schema/model (see [db/README.md](db/README.md)) |
| `package.json` | the backend packages (express, mongoose, cors) and the `npm start` command |
| `node_modules/` | the installed packages, created by `npm install` (not uploaded to GitHub) |

```
server.js  ──uses──>  api.js        (the APIs)
           ──uses──>  helper.js     (addStartingData)
           ──uses──>  db/schema.js  (connectDB)
api.js     ──uses──>  helper.js     (findCategoryIndex)
           ──uses──>  db/schema.js  (Store model)
```

**Run everything from inside this `backend` folder:**
```bash
cd backend
npm install --registry=https://registry.npmjs.org/
npm start
```
`npm start` runs `node server.js` (written in `package.json` under `"scripts"`).

---

## 1. All APIs (at a glance)

| No | Task | Method | URL | Send | Get back |
|----|------|--------|-----|------|----------|
| 1 | Task 1 – Welcome | `GET` | `/api/welcome?name=Ravi` | – | `{ message }` |
| 2 | Task 2 – Products | `GET` | `/api/products` | – | array of products |
| 3 | Task 2 – Bill | `POST` | `/api/purchase/total` | `{ items: [ { productId, quantity } ] }` | `{ bill, totalAmount }` |
| 4 | Task 3 – Categories | `GET` | `/api/categories` | – | `{ categories, count }` |
| 5 | Task 4 – Add | `POST` | `/api/categories` | `{ name }` | `{ message, categories }` |
| 6 | Task 4 – Remove | `DELETE` | `/api/categories/:name` | – | `{ message, categories }` |
| 7 | Task 5 – Search | `GET` | `/api/categories/search?name=Dairy` | – | `{ category, index, position, message }` |

You can open the `GET` APIs straight in the browser, for example http://localhost:3000/api/categories

---

## 2. server.js – only the server

```
server.js
 ├── 1. import packages      express, cors, path, schema.js, helper.js, api.js
 ├── 2. setup                app, PORT = 3000, middleware, app.use(apiRoutes)
 └── 3. startServer()        connect DB → add starting data → listen on port 3000
```

### 1. Import packages
```js
const express = require("express");                 // to build the server
const cors = require("cors");                       // allow calls from another address
const path = require("path");                       // to build folder paths
const { connectDB } = require("./db/schema");       // connect to the database
const { addStartingData } = require("./helper");    // insert starting data (first time)
const apiRoutes = require("./api");                 // all our APIs
```

### 2. Setup (middleware)
```js
app.use(cors());              // allow a page from another address (e.g. Live Server) to call us
app.use(express.json());      // read the JSON the browser sends → req.body
app.use(express.static(...)); // show frontend/index.html at http://localhost:3000
app.use(apiRoutes);           // add all the APIs from api.js to the app
```

### 3. startServer()
```js
await connectDB();        // 1. connect to MongoDB
await addStartingData();  // 2. first time only: insert Fresh Mart with categories + products
app.listen(PORT, ...);    // 3. start waiting for requests on port 3000
```

---

## 3. api.js – all the APIs

```
api.js
 ├── 1. comment at the top   list of APIs for each task
 ├── 2. imports              express, Store model, findCategoryIndex
 ├── 3. router               const router = express.Router();
 ├── 4. the 7 APIs           router.get / router.post / router.delete
 └── 5. export               module.exports = router;
```

A **router** is like a small group of APIs. We write the APIs on `router` in `api.js`,
export it, and `server.js` adds the whole group to the app with `app.use(apiRoutes)`.

### Every API has the same pattern
```js
router.get("/api/something", async function (req, res) {
  try {
    const store = await Store.findOne();   // 1. read the store from MongoDB
    // 2. do the work (array / maths)
    res.json({ ... });                      // 3. send the answer
  } catch (error) {
    res.status(500).json({ message: error.message });   // something broke
  }
});
```

| Where the data comes from | Example URL / body | Read it with |
|---------------------------|--------------------|--------------|
| query string (after `?`) | `/api/welcome?name=Ravi` | `req.query.name` |
| route parameter (`:name`) | `/api/categories/Household` | `req.params.name` |
| request body (JSON) | `{ "name": "Toys" }` | `req.body.name` |

---

## 4. Each API explained (api.js)

### API 1 – Welcome message (Task 1)
`GET /api/welcome?name=Ravi`
1. Read the store.
2. Take the name from `req.query.name`. If nothing was typed, use `"Guest"`.
3. Make the message with a **template string** `` `Hello ${name}! ...` ``.
```json
{ "message": "Hello Ravi! Welcome to Fresh Mart Supermarket. Happy shopping!" }
```

### API 2 – List products (Task 2)
`GET /api/products` → sends back `store.products` (the products array).
```json
[ { "_id": "6ac6a1...", "name": "Apple (1 kg)", "category": "Fruits", "price": 180, "stock": 40 }, ... ]
```

### API 3 – Calculate the bill (Task 2)
`POST /api/purchase/total`
```json
{ "items": [ { "productId": "6ac6a1...", "quantity": 2 }, { "productId": "6ac6a5...", "quantity": 3 } ] }
```
1. If `items` is empty → **400** *Please enter a quantity...*
2. For each item:
   - find the product with `store.products.id(productId)` → not found → **404**
   - quantity more than stock → **400** *Only 40 of Apple (1 kg) left in stock*
   - `amount = price × quantity`, add it to `totalAmount`, add one row to `bill`
3. Send the bill.
```json
{ "bill": [ { "name": "Apple (1 kg)", "price": 180, "quantity": 2, "amount": 360 },
            { "name": "Milk (1 litre)", "price": 56, "quantity": 3, "amount": 168 } ],
  "totalAmount": 528 }
```
> The browser sends only the **id and quantity**, never the price. The server takes the price from the database, so nobody can change the price in the browser to cheat.

### API 4 – Show categories (Task 3)
`GET /api/categories` → the array and its `length`.
```json
{ "categories": ["Fruits", "Vegetables", "Dairy", ...], "count": 8 }
```

### API 5 – Add a category (Task 4) → `push()`
`POST /api/categories` with body `{ "name": "Personal Care" }`
1. Name empty → **400**.
2. Already in the array (`findCategoryIndex` is not `-1`) → **400** *already exists*.
3. `store.categories.push(name)` adds it at the **end**, then `store.save()`.
```json
{ "message": "Category \"Personal Care\" added at position 9", "categories": [ ... ] }
```

### API 6 – Remove a category (Task 4) → `splice()`
`DELETE /api/categories/Household`
1. Find the index with `findCategoryIndex`. `-1` → **404** *not found*.
2. `store.categories.splice(index, 1)` removes **1** item at that index, then `store.save()`.

### API 7 – Search a category (Task 5) → `findIndex()`
`GET /api/categories/search?name=dairy`
1. Find the index. `-1` → **404** *not found*.
2. `position = index + 1` (arrays count from 0, people count from 1).
```json
{ "category": "Dairy", "index": 2, "position": 3,
  "message": "\"Dairy\" found at position 3 (array index 2)" }
```

---

## 5. helper.js

| Function / data | What it does | Used by |
|-----------------|--------------|---------|
| `startingStore` | the starting data: store name, 8 categories, 9 products | `addStartingData` |
| `addStartingData()` | if there is **no** store in MongoDB, insert `startingStore`. If there is one, do nothing | `startServer()` |
| `findCategoryIndex(categories, name)` | gives the index of `name` in the array, or **-1** if it is not there. Small/capital letters don't matter (`dairy` = `Dairy`) | APIs 5, 6, 7 |

```js
function findCategoryIndex(categories, name) {
  const searchName = String(name).trim().toLowerCase();   // "  dairy " -> "dairy"
  return categories.findIndex(function (category) {
    return category.toLowerCase() === searchName;          // check each item, one by one
  });
}
```
`findIndex` checks each item from index 0 and returns the index of the **first** match, or `-1` if none match.

---

## 6. Status codes we use

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | categories sent |
| 201 | Created | new category added |
| 400 | Bad input | empty name, already exists, not enough stock |
| 404 | Not found | category / product not found |
| 500 | Server error | MongoDB stopped |
