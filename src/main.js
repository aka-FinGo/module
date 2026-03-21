import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const STORAGE_KEY = 'kitchen_module_templates_v2';

const app = document.getElementById('app');
app.innerHTML = `
  <div class="layout">
    <aside class="panel">
      <h1>Admin panel</h1>
      <p class="muted">Modul qo'shing, keyin sahnaga joylashtiring.</p>

      <form id="module-form" class="card">
        <h2>Yangi modul</h2>
        <input id="m-name" placeholder="Modul nomi" required />
        <div class="grid-2">
          <input id="m-width" type="number" min="20" value="60" placeholder="Eni (sm)" required />
          <input id="m-height" type="number" min="20" value="72" placeholder="Boyi (sm)" required />
        </div>
        <div class="grid-2">
          <input id="m-depth" type="number" min="20" value="60" placeholder="Chuqurligi (sm)" required />
          <input id="m-price" type="number" min="0" value="100" placeholder="Narxi" required />
        </div>
        <textarea id="m-furniture" rows="5" placeholder="Furnitura: Nomi|Soni\nMasalan:\nShurup 4x30|20\nRuchka|2"></textarea>
        <button type="submit">Saqlash</button>
      </form>

      <section class="card">
        <h2>Modullar</h2>
        <div id="template-list" class="stack"></div>
      </section>
    </aside>

    <main class="scene-wrap">
      <div id="scene"></div>
      <section class="summary card">
        <h2>Loyiha</h2>
        <p><strong>Jami narx:</strong> <span id="total-price">0</span></p>
        <div id="placed-list" class="stack small"></div>
        <h3>Jami furnitura</h3>
        <div id="furniture-totals" class="stack small"></div>
      </section>
    </main>
  </div>
`;

const form = document.getElementById('module-form');
const listEl = document.getElementById('template-list');
const placedListEl = document.getElementById('placed-list');
const totalPriceEl = document.getElementById('total-price');
const furnitureTotalsEl = document.getElementById('furniture-totals');

let templates = loadTemplates();
let placedModules = [];

const sceneContainer = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
sceneContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f6f8);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
camera.position.set(4, 3, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, 0);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(4, 8, 3);
scene.add(dir);

const grid = new THREE.GridHelper(20, 40, 0xbfc7d1, 0xdbe1e8);
scene.add(grid);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0xfafafa })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

function resize() {
  const { clientWidth, clientHeight } = sceneContainer;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function loadTemplates() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTemplates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function parseFurniture(text) {
  return text
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qty] = line.split('|').map((x) => x?.trim());
      return { name, qty: Number(qty || 1) };
    })
    .filter((x) => x.name);
}

function renderTemplates() {
  if (!templates.length) {
    listEl.innerHTML = '<p class="muted">Hozircha modul yo\'q.</p>';
    return;
  }

  listEl.innerHTML = templates
    .map(
      (t) => `
        <article class="template-item">
          <div>
            <strong>${t.name}</strong>
            <p>${t.width}x${t.height}x${t.depth} sm · ${formatPrice(t.price)}</p>
          </div>
          <div class="row">
            <button data-add="${t.id}">Sahnaga qo'shish</button>
            <button data-del="${t.id}" class="danger">O'chirish</button>
          </div>
        </article>
      `
    )
    .join('');
}

function formatPrice(value) {
  return new Intl.NumberFormat('uz-UZ').format(value) + ' so\'m';
}

function addToScene(templateId) {
  const t = templates.find((x) => x.id === templateId);
  if (!t) return;

  const geometry = new THREE.BoxGeometry(t.width / 100, t.height / 100, t.depth / 100);
  const material = new THREE.MeshStandardMaterial({ color: t.color });
  const mesh = new THREE.Mesh(geometry, material);

  const nextX = placedModules.length ? placedModules[placedModules.length - 1].x + 0.9 : 0;
  mesh.position.set(nextX, t.height / 200, 0);
  scene.add(mesh);

  placedModules.push({
    id: crypto.randomUUID(),
    templateId: t.id,
    name: t.name,
    price: t.price,
    furniture: t.furniture,
    mesh,
    x: nextX
  });

  renderProjectSummary();
}

function removePlaced(id) {
  const index = placedModules.findIndex((x) => x.id === id);
  if (index === -1) return;
  scene.remove(placedModules[index].mesh);
  placedModules.splice(index, 1);
  placedModules.forEach((m, i) => {
    m.x = i * 0.9;
    m.mesh.position.x = m.x;
  });
  renderProjectSummary();
}

function renderProjectSummary() {
  const total = placedModules.reduce((acc, x) => acc + x.price, 0);
  totalPriceEl.textContent = formatPrice(total);

  if (!placedModules.length) {
    placedListEl.innerHTML = '<p class="muted">Sahnaga modul qo\'shilmagan.</p>';
    furnitureTotalsEl.innerHTML = '<p class="muted">Furnitura yo\'q.</p>';
    return;
  }

  placedListEl.innerHTML = placedModules
    .map(
      (m) => `
      <div class="placed-item">
        <span>${m.name} · ${formatPrice(m.price)}</span>
        <button data-remove="${m.id}" class="danger">olib tashlash</button>
      </div>
    `
    )
    .join('');

  const totals = new Map();
  for (const m of placedModules) {
    for (const f of m.furniture) {
      totals.set(f.name, (totals.get(f.name) || 0) + Number(f.qty));
    }
  }

  furnitureTotalsEl.innerHTML = Array.from(totals.entries())
    .map(([name, qty]) => `<div class="placed-item"><span>${name}</span><strong>x${qty}</strong></div>`)
    .join('');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const template = {
    id: crypto.randomUUID(),
    name: document.getElementById('m-name').value.trim(),
    width: Number(document.getElementById('m-width').value),
    height: Number(document.getElementById('m-height').value),
    depth: Number(document.getElementById('m-depth').value),
    price: Number(document.getElementById('m-price').value),
    furniture: parseFurniture(document.getElementById('m-furniture').value),
    color: `hsl(${Math.floor(Math.random() * 360)} 60% 62%)`
  };

  templates.unshift(template);
  saveTemplates();
  renderTemplates();
  form.reset();
});

listEl.addEventListener('click', (e) => {
  const addId = e.target.dataset.add;
  const delId = e.target.dataset.del;
  if (addId) addToScene(addId);
  if (delId) {
    templates = templates.filter((t) => t.id !== delId);
    saveTemplates();
    renderTemplates();
  }
});

placedListEl.addEventListener('click', (e) => {
  const removeId = e.target.dataset.remove;
  if (removeId) removePlaced(removeId);
});

renderTemplates();
renderProjectSummary();
