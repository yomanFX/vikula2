/**
 * APP CONFIGURATION & GOOGLE SHEETS SETUP
 */

// ВСТАВЬТЕ СЮДА ССЫЛКУ НА ВАШ GOOGLE APPS SCRIPT WEB APP
// Пример: 'https://script.google.com/macros/s/AKfycbx.../exec'
const SCRIPT_URL = ''; 

// Если URL пустой, приложение будет работать в демо-режиме (Mock Data)
const MOCK_MODE = SCRIPT_URL === '';

/**
 * STATE MANAGEMENT
 */
const state = {
    currentUser: localStorage.getItem('currentUserIdentity') || 'Викуля',
    accusedUser: null, // Кто виноват в текущей жалобе
    complaints: [],
    createForm: {
        category: null,
        categoryIcon: null,
        description: '',
        compensation: null,
        compensationIcon: null,
        points: -10
    }
};

const CATEGORIES = [
    { id: 'late', label: 'Опоздание', icon: '⏰' },
    { id: 'ignore', label: 'Игнор', icon: '👻' },
    { id: 'bad_joke', label: 'Плохая шутка', icon: '🃏' },
    { id: 'coffee_debt', label: 'Кофейный долг', icon: '☕' },
    { id: 'cold', label: 'Холодность', icon: '🧊' },
    { id: 'phone', label: 'Телефономания', icon: '📱' },
];

const COMPENSATIONS = [
    { id: 'coffee', label: 'Купить кофе', icon: 'coffee', color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'apology', label: 'Извинения', icon: 'campaign', color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'movie', label: 'Билет в кино', icon: 'local_activity', color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'dinner', label: 'Ужин', icon: 'restaurant', color: 'text-green-600', bg: 'bg-green-100' },
];

/**
 * GOOGLE SHEETS SERVICE
 */
const api = {
    async fetch() {
        if (MOCK_MODE) {
            console.log("Using Mock Data");
            const local = localStorage.getItem('complaints_data');
            if (local) return JSON.parse(local);
            return [
                { id: '1', user: 'Викуля', type: 'COMPLAINT', category: 'Холодность', description: 'Съела йогурт', points: -15, timestamp: new Date().toISOString(), status: 'APPROVED', compensation: 'Йогурт', compensationIcon: 'redeem' },
                { id: '2', user: 'Яник', type: 'GOOD_DEED', category: 'Забота', description: 'Помыл посуду', points: 10, timestamp: new Date().toISOString(), status: 'COMPLETED', compensation: '', compensationIcon: '' }
            ];
        }
        try {
            const res = await fetch(SCRIPT_URL);
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    async submit(data) {
        if (MOCK_MODE) {
            const current = await this.fetch();
            current.unshift(data);
            localStorage.setItem('complaints_data', JSON.stringify(current));
            return true;
        }
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};

/**
 * ROUTING & VIEWS
 */
const router = {
    current: 'home',
    
    navigate(page, params = {}) {
        this.current = page;
        
        // Show/Hide Bottom Nav
        const nav = document.getElementById('bottom-nav');
        if (page.startsWith('create')) {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
            this.updateNavHighlight(page);
        }

        const app = document.getElementById('app');
        
        switch(page) {
            case 'home': renderHome(app); break;
            case 'feed': renderFeed(app); break;
            case 'profile': renderProfile(app); break;
            case 'create_step1': 
                if (params.accusedUser) state.accusedUser = params.accusedUser;
                // Default accused: if I am Vikulya, accuse Yanik
                else state.accusedUser = state.currentUser === 'Викуля' ? 'Яник' : 'Викуля';
                renderCreateStep1(app); 
                break;
            case 'create_step2': renderCreateStep2(app); break;
        }
    },

    updateNavHighlight(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isTarget = btn.dataset.page === page;
            btn.classList.toggle('text-primary', isTarget);
            btn.classList.toggle('text-gray-400', !isTarget);
            const icon = btn.querySelector('.material-symbols-outlined');
            if(isTarget) icon.classList.add('font-variation-filled');
            else icon.classList.remove('font-variation-filled');
        });
    }
};

/**
 * SCREEN RENDERERS
 */

// --- HOME SCREEN ---
async function renderHome(container) {
    const complaints = await api.fetch();
    state.complaints = complaints;
    const recent = complaints.slice(0, 3);
    
    // Calculate simple stats
    const weeklyCount = complaints.length;

    container.innerHTML = `
        <div class="pb-24 pt-4 px-4">
             <header class="flex justify-between items-center mb-6">
                <div class="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">bar_chart</span>
                </div>
                <h1 class="text-lg font-bold">Система Учета</h1>
                <button class="size-10 flex items-center justify-center">
                    <span class="material-symbols-outlined">settings</span>
                </button>
            </header>

            <!-- KPI Chart -->
            <div class="bg-white rounded-2xl p-5 shadow-ios mb-8 relative overflow-hidden">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">Претензий за неделю</p>
                        <div class="flex items-baseline gap-2 mt-1">
                            <span class="text-4xl font-bold text-gray-900">${weeklyCount}</span>
                        </div>
                    </div>
                    <div style="width: 100px; height: 50px;">
                        <canvas id="miniChart"></canvas>
                    </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                    <div class="bg-primary h-1.5 rounded-full" style="width: 65%"></div>
                </div>
            </div>

            <!-- Profiles -->
            <div class="mb-8">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Выберите профиль</h2>
                <div class="grid grid-cols-2 gap-4">
                    ${renderProfileCard('Викуля', 'https://picsum.photos/seed/vikulya/200', 'TIER A', 'text-primary', '85%')}
                    ${renderProfileCard('Яник', 'https://picsum.photos/seed/yanik/200', 'CRITICAL', 'text-red-500', '42%')}
                </div>
            </div>

            <!-- Recent -->
            <div>
                 <h2 class="text-lg font-bold text-gray-900 mb-4">Последняя активность</h2>
                 <div class="flex flex-col gap-3">
                    ${recent.map(item => renderActivityItem(item)).join('')}
                 </div>
            </div>
        </div>
    `;

    // Initialize Chart
    new Chart(document.getElementById('miniChart'), {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{
                data: [10, 12, 8, 14, 11, 15, 14],
                borderColor: '#2b6cee',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
            maintainAspectRatio: false
        }
    });
}

function renderProfileCard(name, img, statusText, statusColor, percent) {
    return `
    <div class="bg-white p-4 rounded-2xl shadow-ios flex flex-col items-center">
        <div class="size-20 rounded-full bg-indigo-100 mb-3 overflow-hidden border-2 border-white shadow-sm">
            <img src="${img}" class="w-full h-full object-cover" />
        </div>
        <h3 class="font-bold text-lg">${name}</h3>
        <div class="w-full flex justify-between text-[10px] font-bold mb-1 mt-2">
            <span class="${statusColor}">${statusText}</span>
            <span class="${statusColor}">${percent}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div class="bg-${statusColor.replace('text-', '')} h-1.5 rounded-full" style="width: ${percent}"></div>
        </div>
        <button onclick="router.navigate('create_step1', {accusedUser: '${name}'})" class="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition-transform">
            Жалоба
        </button>
    </div>
    `;
}

function renderActivityItem(item) {
    const isGood = item.points > 0;
    return `
    <div class="bg-white p-4 rounded-xl shadow-ios flex gap-4 items-center">
        <div class="size-12 rounded-lg flex items-center justify-center shrink-0 ${isGood ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
            <span class="material-symbols-outlined">${isGood ? 'check_circle' : 'warning'}</span>
        </div>
        <div class="flex-1">
            <h4 class="font-bold text-sm text-gray-900 line-clamp-1">${item.category}</h4>
            <p class="text-xs text-gray-500">${item.user} • ${new Date(item.timestamp).getHours()}ч назад</p>
        </div>
        <span class="text-xs font-bold ${isGood ? 'text-green-500' : 'text-red-500'}">
            ${isGood ? '+' : ''}${item.points} PTS
        </span>
    </div>`;
}

// --- FEED SCREEN ---
async function renderFeed(container) {
    const complaints = await api.fetch();
    let filter = 'All';

    const renderList = () => {
        const list = filter === 'All' ? complaints : complaints.filter(c => c.user === filter);
        const html = list.length ? list.map(c => `
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 ${c.status === 'COMPENSATED' ? 'opacity-80 grayscale' : ''}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                             <img src="https://picsum.photos/seed/${c.user}/100" class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p class="text-sm font-bold">${c.user}</p>
                            <p class="text-xs text-gray-500">${new Date(c.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <h3 class="text-base font-bold leading-snug mb-2 ${c.status === 'COMPENSATED' ? 'line-through' : ''}">${c.description}</h3>
                    ${c.compensation ? `
                    <div class="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                         <span class="material-symbols-outlined text-primary text-lg">${c.compensationIcon || 'redeem'}</span>
                         <p class="text-sm text-gray-600"><span class="font-semibold">Возмещение:</span> ${c.compensation}</p>
                    </div>` : ''}
                </div>
            </div>
        `).join('') : '<div class="text-center py-10 text-gray-400">Нет записей</div>';
        
        document.getElementById('feed-list').innerHTML = html;
    };

    container.innerHTML = `
        <header class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div class="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">gavel</span>
                    <h1 class="text-xl font-bold tracking-tight">Лента</h1>
                </div>
            </div>
        </header>
        <div class="pt-4 px-4">
            <div class="flex gap-2 mb-4 overflow-x-auto no-scrollbar" id="feed-filters">
                <button class="filter-btn bg-primary text-white shadow-lg shadow-primary/20 flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold" data-f="All">Все</button>
                <button class="filter-btn bg-white text-gray-600 flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold" data-f="Викуля">Викуля</button>
                <button class="filter-btn bg-white text-gray-600 flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold" data-f="Яник">Яник</button>
            </div>
            <div id="feed-list">Loading...</div>
        </div>
    `;

    renderList();

    // Attach filter events
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            filter = btn.dataset.f;
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.className = `filter-btn flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold ${b.dataset.f === filter ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600'}`;
            });
            renderList();
        }
    });
}

// --- PROFILE SCREEN ---
async function renderProfile(container) {
    const complaints = await api.fetch();
    const user = state.currentUser;
    
    // Calc Score
    let score = 500;
    complaints.forEach(c => {
        if(c.user === user) {
            if(c.type === 'GOOD_DEED') score += Math.abs(c.points);
            else if(c.type === 'COMPLAINT') score -= Math.abs(c.points);
        }
    });
    score = Math.max(0, Math.min(1000, score));
    const rotation = (score / 1000) * 180;
    const tier = score > 900 ? 'Божество' : (score > 500 ? 'Нормально' : 'Токсик');

    const pending = complaints.filter(c => c.user === user && c.type === 'COMPLAINT' && c.status === 'IN PROGRESS');

    container.innerHTML = `
        <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-gray-200">
            <h2 class="text-lg font-bold flex-1 text-center">Профиль</h2>
        </header>

        <!-- Switcher -->
        <div class="px-4 py-6">
            <div class="flex h-12 items-center justify-center rounded-xl bg-gray-200 p-1.5">
                <button onclick="switchUser('Викуля')" class="flex h-full grow items-center justify-center rounded-lg transition-all ${user === 'Викуля' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}">Я Викуля</button>
                <button onclick="switchUser('Яник')" class="flex h-full grow items-center justify-center rounded-lg transition-all ${user === 'Яник' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}">Я Яник</button>
            </div>
        </div>

        <!-- Gauge -->
        <div class="flex flex-col items-center px-4 py-4 mb-4">
             <div class="relative flex flex-col items-center">
                <div class="gauge-container mb-[-20px]">
                    <div class="gauge-bg"></div>
                    <div class="gauge-fill" style="transform: rotate(${rotation}deg)"></div>
                </div>
                <div class="flex flex-col items-center z-10">
                    <span class="text-4xl font-black text-primary font-display">${score}</span>
                    <p class="text-gray-400 text-sm font-bold uppercase tracking-wider">Рейтинг</p>
                </div>
            </div>
            <p class="mt-4 text-sm text-center italic text-gray-500">Ваш статус: "${tier}"</p>
        </div>

        <!-- Good Deed Form -->
        <div class="px-4">
             <div class="bg-white p-5 rounded-xl custom-shadow border border-gray-100">
                <input id="deed-desc" type="text" placeholder="Что сделали доброго?" class="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 mb-3 outline-none focus:border-primary">
                
                <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
                    ${[5, 10, 20].map(p => `<button onclick="setDeedPoints(${p}, this)" class="deed-pt-btn size-10 flex items-center justify-center rounded-lg border bg-gray-50 font-bold" data-val="${p}">${p}</button>`).join('')}
                    <input id="deed-custom-pt" type="number" placeholder="..." class="size-10 rounded-lg border text-center outline-none">
                </div>

                <button onclick="submitGoodDeed()" class="w-full bg-primary text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">add_circle</span> Добавить дело
                </button>
             </div>
        </div>

        <!-- Pending -->
        <div class="px-4 pt-8 pb-8">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-orange-500">warning</span> Ожидают внимания</h3>
            ${pending.length === 0 ? '<p class="text-gray-400 text-sm text-center">Нет активных жалоб</p>' : pending.map(c => `
                <div class="bg-white p-4 rounded-xl border border-orange-100 custom-shadow mb-3">
                    <p class="font-bold text-gray-800">${c.category}</p>
                    <p class="text-sm text-gray-600 mb-2">${c.description}</p>
                    <button onclick="alert('Статус обновлен!')" class="w-full h-9 rounded-lg bg-primary text-white text-sm font-semibold">Исправлено</button>
                </div>
            `).join('')}
        </div>
    `;
}

window.switchUser = (u) => {
    state.currentUser = u;
    localStorage.setItem('currentUserIdentity', u);
    router.navigate('profile');
};

let selectedDeedPoints = 5;
window.setDeedPoints = (pts, btn) => {
    selectedDeedPoints = pts;
    document.getElementById('deed-custom-pt').value = '';
    document.querySelectorAll('.deed-pt-btn').forEach(b => b.classList.remove('bg-primary', 'text-white'));
    btn.classList.add('bg-primary', 'text-white');
};

window.submitGoodDeed = async () => {
    const desc = document.getElementById('deed-desc').value;
    const customPt = document.getElementById('deed-custom-pt').value;
    const pts = customPt ? parseInt(customPt) : selectedDeedPoints;

    if(!desc) return alert("Введите описание!");

    const deed = {
        id: Date.now().toString(),
        user: state.currentUser,
        type: 'GOOD_DEED',
        category: 'Доброе дело',
        categoryIcon: '🌟',
        description: desc,
        compensation: '',
        compensationIcon: '',
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        points: pts
    };
    
    await api.submit(deed);
    router.navigate('profile');
};


// --- CREATE COMPLAINT WIZARD ---

function renderCreateStep1(container) {
    container.innerHTML = `
    <div class="min-h-screen bg-white flex flex-col">
         <div class="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100">
            <button onclick="router.navigate('home')" class="text-gray-900 flex size-10 items-center justify-start"><span class="material-symbols-outlined">arrow_back_ios</span></button>
            <h2 class="text-gray-900 text-lg font-bold flex-1 text-center pr-10">Жалоба на: <span class="text-red-500">${state.accusedUser}</span></h2>
        </div>
        
        <div class="grid grid-cols-3 gap-3 p-4">
            ${CATEGORIES.map(c => `
                <div onclick="selectCategory('${c.id}', this)" class="cat-card relative flex flex-col items-center justify-center p-3 rounded-xl border aspect-square cursor-pointer hover:border-primary/50" data-label="${c.label}" data-icon="${c.icon}">
                    <div class="text-3xl mb-1">${c.icon}</div>
                    <p class="text-[10px] font-bold text-center leading-tight">${c.label}</p>
                </div>
            `).join('')}
             <div class="relative flex flex-col items-center justify-center p-3 rounded-xl border aspect-square">
                <input type="text" id="custom-emoji" class="w-full text-center text-3xl outline-none" placeholder="➕" maxlength="2" oninput="clearCatSelection()">
                <p class="text-[10px] text-gray-400 mt-1 font-bold">Свой</p>
             </div>
        </div>

        <div class="px-4 py-3">
             <p class="text-base font-bold pb-2">Подробности</p>
             <textarea id="complaint-desc" class="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 min-h-[120px] outline-none focus:border-primary" placeholder="Опишите ситуацию..."></textarea>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20">
             <button onclick="goToStep2()" class="w-full h-14 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2">
                Далее <span class="material-symbols-outlined">arrow_forward</span>
             </button>
        </div>
    </div>
    `;
}

window.selectCategory = (id, el) => {
    document.getElementById('custom-emoji').value = '';
    document.querySelectorAll('.cat-card').forEach(c => {
        c.classList.remove('border-primary', 'bg-primary/5');
        c.classList.add('border-gray-100');
    });
    el.classList.remove('border-gray-100');
    el.classList.add('border-primary', 'bg-primary/5');
    
    state.createForm.category = el.dataset.label;
    state.createForm.categoryIcon = el.dataset.icon;
};

window.clearCatSelection = () => {
     document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('border-primary', 'bg-primary/5'));
     state.createForm.category = 'Другое';
     state.createForm.categoryIcon = null;
};

window.goToStep2 = () => {
    const customEmoji = document.getElementById('custom-emoji').value;
    const desc = document.getElementById('complaint-desc').value;

    if(customEmoji) state.createForm.categoryIcon = customEmoji;
    
    if(!state.createForm.categoryIcon || !desc) return alert("Выберите категорию и опишите суть!");
    
    state.createForm.description = desc;
    router.navigate('create_step2');
};

function renderCreateStep2(container) {
    container.innerHTML = `
     <div class="min-h-screen bg-white flex flex-col">
        <div class="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100">
            <button onclick="router.navigate('create_step1')" class="text-gray-900 flex size-10 items-center justify-start"><span class="material-symbols-outlined">arrow_back_ios</span></button>
            <h2 class="text-gray-900 text-lg font-bold flex-1 text-center pr-10">Компенсация</h2>
        </div>

        <div class="grid grid-cols-2 gap-4 px-4 py-6">
            ${COMPENSATIONS.map(c => `
                <button onclick="selectComp('${c.label}', '${c.icon}', this)" class="comp-card flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent bg-white shadow-ios">
                    <div class="size-14 rounded-full flex items-center justify-center ${c.bg} ${c.color}">
                        <span class="material-symbols-outlined text-3xl">${c.icon}</span>
                    </div>
                    <span class="font-semibold text-sm">${c.label}</span>
                </button>
            `).join('')}
             <div class="col-span-2 bg-white rounded-xl shadow-ios p-4 border-2 border-transparent focus-within:border-primary transition-all">
                <input id="custom-comp" type="text" class="w-full border-b py-2 outline-none" placeholder="Свой вариант..." oninput="clearCompSelection()">
             </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20">
             <button id="submit-btn" onclick="submitFinalComplaint()" class="w-full h-14 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                ОТПРАВИТЬ ЖАЛОБУ <span class="material-symbols-outlined">send</span>
             </button>
        </div>
     </div>
    `;
}

window.selectComp = (label, icon, el) => {
    document.getElementById('custom-comp').value = '';
    document.querySelectorAll('.comp-card').forEach(c => {
        c.classList.remove('border-primary', 'bg-primary/5');
        c.classList.add('border-transparent');
    });
    el.classList.remove('border-transparent');
    el.classList.add('border-primary', 'bg-primary/5');

    state.createForm.compensation = label;
    state.createForm.compensationIcon = icon;
};

window.clearCompSelection = () => {
    document.querySelectorAll('.comp-card').forEach(c => c.classList.remove('border-primary', 'bg-primary/5'));
    state.createForm.compensation = null;
    state.createForm.compensationIcon = 'edit';
};

window.submitFinalComplaint = async () => {
    const btn = document.getElementById('submit-btn');
    const customComp = document.getElementById('custom-comp').value;
    
    if(customComp) state.createForm.compensation = customComp;

    if(!state.createForm.compensation) return alert("Выберите компенсацию!");

    btn.innerText = "Отправка...";
    btn.disabled = true;

    const payload = {
        id: Date.now().toString(),
        user: state.accusedUser,
        type: 'COMPLAINT',
        category: state.createForm.category,
        categoryIcon: state.createForm.categoryIcon,
        description: state.createForm.description,
        compensation: state.createForm.compensation,
        compensationIcon: state.createForm.compensationIcon,
        timestamp: new Date().toISOString(),
        status: 'IN PROGRESS',
        points: -10
    };

    const success = await api.submit(payload);
    if(success) {
        router.navigate('feed');
    } else {
        alert("Ошибка");
        btn.disabled = false;
        btn.innerText = "Попробовать снова";
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    router.navigate('home');
});