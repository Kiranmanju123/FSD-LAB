# backend folder – the server part

| File | What is inside |
|------|----------------|
| `server.js` | only the server: Express setup + start the server |
| `api.js` | **all 4 APIs** (the list of APIs is written at the top as a comment) |
| `helper.js` | helper functions: read input, validate, department code, palindrome |
| `db/schema.js` | MongoDB connection + Admission schema/model (see [db/README.md](db/README.md)) |
| `package.json` | the backend packages (express, mongoose, cors) and the `npm start` command |
| `node_modules/` | the installed packages, created by `npm install` (not uploaded to GitHub) |

```
server.js  ──uses──>  api.js         (the APIs)
           ──uses──>  db/schema.js   (connectDB)
api.js     ──uses──>  helper.js      (readAdmission, validateAdmission, extractDepartmentCode, isPalindrome)
           ──uses──>  db/schema.js   (Admission model)
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

| No | Tasks | Method | URL | Send | Get back |
|----|-------|--------|-----|------|----------|
| 1 | 1, 2, 3, 5 | `POST` | `/api/admissions` | `{ studentName, registrationNumber, email, department }` | `{ message, admission }` |
| 2 | – | `GET` | `/api/admissions` | – | array of admissions |
| 3 | 4 | `PUT` | `/api/admissions/replace-department` | `{ oldName, newName }` | `{ message }` |
| 4 | – | `DELETE` | `/api/admissions/:id` | – | `{ message }` |

You can open the `GET` API straight in the browser: http://localhost:5000/api/admissions

---

## 2. server.js – only the server

```
server.js
 ├── 1. import packages      express, cors, path, schema.js, api.js
 ├── 2. setup                app, PORT = 5000, middleware, app.use(apiRoutes)
 └── 3. startServer()        connect DB → listen on port 5000
```

```js
const express = require("express");               // to build the server
const cors = require("cors");                     // allow calls from another address
const path = require("path");                     // to build folder paths
const { connectDB } = require("./db/schema");     // connect to the database
const apiRoutes = require("./api");               // all our APIs
```
```js
app.use(cors());              // allow a page from another address (e.g. Live Server) to call us
app.use(express.json());      // read the JSON the browser sends → req.body
app.use(express.static(...)); // show frontend/index.html at http://localhost:5000
app.use(apiRoutes);           // add all the APIs from api.js to the app
```
```js
await connectDB();            // 1. connect to MongoDB
app.listen(PORT, ...);        // 2. start waiting for requests on port 5000
```

---

## 3. api.js – all the APIs

```
api.js
 ├── 1. comment at the top   list of APIs for each task
 ├── 2. imports              express, Admission model, helper functions
 ├── 3. router               const router = express.Router();
 ├── 4. the 4 APIs           router.post / router.get / router.put / router.delete
 └── 5. export               module.exports = router;
```

A **router** is like a small group of APIs. We write the APIs on `router` in `api.js`,
export it, and `server.js` adds the whole group to the app with `app.use(apiRoutes)`.

### Every API has the same pattern
```js
router.get("/api/something", async function (req, res) {
  try {
    // 1. read the input   (req.body / req.params)
    // 2. work with MongoDB (Admission.find / create / ...)
    res.json({ ... });                                    // 3. send the answer
  } catch (error) {
    res.status(500).json({ message: error.message });    // something broke
  }
});
```

| Where the data comes from | Example | Read it with |
|---------------------------|---------|--------------|
| request body (JSON) | `{ "oldName": "Engg" }` | `req.body.oldName` |
| route parameter (`:id`) | `/api/admissions/6ad97e91...` | `req.params.id` |

---

## 4. Each API explained (api.js)

### API 1 – Register a student (Tasks 1, 2, 3, 5)
`POST /api/admissions`
```json
{ "studentName": "Ravi Kumar", "registrationNumber": "12321",
  "email": "ravi@gmail.com", "department": "Computer Science and Engineering" }
```
1. **Task 1** – `readAdmission(req.body)` reads the 4 fields.
2. `validateAdmission()` – wrong input → **400** with the error message.
3. Same registration number already saved → **400** *already registered*.
4. **Task 2** – `nameLength = studentName.length` (spaces are counted).
5. **Task 3** – `departmentCode = extractDepartmentCode(department)`.
6. **Task 5** – `isPalindrome = isPalindrome(registrationNumber)`.
7. `Admission.create()` saves it → **201**.
```json
{ "message": "Admission saved for \"Ravi Kumar\"",
  "admission": { "studentName": "Ravi Kumar", "registrationNumber": "12321", "nameLength": 10,
                 "departmentCode": "CSE", "isPalindrome": true, "createdAt": "...", ... } }
```

### API 2 – List all admissions
`GET /api/admissions` → `Admission.find().sort({ createdAt: -1 })` → newest first.

### API 3 – Replace department names (Task 4)
`PUT /api/admissions/replace-department`
```json
{ "oldName": "Engg", "newName": "Engineering" }
```
1. Old or new name empty → **400**. New name not letters → **400**.
2. Read all admissions. For each one:
   - `department.includes(oldName)` → does it have the old text?
   - `department.replace(oldName, newName)` → change it
   - find the department code again, then `save()` (this also changes `updatedAt`)
3. Nothing changed → **404**. Else send how many records changed.
```json
{ "message": "\"Engg\" replaced with \"Engineering\" in 1 record(s)" }
```
Example: `Mechanical Engg` → `Mechanical Engineering`.

### API 4 – Delete an admission
`DELETE /api/admissions/6ad97e91...` → `Admission.findByIdAndDelete(id)`. Not found → **404**.

---

## 5. helper.js

| Function | Task | What it does | Example |
|----------|------|--------------|---------|
| `readAdmission(body)` | 1 | takes only the 4 fields, removes extra spaces (`trim`), reg. no. in CAPITALS, email in small letters | `" ravi "` → `"ravi"` |
| `validateAdmission(admission)` | – | returns an error message, or `null` if all is OK | empty name → `"All fields are required"` |
| `extractDepartmentCode(department)` | 3 | first letter of each word, skips `and` / `of` | `Computer Science and Engineering` → `CSE` |
| `isPalindrome(text)` | 5 | `true` if the text reads the same from both sides | `12321` → `true`, `12345` → `false` |

### Validation rules (`validateAdmission`)

| Field | Rule |
|-------|------|
| all 4 fields | required |
| Student name | only letters and spaces |
| Registration number | only letters and digits |
| Email | like `name@domain.com` |
| Department | only letters and spaces |

### extractDepartmentCode – string functions `split`, `toLowerCase`, `charAt`, `toUpperCase`
```js
function extractDepartmentCode(department) {
  const words = department.split(" ");          // ["Computer", "Science", "and", "Engineering"]
  let code = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (word === "" || word === "and" || word === "of") {
      continue;                                  // skip small words
    }
    code = code + word.charAt(0).toUpperCase();  // C, S, E
  }
  return code;                                   // "CSE"
}
```

### isPalindrome – string functions `split`, `reverse`, `join`
```js
function isPalindrome(text) {
  const reversed = text.split("").reverse().join("");   // "12321" → ["1","2","3","2","1"] → reversed → "12321"
  return text === reversed;                             // same → true (valid)
}
```

---

## 6. Status codes we use

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | list sent, record deleted |
| 201 | Created | admission saved |
| 400 | Bad input | empty field, wrong email, already registered |
| 404 | Not found | admission not found, no department has the old text |
| 500 | Server error | MongoDB stopped, wrong id format |
