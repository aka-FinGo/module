import * as THREE from 'three';

const STORAGE_KEY = 'kitchen_modules_v1';

const state = {
  catalog: loadCatalog(),
  sceneModules: []
};

const el = {
  moduleName: document.getElementById('moduleName'),
  modulePrice: document.getElementById('modulePrice'),
  moduleW: document.getElementById('moduleW'),
  moduleH: document.getElementById('moduleH'),
  moduleD: document.getElementById('moduleD'),
  moduleColor: document.getElementById('moduleColor'),
  moduleHardware: document.getElementById('moduleHardware'),
  addModuleBtn: document.getElementById('addModuleBtn'),
  catalogList: document.getElementById('catalogList'),
  sceneItems: document.getElementById('sceneItems'),
  totalPrice: document.getElementById('totalPrice'),
  clearSceneBtn: document.getElementById('clearSceneBtn'),
  canvas: document.getElementById('sceneCanvas')
};

setupThree();
renderCatalog();
renderSceneList();

el.addModuleBtn.addEventListener('click', () => {
  const name = el.moduleName.value.trim();
  const price = Number(el.modulePrice.value);
  const width = Number(el.moduleW.value);
  const height = Number(el.moduleH.value);
  const depth = Number(el.moduleD.value);

  if (!name || !price || width <= 0 || height <= 0 || depth <= 0) {
    alert('Iltimos, modul maʼlumotlarini toʻliq kiriting.');
    return;
  }

  const module = {
    id: crypto.randomUUID(),
    name,
    price,
    width,
    height,
    depth,
    color: el.moduleColor.value,
    hardware: el.moduleHardware.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  };

  state.catalog.push(module);
  saveCatalog(state.catalog);
  renderCatalog();

  el.moduleName.value = '';
  el.modulePrice.value = '';
  el.moduleHardware.value = '';
});

el.clearSceneBtn.addEventListener('click', () => {
  state.sceneModules = [];
  clearPlacedMeshes();
  renderSceneList();
  layoutMeshes();
});

function loadCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: crypto.randomUUID(),
          name: 'Demo modul 60',
          price: 210,
          width: 60,
          height: 72,
          depth: 60,
          color: '#d6b68a',
          hardware: ['rels', 'tutqich']
        }
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCatalog(catalog) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}

function renderCatalog() {
  el.catalogList.innerHTML = '';
  state.catalog.forEach((module) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <strong>${module.name}</strong>
      <div class="meta">$${module.price} • ${module.width}x${module.height}x${module.depth} sm</div>
      <div class="meta">Furnitura: ${module.hardware.join(', ') || '—'}</div>
      <button data-id="${module.id}">Sahnaga qo'shish</button>
    `;

    li.querySelector('button').addEventListener('click', () => {
      addToScene(module);
    });

    el.catalogList.appendChild(li);
  });
}

function renderSceneList() {
  el.sceneItems.innerHTML = '';
  const total = state.sceneModules.reduce((acc, item) => acc + item.price, 0);

  state.sceneModules.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${index + 1}. ${item.name}</strong> <div class="meta">$${item.price}</div>`;
    el.sceneItems.appendChild(div);
  });

  el.totalPrice.textContent = `$${total}`;
}

let scene;
let camera;
let renderer;
let placedMeshes = [];

function setupThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f4f6);

  const width = el.canvas.clientWidth || window.innerWidth - 360;
  const height = el.canvas.clientHeight || window.innerHeight;

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
  camera.position.set(0, 170, 320);

  renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true });
  renderer.setSize(width, height, false);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.2);
  directional.position.set(200, 250, 100);
  scene.add(directional);

  const grid = new THREE.GridHelper(800, 32, 0x9ca3af, 0xd1d5db);
  scene.add(grid);

  const floorGeom = new THREE.PlaneGeometry(800, 800);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);

  animate();

  window.addEventListener('resize', onResize);
}

function addToScene(module) {
  const geometry = new THREE.BoxGeometry(module.width, module.height, module.depth);
  const material = new THREE.MeshStandardMaterial({ color: module.color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData = {
    id: crypto.randomUUID(),
    name: module.name,
    price: module.price,
    width: module.width,
    height: module.height,
    depth: module.depth
  };

  scene.add(mesh);
  placedMeshes.push(mesh);
  state.sceneModules.push({ name: module.name, price: module.price });

  layoutMeshes();
  renderSceneList();
}

function clearPlacedMeshes() {
  placedMeshes.forEach((mesh) => scene.remove(mesh));
  placedMeshes = [];
}

function layoutMeshes() {
  let cursorX = -260;
  placedMeshes.forEach((mesh) => {
    const w = mesh.userData.width;
    const h = mesh.userData.height;
    mesh.position.set(cursorX + w / 2, h / 2, 0);
    cursorX += w + 5;
  });
}

function onResize() {
  const width = el.canvas.clientWidth || window.innerWidth;
  const height = el.canvas.clientHeight || window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
