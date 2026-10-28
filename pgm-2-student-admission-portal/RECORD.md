# Lab Record – Program 2: Student Admission Portal

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

**Student Admission Portal**

A university is developing an online admission portal to automate student registration. The system
should validate applicant information, process registration numbers, and extract department details
from admission records.

**Tasks:**
1. Read admission details from the user.
2. Calculate string length.
3. Extract department code.
4. Replace department names.
5. Validate registration numbers using palindrome checking.

---

## 2. Database Design

**Database:** `university`  **Collection:** `admissions` (one document per student)

| Field | Type | Filled by | Rule / Description |
|-------|------|-----------|--------------------|
| `_id` | ObjectId | MongoDB | unique id |
| `studentName` | String | student | required, only letters and spaces |
| `registrationNumber` | String | student | required, only letters and digits |
| `email` | String | student | required, like `name@domain.com` |
| `department` | String | student | required, only letters and spaces |
| `nameLength` | Number | server | length of the name (Task 2) |
| `departmentCode` | String | server | first letter of each word (Task 3) |
| `isPalindrome` | Boolean | server | `true` = valid reg. no. (Task 5) |
| `createdAt` | Date | automatic | created time |
| `updatedAt` | Date | automatic | last changed time |

**Sample document:**
```
{
  studentName        : "Ravi Kumar",
  registrationNumber : "12321",
  email              : "ravi@gmail.com",
  department         : "Computer Science and Engineering",
  nameLength         : 10,
  departmentCode     : "CSE",
  isPalindrome       : true,
  createdAt          : Date,
  updatedAt          : Date
}
```

---

## 3. API Design

| Task | Method | URL | Input | Output |
|------|--------|-----|-------|--------|
| 1, 2, 3, 5 | POST | `/api/admissions` | name, reg. no., email, department | saved admission with name length, department code, palindrome result |
| – | GET | `/api/admissions` | – | list of all admissions |
| 4 | PUT | `/api/admissions/replace-department` | old name, new name | number of records changed |
| – | DELETE | `/api/admissions/:id` | admission id | admission deleted |

| Task | String function used |
|------|----------------------|
| 2 | `studentName.length` |
| 3 | `split(" ")`, `charAt(0)`, `toUpperCase()` |
| 4 | `includes()`, `replace()` |
| 5 | `split("")`, `reverse()`, `join("")` |

---

## 4. Architecture

```
 +--------------+   request (fetch)   +-------------------+   Mongoose   +--------------+
 |   FRONTEND   | ------------------> |      BACKEND      | -----------> |   DATABASE   |
 |  index.html  |                     |  server.js        |              |  MongoDB     |
 |  script.js   | <------------------ |  api.js           | <----------- |  university  |
 |  (browser)   |   response (JSON)   |  helper.js        |   document   |  └ admissions|
 +--------------+                     |  Express, port    |              +--------------+
                                      |  5000             |
                                      +-------------------+
```

---

## 5. Frontend Design

```
+------------------------------------------------------------------+
|              UNIVERSITY ONLINE ADMISSION PORTAL                  |
+------------------------------------------------------------------+
| New Admission                                                    |
|   Student Name      [ Ravi Kumar                        ]        |
|   Registration No.  [ 12321                             ]        |
|   Email             [ ravi@gmail.com                    ]        |
|   Department        [ Computer Science and Engineering  ]        |
|   (Register)                                                     |
|   Name length: 10 | Department code: CSE | 12321 -> Valid        |
+------------------------------------------------------------------+
| Replace Department Name                                          |
|   Old Text [ Engg ]   New Text [ Engineering ]   (Replace)       |
+------------------------------------------------------------------+
| All Admissions                                                   |
|  Reg.No | Valid? | Name       | Length | Department | Code | Del |
|  12321  | Valid  | Ravi Kumar |   10   | Computer...| CSE  | (x) |
|  12345  | Invalid| Meena Gowda|   11   | Mechanical.| ME   | (x) |
+------------------------------------------------------------------+
```

---

## 6. Code

### 6a. MongoDB connection – `backend/db/schema.js`
```js
const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/university";

async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}

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

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = { connectDB, Admission };
```

### 6b. Node server – `backend/server.js`
```js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db/schema");
const apiRoutes = require("./api");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(apiRoutes);

async function startServer() {
  try {
    await connectDB();
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
const { Admission } = require("./db/schema");
const { readAdmission, validateAdmission, extractDepartmentCode, isPalindrome } = require("./helper");

const router = express.Router();

router.post("/api/admissions", async function (req, res) {
  try {
    const admission = readAdmission(req.body);
    const error = validateAdmission(admission);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const oldRecord = await Admission.findOne({ registrationNumber: admission.registrationNumber });
    if (oldRecord) {
      return res.status(400).json({ message: "This registration number is already registered" });
    }

    admission.nameLength = admission.studentName.length;
    admission.departmentCode = extractDepartmentCode(admission.department);
    admission.isPalindrome = isPalindrome(admission.registrationNumber);

    const savedAdmission = await Admission.create(admission);
    res.status(201).json({
      message: `Admission saved for "${savedAdmission.studentName}"`,
      admission: savedAdmission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/admissions", async function (req, res) {
  try {
    const admissions = await Admission.find().sort({ createdAt: -1 });
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/api/admissions/replace-department", async function (req, res) {
  try {
    const oldName = req.body.oldName;
    const newName = req.body.newName;
    if (!oldName || !newName) {
      return res.status(400).json({ message: "Old name and new name are required" });
    }
    if (!/^[A-Za-z ]+$/.test(newName)) {
      return res.status(400).json({ message: "New name can have only letters and spaces" });
    }

    const admissions = await Admission.find();
    let changedCount = 0;

    for (const admission of admissions) {
      if (admission.department.includes(oldName)) {
        admission.department = admission.department.replace(oldName, newName);
        admission.departmentCode = extractDepartmentCode(admission.department);
        await admission.save();
        changedCount++;
      }
    }

    if (changedCount === 0) {
      return res.status(404).json({ message: `No department name has "${oldName}" in it` });
    }
    res.json({ message: `"${oldName}" replaced with "${newName}" in ${changedCount} record(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/api/admissions/:id", async function (req, res) {
  try {
    const deletedAdmission = await Admission.findByIdAndDelete(req.params.id);
    if (!deletedAdmission) {
      return res.status(404).json({ message: "Admission not found" });
    }
    res.json({ message: `Admission of "${deletedAdmission.studentName}" deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

### 6d. Helper functions for the tasks – `backend/helper.js`
(`validateAdmission()` checks the rules given in Part 2, so it is not written again.)

```js
function readAdmission(body) {
  return {
    studentName: String(body.studentName || "").trim(),
    registrationNumber: String(body.registrationNumber || "").trim().toUpperCase(),
    email: String(body.email || "").trim().toLowerCase(),
    department: String(body.department || "").trim()
  };
}

function extractDepartmentCode(department) {
  const words = department.split(" ");
  let code = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (word === "" || word === "and" || word === "of") {
      continue;
    }
    code = code + word.charAt(0).toUpperCase();
  }
  return code;
}

function isPalindrome(text) {
  const reversed = text.split("").reverse().join("");
  return text === reversed;
}
```

---

## 7. Output

```
Connected to MongoDB -> mongodb://127.0.0.1:27017/university
Server is running. Open http://localhost:5000 in your browser
```

| Task | Input | Output |
|------|-------|--------|
| 1 | Ravi Kumar, 12321, ravi@gmail.com, Computer Science and Engineering | Admission saved for "Ravi Kumar" |
| 2 | Ravi Kumar | Name length: 10 |
| 3 | Computer Science and Engineering | Department code: CSE |
| 4 | old = `Engg`, new = `Engineering` | Mechanical Engg → Mechanical Engineering |
| 5 | 12321 | 12321 is a palindrome → Valid |
| 5 | 12345 | 12345 is NOT a palindrome → Invalid |

---

## 8. Result

The Student Admission Portal was developed using Node.js, Express.js and MongoDB, and all five
tasks were executed successfully using JavaScript string functions.
