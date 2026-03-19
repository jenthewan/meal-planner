// ── Firebase setup ──────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDX30eTXA5ZOpfs7ppG8buR2lA1Cjf4LYc",
  authDomain: "meal-planner-b8721.firebaseapp.com",
  databaseURL: "https://meal-planner-b8721-default-rtdb.firebaseio.com",
  projectId: "meal-planner-b8721",
  storageBucket: "meal-planner-b8721.firebasestorage.app",
  messagingSenderId: "91326190053",
  appId: "1:91326190053:web:4f42deab745fab9e2a9f0c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const planRef = ref(db, "plan");

// ── Meal slot definitions ────────────────────────────────────────
const DINNER_SLOTS = [
  { key: "monday_dinner",    label: "Mon" },
  { key: "tuesday_dinner",   label: "Tue" },
  { key: "wednesday_dinner", label: "Wed" },
  { key: "thursday_dinner",  label: "Thu" },
  { key: "friday_dinner",    label: "Fri" },
];

const LUNCH_SLOTS = [
  { key: "monday_lunch",    label: "Mon" },
  { key: "wednesday_lunch", label: "Wed" },
  { key: "friday_lunch",    label: "Fri" },
];

const MARGOT_SLOTS = [
  { key: "margot_monday",    label: "Mon" },
  { key: "margot_tuesday",   label: "Tue" },
  { key: "margot_wednesday", label: "Wed" },
  { key: "margot_thursday",  label: "Thu" },
  { key: "margot_friday",    label: "Fri" },
];

// ── State ────────────────────────────────────────────────────────
let currentPlan = {};
let editingKey = null;

// ── Firebase listener ────────────────────────────────────────────
onValue(planRef, (snapshot) => {
  currentPlan = snapshot.val() || {};
  render();
});

// ── Render ───────────────────────────────────────────────────────
function render() {
  updateWeekLabel();
  renderMealList("dinners-list", DINNER_SLOTS);
  renderMealList("lunches-list", LUNCH_SLOTS);
  renderMealList("margot-list", MARGOT_SLOTS);
  renderGroceryList();
}

function updateWeekLabel() {
  const el = document.getElementById("week-label");
  if (currentPlan.weekOf) {
    const d = new Date(currentPlan.weekOf + "T12:00:00");
    el.textContent = "Week of " + d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } else {
    el.textContent = "No plan loaded yet — use Generate tab";
  }
}

function renderMealList(containerId, slots) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  slots.forEach(({ key, label }) => {
    const meal = (currentPlan.meals || {})[key] || {};
    const card = makeMealCard(key, label, meal);
    container.appendChild(card);
  });
}

function makeMealCard(key, label, meal) {
  const card = document.createElement("div");
  card.className = "meal-card" + (meal.done ? " done" : "");
  card.dataset.key = key;

  const isEmpty = !meal.name;

  // Top row
  const top = document.createElement("div");
  top.className = "meal-card-top";

  const dayEl = document.createElement("div");
  dayEl.className = "meal-day";
  dayEl.textContent = label;

  const nameEl = document.createElement("div");
  nameEl.className = "meal-name" + (isEmpty ? " empty" : "");
  nameEl.textContent = isEmpty ? "Tap Edit to add a meal" : meal.name;

  const checkBtn = document.createElement("button");
  checkBtn.className = "done-check" + (meal.done ? " checked" : "");
  checkBtn.title = meal.done ? "Mark undone" : "Mark done";
  checkBtn.addEventListener("click", () => toggleDone(key, meal.done));

  top.appendChild(dayEl);
  top.appendChild(nameEl);
  top.appendChild(checkBtn);
  card.appendChild(top);

  // Expand toggle (only if there's content)
  if (!isEmpty) {
    const toggle = document.createElement("button");
    toggle.className = "expand-toggle";
    toggle.textContent = "Show details ▾";
    toggle.addEventListener("click", () => {
      card.classList.toggle("expanded");
      toggle.textContent = card.classList.contains("expanded") ? "Hide details ▴" : "Show details ▾";
    });
    card.appendChild(toggle);

    // Details section
    const details = document.createElement("div");
    details.className = "meal-details";

    if (meal.ingredients && meal.ingredients.length > 0) {
      const ingLabel = document.createElement("div");
      ingLabel.className = "detail-label";
      ingLabel.textContent = "Ingredients";
      const ingList = document.createElement("ul");
      ingList.className = "detail-list";
      meal.ingredients.forEach(ing => {
        const li = document.createElement("li");
        li.textContent = ing;
        ingList.appendChild(li);
      });
      details.appendChild(ingLabel);
      details.appendChild(ingList);
    }

    if (meal.instructions) {
      const instrLabel = document.createElement("div");
      instrLabel.className = "detail-label";
      instrLabel.textContent = "Instructions";
      const steps = meal.instructions.split(/\.\s+|\n/).map(s => s.trim()).filter(Boolean);
      if (steps.length > 1) {
        const ol = document.createElement("ol");
        ol.className = "detail-list";
        steps.forEach(step => {
          const li = document.createElement("li");
          li.textContent = step.replace(/\.$/, "");
          ol.appendChild(li);
        });
        details.appendChild(instrLabel);
        details.appendChild(ol);
      } else {
        const instrText = document.createElement("div");
        instrText.className = "detail-text";
        instrText.textContent = meal.instructions;
        details.appendChild(instrLabel);
        details.appendChild(instrText);
      }
    }

    if (meal.babyNotes) {
      const babyDiv = document.createElement("div");
      babyDiv.className = "baby-note";
      const babyLabel = document.createElement("div");
      babyLabel.className = "detail-label";
      babyLabel.textContent = "Margot";
      const steps = meal.babyNotes.split(/\.\s+|\n/).map(s => s.trim()).filter(Boolean);
      if (steps.length > 1) {
        const ol = document.createElement("ol");
        ol.className = "detail-list";
        steps.forEach(step => {
          const li = document.createElement("li");
          li.textContent = step.replace(/\.$/, "");
          ol.appendChild(li);
        });
        babyDiv.appendChild(babyLabel);
        babyDiv.appendChild(ol);
      } else {
        const babyText = document.createElement("div");
        babyText.className = "detail-text";
        babyText.textContent = meal.babyNotes;
        babyDiv.appendChild(babyLabel);
        babyDiv.appendChild(babyText);
      }
      details.appendChild(babyDiv);
    }

    if (meal.userNotes) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "user-note";
      const noteLabel = document.createElement("div");
      noteLabel.className = "detail-label";
      noteLabel.textContent = "Notes";
      const noteText = document.createElement("div");
      noteText.className = "detail-text";
      noteText.textContent = meal.userNotes;
      noteDiv.appendChild(noteLabel);
      noteDiv.appendChild(noteText);
      details.appendChild(noteDiv);
    }

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "meal-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEditModal(key, meal));
    actions.appendChild(editBtn);

    details.appendChild(actions);
    card.appendChild(details);
  } else {
    // Just show edit button for empty slots
    const actions = document.createElement("div");
    actions.className = "meal-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn-small";
    editBtn.textContent = "Add meal";
    editBtn.addEventListener("click", () => openEditModal(key, meal));
    actions.appendChild(editBtn);
    card.appendChild(actions);
  }

  return card;
}

// ── Grocery list ─────────────────────────────────────────────────
function renderGroceryList() {
  const container = document.getElementById("grocery-list");
  container.innerHTML = "";

  const items = currentPlan.groceryList || [];

  if (items.length === 0) {
    container.innerHTML = `<div class="grocery-empty">No grocery list yet.<br>Generate a week to populate this.</div>`;
    return;
  }

  // Group by category
  const categories = {};
  items.forEach((item, idx) => {
    const cat = item.category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ ...item, idx });
  });

  Object.entries(categories).forEach(([cat, catItems]) => {
    const section = document.createElement("div");
    section.className = "grocery-category";

    const heading = document.createElement("h3");
    heading.textContent = cat;
    section.appendChild(heading);

    catItems.forEach(({ item, amount, checked, idx }) => {
      const row = document.createElement("div");
      row.className = "grocery-item" + (checked ? " checked" : "");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!checked;
      cb.id = "grocery-" + idx;
      cb.addEventListener("change", () => toggleGroceryItem(idx, cb.checked));

      const lbl = document.createElement("label");
      lbl.htmlFor = "grocery-" + idx;
      lbl.textContent = amount ? `${item} (${amount})` : item;

      row.appendChild(cb);
      row.appendChild(lbl);
      row.addEventListener("click", (e) => {
        if (e.target !== cb) cb.click();
      });

      section.appendChild(row);
    });

    container.appendChild(section);
  });
}

// ── Firebase writes ──────────────────────────────────────────────
function toggleDone(key, currentDone) {
  update(ref(db, `plan/meals/${key}`), { done: !currentDone });
}

function toggleGroceryItem(idx, checked) {
  update(ref(db, `plan/groceryList/${idx}`), { checked });
}

function saveMeal(key, data) {
  update(ref(db, `plan/meals/${key}`), data);
}

// ── Edit modal ───────────────────────────────────────────────────
const overlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalName = document.getElementById("modal-name");
const modalInstructions = document.getElementById("modal-instructions");
const modalBaby = document.getElementById("modal-baby");
const modalNotes = document.getElementById("modal-notes");
const modalIngredients = document.getElementById("modal-ingredients");

function openEditModal(key, meal) {
  editingKey = key;
  modalTitle.textContent = "Edit Meal";
  modalName.value = meal.name || "";
  modalInstructions.value = meal.instructions || "";
  modalBaby.value = meal.babyNotes || "";
  modalNotes.value = meal.userNotes || "";
  modalIngredients.value = (meal.ingredients || []).join("\n");
  overlay.classList.remove("hidden");
}

function closeModal() {
  overlay.classList.add("hidden");
  editingKey = null;
}

document.getElementById("modal-cancel").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

document.getElementById("modal-save").addEventListener("click", () => {
  if (!editingKey) return;

  const ingredients = modalIngredients.value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  saveMeal(editingKey, {
    name: modalName.value.trim(),
    instructions: modalInstructions.value.trim(),
    babyNotes: modalBaby.value.trim(),
    userNotes: modalNotes.value.trim(),
    ingredients,
  });

  closeModal();
});

// ── Uncheck all groceries ────────────────────────────────────────
document.getElementById("uncheck-all").addEventListener("click", () => {
  const items = currentPlan.groceryList || [];
  const updates = {};
  items.forEach((_, idx) => { updates[`plan/groceryList/${idx}/checked`] = false; });
  update(ref(db), updates);
});

// ── Tabs ─────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// ── Generate tab: copy prompt ────────────────────────────────────
const HOUSEHOLD_PROMPT = `MEAL PLAN GENERATION PROMPT

Generate a weekly meal plan for a family of three: two adults and one baby (1 year old, named Margot). Follow these rules exactly:

OUTPUT FORMAT — return ONLY a valid JSON object with this exact structure, no other text before or after:
{
  "weekOf": "YYYY-MM-DD (Monday's date)",
  "meals": {
    "monday_dinner":    { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "tuesday_dinner":   { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "wednesday_dinner": { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "thursday_dinner":  { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "friday_dinner":    { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "monday_lunch":     { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "wednesday_lunch":  { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "friday_lunch":     { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "margot_monday":    { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "margot_tuesday":   { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "margot_wednesday": { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "margot_thursday":  { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] },
    "margot_friday":    { "name": "", "instructions": "", "babyNotes": "", "ingredients": [] }
  },
  "groceryList": [
    { "item": "", "amount": "", "category": "Produce|Protein|Dairy|Grains|Frozen|Other" }
  ]
}

HOUSEHOLD RULES:
- Adult 1: Enjoys Asian cuisine, comfortable with sodium.
- Adult 2: Health-conscious. Lower sodium, avoid excess carbs and red meat. Cannot eat walnuts, pecans, avocado, banana, or most mushrooms (enoki is fine). Allowed nuts: peanuts, almonds, pistachios. Where adults differ on seasoning, adjust at serving — do not cook two separate meals.
- Baby Margot (~1 year old): Soft solids and finger foods only. 8 teeth, no molars. Safe: soft-cooked veg, soft fish, ground or finely shredded meat, soft grains, soft fruit (squish blueberries). Avoid: honey, high sodium, hard raw veg, large pieces, whole round slippery foods, hot dogs or processed cylinder-shaped foods.
- Daycare lunches (margot_*): No eggs (classmate allergy). Safe unrefrigerated with ice pack 4–5 hours. No reheating. Finger food format. No saucy dishes that fall apart in a container.
- Cooking effort: Max ~20 min active cooking. Preferred formats: sheet pan, stir fry, one-pan, rice cooker, simple assembly. Meals should feel fresh, not reheated leftovers.
- Cuisine style: Asian-leaning strongly preferred. Preferred meal types: rice bowls, noodle bowls, stir fries, miso salmon, tofu dishes, lettuce wraps, steamed egg, Asian-flavored salads.
- Pantry always stocked (never put on grocery list): soy sauce, miso, fish sauce, oyster sauce, sesame oil, chili oil, black vinegar, rice vinegar, mirin, ginger, garlic, scallions, standard spices.
- Preferred proteins: salmon, tofu, shrimp, rotisserie chicken, ground turkey, eggs (adults only), occasional red meat.
- Preferred veg: frozen broccoli, frozen stir fry veg, baby cucumbers, cherry tomatoes, bagged greens, shredded carrots, spinach, enoki mushrooms.
- Frozen goods always on hand: peas, green beans, mango, Chinese boiled dumplings, Argentinian shrimp, thin-sliced lamb, chicken tenders.
- Groceries available at: Whole Foods, PCC, H Mart, T&T.
- Do not repeat any dinner from the last 4 weeks.
- Overlap ingredients across meals to reduce waste.
- Pull Margot's portion before adding sauces/seasoning — no separate cooking.
- Adult lunches should repurpose dinner leftovers where possible.`;

document.getElementById("copy-prompt").addEventListener("click", async () => {
  const onHand = document.getElementById("on-hand").value.trim();
  const recentDinners = document.getElementById("recent-dinners").value.trim();

  let prompt = HOUSEHOLD_PROMPT;
  prompt += `\n\nIngredients on hand this week: ${onHand || "none specified"}`;
  prompt += `\nRecent dinners to avoid repeating: ${recentDinners || "none specified"}`;
  prompt += `\n\nNow generate the full weekly meal plan as JSON only.`;

  try {
    await navigator.clipboard.writeText(prompt);
    document.getElementById("copy-confirm").classList.remove("hidden");
    setTimeout(() => document.getElementById("copy-confirm").classList.add("hidden"), 4000);
  } catch {
    alert("Clipboard copy failed — please copy the prompt manually.");
  }
});

// ── Generate tab: load JSON ──────────────────────────────────────
document.getElementById("load-plan").addEventListener("click", () => {
  const raw = document.getElementById("paste-json").value.trim();
  const errorEl = document.getElementById("load-error");
  errorEl.classList.add("hidden");

  let parsed;
  try {
    // Handle case where Claude wraps JSON in ```json ... ```
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    parsed = JSON.parse(cleaned);
  } catch {
    errorEl.textContent = "Couldn't read that JSON. Make sure you copied the full response from Claude and try again.";
    errorEl.classList.remove("hidden");
    return;
  }

  if (!parsed.meals) {
    errorEl.textContent = "The JSON doesn't look right — it's missing a 'meals' section. Make sure Claude returned the full plan.";
    errorEl.classList.remove("hidden");
    return;
  }

  // Reset done states on new plan load
  Object.keys(parsed.meals).forEach(k => { parsed.meals[k].done = false; });

  set(planRef, parsed)
    .then(() => {
      document.getElementById("paste-json").value = "";
      // Switch to This Week tab
      document.querySelector('[data-tab="this-week"]').click();
    })
    .catch(err => {
      errorEl.textContent = "Error saving to database: " + err.message;
      errorEl.classList.remove("hidden");
    });
});
