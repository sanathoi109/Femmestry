/**
 * budget.js
 * ----------
 * Handles budgeting logic, local storage sync, category styling,
 * transaction filtering, and Real-Time Webcam AI Receipt Scanning via Flask backend.
 */

// Color Palette matching Overview Donut Chart
const categoryColors = {
    'Housing': '#3D1E28',
    'Food': '#CFA6C0',
    'Fun': '#8E79B4',
    'Health': '#E5B597',
    'Beauty': '#8DBDC0',
    'Education': '#5C82A6',
    'Subscriptions': '#A288A6',
    'Transport': '#B592A0',
    'Salary': '#2B5B45',
    'Freelance': '#4B8B62',
    'Bonus': '#D4A359',
    'Investments': '#3B6E8C',
    'Other': '#E8C5D8'
};

const expenseCategories = ['Housing', 'Food', 'Fun', 'Health', 'Beauty', 'Education', 'Subscriptions', 'Transport', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Bonus', 'Investments', 'Other'];

let currentType = 'EXPENSE';
let currentFilter = 'ALL';
let mediaStream = null;

// Default Initial Transactions
const defaultTransactions = [
    { id: 1, desc: 'Online course', amount: 150, type: 'EXPENSE', category: 'Education', date: '2026-07-22' },
    { id: 2, desc: 'Salon', amount: 180, type: 'EXPENSE', category: 'Beauty', date: '2026-07-20' },
    { id: 3, desc: 'Dinners out', amount: 310, type: 'EXPENSE', category: 'Fun', date: '2026-07-18' },
    { id: 4, desc: 'Freelance project', amount: 900, type: 'INCOME', category: 'Freelance', date: '2026-07-12' },
    { id: 5, desc: 'Groceries', amount: 540, type: 'EXPENSE', category: 'Food', date: '2026-07-08' },
    { id: 6, desc: 'Health insurance', amount: 260, type: 'EXPENSE', category: 'Health', date: '2026-07-06' },
    { id: 7, desc: 'Streaming + apps', amount: 74, type: 'EXPENSE', category: 'Subscriptions', date: '2026-07-05' },
    { id: 8, desc: 'Metro pass', amount: 120, type: 'EXPENSE', category: 'Transport', date: '2026-07-03' },
    { id: 9, desc: 'Rent', amount: 1850, type: 'EXPENSE', category: 'Housing', date: '2026-07-02' },
    { id: 10, desc: 'Salary', amount: 6200, type: 'INCOME', category: 'Salary', date: '2026-07-01' }
];

// Read Data from Shared Local Storage
let transactions = JSON.parse(localStorage.getItem('herworth_transactions')) || defaultTransactions;
let finData = JSON.parse(localStorage.getItem('herworth_finances')) || {
    income: 7100,
    expenses: 3484,
    savings: 28050,
    portfolio: 33880,
    currency: 'INR'
};

/**
 * Initializes default page state, dates, and renders transactions.
 */
function initPage() {
    const dateInput = document.getElementById('entryDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    populateCategories();
    updateSummaryAndStorage();
    renderTransactions();
}

/**
 * Toggles form mode between EXPENSE and INCOME.
 */
function setType(type) {
    currentType = type;
    const btnExp = document.getElementById('btnExpense');
    const btnInc = document.getElementById('btnIncome');

    if (btnExp && btnInc) {
        if (type === 'EXPENSE') {
            btnExp.className = "px-5 py-2 rounded-full text-xs font-bold tracking-wider transition bg-[#3D1E28] text-white";
            btnInc.className = "px-5 py-2 rounded-full text-xs font-bold tracking-wider transition bg-[#F5EFF2] text-[#8C7A7E] hover:text-[#3D1E28]";
        } else {
            btnInc.className = "px-5 py-2 rounded-full text-xs font-bold tracking-wider transition bg-[#3D1E28] text-white";
            btnExp.className = "px-5 py-2 rounded-full text-xs font-bold tracking-wider transition bg-[#F5EFF2] text-[#8C7A7E] hover:text-[#3D1E28]";
        }
    }

    populateCategories();
}

/**
 * Dynamically updates dropdown options based on current type.
 */
function populateCategories() {
    const catSelect = document.getElementById('entryCategory');
    if (!catSelect) return;
    
    const list = currentType === 'EXPENSE' ? expenseCategories : incomeCategories;
    catSelect.innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join('');
}

/**
 * Handles manual entry creation.
 */
function addEntry(e) {
    if (e) e.preventDefault();
    
    const descInput = document.getElementById('entryDesc');
    const amountInput = document.getElementById('entryAmount');
    const catSelect = document.getElementById('entryCategory');
    const dateInput = document.getElementById('entryDate');

    if (!descInput || !amountInput || !catSelect || !dateInput) return;

    const desc = descInput.value.trim();
    const amount = Math.abs(parseFloat(amountInput.value));
    const category = catSelect.value;
    const date = dateInput.value;

    if (!desc || isNaN(amount) || amount <= 0) return;

    const newEntry = {
        id: Date.now(),
        desc,
        amount,
        type: currentType,
        category,
        date
    };

    transactions.unshift(newEntry);

    // Reset input text fields
    descInput.value = '';
    amountInput.value = '';

    updateSummaryAndStorage();
    renderTransactions();
}

/**
 * Deletes a single transaction entry by ID.
 */
function deleteEntry(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateSummaryAndStorage();
    renderTransactions();
}

/**
 * Recalculates totals and updates state in local storage.
 */
function updateSummaryAndStorage() {
    const totalInc = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalInc - totalExp;

    // Keep Overview cards synced in local storage
    finData.income = totalInc;
    finData.expenses = totalExp;
    localStorage.setItem('herworth_finances', JSON.stringify(finData));
    localStorage.setItem('herworth_transactions', JSON.stringify(transactions));

    // Render values to DOM
    const headerInc = document.getElementById('headerIncome');
    const headerExp = document.getElementById('headerExpenses');
    const headerBal = document.getElementById('headerBalance');

    if (headerInc) headerInc.innerText = totalInc.toLocaleString();
    if (headerExp) headerExp.innerText = totalExp.toLocaleString();
    if (headerBal) headerBal.innerText = balance.toLocaleString();

    // Update Currency Symbols
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const sym = symbols[finData.currency] || '₹';
    document.querySelectorAll('.curr-symbol').forEach(el => el.innerText = sym);
}

/**
 * Sets transaction list filter tab ('ALL', 'EXPENSE', 'INCOME').
 */
function setFilter(filter) {
    currentFilter = filter;
    ['All', 'Expense', 'Income'].forEach(f => {
        const btn = document.getElementById('filter' + f);
        if (btn) {
            if (f.toUpperCase() === filter) {
                btn.className = "px-3 py-1.5 rounded-xl bg-[#F5EFF2] text-[#3D1E28]";
            } else {
                btn.className = "px-3 py-1.5 rounded-xl text-[#8C7A7E] hover:bg-[#F5EFF2]";
            }
        }
    });
    renderTransactions();
}

/**
 * Renders filtered transactions list into the DOM.
 */
function renderTransactions() {
    const container = document.getElementById('transactionList');
    if (!container) return;
    
    let filtered = transactions;
    if (currentFilter !== 'ALL') {
        filtered = transactions.filter(t => t.type === currentFilter);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-xs text-[#8C7A7E]">
                No transactions found in this view.
            </div>
        `;
        return;
    }

    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const sym = symbols[finData.currency] || '₹';

    container.innerHTML = filtered.map(item => {
        const isExp = item.type === 'EXPENSE';
        const sign = isExp ? '-' : '+';
        const color = categoryColors[item.category] || '#3D1E28';

        return `
            <div class="flex items-center justify-between p-5 hover:bg-[#FAF8F8] transition group">
                <div class="space-y-1">
                    <div class="text-sm font-semibold text-[#2B1B22]">${item.desc}</div>
                    <div class="flex items-center gap-2 text-xs text-[#8C7A7E]">
                        <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${color}"></span>
                        <span>${item.category}</span>
                        <span>·</span>
                        <span>${item.date}</span>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <span class="text-sm font-bold ${isExp ? 'text-[#3D1E28]' : 'text-[#2B5B45]'}">
                        ${sign}${sym}${item.amount.toLocaleString()}
                    </span>
                    <button onclick="deleteEntry(${item.id})" class="text-[#A39296] hover:text-[#3D1E28] p-1 transition" title="Delete entry">
                        <i class="fa-regular fa-trash-can text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ---------------------------------------------------------
// REAL-TIME WEBCAM SCANNER FUNCTIONS
// ---------------------------------------------------------

/**
 * Requests camera stream and opens the live webcam modal overlay.
 */
async function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('webcamVideo');

    if (!modal || !video) return;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = mediaStream;
        modal.classList.remove('hidden');
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Unable to access camera. Please allow camera permissions in your browser settings.");
    }
}

/**
 * Stops camera track streams and hides modal dialog.
 */
function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (modal) modal.classList.add('hidden');
}

/**
 * Captures video frame to canvas, creates JPEG binary blob, and uploads to Flask backend.
 */
async function captureAndProcess() {
    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('snapshotCanvas');
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current frame onto canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop video stream and close camera modal
    closeCameraModal();

    const btnScan = document.getElementById('btnScan');
    const scanStatusBox = document.getElementById('scanStatusBox');
    const scanStatusText = document.getElementById('scanStatusText');

    if (btnScan) btnScan.disabled = true;
    if (scanStatusBox) scanStatusBox.classList.remove('hidden');
    if (scanStatusText) scanStatusText.textContent = "Scanning bill & categorizing with Groq AI...";

    // Convert canvas image to JPEG blob
    canvas.toBlob(async (blob) => {
        if (!blob) {
            alert('Failed to capture frame from camera feed.');
            if (btnScan) btnScan.disabled = false;
            if (scanStatusBox) scanStatusBox.classList.add('hidden');
            return;
        }

        const formData = new FormData();
        formData.append('receipt_image', blob, 'webcam_capture.jpg');

        try {
            const response = await fetch('/scan-receipt', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                data.items.forEach(item => {
                    transactions.unshift({
                        id: Date.now() + Math.random(),
                        desc: item.description,
                        amount: Math.abs(parseFloat(item.amount)),
                        type: 'EXPENSE',
                        category: expenseCategories.includes(item.category) ? item.category : 'Other',
                        date: item.date || new Date().toISOString().split('T')[0]
                    });
                });

                if (scanStatusText) {
                    scanStatusText.textContent = `Success! Parsed and added ${data.items.length} entries.`;
                }

                updateSummaryAndStorage();
                renderTransactions();

                setTimeout(() => {
                    if (scanStatusBox) scanStatusBox.classList.add('hidden');
                }, 3000);
            } else {
                alert(data.error || 'Failed to scan receipt image.');
                if (scanStatusBox) scanStatusBox.classList.add('hidden');
            }
        } catch (err) {
            console.error('Scan Error:', err);
            alert('An error occurred while uploading/scanning the bill.');
            if (scanStatusBox) scanStatusBox.classList.add('hidden');
        } finally {
            if (btnScan) btnScan.disabled = false;
        }
    }, 'image/jpeg', 0.9);
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', initPage);