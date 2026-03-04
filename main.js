import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.156.0/examples/jsm/controls/OrbitControls.js';
import { Terrain } from './terrain.js';
import { Player } from './player.js';
import { Resources } from './resources.js';
import { Crafting } from './crafting.js';
import { AIManager } from './ai.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', ()=> {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5,10,7); scene.add(dir);

// modules
const terrain = new Terrain(scene);
terrain.generate(0); // seed 0

const player = new Player(scene, camera, terrain);
const resources = new Resources(scene, terrain);
const crafting = new Crafting();
const ai = new AIManager(scene, terrain, player);

// spawn some resources
resources.spawnCluster('wood', 30);
resources.spawnCluster('stone', 20);
resources.spawnCluster('iron', 8);

let last = performance.now();
function animate(t){
  const dt = (t - last)/1000; last = t;
  player.update(dt);
  resources.update(dt, player);
  ai.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// simple UI hooks
window.gameAPI = { player, resources, crafting };
