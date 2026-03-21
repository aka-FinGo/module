import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const STORAGE_KEY = 'kitchen_templates_v3';

const DEFAULT_TEMPLATES = [
  {
    id: crypto.randomUUID(),
    category: 'Pastki seksiyalar',
    name: 'Pastki modul 600',
    width: 60,
    height: 72,
    depth: 60,
    price: 1200000,
    furniture: [
      { name: 'Shurup 4x30', qty: 20 },
      { name: 'Ruchka', qty: 1 }
    ],
    color: '#b7beca'
  },
  {
    id: crypto.randomUUID(),
    category: 'Pastki seksiyalar',
    name: 'Pastki modul 800',
    width: 80,
    height: 72,
    depth: 60,
    price: 1450000,
    furniture: [
      { name: 'Shurup 4x30', qty: 24 },
      { name: 'Ruchka', qty: 2 }
    ],
    color: '#aeb8c6'
  },
  {
    id: crypto.randomUUID(),
    category: 'Yuqori seksiyalar',
    name: 'Yuqori modul 600',
    width: 60,
    height: 72,
    depth: 35,
    price: 980000,
    furniture: [
      { name: 'Shurup 4x30', qty: 14 },
      { name: 'Petlya', qty: 2 }
    ],
    color: '#c7ccd6'
  }
];

const app = document.getElementById('app');
app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="toolbar-group">
        <button id="toggle-admin" class="tool-btn">⚙️ Admin</button>
        <button id="reset-scene" class="tool-btn">♻️ Tozalash</button>
      </div>
      <div class="toolbar-title">Kitchen Planner Clone</div>
      <div class="toolbar-group right">
        <div class="price-pill">Jami: <strong id="total-price">0 so'm</strong></div>
      </div>
    </header>

    <div class="workspace">
      <aside class="sidebar">
        <nav class="menu-block">
          <h3>Katalog</h3>
          <div id="category-list" class="category-list"></div>
        </nav>

        <section class="menu-block">
          <h3>Modullar</h3>
          <div id="catalog-list" class="catalog-list"></div>
        </section>
      </aside>

      <main class="scene-panel">
        <div id="scene"></div>
        <section class="floating-summary">
          <h4>Sahnadagi modullar</h4>
          <div id="placed-list" class="mini-list"></div>
          <h4>Furnitura jami</h4>
          <div id="furniture-totals" class="mini-list"></div>
        </section>
      </main>
    </div>

    <div id="admin-drawer" class="admin-drawer hidden">
      <div class="admin-header">
        <h3>Admin panel</h3>
        <button id="close-admin" class="tool-btn">✕</button>
      </div>
      <form id="module-form" class="admin-form">
        <input id="m-category" placeholder="Kategoriya (masalan: Pastki seksiyalar)" required />
        <input id="m-name" placeholder="Modul nomi" required />
        <div class="inline-3">
          <input id="m-width" type="number" min="20" placeholder="Eni" required />
          <input id="m-height" type="number" min="20" placeholder="Boyi" required />
          <input id="m-depth" type="number" min="20" placeholder="Chuqurlik" required />
        </div>
        <input id="m-price" type="number" min="0" placeholder="Narxi" required />
        <textarea id="m-furniture" rows="5" placeholder="Furnitura: Nomi|Soni\nMasalan:\nShurup 4x30|20\nRuchka|2"></textarea>
        <button type="submit">Modulni saqlash</button>
      </form>
      <div id="admin-template-list" class="mini-list"></div>
    </div>
  </div>
`;

const elements = {
  categoryList: document.getElementById('category-list'),
  catalogList: document.getElementById('catalog-list'),
  placedList: document.getElementById('placed-list'),
  furnitureTotals: document.getElementById('furniture-totals'),
  totalPrice: document.getElementById('total-price'),
  adminList: document.getElementById('admin-template-list'),
  drawer: document.getElementById('admin-drawer')
};

let templates = loadTemplates();
if (!templates.length) {
  templates = DEFAULT_TEMPLATES;
  saveTemplates();
}
let currentCategory = templates[0]?.category || '';
let placedModules = [];

const sceneRoot = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
sceneRoot.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f2);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(3.5, 3, 6.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(5, 9, 4);
scene.add(keyLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f7 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
backWall.position.set(0, 2, -6);
scene.add(backWall);

const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
sideWall.rotation.y = Math.PI / 2;
sideWall.position.set(-6, 2, 0);
scene.add(sideWall);

const grid = new THREE.GridHelper(12, 24, 0x9aa1a8, 0xc8ced5);
scene.add(grid);

function resize() {
  const { clientWidth, clientHeight } = sceneRoot;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

(function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();

function loadTemplates() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTemplates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function parseFurniture(raw) {
  return raw
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qty] = line.split('|').map((v) => v?.trim());
      return { name, qty: Number(qty || 1) };
    })
    .filter((x) => x.name);
}

function formatMoney(value) {
  return `${new Intl.NumberFormat('uz-UZ').format(value)} so'm`;
}

function renderCategories() {
  const categories = [...new Set(templates.map((t) => t.category))];
  if (!categories.includes(currentCategory)) currentCategory = categories[0] || '';

  elements.categoryList.innerHTML = categories
    .map(
      (cat) => `<button class="cat-btn ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
    )
    .join('');
}

function renderCatalog() {
  const list = templates.filter((t) => t.category === currentCategory);
  if (!list.length) {
    elements.catalogList.innerHTML = `<p class="muted">Bu kategoriyada modul yo'q.</p>`;
    return;
  }

  elements.catalogList.innerHTML = list
    .map(
      (t) => `
        <article class="catalog-item">
          <div class="thumb" style="background:${t.color}"></div>
          <div>
            <strong>${t.name}</strong>
            <p>${t.width}x${t.height}x${t.depth} sm</p>
            <p>Narx: ${formatMoney(t.price)}</p>
          </div>
          <button data-add="${t.id}" class="tool-btn">+ Qo'shish</button>
        </article>
      `
    )
    .join('');
}

function renderAdminList() {
  elements.adminList.innerHTML = templates
    .map(
      (t) => `
        <div class="mini-row">
          <div>
            <strong>${t.name}</strong>
            <p>${t.category} · ${formatMoney(t.price)}</p>
          </div>
          <button class="danger" data-del-template="${t.id}">O'chirish</button>
        </div>
      `
    )
    .join('');
}

function addToScene(templateId) {
  const t = templates.find((item) => item.id === templateId);
  if (!t) return;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(t.width / 100, t.height / 100, t.depth / 100),
    new THREE.MeshStandardMaterial({ color: t.color })
  );

  const x = placedModules.length * 0.9 - 2.7;
  mesh.position.set(x, t.height / 200, -5.6 + t.depth / 200);
  scene.add(mesh);

  placedModules.push({
    id: crypto.randomUUID(),
    name: t.name,
    price: t.price,
    furniture: t.furniture,
    mesh
  });

  renderProject();
}

function removePlaced(id) {
  const idx = placedModules.findIndex((m) => m.id === id);
  if (idx === -1) return;
  scene.remove(placedModules[idx].mesh);
  placedModules.splice(idx, 1);
  placedModules.forEach((m, i) => {
    m.mesh.position.x = i * 0.9 - 2.7;
  });
  renderProject();
}

function renderProject() {
  const total = placedModules.reduce((sum, x) => sum + x.price, 0);
  elements.totalPrice.textContent = formatMoney(total);

  elements.placedList.innerHTML = placedModules.length
    ? placedModules
        .map(
          (m) => `
          <div class="mini-row">
            <span>${m.name} · ${formatMoney(m.price)}</span>
            <button class="danger" data-remove="${m.id}">x</button>
          </div>
        `
        )
        .join('')
    : `<p class="muted">Sahnada modul yo'q.</p>`;

  const fTotals = new Map();
  for (const module of placedModules) {
    for (const f of module.furniture) {
      fTotals.set(f.name, (fTotals.get(f.name) || 0) + Number(f.qty));
    }
  }

  elements.furnitureTotals.innerHTML = fTotals.size
    ? [...fTotals.entries()]
        .map(([name, qty]) => `<div class="mini-row"><span>${name}</span><strong>x${qty}</strong></div>`)
        .join('')
    : `<p class="muted">Furnitura hali yo'q.</p>`;
}

function bindEvents() {
  document.getElementById('toggle-admin').addEventListener('click', () => {
    elements.drawer.classList.toggle('hidden');
  });

  document.getElementById('close-admin').addEventListener('click', () => {
    elements.drawer.classList.add('hidden');
  });

  document.getElementById('reset-scene').addEventListener('click', () => {
    placedModules.forEach((m) => scene.remove(m.mesh));
    placedModules = [];
    renderProject();
  });

  elements.categoryList.addEventListener('click', (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    currentCategory = cat;
    renderCategories();
    renderCatalog();
  });

  elements.catalogList.addEventListener('click', (e) => {
    const id = e.target.dataset.add;
    if (id) addToScene(id);
  });

  elements.placedList.addEventListener('click', (e) => {
    const id = e.target.dataset.remove;
    if (id) removePlaced(id);
  });

  elements.adminList.addEventListener('click', (e) => {
    const id = e.target.dataset.delTemplate;
    if (!id) return;
    templates = templates.filter((t) => t.id !== id);
    saveTemplates();
    renderCategories();
    renderCatalog();
    renderAdminList();
  });

  document.getElementById('module-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      id: crypto.randomUUID(),
      category: document.getElementById('m-category').value.trim(),
      name: document.getElementById('m-name').value.trim(),
      width: Number(document.getElementById('m-width').value),
      height: Number(document.getElementById('m-height').value),
      depth: Number(document.getElementById('m-depth').value),
      price: Number(document.getElementById('m-price').value),
      furniture: parseFurniture(document.getElementById('m-furniture').value),
      color: `hsl(${Math.floor(Math.random() * 360)} 45% 72%)`
    };
    templates.unshift(formData);
    saveTemplates();
    currentCategory = formData.category;
    renderCategories();
    renderCatalog();
    renderAdminList();
    e.target.reset();
  });
}

bindEvents();
renderCategories();
renderCatalog();
renderAdminList();
renderProject();
