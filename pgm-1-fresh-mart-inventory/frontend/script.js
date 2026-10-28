// =====================================================================
//  frontend/script.js
//  ---------------------------------------------------------------------
//  This file talks to our backend using fetch().
//  Each function below matches one lab task.
//
//  The pattern used in every function:
//    1. Read what the user typed  (document.getElementById(...).value)
//    2. Call the backend API      (await fetch(...))
//    3. Read the JSON reply       (await response.json())
//    4. If response.ok is false -> show the error in RED
//       else                    -> show the result in GREEN
// =====================================================================

// Address of our backend API (backend/server.js runs on port 3000)
const API_URL = "http://localhost:3000/api";

// This message is shown when fetch() cannot reach the server at all
const SERVER_DOWN = "Cannot connect to the server. Is it running? (npm start)";

// Products from the database. We keep them here so calculateTotal() can use their ids.
let products = [];

// ---------------------------------------------------------------------
// Helper: show a message in a box. Green for success, red for error.
// ---------------------------------------------------------------------
function showMessage(elementId, text, isError) {
  const box = document.getElementById(elementId);
  box.textContent = text;
  if (isError) {
    box.className = "message error";
  } else {
    box.className = "message success";
  }
}

// =====================================================================
// TASK 1: Display a welcome message
// =====================================================================
async function showWelcome() {
  const name = document.getElementById("customerName").value;

  try {
    // encodeURIComponent makes the text safe to put inside a URL (for example, spaces)
    const response = await fetch(`${API_URL}/welcome?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (!response.ok) {
      showMessage("welcomeMessage", data.message, true);
      return;
    }
    showMessage("welcomeMessage", data.message, false);
  } catch (error) {
    showMessage("welcomeMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 2 (part a): Load products into the table
// =====================================================================
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();

    if (!response.ok) {
      showMessage("purchaseMessage", data.message, true);
      return;
    }
    products = data;

    // Build one table row (<tr>) for each product
    let rows = "";
    for (const product of products) {
      rows += `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.price}</td>
          <td>${product.stock}</td>
          <td><input type="number" class="qty-input" id="qty-${product._id}" min="0" value="0"></td>
        </tr>`;
    }
    document.getElementById("productRows").innerHTML = rows;
  } catch (error) {
    showMessage("purchaseMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 2 (part b): Calculate the total purchase amount
// =====================================================================
async function calculateTotal() {
  // Step 1: make a list of the products where the quantity is more than 0
  const items = [];
  for (const product of products) {
    const quantity = Number(document.getElementById(`qty-${product._id}`).value);
    if (quantity > 0) {
      items.push({ productId: product._id, quantity: quantity });
    }
  }

  // Clear the old bill
  document.getElementById("billArea").innerHTML = "";

  try {
    // Step 2: send the list to the backend with a POST request
    const response = await fetch(`${API_URL}/purchase/total`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // tell the server we are sending JSON
      body: JSON.stringify({ items: items }) // convert the JS object into JSON text
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("purchaseMessage", data.message, true);
      return;
    }

    // Step 3: show the bill as a table
    let rows = "";
    for (const row of data.bill) {
      rows += `
        <tr>
          <td>${row.name}</td>
          <td>${row.price}</td>
          <td>${row.quantity}</td>
          <td>${row.amount}</td>
        </tr>`;
    }

    document.getElementById("billArea").innerHTML = `
      <h3>Your Bill</h3>
      <table>
        <tr><th>Product</th><th>Price (₹)</th><th>Quantity</th><th>Amount (₹)</th></tr>
        ${rows}
        <tr class="total-row"><td colspan="3">TOTAL</td><td>₹ ${data.totalAmount}</td></tr>
      </table>`;

    showMessage("purchaseMessage", `Total purchase amount: ₹ ${data.totalAmount}`, false);
  } catch (error) {
    showMessage("purchaseMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 3: Show all categories (the array)
// =====================================================================
async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();

    if (!response.ok) {
      showMessage("categoryMessage", data.message, true);
      return;
    }

    const list = document.getElementById("categoryList");
    list.innerHTML = ""; // remove the old list items

    // forEach gives us each item AND its index (0, 1, 2, ...)
    data.categories.forEach(function (category, index) {
      const li = document.createElement("li"); // create <li></li>
      li.textContent = `${category}   (array index ${index})`;
      list.appendChild(li); // put it inside the <ol>
    });

    document.getElementById("categoryCount").textContent = data.count;
    // JSON.stringify shows the array exactly like we write it in JavaScript
    document.getElementById("categoryArray").textContent = JSON.stringify(data.categories);
  } catch (error) {
    showMessage("categoryMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 4 (part a): Add a category
// =====================================================================
async function addCategory() {
  // trim() removes extra spaces at the start and end
  const name = document.getElementById("categoryInput").value.trim();

  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name })
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("categoryMessage", data.message, true);
      return;
    }

    showMessage("categoryMessage", data.message, false);
    document.getElementById("categoryInput").value = ""; // clear the text box
    loadCategories(); // refresh the list in Task 3
  } catch (error) {
    showMessage("categoryMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 4 (part b): Remove a category
// =====================================================================
async function removeCategory() {
  const name = document.getElementById("categoryInput").value.trim();

  // Small check in the browser before calling the server
  if (name === "") {
    showMessage("categoryMessage", "Please type the category name to remove", true);
    return;
  }

  try {
    // The name goes inside the URL:  /api/categories/Household
    const response = await fetch(`${API_URL}/categories/${encodeURIComponent(name)}`, {
      method: "DELETE"
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("categoryMessage", data.message, true);
      return;
    }

    showMessage("categoryMessage", data.message, false);
    document.getElementById("categoryInput").value = "";
    loadCategories(); // refresh the list in Task 3
  } catch (error) {
    showMessage("categoryMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// TASK 5: Search a category and show its position
// =====================================================================
async function searchCategory() {
  const name = document.getElementById("searchInput").value;

  // Remove the yellow highlight from every category in the list
  const allItems = document.querySelectorAll("#categoryList li");
  allItems.forEach(function (li) {
    li.classList.remove("highlight");
  });

  try {
    const response = await fetch(`${API_URL}/categories/search?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (!response.ok) {
      showMessage("searchMessage", data.message, true);
      return;
    }

    showMessage("searchMessage", data.message, false);
    // Highlight the found category in the Task 3 list (allItems is also counted from 0)
    if (allItems[data.index]) {
      allItems[data.index].classList.add("highlight");
    }
  } catch (error) {
    showMessage("searchMessage", SERVER_DOWN, true);
  }
}

// =====================================================================
// When the page opens, load everything once
// =====================================================================
showWelcome();
loadProducts();
loadCategories();
