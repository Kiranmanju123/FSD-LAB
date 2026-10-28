# backend/db folder – the database part

This folder has only **one file**: `schema.js`.
It tells our program **where** MongoDB is and **what shape** our data has.

It is inside `backend` because only the backend talks to MongoDB, and `schema.js`
uses the `mongoose` package installed in `backend/node_modules`.

---

## 1. One independent collection

```
Database:    university
Collection:  admissions
Documents:   one document = one student's admission
```

The collection is **independent**: it has no links to any other collection.
(If we add another collection later, for example `departments`, we would only store its `_id` here as a normal field.)

---

## 2. How one document looks inside MongoDB

```js
{
  _id: ObjectId("6ad97e91..."),                      // MongoDB adds this id itself
  studentName: "Ravi Kumar",
  registrationNumber: "12321",
  email: "ravi@gmail.com",
  department: "Computer Science and Engineering",
  nameLength: 10,                                    // Task 2
  departmentCode: "CSE",                             // Task 3
  isPalindrome: true,                                // Task 5
  createdAt: ISODate("2026-10-29T10:30:00Z"),        // added by { timestamps: true }
  updatedAt: ISODate("2026-10-29T10:30:00Z"),        // changes every time we save
  __v: 0                                             // version number, Mongoose adds it
}
```

---

## 3. The fields

| Field | Type | Who fills it | Example | Task |
|-------|------|--------------|---------|------|
| `studentName` | String (required) | student (form) | `"Ravi Kumar"` | 1 |
| `registrationNumber` | String (required) | student (form) | `"12321"` | 1 |
| `email` | String (required) | student (form) | `"ravi@gmail.com"` | 1 |
| `department` | String (required) | student (form) | `"Computer Science and Engineering"` | 1, 4 |
| `nameLength` | Number | server | `10` | 2 |
| `departmentCode` | String | server | `"CSE"` | 3 |
| `isPalindrome` | Boolean | server | `true` = valid, `false` = invalid | 5 |
| `createdAt` | Date | Mongoose (automatic) | `2026-10-29T10:30:00Z` | – |
| `updatedAt` | Date | Mongoose (automatic) | `2026-10-29T10:30:00Z` | – |

`registrationNumber` is a **String**, not a Number, because it can have letters (e.g. `CS2002SC`).

---

## 4. The code, line by line

```js
const mongoose = require("mongoose");
```
Loads **Mongoose**, a package that lets us use MongoDB with normal JavaScript objects.

```js
const MONGO_URL = "mongodb://127.0.0.1:27017/university";
```

| Part | Meaning |
|------|---------|
| `mongodb://` | we are talking to MongoDB |
| `127.0.0.1` | this computer (we use it instead of `localhost`, which sometimes fails with new Node versions) |
| `27017` | the port MongoDB runs on (default) |
| `university` | our database name. MongoDB creates it by itself the first time we save data |

```js
async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}
```
Connects to MongoDB. `await` waits until the connection is ready.
`serverSelectionTimeoutMS: 5000` → if MongoDB is not running, show an error after 5 seconds (instead of 30).

```js
const admissionSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    nameLength: Number,
    departmentCode: String,
    isPalindrome: Boolean
  },
  { timestamps: true }
);
```
The **schema** is the "shape" of one document: which fields it has and their types.

- `required: true` → this field must be given, or Mongoose will not save.
- `nameLength: Number` is a short way of writing `nameLength: { type: Number }`.
- `{ timestamps: true }` → Mongoose adds `createdAt` and `updatedAt` and fills them in.

```js
const Admission = mongoose.model("Admission", admissionSchema);
```
The **model** is what we use in the code to read and save data.
Mongoose names the collection from the model name: `"Admission"` → small letters + plural → **`admissions`**.

Model functions we use in the backend:

| Function | What it does |
|----------|--------------|
| `Admission.create({...})` | save a new admission |
| `Admission.find()` | get all admissions |
| `Admission.findOne({...})` | get the first one that matches |
| `Admission.findByIdAndDelete(id)` | remove one admission |
| `admission.save()` | save the changes made to one document |

```js
module.exports = { connectDB, Admission };
```
Shares `connectDB` and `Admission` with other files. The backend gets them with:
```js
const { connectDB } = require("./db/schema");      // in server.js
const { Admission } = require("./db/schema");      // in api.js
```

---

## 5. Starting data

There is **no** starting data and no migration script. The collection starts **empty**.
Students add records from the form on the page.

## 6. See the data yourself

```bash
mongosh
```
```
use university
db.admissions.find()
```
**Remove all records:** `db.admissions.deleteMany({})`
