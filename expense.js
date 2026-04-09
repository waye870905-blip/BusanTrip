const expenseForm = document.getElementById("expense-form");
const expenseTbody = document.getElementById("expense-tbody");
const expenseCount = document.getElementById("expense-count");
const expenseTotalKrw = document.getElementById("expense-total-krw");
const expenseTotalTwd = document.getElementById("expense-total-twd");
const exchangeRateInput = document.getElementById("exchange-rate");
const clearExpensesBtn = document.getElementById("clear-expenses");

const EXPENSE_STORAGE_KEY = "busan_trip_expenses";
const RATE_STORAGE_KEY = "busan_trip_exchange_rate";

function getExpenses() {
  return JSON.parse(localStorage.getItem(EXPENSE_STORAGE_KEY) || "[]");
}

function saveExpenses(expenses) {
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
}

function getRate() {
  return Number(localStorage.getItem(RATE_STORAGE_KEY) || exchangeRateInput.value || 0.023);
}

function saveRate(rate) {
  localStorage.setItem(RATE_STORAGE_KEY, String(rate));
}

function formatKrw(value) {
  return `₩${Number(value).toLocaleString("ko-KR")}`;
}

function formatTwd(value) {
  return `NT$${Math.round(value).toLocaleString("zh-TW")}`;
}

function renderExpenses() {
  const expenses = getExpenses();
  const rate = getRate();

  exchangeRateInput.value = rate;

  if (!expenses.length) {
    expenseTbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">目前還沒有任何費用記錄</td>
      </tr>
    `;
  } else {
    expenseTbody.innerHTML = expenses
      .map((item, index) => {
        const twd = item.amount * rate;
        return `
          <tr>
            <td>${item.date}</td>
            <td><span class="category-badge">${item.category}</span></td>
            <td>${item.person || "-"}</td>
            <td>${item.item}</td>
            <td>${formatKrw(item.amount)}</td>
            <td>${formatTwd(twd)}</td>
            <td>${item.note || "-"}</td>
            <td>
              <button class="btn-delete" type="button" onclick="deleteExpense(${index})">刪除</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  const totalKrw = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalTwd = totalKrw * rate;

  expenseCount.textContent = expenses.length;
  expenseTotalKrw.textContent = formatKrw(totalKrw);
  expenseTotalTwd.textContent = formatTwd(totalTwd);
}

function deleteExpense(index) {
  const expenses = getExpenses();
  expenses.splice(index, 1);
  saveExpenses(expenses);
  renderExpenses();
}

expenseForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("expense-date").value;
  const category = document.getElementById("expense-category").value;
  const person = document.getElementById("expense-person").value;
  const item = document.getElementById("expense-item").value.trim();
  const amount = Number(document.getElementById("expense-amount").value);
  const note = document.getElementById("expense-note").value.trim();
  const rate = Number(exchangeRateInput.value);

  if (!date || !category || !person || !item || !amount) return;

  const expenses = getExpenses();

  expenses.unshift({
    date,
    category,
    person,
    item,
    amount,
    note
  });

  saveExpenses(expenses);
  saveRate(rate);

  expenseForm.reset();
  document.getElementById("expense-date").value = date;
  document.getElementById("expense-person").value = "拔拔";
  exchangeRateInput.value = rate;

  renderExpenses();
});

exchangeRateInput?.addEventListener("change", () => {
  const rate = Number(exchangeRateInput.value);
  if (!rate) return;
  saveRate(rate);
  renderExpenses();
});

clearExpensesBtn?.addEventListener("click", () => {
  const confirmed = confirm("確定要清空全部旅費資料嗎？");
  if (!confirmed) return;

  localStorage.removeItem(EXPENSE_STORAGE_KEY);
  renderExpenses();
});

window.deleteExpense = deleteExpense;

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("expense-date");

  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  renderExpenses();
});
