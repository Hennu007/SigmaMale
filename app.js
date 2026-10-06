const STORAGE_KEY = 'homework_tasks_v1';
const THEME_KEY = 'homework_theme_v1';

// DOM
const taskForm = document.getElementById('taskForm');
const subjectInput = document.getElementById('subject');
const descInput = document.getElementById('description');
const dueInput = document.getElementById('dueDate');
const priorityInput = document.getElementById('priority');
const tasksList = document.getElementById('tasksList');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
const sortOrder = document.getElementById('sortOrder');
const themeToggle = document.getElementById('themeToggle');

let tasks = [];
let currentFilter = 'all';

function saveTasks(){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks(){
	try{
		const raw = localStorage.getItem(STORAGE_KEY);
		tasks = raw ? JSON.parse(raw) : [];
	}catch(e){ tasks = []; }
}

function applyTheme(theme){
	if(theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
	else document.documentElement.removeAttribute('data-theme');
	localStorage.setItem(THEME_KEY, theme);
}

function loadTheme(){
	const t = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
	applyTheme(t);
}

function formatDate(iso){
	if(!iso) return '';
	const d = new Date(iso);
	if(isNaN(d)) return iso;
	return d.toLocaleDateString(undefined,{day:'2-digit',month:'short'});
}

function updateProgress(){
	const total = tasks.length || 0;
	const done = tasks.filter(t=>t.done).length;
	const pct = total ? Math.round((done/total)*100) : 0;
	progressBar.style.width = pct + '%';
	progressPercent.textContent = pct + '%';
}

function sortTasks(arr){
	const order = sortOrder.value || 'dueAsc';
	const copy = [...arr];
	copy.sort((a,b)=>{
		const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
		const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
		return order === 'dueAsc' ? da - db : db - da;
	});
	return copy;
}

function filteredTasks(){
	let res = tasks;
	if(currentFilter === 'inprogress') res = tasks.filter(t=>!t.done);
	if(currentFilter === 'done') res = tasks.filter(t=>t.done);
	return sortTasks(res);
}

function renderTasks(){
	const list = filteredTasks();
	tasksList.innerHTML = '';
	if(list.length === 0){
		const li = document.createElement('li');
		li.className = 'task-card';
		li.innerHTML = '<div class="task-desc muted">Ülesandeid pole. Lisa uus ülesanne vormist ülal.</div>';
		tasksList.appendChild(li);
		updateProgress();
		return;
	}

	list.forEach(task=>{
		const li = document.createElement('li');
		li.className = 'task-card';
		li.dataset.id = task.id;

		const head = document.createElement('div'); head.className = 'task-head';
		const left = document.createElement('div');
		left.innerHTML = `<div class="task-subject">${escapeHtml(task.subject)}</div><div class="task-meta">${formatDate(task.dueDate)}</div>`;
		const right = document.createElement('div');
		const tag = document.createElement('span'); tag.className = `tag ${task.priority}`; tag.textContent = priorityLabel(task.priority);
		right.appendChild(tag);
		head.appendChild(left); head.appendChild(right);

		const desc = document.createElement('div'); desc.className = 'task-desc'; desc.textContent = task.description || '';
		if(task.done) { desc.classList.add('done'); }

		const actions = document.createElement('div'); actions.className = 'task-actions';
		const toggleBtn = document.createElement('button'); toggleBtn.className = 'icon-btn'; toggleBtn.title = task.done ? 'Märgi tegemata' : 'Märgi tehtuks';
		toggleBtn.innerHTML = task.done ? '↺' : '✓';
		toggleBtn.dataset.action = 'toggle';
		const delBtn = document.createElement('button'); delBtn.className = 'icon-btn'; delBtn.title = 'Kustuta'; delBtn.innerHTML = '🗑'; delBtn.dataset.action = 'delete';
		actions.appendChild(toggleBtn); actions.appendChild(delBtn);

		li.appendChild(head); li.appendChild(desc); li.appendChild(actions);
		tasksList.appendChild(li);
	});

	updateProgress();
}

function priorityLabel(p){
	if(p === 'low') return 'Madal';
	if(p === 'medium') return 'Keskmine';
	return 'Kõrge';
}

function escapeHtml(s){
	return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function addTask(e){
	e.preventDefault();
	const subject = subjectInput.value.trim();
	const due = dueInput.value ? new Date(dueInput.value).toISOString() : null;
	if(!subject || !due){
		alert('Täida vähemalt õppeaine ja tähtaeg.');
		return;
	}
	const newTask = {
		id: Date.now().toString(36),
		subject,
		description: descInput.value.trim(),
		dueDate: due,
		priority: priorityInput.value || 'medium',
		done: false,
		createdAt: new Date().toISOString()
	};
	tasks.push(newTask);
	saveTasks();
	renderTasks();
	taskForm.reset();
}

function handleListClick(e){
	const btn = e.target.closest('button');
	if(!btn) return;
	const action = btn.dataset.action;
	const li = btn.closest('li.task-card');
	if(!li) return;
	const id = li.dataset.id;
	if(action === 'toggle'){
		const t = tasks.find(x=>x.id===id); if(!t) return; t.done = !t.done; saveTasks(); renderTasks();
	}
	if(action === 'delete'){
		if(!confirm('Kas oled kindel, et soovid ülesande kustutada?')) return;
		tasks = tasks.filter(x=>x.id!==id); saveTasks(); renderTasks();
	}
}

function setFilter(f){
	currentFilter = f;
	filterBtns.forEach(b=>b.classList.toggle('active', b.dataset.filter===f));
	renderTasks();
}

// events
taskForm.addEventListener('submit', addTask);
tasksList.addEventListener('click', handleListClick);
filterBtns.forEach(b=>b.addEventListener('click', ()=>setFilter(b.dataset.filter)));
sortOrder.addEventListener('change', ()=>renderTasks());
themeToggle.addEventListener('click', ()=>{
	const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
	const next = current === 'dark' ? 'light' : 'dark';
	applyTheme(next);
});

// init
loadTheme();
loadTasks();
renderTasks();
// small UX: prefill today date by default
if(!dueInput.value){
	const today = new Date();
	dueInput.value = today.toISOString().slice(0,10);
}

