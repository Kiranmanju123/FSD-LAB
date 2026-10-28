/*
  APIs used in this program

  Task 1 - Read admission details from the user
  Task 2 - Calculate string length
  Task 3 - Extract department code
  Task 5 - Validate registration numbers using palindrome checking
    POST   /api/admissions                      -> register a student
                                                   (reads the details, name length,
                                                    department code, palindrome check)

  Task 4 - Replace department names
    PUT    /api/admissions/replace-department   -> replace old text with new text
                                                   in all department names

  Show and remove records
    GET    /api/admissions                      -> list all admission records
    DELETE /api/admissions/:id                  -> delete one admission record
*/

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
