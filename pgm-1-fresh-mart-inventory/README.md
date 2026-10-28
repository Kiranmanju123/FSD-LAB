# FSD Lab – Program 1
## Online Grocery Store Inventory Management (Fresh Mart Supermarket)

**Scenario:** Fresh Mart Supermarket wants to digitize its inventory system. The store manager needs
a web app that shows product categories, calculates customer purchase totals, and updates
categories as products are added or discontinued.

| # | Task | API | Main idea |
|---|------|-----|-----------|
| 1 | Display a welcome message for customers | `GET /api/welcome` | template string |
| 2 | Calculate total purchase amount | `GET /api/products`, `POST /api/purchase/total` | loop, `price × quantity` |
| 3 | Manage product categories using arrays | `GET /api/categories` | array, `length` |
| 4 | Add and remove categories dynamically | `POST /api/categories`, `DELETE /api/categories/:name` | `push()`, `splice()` |
| 5 | Search a category and show its position | `GET /api/categories/search` | `findIndex()`, position = index + 1 |

---

## 1. Folder structure

```
pgm-1-fresh-mart-inventory/
├── backend/
│   ├── db/
│   │   ├── schema.js      -> MongoDB connection + Store schema/model (ONE collection)
│   │   └── README.md      -> explains the database code
│   ├── server.js          -> server setup + start (no APIs here)
│   ├── api.js             -> all 7 APIs (list of APIs at the top)
│   ├── helper.js          -> helper functions + starting data
│   ├── package.json       -> backend packages (express, mongoose, cors) + npm start
│   ├── package-lock.json
│   ├── node_modules/      -> created by "npm install" (not uploaded to GitHub)
│   └── README.md          -> explains every API
├── frontend/
│   ├── index.html         -> the web page
│   └── script.js          -> calls the APIs using fetch()
├── .gitignore             -> tells Git not to upload node_modules
├── RECORD.md              -> how to write this program in the lab record
└── README.md              -> this file
```

**Why is `package.json` inside `backend`?** The backend and the frontend each keep their **own** packages.
The backend packages (express, mongoose, cors) live in `backend/node_modules`. If we later build the
frontend with React, it gets its own `package.json` and `node_modules` inside `frontend`.
The `db` folder is inside `backend` because only the backend talks to MongoDB, and `schema.js` needs
`mongoose` from `backend/node_modules`.

| Want to understand... | Read |
|-----------------------|------|
| the database (schema, fields, sample document) | [backend/db/README.md](backend/db/README.md) |
| the APIs (request, steps, response) | [backend/README.md](backend/README.md) |
| what to write in the record book | [RECORD.md](RECORD.md) |

## 2. How the parts talk to each other

```
 Browser                  Backend                     Database
 ──────────               ─────────────────           ──────────────
 index.html               server.js + api.js          MongoDB
 script.js  ──fetch()──>  Express API  ──Store──────> freshmart.stores
            <──JSON─────               <────────────  (1 document)
```

## 3. Database – ONE collection

Database `freshmart`, collection `stores`, **one** document:
```js
{ storeName: "Fresh Mart Supermarket",
  categories: ["Fruits", "Vegetables", "Dairy", ...],                     // array of strings
  products: [ { name: "Milk (1 litre)", category: "Dairy", price: 56, stock: 30 }, ... ],  // array of objects
  createdAt: ..., updatedAt: ... }
```
There is no migration script. The **first time** the server starts, it inserts this document by itself (`addStartingData()` in `backend/helper.js`).

---

## 4. How to run

MongoDB must be running. Open a terminal in the `pgm-1-fresh-mart-inventory` folder.

**Step 1 – go into the backend folder**
```bash
cd backend
```

**Step 2 – install the packages** (only the first time; this creates `backend/node_modules`)
```bash
npm install --registry=https://registry.npmjs.org/
```

**Step 3 – start the server**
```bash
npm start
```
You should see:
```
Connected to MongoDB -> mongodb://127.0.0.1:27017/freshmart
Starting data added: 1 store, 8 categories, 9 products      (first time only)
Server is running. Open http://localhost:3000 in your browser
```

**Step 4 – open http://localhost:3000 in the browser.** To stop the server, press `Ctrl + C`.

**Reset the data:** in `mongosh` run `use freshmart` and `db.stores.drop()`, then `npm start` again.

---

## 5. Try these in class

1. **Task 1:** type `Ravi` → *Hello Ravi! Welcome to Fresh Mart Supermarket. Happy shopping!*  Empty → *Hello Guest!...*
2. **Task 2:** Apple = 2, Milk = 3 → **₹ 528** (2×180 + 3×56). Apple = 100 → *Only 40 of Apple (1 kg) left in stock*.
3. **Task 3:** see the 8 categories with positions 1, 2, 3... and the same data as a JS array.
4. **Task 4:** add `Personal Care` → goes to the **end** (position 9). Add `dairy` → *already exists*. Remove `Household` → removed.
5. **Task 5:** search `dairy` → *"Dairy" found at position 3 (array index 2)* and it is highlighted. Search `Toys` → *not found*.

## 6. Common errors

| What you see | Why | Fix |
|--------------|-----|-----|
| `Could not connect to MongoDB ... ECONNREFUSED` | MongoDB is not running | Start MongoDB, then `npm start` again |
| `EADDRINUSE: address already in use :::3000` | server already running in another terminal | close it (`Ctrl + C`) |
| Page shows *Cannot connect to the server* | backend is not started | `cd backend`, then `npm start` |
| `Cannot find module 'express'` | packages not installed, or `npm start` run outside `backend` | `cd backend`, then `npm install --registry=https://registry.npmjs.org/` |
| `npm error ... Could not read package.json` | the terminal is not in the `backend` folder | `cd backend` first |

## 7. Viva questions

1. What is the difference between an array **index** and a **position**?
2. Which array methods add, remove and search? (`push`, `splice`, `findIndex`)
3. What does `findIndex` return when nothing matches? (`-1`)
4. What is a Mongoose **schema** and a **model**?
5. Why do we keep everything in ONE collection here? When would we use two?
6. What does `{ timestamps: true }` add?
7. Why does the server take the price from the database instead of the browser?
8. What is the difference between `req.query`, `req.params` and `req.body`?
9. What do status codes 200, 201, 400, 404 and 500 mean?
10. Why do we use `async` / `await` with Mongoose?
