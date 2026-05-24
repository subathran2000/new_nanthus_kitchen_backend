/**
 * Seed script: Populate full Markham menu from the PDF menu card.
 *
 * Production-safe design:
 *  - Runs inside a single transaction → full rollback on any error.
 *  - Idempotent: name-based lookups so re-running never creates duplicates.
 *  - Never touches Scarborough data.
 *  - Dry-run mode: node seed-markham-menu.js DRY_RUN=true
 *
 * Run from the backend root:
 *   node src/seeds/seed-markham-menu.js
 */

"use strict";

const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const DRY_RUN = process.argv.includes("DRY_RUN=true");
const LOCATION = "markham";

const client = new Client({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// ─── MENU DATA (exactly as in the PDF, nothing added) ────────────────────────
//
// Item shape:
//   { name, description?, price?, hasMeasurements?, measurements?: [{ typeName, price }] }

const MENU = [
  // ── Sandwiches ──────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Sandwiches", sortOrder: 1 },
    category: {
      name: "Sandwiches",
      sortOrder: 1,
      description: "All sandwiches are dressed with hummus, tahini, lettuce, tomatoes, cucumbers. Maximum of two cold appetizer toppings per sandwich free of charge. Extra toppings can be added for 0.99 each.",
    },
    items: [
      { name: "Falafel",                    hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 7.99  }, { typeName: "Plate", price: 10.99 }] },
      { name: "Veggie",                     hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 7.99  }, { typeName: "Plate", price: 10.99 }] },
      { name: "Chicken Shawarma",           hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 7.99  }, { typeName: "Plate", price: 12.99 }] },
      { name: "Beef Shawarma",              hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 8.99  }, { typeName: "Plate", price: 12.99 }] },
      { name: "Chicken Breast Shish Kebob", hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 9.99  }, { typeName: "Plate", price: 13.99 }] },
      { name: "Chicken Dark Shish Kebob",   hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 9.99  }, { typeName: "Plate", price: 13.99 }] },
      { name: "Lamb Shish Kebob",           hasMeasurements: true, measurements: [{ typeName: "Pita",  price: 10.99 }, { typeName: "Plate", price: 14.99 }] },
    ],
  },
  {
    primaryCategory: { name: "Sandwiches", sortOrder: 1 },
    category: {
      name: "Sandwich Combo",
      sortOrder: 2,
      description: "Sandwich with a choice of Salad or Side Order. Upgrade to Lamb $1.99 ext.",
    },
    items: [
      { name: "Sandwich Combo", hasMeasurements: true, measurements: [{ typeName: "Pita", price: 12.99 }, { typeName: "Plate", price: 16.99 }] },
    ],
  },

  // ── Cold Appetizers ─────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Appetizers", sortOrder: 2 },
    category: { name: "Cold Appetizers", sortOrder: 1 },
    items: [
      { name: "Coleslaw",      hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Hummus",        hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Baba Ganoush",  hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Fried Eggplant",hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Tzatziki",      hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Tabbouleh",     hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "GLARIC sauce",  hasMeasurements: true, measurements: [{ typeName: "Small", price: 6.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Tahini",        hasMeasurements: true, measurements: [{ typeName: "Small", price: 6.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Hot sauce",     hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
      { name: "Habanero",      hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Medium", price: 9.99 }, { typeName: "Large", price: 15.99 }] },
    ],
  },

  // ── Hot Appetizers ──────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Appetizers", sortOrder: 2 },
    category: { name: "Hot Appetizers", sortOrder: 2 },
    items: [
      { name: "Falafel with Tahini",        hasMeasurements: true, measurements: [{ typeName: "6 Balls", price: 6.99 }, { typeName: "12 Balls", price: 11.99 }] },
      { name: "Chicken Samosas",            price: 8.99,  description: "6 Pieces" },
      { name: "Moroccan Cigars",            price: 8.99,  description: "6 Pieces" },
      { name: "Jaffana style Poutine",      price: 11.99 },
      { name: "Chicken Shawarma Poutine",   price: 12.99 },
      { name: "Beef Shawarma Poutine",      price: 13.99 },
      { name: "Shawarma on Hummus",         price: 14.99 },
      { name: "Fried Calamari",             price: 15.99 },
    ],
  },

  // ── Entrées ─────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Entrées", sortOrder: 3 },
    category: {
      name: "Entrées",
      sortOrder: 1,
      description: "All entrées are served with a house salad and your choice of rice, French fries, red garlic potatoes, vegetables, mashed potatoes or potato wedges. Sweet potato fries 0.99. Salad upgrade to Greek, Israeli or Caesar 1.99. Extra side house salad 6.99. Extra sauces 0.99.",
    },
    items: [
      { name: "Falafel Dinner",     price: 14.99, description: "6 Balls" },
      { name: "Chicken Shawarma",   price: 18.99 },
      { name: "Beef Shawarma",      price: 19.99 },
      { name: "Lamb Chops",         price: 21.99, description: "4pc" },
    ],
  },

  // ── Shish Kebob ─────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Entrées", sortOrder: 3 },
    category: {
      name: "Shish Kebob",
      sortOrder: 2,
      description: "All entrées are served with a house salad and your choice of rice, French fries, red garlic potatoes, vegetables, mashed potatoes or potato wedges. Sweet potato fries 0.99. Salad upgrade to Greek, Israeli or Caesar 1.99. Extra side house salad 6.99. Extra sauces 0.99.",
    },
    items: [
      { name: "Chicken Breast",      hasMeasurements: true, measurements: [{ typeName: "1 Skewer", price: 16.99 }, { typeName: "2 Skewers", price: 19.99 }] },
      { name: "Chicken Dark",        hasMeasurements: true, measurements: [{ typeName: "1 Skewer", price: 16.99 }, { typeName: "2 Skewers", price: 19.99 }] },
      { name: "Mixed Chicken Skewers", price: 21.99, description: "2 Skewers" },
      { name: "Kefta Kebob",         hasMeasurements: true, description: "Ground lamb", measurements: [{ typeName: "1 Skewer", price: 15.99 }, { typeName: "2 Skewers", price: 21.99 }] },
      { name: "Lamb",                hasMeasurements: true, measurements: [{ typeName: "1 Skewer", price: 18.99 }, { typeName: "2 Skewers", price: 22.99 }] },
      { name: "Mixed Skewers",       price: 22.99, description: "2 Skewers" },
    ],
  },

  // ── Salads ──────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Salads", sortOrder: 4 },
    category: {
      name: "Salads",
      sortOrder: 1,
      description: "Add avocado, olives, mango, peppers, pecans or feta cheese 1.99. Chicken breast fillets can be substituted for Shawarma. Extra salad dressing 0.99.",
    },
    items: [
      { name: "House Salad",          hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Large", price: 10.99 }] },
      { name: "Caesar Salad",         hasMeasurements: true, measurements: [{ typeName: "Small", price: 6.99 }, { typeName: "Large", price: 10.99 }] },
      { name: "Greek Salad",          hasMeasurements: true, measurements: [{ typeName: "Small", price: 6.99 }, { typeName: "Large", price: 10.99 }] },
      { name: "Mango Salad",          hasMeasurements: true, measurements: [{ typeName: "Small", price: 6.99 }, { typeName: "Large", price: 10.99 }] },
      { name: "Israeli Salad",        hasMeasurements: true, measurements: [{ typeName: "Small", price: 7.99 }, { typeName: "Large", price: 11.99 }] },
      { name: "Chicken Breast Salad", price: 14.99, description: "3 Fillets" },
      { name: "Chicken Caesar Salad", price: 14.99, description: "3 Fillets" },
      { name: "Chicken Greek Salad",  price: 15.99, description: "3 Fillets" },
      { name: "Chicken Mango Salad",  price: 15.99, description: "3 Fillets" },
    ],
  },

  // ── Combos ──────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Combos", sortOrder: 5 },
    category: { name: "Combos", sortOrder: 1 },
    items: [
      { name: "Cold Appetizer Combo Salad (4)",  price: 17.99, description: "4 cold appetizers" },
      { name: "Cold Appetizer Combo Salad (6)",  price: 21.99, description: "6 cold appetizers" },
      { name: "Hot Appetizer Combo",             price: 16.99, description: "4 Moroccan cigars, 4 samosas and 4 falafels" },
      { name: "Falafel Combo Salad",             price: 15.99, description: "6 falafels with a choice of 3 cold appetizers" },
      { name: "Shawarma and Falafel Combo",      price: 17.99, description: "Shawarma with 3 falafels and Israeli salad" },
      { name: "Shawarma Combo Salad",            price: 18.99, description: "Shawarma with a choice of 2 cold appetizers" },
    ],
  },

  // ── Kids Menu ───────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Kids Menu", sortOrder: 6 },
    category: { name: "Kids Menu", sortOrder: 1, description: "Kids entrée include a side order." },
    items: [
      { name: "Fish and Chips", price: 13.99, description: "Haddock Fish, 2 Pieces" },
      { name: "Chicken Fingers", price: 13.99, description: "4 Pieces" },
    ],
  },

  // ── Side Orders ─────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Side Orders", sortOrder: 7 },
    category: { name: "Side Orders", sortOrder: 1 },
    items: [
      { name: "Rice",                 hasMeasurements: true, measurements: [{ typeName: "Small", price: 4.99 }, { typeName: "Large", price: 9.99  }] },
      { name: "French Fries",         hasMeasurements: true, measurements: [{ typeName: "Small", price: 4.99 }, { typeName: "Large", price: 9.99  }] },
      { name: "Potato Wedges",        hasMeasurements: true, measurements: [{ typeName: "Small", price: 4.99 }, { typeName: "Large", price: 9.99  }] },
      { name: "Red Garlic Potatoes",  hasMeasurements: true, measurements: [{ typeName: "Small", price: 4.99 }, { typeName: "Large", price: 9.99  }] },
      { name: "Vegetables",           hasMeasurements: true, measurements: [{ typeName: "Small", price: 4.99 }, { typeName: "Large", price: 9.99  }] },
      { name: "Sweet Potato Fries",   hasMeasurements: true, measurements: [{ typeName: "Small", price: 5.99 }, { typeName: "Large", price: 10.99 }] },
    ],
  },

  // ── Desserts ────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Desserts & Drinks", sortOrder: 8 },
    category: { name: "Desserts", sortOrder: 1 },
    items: [
      { name: "2 Scoops",                    price: 3.99,  description: "Chocolate or vanilla" },
      { name: "In-House Special",            price: 7.99 },
      { name: "The Cheesecake Factory Cake", price: 13.99, description: "Ask your server for cake selection" },
    ],
  },

  // ── Drinks ──────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Desserts & Drinks", sortOrder: 8 },
    category: { name: "Drinks", sortOrder: 2 },
    items: [
      { name: "Soft Drink",     price: 1.99, description: "355ml Can" },
      { name: "Water",          price: 1.50, description: "500ml Bottle" },
      { name: "Perrier",        price: 3.99, description: "330ml Bottle" },
      { name: "Israeli Nectar", price: 2.49, description: "250ml Can" },
      { name: "Ayran",          price: 3.00, description: "473ml Can" },
      { name: "Apple Juice",    price: 2.49, description: "300ml Can" },
      { name: "Orange Juice",   price: 2.49, description: "300ml Can" },
      { name: "Fresh juice available", price: null },
    ],
  },

  // ── KOTHU ───────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "KOTHU", sortOrder: 9 },
    category: { name: "KOTHU", sortOrder: 1 },
    items: [
      // PDF format: $12 NS / $14 — NS variant omitted, using the standard price
      { name: "Chicken",         hasMeasurements: true, measurements: [{ typeName: "NS", price: 12.00 }, { typeName: "Regular", price: 14.00 }] },
      { name: "Mutton",          hasMeasurements: true, measurements: [{ typeName: "NS", price: 12.00 }, { typeName: "Regular", price: 15.00 }] },
      { name: "Beef",            hasMeasurements: true, measurements: [{ typeName: "NS", price: 12.00 }, { typeName: "Regular", price: 15.00 }] },
      { name: "Dolphin",         hasMeasurements: true, measurements: [{ typeName: "NS", price: 14.00 }, { typeName: "Regular", price: 16.00 }] },
      { name: "Seafood",         hasMeasurements: true, measurements: [{ typeName: "NS", price: 14.00 }, { typeName: "Regular", price: 16.00 }] },
      { name: "Cheese Kothu",    price: 15.00 },
      { name: "Chicken Shawarma",price: 13.00 },
      { name: "Beef Shawarma",   price: 15.00 },
      { name: "Veggie",          price: 10.00 },
      { name: "Egg",             price: 10.00 },
    ],
  },

  // ── Pasta ───────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Pasta", sortOrder: 10 },
    category: { name: "Pasta", sortOrder: 1 },
    items: [
      { name: "Chicken & Shrimp", price: 17.00 },
      { name: "Chicken Pasta",    price: 15.00 },
      { name: "Seafood Pasta",    price: 17.00 },
      { name: "Veggie Pasta",     price: 13.00 },
    ],
  },

  // ── Briyani ─────────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Briyani", sortOrder: 11 },
    category: { name: "Briyani", sortOrder: 1 },
    items: [
      { name: "Chicken", price: 15.00 },
      { name: "Mutton",  price: 16.00 },
    ],
  },

  // ── Fried Rice ──────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Fried Rice", sortOrder: 12 },
    category: { name: "Fried Rice", sortOrder: 1 },
    items: [
      { name: "chicken",  price: 15.00 },
      { name: "Beef",     price: 16.00 },
      { name: "Seafood",  price: 17.00 },
      { name: "Veggie",   price: 13.00 },
      { name: "Egg",      price: 12.00 },
    ],
  },

  // ── Chicken Dish ────────────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Chicken Dish", sortOrder: 13 },
    category: { name: "Chicken Dish", sortOrder: 1 },
    items: [
      { name: "Chicken Devil",  price: 15.00 },
      { name: "Chicken 65",     price: 15.00 },
      { name: "Chili Chicken",  price: 15.00 },
      { name: "Tandoori Leg",   price: 4.00 },
      { name: "Butter Chicken", price: 16.00 },
    ],
  },

  // ── Sri Lankan Specialties ──────────────────────────────────────────────────
  {
    primaryCategory: { name: "Sri Lankan Specialties", sortOrder: 14 },
    category: { name: "Sri Lankan Specialties", sortOrder: 1 },
    items: [
      { name: "Puttu box (white)",  price: 3.00, description: "add sampal & sothi $1.50" },
      { name: "Puttu box (Brown)",  price: 3.00, description: "add sampal & sothi $1.50" },
      { name: "Idiyappam (white)",  price: 3.00, description: "Add sampal & sothi $1.50" },
      { name: "Idiyappam (Brown)",  price: 3.00, description: "Add sampal & sothi $1.50" },
    ],
  },

  // ── Jaffna Style Banana Leaf ────────────────────────────────────────────────
  {
    primaryCategory: { name: "Sri Lankan Specialties", sortOrder: 14 },
    category: { name: "Jaffna Style Banana Leaf", sortOrder: 2 },
    items: [
      { name: "Chicken",    price: 16.00 },
      { name: "Veggie",     price: 14.00 },
      { name: "Mutton",     price: 17.00 },
      { name: "Any Seafood",price: 17.00 },
      { name: "All Seafood",price: 25.00 },
    ],
  },

  // ── Everyday Lunch Boxes ────────────────────────────────────────────────────
  {
    primaryCategory: { name: "Lunch Boxes", sortOrder: 15 },
    category: { name: "Everyday Lunch Boxes", sortOrder: 1 },
    items: [
      { name: "Everyday Lunch Box", price: 10.00 },
      { name: "Burger combo",       price: 11.99, description: "Burger sandwich with French fries and pop" },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function query(sql, params = []) {
  if (DRY_RUN) {
    console.log("[DRY RUN]", sql.replace(/\s+/g, " ").trim(), params);
    return { rows: [] };
  }
  return client.query(sql, params);
}

async function upsertPrimaryCategory(name, sortOrder) {
  const existing = await client.query(
    `SELECT id FROM primary_categories WHERE name = $1 LIMIT 1`,
    [name]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const id = uuidv4();
  await query(
    `INSERT INTO primary_categories (id, name, sort_order, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, true, NOW(), NOW())`,
    [id, name, sortOrder]
  );
  console.log(`  [+] Primary category: ${name}`);
  return id;
}

async function upsertMenuCategory(name, primaryCategoryId, sortOrder, description) {
  const existing = await client.query(
    `SELECT id FROM menu_categories WHERE name = $1 AND primary_category_id = $2 LIMIT 1`,
    [name, primaryCategoryId]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const id = uuidv4();
  await query(
    `INSERT INTO menu_categories (id, name, description, primary_category_id, sort_order, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
    [id, name, description || null, primaryCategoryId, sortOrder]
  );
  console.log(`    [+] Category: ${name}`);
  return id;
}

const measurementTypeCache = {};
async function upsertMeasurementType(name) {
  if (measurementTypeCache[name]) return measurementTypeCache[name];

  const existing = await client.query(
    `SELECT id FROM measurement_types WHERE name = $1 LIMIT 1`,
    [name]
  );
  if (existing.rows.length) {
    measurementTypeCache[name] = existing.rows[0].id;
    return existing.rows[0].id;
  }

  const id = uuidv4();
  await query(
    `INSERT INTO measurement_types (id, name, short_name, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [id, name, name]
  );
  measurementTypeCache[name] = id;
  console.log(`      [+] Measurement type: ${name}`);
  return id;
}

async function insertMenuItem(item, categoryId, sortOrder) {
  const existing = await client.query(
    `SELECT id FROM menu_items WHERE name = $1 AND location_availability = $2 LIMIT 1`,
    [item.name, LOCATION]
  );
  if (existing.rows.length) {
    return { id: existing.rows[0].id, skipped: true };
  }

  const id = uuidv4();
  await query(
    `INSERT INTO menu_items
       (id, name, description, price, is_available, sort_order, category_id,
        has_measurements, location_availability, price_scarborough, price_markham,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,NULL,NULL,NOW(),NOW())`,
    [
      id,
      item.name,
      item.description || null,
      item.price || null,
      sortOrder,
      categoryId,
      item.hasMeasurements ? true : false,
      LOCATION,
    ]
  );
  return { id, skipped: false };
}

async function insertMeasurements(menuItemId, measurements) {
  for (const m of measurements) {
    const typeId = await upsertMeasurementType(m.typeName);

    const existing = await client.query(
      `SELECT id FROM menu_item_measurements
        WHERE menu_item_id = $1 AND measurement_type_id = $2 LIMIT 1`,
      [menuItemId, typeId]
    );
    if (existing.rows.length) continue;

    await query(
      `INSERT INTO menu_item_measurements (id, menu_item_id, measurement_type_id, price, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [uuidv4(), menuItemId, typeId, m.price]
    );
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log(" Nanthus Kitchen — Markham Menu Seed");
  if (DRY_RUN) console.log(" MODE: DRY RUN (nothing will be written)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`DB: ${process.env.DATABASE_NAME} @ ${process.env.DATABASE_HOST || "localhost"}\n`);

  await client.connect();
  console.log("✅ Connected\n");

  if (!DRY_RUN) await client.query("BEGIN");

  try {
    let inserted = 0;
    let skipped  = 0;

    for (const section of MENU) {
      const { primaryCategory, category, items } = section;

      const primaryCatId = await upsertPrimaryCategory(
        primaryCategory.name,
        primaryCategory.sortOrder
      );
      const categoryId = await upsertMenuCategory(
        category.name,
        primaryCatId,
        category.sortOrder,
        category.description
      );

      for (let i = 0; i < items.length; i++) {
        const { id, skipped: wasSkipped } = await insertMenuItem(items[i], categoryId, i);

        if (wasSkipped) {
          console.log(`      [=] Skipped (exists): ${items[i].name}`);
          skipped++;
        } else {
          console.log(`      [+] Item: ${items[i].name}`);
          inserted++;
          if (items[i].hasMeasurements && items[i].measurements?.length) {
            await insertMeasurements(id, items[i].measurements);
          }
        }
      }
    }

    if (!DRY_RUN) {
      await client.query("COMMIT");
      console.log("\n✅ Transaction committed");
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log(` Done.  Inserted: ${inserted}  |  Skipped: ${skipped}`);
    console.log("═══════════════════════════════════════════════════════");

  } catch (err) {
    if (!DRY_RUN) {
      await client.query("ROLLBACK");
      console.error("\n❌ Error — transaction rolled back. Nothing was written.");
    }
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
