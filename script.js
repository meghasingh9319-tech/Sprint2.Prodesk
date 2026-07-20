
(() => {
    "use strict";

    const SALARY_KEY = "cashflow_salary";
    const EXPENSE_KEY = "cashflow_expenses";

    let currentSalary = 0;
    let expenseList = [];

    let expenseChart = null;
    let toastTimeout = null;

    const salaryForm = document.getElementById("salaryForm");
    const expenseForm = document.getElementById("expenseForm");

    const salaryInput = document.getElementById("salaryInput");
    const expenseName = document.getElementById("expenseName");
    const expenseAmount = document.getElementById("expenseAmount");

    const salaryError = document.getElementById("salaryError");
    const expenseError = document.getElementById("expenseError");

    const balanceDisplay = document.getElementById("balanceDisplay");
    const balanceCaption = document.getElementById("balanceCaption");

    const salaryStat = document.getElementById("statSalary");
    const expenseStat = document.getElementById("statExpenses");
    const entryStat = document.getElementById("statCount");

    const ledgerBody = document.getElementById("ledgerBody");
    const ledgerEmpty = document.getElementById("ledgerEmpty");
    const ledgerCount = document.getElementById("ledgerCount");

    const emptyChartMessage = document.getElementById("chartEmpty");
    const toast = document.getElementById("toast");


    function formatCurrency(value) {
        const roundedValue = Math.round(value);
        return "₹" + roundedValue.toLocaleString("en-IN");
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);

        return (
            date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short"
            }) +
            " · " +
            date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
            })
        );
    }

    function createId() {
        return (
            "e_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 7)
        );
    }

    function showToast(message, type = "") {

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
    }

    function showError(element, message) {
        element.textContent = message;
        element.classList.add("show");
    }

    function clearError(element) {
        element.textContent = "";
        element.classList.remove("show");
    }

    function saveSalary() {
        try {
            localStorage.setItem(
                SALARY_KEY,
                JSON.stringify(currentSalary)
            );
        } catch (error) {
            showToast("Could not save salary. Storage is unavailable.", "err");
        }
    }

    function saveExpenses() {
        try {
            localStorage.setItem(
                EXPENSE_KEY,
                JSON.stringify(expenseList)
            );
        } catch (error) {
            showToast("Could not save expenses. Storage is unavailable.", "err");
        }
    }

    function loadSavedData() {
        try {

            const storedSalary = localStorage.getItem(SALARY_KEY);

            if (storedSalary !== null) {

                const parsedSalary = JSON.parse(storedSalary);

                if (
                    typeof parsedSalary === "number" &&
                    !isNaN(parsedSalary) &&
                    parsedSalary >= 0
                ) {
                    currentSalary = parsedSalary;
                }
            }

        } catch (error) {
            currentSalary = 0;
        }

        try {

            const storedExpenses = localStorage.getItem(EXPENSE_KEY);

            if (storedExpenses !== null) {

                const parsedExpenses = JSON.parse(storedExpenses);

                if (Array.isArray(parsedExpenses)) {

                    expenseList = parsedExpenses.filter((expense) => {

                        return (
                            expense &&
                            typeof expense.id === "string" &&
                            typeof expense.name === "string" &&
                            typeof expense.amount === "number" &&
                            expense.amount >= 0
                        );

                    });

                }

            }

        } catch (error) {
            expenseList = [];
        }

    }


    function getTotalExpenses() {

        return expenseList.reduce((total, expense) => {
            return total + expense.amount;
        }, 0);

    }

    function getRemainingBalance() {
        return currentSalary - getTotalExpenses();
    }

    function updateSalaryCard() {

        salaryInput.value = currentSalary > 0
            ? currentSalary
            : "";

        salaryStat.textContent = formatCurrency(currentSalary);

    }

    function updateBalance() {

        const balance = getRemainingBalance();

        balanceDisplay.textContent = formatCurrency(balance);

        balanceDisplay.classList.toggle(
            "negative",
            balance < 0
        );

        if (currentSalary === 0 && expenseList.length === 0) {

            balanceCaption.textContent =
                "Set your salary to begin tracking.";

        } else if (balance < 0) {

            balanceCaption.textContent =
                "You've spent beyond your salary this cycle.";

        } else {

            balanceCaption.textContent =
                "Salary minus logged expenses, updated live.";

        }

    }

    function updateSidebarStats() {

        expenseStat.textContent = formatCurrency(
            getTotalExpenses()
        );

        entryStat.textContent = expenseList.length;

    }

    function getDeleteIcon() {

        return `
        <svg viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">

            <polyline points="3 6 5 6 21 6"></polyline>

            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>

            <path d="M10 11v6"></path>

            <path d="M14 11v6"></path>

            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>

        </svg>
        `;

    } 

    function updateLedger() {

        ledgerBody.innerHTML = "";

        if (expenseList.length === 0) {

            ledgerEmpty.classList.add("show");

        } else {

            ledgerEmpty.classList.remove("show");

            const displayList = [...expenseList].reverse();

            displayList.forEach((expense, index) => {

                const row = document.createElement("tr");
                row.dataset.id = expense.id;


                const indexCell = document.createElement("td");
                indexCell.className = "row-index mono";
                indexCell.textContent = String(
                    expenseList.length - index
                ).padStart(2, "0");


                const nameCell = document.createElement("td");
                nameCell.textContent = expense.name;


                const amountCell = document.createElement("td");
                amountCell.className = "align-right row-amount mono";
                amountCell.textContent =
                    "− " + formatCurrency(expense.amount);


                const timeCell = document.createElement("td");
                timeCell.className = "align-right row-time";
                timeCell.textContent = formatDateTime(expense.time);


                const actionCell = document.createElement("td");
                actionCell.className = "align-right";

                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.className = "trash-btn";
                deleteButton.setAttribute(
                    "aria-label",
                    `Delete ${expense.name}`
                );

                deleteButton.innerHTML = getDeleteIcon();

                deleteButton.addEventListener("click", () => {
                    removeExpense(expense.id);
                });

                actionCell.appendChild(deleteButton);

                row.appendChild(indexCell);
                row.appendChild(nameCell);
                row.appendChild(amountCell);
                row.appendChild(timeCell);
                row.appendChild(actionCell);

                ledgerBody.appendChild(row);

            });

        }

        ledgerCount.textContent =
            expenseList.length +
            (expenseList.length === 1 ? " entry" : " entries");

    }

    function updateChart() {

        const totalSpent = getTotalExpenses();
        const balance = Math.max(getRemainingBalance(), 0);

        const hasChartData =
            currentSalary > 0 || totalSpent > 0;

        const chartCanvas =
            document.getElementById("expenseChart");

        emptyChartMessage.style.display =
            hasChartData ? "none" : "block";

        chartCanvas.style.display =
            hasChartData ? "block" : "none";


        if (!hasChartData) {

            if (expenseChart) {
                expenseChart.destroy();
                expenseChart = null;
            }

            return;
        }


        const chartData = {

            labels: [
                "Remaining Balance",
                "Total Expenses"
            ],

            datasets: [
                {
                    data: [balance, totalSpent],
                    backgroundColor: [
                        "#E3B341",
                        "#FB7185"
                    ],
                    borderColor: "#131A28",
                    borderWidth: 3,
                    hoverOffset: 6
                }
            ]

        };


        if (expenseChart) {

            expenseChart.data = chartData;
            expenseChart.update();

            return;
        }


        expenseChart = new Chart(chartCanvas, {

            type: "pie",

            data: chartData,

            options: {

                responsive: true,
                maintainAspectRatio: true,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {
                            color: "#A7B1C4",
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: "circle",

                            font: {
                                family: "Inter",
                                size: 12
                            }
                        }

                    },

                    tooltip: {

                        backgroundColor: "#182135",
                        titleColor: "#EDF1F7",
                        bodyColor: "#EDF1F7",

                        borderColor: "#243044",
                        borderWidth: 1,

                        callbacks: {

                            label(context) {
                                return (
                                    context.label +
                                    ": " +
                                    formatCurrency(context.raw)
                                );
                            }

                        }

                    }

                }

            }

        });

    }
    function refreshScreen() {

        updateSalaryCard();
        updateBalance();
        updateSidebarStats();
        updateLedger();
        updateChart();

    }

    function updateSalary(value) {

        currentSalary = value;

        saveSalary();
        refreshScreen();

    }

    function saveExpense(name, amount) {

        const newExpense = {

            id: createId(),
            name,
            amount,
            time: new Date().toISOString()

        };

        expenseList.push(newExpense);

        saveExpenses();
        refreshScreen();

    }


    function removeExpense(expenseId) {

        expenseList = expenseList.filter((expense) => {
            return expense.id !== expenseId;
        });

        saveExpenses();

        refreshScreen();

        showToast("Expense removed.", "ok");

    } 

    function isValidAmount(value) {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {
            return false;
        }

        const number = Number(value);

        return (
            !isNaN(number) &&
            isFinite(number) &&
            number >= 0
        );
    }


    salaryForm.addEventListener("submit", function (event) {

        event.preventDefault();

        clearError(salaryError);
        salaryInput.classList.remove("invalid");

        const enteredSalary = salaryInput.value.trim();

        if (
            !isValidAmount(enteredSalary) ||
            Number(enteredSalary) <= 0
        ) {

            salaryInput.classList.add("invalid");

            showError(
                salaryError,
                enteredSalary === ""
                    ? "Salary can't be empty."
                    : "Enter a valid positive salary."
            );

            return;
        }

        updateSalary(Number(enteredSalary));

        showToast("Salary updated.", "ok");

    });


    expenseForm.addEventListener("submit", function (event) {

        event.preventDefault();

        clearError(expenseError);

        expenseName.classList.remove("invalid");
        expenseAmount.classList.remove("invalid");

        const expenseTitle = expenseName.value.trim();
        const enteredAmount = expenseAmount.value.trim();

        let hasValidationError = false;


        if (expenseTitle === "") {

            expenseName.classList.add("invalid");
            hasValidationError = true;

        }


        if (
            !isValidAmount(enteredAmount) ||
            Number(enteredAmount) <= 0
        ) {

            expenseAmount.classList.add("invalid");
            hasValidationError = true;

        }


        if (hasValidationError) {

            showError(
                expenseError,
                "Enter an expense name and a positive amount."
            );

            return;
        }


        saveExpense(
            expenseTitle,
            Number(enteredAmount)
        );

        expenseForm.reset();

        showToast("Expense logged.", "ok");

    });


    function startApplication() {

        loadSavedData();
        refreshScreen();

    }


    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );

})();