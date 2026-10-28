const { Store } = require("./db/schema");

const startingStore = {
  storeName: "Fresh Mart Supermarket",
  categories: ["Fruits", "Vegetables", "Dairy", "Bakery", "Beverages", "Snacks", "Frozen Foods", "Household"],
  products: [
    { name: "Apple (1 kg)", category: "Fruits", price: 180, stock: 40 },
    { name: "Banana (1 dozen)", category: "Fruits", price: 60, stock: 50 },
    { name: "Tomato (1 kg)", category: "Vegetables", price: 40, stock: 60 },
    { name: "Onion (1 kg)", category: "Vegetables", price: 35, stock: 80 },
    { name: "Milk (1 litre)", category: "Dairy", price: 56, stock: 30 },
    { name: "Paneer (200 g)", category: "Dairy", price: 90, stock: 20 },
    { name: "Bread (400 g)", category: "Bakery", price: 45, stock: 25 },
    { name: "Orange Juice (1 litre)", category: "Beverages", price: 120, stock: 15 },
    { name: "Potato Chips (100 g)", category: "Snacks", price: 30, stock: 70 }
  ]
};

async function addStartingData() {
  const store = await Store.findOne();
  if (!store) {
    await Store.create(startingStore);
    console.log("Starting data added: 1 store, 8 categories, 9 products");
  }
}

function findCategoryIndex(categories, name) {
  const searchName = String(name).trim().toLowerCase();
  return categories.findIndex(function (category) {
    return category.toLowerCase() === searchName;
  });
}

module.exports = { addStartingData, findCategoryIndex };
