import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ─── PASTE YOUR GOOGLE APPS SCRIPT URL HERE after Step 2 of the guide ───
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzLKOrbnqzdWkRy25fvQGzlj9uoHX4IttIrZzmtk2209wmKUbnGC2x1ZW8lCo9c9qdOBw/exec";

const MONTH_KEY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const DEFAULT_CATEGORIES = [
  { id: "home_loan", name: "Home Loan", color: "#4F6F8F", type: "expense" },
  { id: "car_loan", name: "Car Loan", color: "#5DADE2", type: "expense" },
  { id: "personal_loan", name: "Personal Loan", color: "#2E86AB", type: "expense" },
  { id: "grocery", name: "Grocery", color: "#E07B54", type: "expense" },
  { id: "petrol", name: "Petrol", color: "#E8B84B", type: "expense" },
  { id: "course_fee", name: "Course Fee", color: "#A569BD", type: "expense" },
  { id: "school_fee", name: "School Fee", color: "#B784A7", type: "expense" },
  { id: "chit", name: "Chit", color: "#F0A500", type: "expense" },
  { id: "current_bill", name: "Current Bill", color: "#F39C12", type: "expense" },
  { id: "maid_salary", name: "Maid Salary", color: "#7BAE7F", type: "expense" },
  { id: "gifts_donations", name: "Gifts / Donations", color: "#F1948A", type: "expense" },
  { id: "maintenance", name: "Maintenance", color: "#76D7C4", type: "expense" },
  { id: "travel", name: "Travel", color: "#1ABC9C", type: "expense" },
  { id: "food_dining", name: "Food / Dining", color: "#E74C3C", type: "expense" },
  { id: "medical", name: "Medical", color: "#EC407A", type: "expense" },
  { id: "entertainment", name: "Entertainment", color: "#8E44AD", type: "expense" },
  { id: "clothing", name: "Clothing", color: "#D35400", type: "expense" },
  { id: "emergency_fund", name: "Emergency Fund", color: "#E67E22", type: "expense" },
  { id: "credit_card", name: "Credit Card", color: "#C0392B", type: "expense" },
  { id: "savings", name: "Savings", color: "#27AE60", type: "savings" },
  { id: "other", name: "Other", color: "#95A5A6", type: "expense" },
];

const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary" },
  { id: "freelance", name: "Freelance" },
  { id: "investments", name: "Investments" },
  { id: "other_income", name: "Other Income" },
];

const PROTECTED_IDS = DEFAULT_CATEGORIES.map(c => c.id);

const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div style={{ background: "#1A2332", border: "1px solid #2D3F55", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#E8EDF2" }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
        <div style={{ color: d.payload.color }}>{formatINR(d.value)}</div>
        <div style={{ color: "#7A8FA6", fontSize: 11 }}>{d.payload.percent}% of total outflow</div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [income, setIncome] = useState({});
  const [expenses, setExpenses] = useState({});
  const [budgets, setBudgets] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | saved | error
  const [lastSynced, setLastSynced] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const monthKey = MONTH_KEY();
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // ── Load from Google Sheets on mount ──
  useEffect(() => {
    if (SHEET_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      setIsLoading(false);
      return;
    }
    fetch(`${SHEET_URL}?month=${monthKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.income) setIncome(data.income);
        if (data.expenses) setExpenses(data.expenses);
        if (data.budgets) setBudgets(data.budgets);
        if (data.categories) setCategories(data.categories);
        setLastSynced(new Date());
      })
      .catch(() => setSyncStatus("error"))
      .finally(() => setIsLoading(false));
  }, [monthKey]);

  // ── Save to Google Sheets ──
  const saveToSheet = useCallback(async (payload) => {
    if (SHEET_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") return;
    setSyncStatus("syncing");
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify({ month: monthKey, ...payload }),
      });
      setSyncStatus("saved");
      setLastSynced(new Date());
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch {
      setSyncStatus("error");
    }
  }, [monthKey]);

  const handleIncomeChange = (id, val) => {
    const next = { ...income, [id]: val };
    setIncome(next);
    saveToSheet({ income: next, expenses, budgets, categories });
  };

  const handleExpenseChange = (id, val) => {
    const next = { ...expenses, [id]: val };
    setExpenses(next);
    saveToSheet({ income, expenses: next, budgets, categories });
  };

  const handleBudgetChange = (id, val) => {
    const next = { ...budgets, [id]: val };
    setBudgets(next);
    saveToSheet({ income, expenses, budgets: next, categories });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const colors = ["#F1948A", "#82E0AA", "#85C1E9", "#F8C471", "#C39BD3", "#76D7C4"];
    const color = colors[categories.length % colors.length];
    const next = [...categories, { id: `cat_${Date.now()}`, name: newCatName.trim(), color, type: newCatType }];
    setCategories(next);
    saveToSheet({ income, expenses, budgets, categories: next });
    setNewCatName("");
  };

  const handleRemoveCategory = (id) => {
    const next = categories.filter(c => c.id !== id);
    setCategories(next);
    saveToSheet({ income, expenses, budgets, categories: next });
  };

  const totalIncome = useMemo(() => Object.values(income).reduce((s, v) => s + (parseFloat(v) || 0), 0), [income]);
  const totalExpenses = useMemo(() => categories.filter(c => c.type === "expense").reduce((s, c) => s + (parseFloat(expenses[c.id]) || 0), 0), [expenses, categories]);
  const totalSavings = useMemo(() => categories.filter(c => c.type === "savings").reduce((s, c) => s + (parseFloat(expenses[c.id]) || 0), 0), [expenses, categories]);
  const totalOutflow = totalExpenses + totalSavings;
  const remaining = totalIncome - totalOutflow;
  const overBudget = remaining < 0;
  const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0;

  const pieData = useMemo(() =>
    categories.map(c => ({ ...c, value: parseFloat(expenses[c.id]) || 0, percent: totalOutflow > 0 ? ((parseFloat(expenses[c.id]) || 0) / totalOutflow * 100).toFixed(1) : 0 })).filter(c => c.value > 0),
    [expenses, categories, totalOutflow]
  );

  const overBudgetCategories = useMemo(() =>
    categories.filter(c => budgets[c.id] && (parseFloat(expenses[c.id]) || 0) > parseFloat(budgets[c.id])),
    [categories, expenses, budgets]
  );

  const s = {
    root: { fontFamily: "'Inter', system-ui, sans-serif", background: "#0F1923", minHeight: "100vh", color: "#E8EDF2", paddingBottom: 40 },
    header: { background: "linear-gradient(135deg, #1A2A3F 0%, #0F1923 100%)", borderBottom: "1px solid #1E2D40", padding: "20px 24px 16px" },
    headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    logo: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#E8EDF2" },
    logoAccent: { color: "#4FC3F7" },
    logoSub: { fontSize: 10, color: "#7A8FA6", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 },
    syncBadge: { fontSize: 10, padding: "3px 10px", borderRadius: 12, fontWeight: 600,
      background: syncStatus === "saved" ? "#0B3D2B" : syncStatus === "syncing" ? "#1A2A3F" : syncStatus === "error" ? "#3D1A0B" : "#1A2332",
      color: syncStatus === "saved" ? "#27AE60" : syncStatus === "syncing" ? "#4FC3F7" : syncStatus === "error" ? "#E07B54" : "#7A8FA6" },
    nav: { display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" },
    navBtn: (active) => ({ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: active ? "#4FC3F7" : "transparent", color: active ? "#0F1923" : "#7A8FA6", transition: "all 0.2s" }),
    container: { maxWidth: 900, margin: "0 auto", padding: "20px 16px" },
    summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 },
    card: (accent) => ({ background: "#1A2332", borderRadius: 12, padding: "14px 16px", borderLeft: `3px solid ${accent}` }),
    cardLabel: { fontSize: 10, color: "#7A8FA6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    cardValue: (color) => ({ fontSize: 20, fontWeight: 700, color: color || "#E8EDF2", letterSpacing: "-0.5px" }),
    cardSub: { fontSize: 10, color: "#7A8FA6", marginTop: 4 },
    sectionTitle: { fontSize: 11, fontWeight: 600, color: "#7A8FA6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    label: { display: "block", fontSize: 11, color: "#7A8FA6", marginBottom: 4, fontWeight: 500 },
    input: { width: "100%", background: "#0F1923", border: "1px solid #2D3F55", borderRadius: 7, padding: "8px 10px", color: "#E8EDF2", fontSize: 14, outline: "none", boxSizing: "border-box" },
    progressOuter: { background: "#0F1923", borderRadius: 4, height: 4, overflow: "hidden" },
    warning: { background: "#2D1B0E", border: "1px solid #E07B54", borderRadius: 10, padding: "12px 16px", marginBottom: 16 },
    warningTitle: { fontSize: 13, fontWeight: 700, color: "#E07B54", marginBottom: 4 },
    warningItem: { fontSize: 11, color: "#D4A574", marginBottom: 2 },
    badge: (ok) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: ok ? "#0B3D2B" : "#3D1A0B", color: ok ? "#27AE60" : "#E07B54" }),
    addBtn: { padding: "8px 14px", borderRadius: 7, border: "none", background: "#4FC3F7", color: "#0F1923", fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
    select: { background: "#0F1923", border: "1px solid #2D3F55", borderRadius: 7, padding: "8px 10px", color: "#E8EDF2", fontSize: 12, outline: "none" },
    dot: (color) => ({ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }),
    empty: { textAlign: "center", color: "#3D5068", fontSize: 13, padding: "32px 0" },
    notSetup: { background: "#1A2A1A", border: "1px solid #27AE60", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 12, color: "#7BAE7F" },
  };

  const syncLabel = syncStatus === "saved" ? "✓ Saved" : syncStatus === "syncing" ? "↑ Saving..." : syncStatus === "error" ? "✗ Sync error" : lastSynced ? `Last saved ${lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Not yet synced";

  if (isLoading) return (
    <div style={{ ...s.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#7A8FA6" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Loading your budget data...</div>
      </div>
    </div>
  );

  return (
    <div style={s.root}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div style={s.logo}>MIPL <span style={s.logoAccent}>Budget</span> Tracker</div>
            <div style={s.logoSub}>Monthly Family Finance · {monthYear}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={s.syncBadge}>{syncLabel}</span>
          </div>
        </div>
        <div style={s.nav}>
          {["dashboard", "income", "expenses", "categories"].map(tab => (
            <button key={tab} style={s.navBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={s.container}>

        {/* Setup notice */}
        {SHEET_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE" && (
          <div style={s.notSetup}>
            📋 <strong>Google Sheets not connected yet.</strong> Follow the deployment guide to enable cloud sync. Your data is currently stored locally in this session.
          </div>
        )}

        {/* Warnings */}
        {(overBudget || overBudgetCategories.length > 0) && (
          <div style={s.warning}>
            <div style={s.warningTitle}>⚠ Budget Alerts</div>
            {overBudget && <div style={s.warningItem}>Total outflow exceeds income by {formatINR(Math.abs(remaining))}</div>}
            {overBudgetCategories.map(c => (
              <div key={c.id} style={s.warningItem}>
                {c.name}: spent {formatINR(parseFloat(expenses[c.id]) || 0)}, budgeted {formatINR(parseFloat(budgets[c.id]) || 0)} (+{formatINR((parseFloat(expenses[c.id]) || 0) - parseFloat(budgets[c.id]))})
              </div>
            ))}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div style={s.summaryGrid}>
              <div style={s.card("#4FC3F7")}>
                <div style={s.cardLabel}>Total Income</div>
                <div style={s.cardValue("#4FC3F7")}>{formatINR(totalIncome)}</div>
                <div style={s.cardSub}>{INCOME_CATEGORIES.filter(c => income[c.id]).length} sources</div>
              </div>
              <div style={s.card("#E07B54")}>
                <div style={s.cardLabel}>Total Expenses</div>
                <div style={s.cardValue("#E07B54")}>{formatINR(totalExpenses)}</div>
                <div style={s.cardSub}>excl. savings</div>
              </div>
              <div style={s.card(overBudget ? "#E07B54" : "#27AE60")}>
                <div style={s.cardLabel}>Remaining</div>
                <div style={s.cardValue(overBudget ? "#E07B54" : "#27AE60")}>{formatINR(Math.abs(remaining))}</div>
                <div style={s.cardSub}><span style={s.badge(!overBudget)}>{overBudget ? "OVER BUDGET" : "ON TRACK"}</span></div>
              </div>
            </div>

            <div style={s.twoCol}>
              <div>
                <div style={s.sectionTitle}>Spending Breakdown</div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value">
                        {pieData.map((entry) => <Cell key={entry.id} fill={entry.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={s.empty}>Add expenses to see breakdown</div>
                )}
              </div>

              <div>
                <div style={s.sectionTitle}>Category Summary</div>
                <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                  {categories.map(cat => {
                    const spent = parseFloat(expenses[cat.id]) || 0;
                    const bud = parseFloat(budgets[cat.id]) || 0;
                    const pct = bud > 0 ? Math.min((spent / bud) * 100, 100) : 0;
                    const over = bud > 0 && spent > bud;
                    if (spent === 0 && bud === 0) return null;
                    return (
                      <div key={cat.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={s.dot(cat.color)} />
                            <span style={{ fontSize: 11, color: "#C5D0DC" }}>{cat.name}</span>
                            {cat.type === "savings" && <span style={{ fontSize: 9, color: "#27AE60", background: "#0B3D2B", padding: "1px 5px", borderRadius: 6 }}>SAVINGS</span>}
                          </div>
                          <span style={{ fontSize: 11, color: over ? "#E07B54" : "#7A8FA6", fontWeight: 600 }}>
                            {formatINR(spent)}{bud > 0 ? ` / ${formatINR(bud)}` : ""}
                          </span>
                        </div>
                        {bud > 0 && (
                          <div style={s.progressOuter}>
                            <div style={{ height: "100%", width: `${pct}%`, background: over ? "#E07B54" : cat.color, borderRadius: 4, transition: "width 0.4s" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#0F1923", borderRadius: 8, borderLeft: "3px solid #27AE60" }}>
                  <div style={{ fontSize: 10, color: "#7A8FA6", marginBottom: 2 }}>Savings Rate</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#27AE60" }}>{savingsRate}%</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* INCOME */}
        {activeTab === "income" && (
          <div style={{ maxWidth: 460 }}>
            <div style={s.sectionTitle}>Monthly Income Sources</div>
            {INCOME_CATEGORIES.map(cat => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <label style={s.label}>{cat.name}</label>
                <input type="number" min="0" placeholder="₹ 0" style={s.input}
                  value={income[cat.id] || ""}
                  onChange={e => handleIncomeChange(cat.id, e.target.value)} />
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#1A2332", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7A8FA6", fontSize: 12 }}>Total Income</span>
              <span style={{ color: "#4FC3F7", fontWeight: 700, fontSize: 16 }}>{formatINR(totalIncome)}</span>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {activeTab === "expenses" && (
          <div>
            <div style={s.sectionTitle}>Monthly Expenses & Savings</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {categories.map(cat => {
                const spent = parseFloat(expenses[cat.id]) || 0;
                const bud = parseFloat(budgets[cat.id]) || 0;
                const over = bud > 0 && spent > bud;
                return (
                  <div key={cat.id} style={{ background: "#1A2332", borderRadius: 10, padding: "14px", borderLeft: `3px solid ${cat.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: "#E8EDF2" }}>{cat.name}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {cat.type === "savings" && <span style={{ fontSize: 9, color: "#27AE60", background: "#0B3D2B", padding: "2px 6px", borderRadius: 6 }}>SAVINGS</span>}
                        {over && <span style={{ fontSize: 9, color: "#E07B54", background: "#3D1A0B", padding: "2px 6px", borderRadius: 6 }}>OVER</span>}
                      </div>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <div style={s.label}>Amount Spent</div>
                      <input type="number" min="0" placeholder="₹ 0"
                        style={{ ...s.input, borderColor: over ? "#E07B54" : "#2D3F55" }}
                        value={expenses[cat.id] || ""}
                        onChange={e => handleExpenseChange(cat.id, e.target.value)} />
                    </div>
                    <div>
                      <div style={s.label}>Budget Limit (optional)</div>
                      <input type="number" min="0" placeholder="₹ 0" style={s.input}
                        value={budgets[cat.id] || ""}
                        onChange={e => handleBudgetChange(cat.id, e.target.value)} />
                    </div>
                    {bud > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={s.progressOuter}>
                          <div style={{ height: "100%", width: `${Math.min(spent / bud * 100, 100)}%`, background: over ? "#E07B54" : cat.color, borderRadius: 4, transition: "width 0.4s" }} />
                        </div>
                        <div style={{ fontSize: 9, color: over ? "#E07B54" : "#7A8FA6", marginTop: 3 }}>
                          {over ? `₹${(spent - bud).toLocaleString("en-IN")} over` : `₹${(bud - spent).toLocaleString("en-IN")} left`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {activeTab === "categories" && (
          <div style={{ maxWidth: 500 }}>
            <div style={s.sectionTitle}>Manage Categories</div>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#1A2332", borderRadius: 8, marginBottom: 6 }}>
                <div style={s.dot(cat.color)} />
                <span style={{ flex: 1, fontSize: 12, color: "#C5D0DC" }}>{cat.name}</span>
                <span style={{ fontSize: 10, color: cat.type === "savings" ? "#27AE60" : "#7A8FA6", background: cat.type === "savings" ? "#0B3D2B" : "#0F1923", padding: "2px 7px", borderRadius: 8 }}>
                  {cat.type}
                </span>
                {!PROTECTED_IDS.includes(cat.id) && (
                  <button onClick={() => handleRemoveCategory(cat.id)}
                    style={{ background: "transparent", border: "none", color: "#E07B54", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                )}
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "14px", background: "#1A2332", borderRadius: 10 }}>
              <div style={s.sectionTitle}>Add New Category</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Category name" style={{ ...s.input, flex: 1 }} value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCategory()} />
                <select style={s.select} value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="savings">Savings</option>
                </select>
                <button style={s.addBtn} onClick={handleAddCategory}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
