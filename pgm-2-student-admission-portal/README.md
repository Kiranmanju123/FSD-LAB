# FSD Lab – Program 2
## Student Admission Portal

**Scenario:** A university is developing an online admission portal to automate student registration.
The system should validate applicant information, process registration numbers, and extract
department details from admission records.

| # | Task | Where | String function |
|---|------|-------|-----------------|
| 1 | Read admission details from the user | form → `POST /api/admissions` → `readAdmission()` | `trim()`, `toUpperCase()` |
| 2 | Calculate string length | `studentName.length` | `length` |
| 3 | Extract department code | `extractDepartmentCode()` → `Computer Science and Engineering` → `CSE` | `split()`, `charAt()` |
| 4 | Replace department names | `PUT /api/admissions/replace-department` → `Engg` → `Engineering` | `includes()`, `replace()` |
| 5 | Validate registration numbers using palindrome checking | `isPalindrome()` → `12321` is **Valid** | `split()`, `reverse()`, `join()` |

---

## 1. Folder structure

```
pgm-2-student-admission-portal/
├── backend/
│   ├── db/
│   │   ├── schema.js      -> MongoDB connection + Admission schema/model
│   │   └── README.md      -> explains the database code
│   ├── server.js          -> server setup + start (no APIs here)
│   ├── api.js             -> all 4 APIs (list of APIs at the top)
│   ├── helper.js          -> helper functions (read, validate, department code, palindrome)
│   ├── package.json       -> backend packages (express, mongoose, cors) + npm start
│   ├── package-lock.json
│   ├── node_modules/      -> created by "npm install" (not uploaded to GitHub)
│   └── README.md          -> explains every API
├── frontend/
│   ├── index.html         -> the page: 2 forms + a table
│   └── script.js          -> calls the APIs using fetch()
├── .gitignore             -> tells Git not to upload node_modules
├── RECORD.md              -> what to write in the lab record
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
| the APIs and helper functions | [backend/README.md](backend/README.md) |
| what to write in the record book | [RECORD.md](RECORD.md) |

## 2. How the parts talk to each other

```
 Browser                  Backend                     Database
 ──────────               ─────────────────           ──────────────────
 index.html               server.js + api.js          MongoDB
 script.js  ──fetch()──>  Express API  ──Admission──> university.admissions
            <──JSON─────               <────────────  (1 document per student)
```

## 3. APIs

| Method | URL | What it does |
|--------|-----|--------------|
| `POST` | `/api/admissions` | register a student (Tasks 1, 2, 3, 5) |
| `GET` | `/api/admissions` | get all admission records |
| `PUT` | `/api/admissions/replace-department` | replace a department name (Task 4) |
| `DELETE` | `/api/admissions/:id` | delete one record |

## 4. Database – one independent collection

Database `university`, collection `admissions`, one document per student:
```js
{ studentName: "Ravi Kumar", registrationNumber: "12321", email: "ravi@gmail.com",
  department: "Computer Science and Engineering",
  nameLength: 10, departmentCode: "CSE", isPalindrome: true,
  createdAt: ..., updatedAt: ... }
```
The collection starts **empty**. Students add records from the page.

---

## 5. How to run

MongoDB must be running. Open a terminal in the `pgm-2-student-admission-portal` folder.

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
Connected to MongoDB -> mongodb://127.0.0.1:27017/university
Server is running. Open http://localhost:5000 in your browser
```

**Step 4 – open http://localhost:5000 in the browser.** To stop the server, press `Ctrl + C`.

> Port 5000, so it can run at the same time as Program 1 (port 3000).

---

## 6. Try these in class

1. Register `Ravi Kumar`, `12321`, `ravi@gmail.com`, `Computer Science and Engineering`
   → name length **10**, code **CSE**, registration **Valid**.
2. Register `Meena Gowda`, `12345`, `meena@gmail.com`, `Mechanical Engg`
   → name length **11**, code **ME**, registration **Invalid** (not a palindrome).
3. Register again with `12321` → *This registration number is already registered*.
4. Replace `Engg` with `Engineering` → Meena's department becomes `Mechanical Engineering`, `updatedAt` changes.
5. Click **Delete** on a record → it is removed.

See the data in MongoDB: `mongosh` → `use university` → `db.admissions.find()`

## 7. Common errors

| What you see | Why | Fix |
|--------------|-----|-----|
| `Could not connect to MongoDB ... ECONNREFUSED` | MongoDB is not running | Start MongoDB, then `npm start` again |
| `EADDRINUSE: address already in use :::5000` | server already running in another terminal | close it (`Ctrl + C`) |
| Page shows *Cannot connect to the server* | backend is not started | `cd backend`, then `npm start` |
| `Cannot find module 'express'` | packages not installed, or `npm start` run outside `backend` | `cd backend`, then `npm install --registry=https://registry.npmjs.org/` |
| `npm error ... Could not read package.json` | the terminal is not in the `backend` folder | `cd backend` first |

## 8. Viva questions

1. Why is `"Ravi Kumar".length` 10 and not 9?
2. What do `split("")`, `reverse()` and `join("")` do in `isPalindrome()`?
3. Why do we change the registration number to CAPITAL letters before the palindrome check?
4. What does `replace()` return? Does it change the old string?
5. What is the difference between `includes()` and `replace()`?
6. How does `extractDepartmentCode()` turn `Computer Science and Engineering` into `CSE`?
7. What does `{ timestamps: true }` add to every document?
8. Why is `registrationNumber` a String and not a Number?
9. What is the difference between `req.body` and `req.params`?
10. Why must validation be done on the server, not only in the browser?
