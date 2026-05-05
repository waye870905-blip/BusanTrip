const expenseForm = document.getElementById("expense-form");
const expenseTbody = document.getElementById("expense-tbody");
const expenseCount = document.getElementById("expense-count");
const expenseTotalKrw = document.getElementById("expense-total-krw");
const expenseTotalTwd = document.getElementById("expense-total-twd");
const exchangeRateInput = document.getElementById("exchange-rate");
const clearExpensesBtn = document.getElementById("clear-expenses");
const personSummaryTbody = document.getElementById("person-summary-tbody");

const expenseAmountInput = document.getElementById("expense-amount");
const expenseAmountTwdInput = document.getElementById("expense-amount-twd");

const EXPENSE_STORAGE_KEY = "busan_trip_expenses";
const RATE_STORAGE_KEY = "busan_trip_exchange_rate";
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbzlZiIa1t3SiyGUL7WTQEG_pq6-35XkDNgG85kdC1kjPUMiw9iYb2BXy_cMZmzxk5Q/exec"; // 👉 將 "YOUR_GAS_URL" 換成你剛剛部署的 Google Apps Script 網址

let isSyncingAmount = false;

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
// ==========================================
// 👉 新增：雲端同步功能
async function saveToCloud(expenseItem) {
  try {
    // 為了避免擋住畫面，背景發送請求
    fetch(CLOUD_API_URL, {
      method: "POST",
      body: JSON.stringify(expenseItem)
    }).catch(e => console.error("雲端儲存失敗", e));
  } catch (e) {
    console.error("發生錯誤", e);
  }
}

async function fetchFromCloud() {
  try {
    const response = await fetch(CLOUD_API_URL);
    const cloudData = await response.json();
    
    // 將 Excel 陣列資料轉回我們原本的物件格式，並反轉順序（新的在上）
    const formatted = cloudData.map(row => ({
      date: row[0], category: row[1], person: row[2], 
      item: row[3], amount: row[4], amountTwd: row[5], note: row[6]
    })).reverse(); 

    localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(formatted));
    renderExpenses();
  } catch (e) {
    console.error("無法同步雲端資料，使用本機快取", e);
    renderExpenses(); // 如果沒網路，至少會顯示本機最後一次的紀錄
  }
}
function formatKrw(value) {
  return `₩${Number(value || 0).toLocaleString("ko-KR")}`;
}

function formatTwd(value) {
  return `NT$${Math.round(Number(value || 0)).toLocaleString("zh-TW")}`;
}

function syncFromKRW() {
  if (isSyncingAmount) return;
  const rate = getRate();
  const krw = Number(expenseAmountInput.value || 0);

  isSyncingAmount = true;

  if (!expenseAmountInput.value) {
    expenseAmountTwdInput.value = "";
  } else {
    expenseAmountTwdInput.value = Math.round(krw * rate);
  }

  isSyncingAmount = false;
}

function syncFromTWD() {
  if (isSyncingAmount) return;
  const rate = getRate();
  const twd = Number(expenseAmountTwdInput.value || 0);

  isSyncingAmount = true;

  if (!expenseAmountTwdInput.value) {
    expenseAmountInput.value = "";
  } else {
    expenseAmountInput.value = Math.round(twd / rate);
  }

  isSyncingAmount = false;
}

function refreshAmountByExistingInput() {
  if (expenseAmountInput.value && !expenseAmountTwdInput.value) {
    syncFromKRW();
  } else if (expenseAmountTwdInput.value && !expenseAmountInput.value) {
    syncFromTWD();
  }
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

    if (personSummaryTbody) {
      personSummaryTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="3">目前還沒有任何費用記錄</td>
        </tr>
      `;
    }
  } else {
    expenseTbody.innerHTML = expenses
      .map((item, index) => {
        const twd = item.amountTwd ?? Math.round((item.amount || 0) * rate);

        return `
          <tr>
            <td>${item.date}</td>
            <td><span class="category-badge">${item.category}</span></td>
            <td>${item.person || "-"}</td>
            <td>${item.item}</td>
            <td>
  <div class="amount-box">
    <span class="amount">${formatKrw(item.amount)}</span>
    <span class="currency">(KRW)</span>
  </div>
</td>
<td>
  <div class="amount-box">
    <span class="amount">${formatTwd(twd)}</span>
    <span class="currency">(TWD)</span>
  </div>
</td>
            <td>${item.note || "-"}</td>
            <td>
              <button class="btn-delete" type="button" onclick="deleteExpense(${index})">刪除</button>
            </td>
          </tr>
        `;
      })
      .join("");

    if (personSummaryTbody) {
      const personTotals = {
        "拔拔": { krw: 0, twd: 0 },
        "麻麻": { krw: 0, twd: 0 },
        "哥哥": { krw: 0, twd: 0 },
        "屁屁": { krw: 0, twd: 0 }
      };

      expenses.forEach(item => {
        if (personTotals[item.person] !== undefined) {
          const krw = Number(item.amount || 0);
          const twd = Number(item.amountTwd ?? Math.round(krw * rate));

          personTotals[item.person].krw += krw;
          personTotals[item.person].twd += twd;
        }
      });

      personSummaryTbody.innerHTML = Object.entries(personTotals)
        .map(([person, totals]) => {
          return `
            <tr>
              <td>${person}</td>
              <td>${formatKrw(totals.krw)}</td>
              <td>${formatTwd(totals.twd)}</td>
            </tr>
          `;
        })
        .join("");
    }
  }

  const totalKrw = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTwd = expenses.reduce(
    (sum, item) => sum + Number(item.amountTwd ?? Math.round((item.amount || 0) * rate)),
    0
  );

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

expenseAmountInput?.addEventListener("input", syncFromKRW);
expenseAmountTwdInput?.addEventListener("input", syncFromTWD);

expenseForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("expense-date").value;
  const category = document.getElementById("expense-category").value;
  const person = document.getElementById("expense-person").value;
  const item = document.getElementById("expense-item").value.trim();
  const note = document.getElementById("expense-note").value.trim();
  const rate = Number(exchangeRateInput.value);

  const amount = Number(expenseAmountInput.value || 0);
  const amountTwd = Number(expenseAmountTwdInput.value || 0);

  if (!date || !category || !person || !item || (!amount && !amountTwd)) return;

  let finalKrw = amount;
  let finalTwd = amountTwd;

  if (amount && !amountTwd) {
    finalTwd = Math.round(amount * rate);
  } else if (!amount && amountTwd) {
    finalKrw = Math.round(amountTwd / rate);
  }

  const expenses = getExpenses();

  // 👉 修改：把新增的資料獨立成一個變數，方便傳給雲端
  const newExpense = {
    date,
    category,
    person,
    item,
    amount: finalKrw,
    amountTwd: finalTwd,
    note
  };

  expenses.unshift(newExpense); // 加到畫面上
  saveExpenses(expenses);       // 存入本機
  saveRate(rate);
  
  saveToCloud(newExpense);      // 👉 新增：同步傳送到 Google 試算表
  expenseForm.reset();
  document.getElementById("expense-date").value = date;
  document.getElementById("expense-person").value = "拔拔";
  exchangeRateInput.value = rate;
  expenseAmountInput.value = "";
  expenseAmountTwdInput.value = "";

  renderExpenses();
});

exchangeRateInput?.addEventListener("input", () => {
  const rate = Number(exchangeRateInput.value);
  if (!rate) return;
  saveRate(rate);
  refreshAmountByExistingInput();
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
  
  // 👉 修改：網頁一打開，先去跟 Google 試算表要最新的資料，要完會自動 render
  fetchFromCloud();
});
