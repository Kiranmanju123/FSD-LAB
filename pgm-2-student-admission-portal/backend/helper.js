function readAdmission(body) {
  return {
    studentName: String(body.studentName || "").trim(),
    registrationNumber: String(body.registrationNumber || "").trim().toUpperCase(),
    email: String(body.email || "").trim().toLowerCase(),
    department: String(body.department || "").trim()
  };
}

function validateAdmission(admission) {
  if (!admission.studentName || !admission.registrationNumber || !admission.email || !admission.department) {
    return "All fields are required";
  }
  if (!/^[A-Za-z ]+$/.test(admission.studentName)) {
    return "Student name can have only letters and spaces";
  }
  if (!/^[A-Z0-9]+$/.test(admission.registrationNumber)) {
    return "Registration number can have only letters and digits";
  }
  if (!/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(admission.email)) {
    return "Please enter a valid email, like ravi@gmail.com";
  }
  if (!/^[A-Za-z ]+$/.test(admission.department)) {
    return "Department can have only letters and spaces";
  }
  return null;
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

module.exports = { readAdmission, validateAdmission, extractDepartmentCode, isPalindrome };
