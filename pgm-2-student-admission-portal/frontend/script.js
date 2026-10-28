// =====================================================================
//  frontend/script.js
//  ---------------------------------------------------------------------
//  This file talks to our backend using fetch().
//
//    Function             HTTP method   URL
//    ------------------   -----------   ----------------------------------
//    loadAdmissions()     GET           /api/admissions
//    registerStudent()    POST          /api/admissions
//    replaceDepartment()  PUT           /api/admissions/replace-department
//    deleteAdmission(id)  DELETE        /api/admissions/:id
//
//  The pattern used in every function:
//    1. Call the backend API      (await fetch(...))
//    2. Read the JSON reply       (await response.json())
//    3. If response.ok is false -> show the error in RED
//       else                    -> show the result in GREEN
// =====================================================================

// Address of our backend API (backend/server.js runs on port 5000)
const API_URL = "http://localhost:5000/api/admissions";

// This message is shown when fetch() cannot reach the server at all
const SERVER_DOWN = "Cannot connect to the server. Is it running? (npm start)";

// ---------------------------------------------------------------------
// Helper: show a message in a box. Green for success, red for error.
// ---------------------------------------------------------------------
function showMessage(elementId, text, isError) {
  const box = document.getElementById(elementId);
  box.innerHTML = text;
  if (isError) {
    box.className = "message error";
  } else {
    box.className = "message success";
  }
}

// =====================================================================
// GET: load all admissions and show them in the table
// =====================================================================
async function loadAdmissions() {
  try {
    const response = await fetch(API_URL); // GET is the default method
    const data = await response.json();

    if (!response.ok) {
      showMessage("listMessage", data.message, true);
      return;
    }

    // Build one table row (<tr>) for each admission
    let rows = "";
    data.forEach(function (admission, index) {
      // Task 5 result: green "Valid" or red "Invalid"
      let validText = `<span class="invalid">✘ Invalid</span>`;
      if (admission.isPalindrome) {
        validText = `<span class="valid">✔ Valid</span>`;
      }

      // createdAt comes as text like "2026-10-22T10:30:00.000Z".
      // new Date(...).toLocaleString() shows it in our local date and time.
      const registeredOn = new Date(admission.createdAt).toLocaleString();

      rows += `
        <tr>
          <td>${index + 1}</td>
          <td>${admission.registrationNumber}</td>
          <td>${validText}</td>
          <td>${admission.studentName}</td>
          <td>${admission.nameLength}</td>
          <td>${admission.email}</td>
          <td>${admission.department}</td>
          <td><b>${admission.departmentCode}</b></td>
          <td>${registeredOn}</td>
          <td>
            <button class="delete" onclick="deleteAdmission('${admission._id}', '${admission.studentName}')">Delete</button>
          </td>
        </tr>`;
    });

    if (data.length === 0) {
      rows = `<tr><td colspan="10">No admissions yet. Register a student using the form above.</td></tr>`;
    }

    document.getElementById("admissionRows").innerHTML = rows;
    document.getElementById("admissionCount").textContent = data.length;
  } catch (error) {
    showMessage("listMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// POST: register a new student   (Task 1 - read admission details)
// =====================================================================
async function registerStudent() {
  // Read what the student typed in the 4 text boxes
  const admission = {
    studentName: document.getElementById("studentName").value,
    registrationNumber: document.getElementById("registrationNumber").value,
    email: document.getElementById("email").value,
    department: document.getElementById("department").value
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // tell the server we are sending JSON
      body: JSON.stringify(admission) // convert the JS object into JSON text
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("formMessage", data.message, true);
      return;
    }

    // Show what the server calculated (Tasks 2, 3 and 5)
    const saved = data.admission;
    let palindromeText = `"${saved.registrationNumber}" is NOT a palindrome → Invalid`;
    if (saved.isPalindrome) {
      palindromeText = `"${saved.registrationNumber}" is a palindrome → Valid`;
    }

    showMessage(
      "formMessage",
      `${data.message}<br>
       Name length: <b>${saved.nameLength}</b><br>
       Department code: <b>${saved.departmentCode}</b><br>
       Registration number: <b>${palindromeText}</b>`,
      false
    );

    // Empty the form
    document.getElementById("studentName").value = "";
    document.getElementById("registrationNumber").value = "";
    document.getElementById("email").value = "";
    document.getElementById("department").value = "";

    loadAdmissions(); // refresh the table
  } catch (error) {
    showMessage("formMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// PUT: replace a department name in all records   (Task 4)
// =====================================================================
async function replaceDepartment() {
  // trim() removes extra spaces at the start and end
  const body = {
    oldName: document.getElementById("oldName").value.trim(),
    newName: document.getElementById("newName").value.trim()
  };

  try {
    const response = await fetch(`${API_URL}/replace-department`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("replaceMessage", data.message, true);
      return;
    }

    showMessage("replaceMessage", data.message, false);
    document.getElementById("oldName").value = "";
    document.getElementById("newName").value = "";
    loadAdmissions(); // refresh the table
  } catch (error) {
    showMessage("replaceMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// DELETE: the Delete button calls this
// =====================================================================
async function deleteAdmission(id, name) {
  // confirm() shows a popup with OK / Cancel. It returns true for OK.
  if (!confirm(`Are you sure you want to delete the admission of "${name}"?`)) {
    return; // user clicked Cancel, so do nothing
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      showMessage("listMessage", data.message, true);
      return;
    }

    showMessage("listMessage", data.message, false);
    loadAdmissions(); // refresh the table
  } catch (error) {
    showMessage("listMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// When the page opens, load the admissions once
// =====================================================================
loadAdmissions();
