// src/main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.156.0/examples/jsm/controls/OrbitControls.js';
import { Terrain } from './terrain.js';
import { Player } from './player.js';
import { Resources } from './resources.js';
import { Crafting } from './crafting.js';
import { AIManager } from './ai.js';

// --- Initialisation scène / rendu
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// rendre le canvas focusable pour capter les touches
renderer.domElement.tabIndex = 0;
renderer.domElement.style.outline = 'none';

// resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
dir.castShadow = true;
scene.add(dir);

// --- Modules (terrain, joueur, ressources, crafting, IA)
const terrain = new Terrain(scene);
terrain.generate(0); // seed 0 (modifiable)

const player = new Player(scene, camera, terrain);
const resources = new Resources(scene, terrain);
const crafting = new Crafting();
const ai = new AIManager(scene, terrain, player);

// exposer API globale utile pour debug / console
window.gameAPI = { player, resources, crafting, terrain, ai };

// spawn initial de ressources (exemples)
resources.spawnCluster('wood', 30);
resources.spawnCluster('stone', 20);
resources.spawnCluster('iron', 8);

// --- Gestion centralisée des entrées
// window.gameInput contient l'état des actions (lecture par les modules)
window.gameInput = {
  keys: {},        // touches maintenues (KeyW, KeyA, ...)
  actions: {},     // actions ponctuelles (pick, openCraftUI, etc.)
  pointerLocked: false
};

// touches maintenues (KeyW, KeyA, KeyS, KeyD, Space, ShiftLeft)
window.addEventListener('keydown', (e) => {
  // éviter répétition si la touche est déjà marquée
  if (!window.gameInput.keys[e.code]) window.gameInput.keys[e.code] = true;

  // actions ponctuelles
  if (e.code === 'KeyE') {
    e.preventDefault();
    window.gameInput.actions.pick = true; // ramasser / interagir
  }
  if (e.code === 'KeyC') {
    e.preventDefault();
    window.gameInput.actions.openCraftUI = true; // ouvrir UI crafting
  }
  if (e.code === 'KeyR') {
    e.preventDefault();
    window.gameInput.actions.reloadResources = true; // debug / respawn manuel
  }
});

window.addEventListener('keyup', (e) => {
  window.gameInput.keys[e.code] = false;
});

// clic pour focus et pointer lock optionnel
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.focus();
  // optionnel : activer pointer lock pour contrôle souris (décommenter si utilisé)
  // renderer.domElement.requestPointerLock?.();
});

// pointer lock events (si utilisé plus tard)
document.addEventListener('pointerlockchange', () => {
  window.gameInput.pointerLocked = (document.pointerLockElement === renderer.domElement);
});

// --- Boucle principale
let last = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp dt pour stabilité
  last = now;

  // Mise à jour des modules (ordre important : player -> resources -> ai)
  // Le player lit window.gameInput.keys pour le déplacement
  player.update(dt, window.gameInput);

  // resources lit window.gameInput.actions.pick pour tenter de ramasser
  resources.update(dt, player, window.gameInput);

  // crafting peut réagir à openCraftUI (ici on consomme l'action)
  if (window.gameInput.actions.openCraftUI) {
    // exemple simple : log / placeholder pour UI
    console.log('Ouvrir UI crafting (à implémenter)');
    window.gameInput.actions.openCraftUI = false;
  }

  // reload resources debug
  if (window.gameInput.actions.reloadResources) {
    resources.spawnCluster('wood', 10);
    resources.spawnCluster('stone', 6);
    window.gameInput.actions.reloadResources = false;
  }

  ai.update(dt);

  // nettoyer actions ponctuelles traitées par d'autres modules (pick est consommé dans resources)
  // si un module ne consomme pas une action, la remettre à false ici pour éviter répétition
  // (resources.tryPick doit remettre pick = false après traitement)
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// --- Focus initial et affichage console utile
console.log('Prototype démarré. Contrôles : W A S D pour bouger, E pour ramasser, C pour crafting.');
