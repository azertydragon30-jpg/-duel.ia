import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/controls/PointerLockControls.js';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@3.0.0/simplex-noise.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(100,200,100);
scene.add(light);

const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', ()=>controls.lock());
camera.position.set(0,50,100);

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 128;
const RENDER_DISTANCE = 3;
const seed = 'seed';
const noise = new SimplexNoise(seed);

const chunks = new Map();

function heightAt(x,z){
  const scale = 80;
  const amp = 24;
  const base = 32;
  let h = 0;
  // 3 octaves
  h += noise.noise2D(x/scale, z/scale) * amp;
  h += noise.noise2D(x/(scale/2), z/(scale/2)) * (amp/4);
  h += noise.noise2D(x/(scale/4), z/(scale/4)) * (amp/8);
  return Math.floor(h + base);
}

function chunkKey(cx,cz){ return `${cx},${cz}`; }

function generateChunk(cx,cz){
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let idx = 0;
  const getBlock = (x,y,z)=>{
    const worldY = y;
    const h = heightAt(cx*CHUNK_SIZE + x, cz*CHUNK_SIZE + z);
    return worldY <= h ? 1 : 0;
  };
  const addFace = (vx,vy,vz, nx,ny,nz, color)=>{
    positions.push(...vx);
    normals.push(nx,ny,nz, nx,ny,nz, nx,ny,nz, nx,ny,nz);
    for(let i=0;i<4;i++) colors.push(color.r, color.g, color.b);
    indices.push(idx, idx+1, idx+2, idx, idx+2, idx+3);
    idx += 4;
  };
  const faceVerts = {
    px: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
    nx: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]],
    py: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
    ny: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
    pz: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
    nz: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]]
  };
  for(let x=0;x<CHUNK_SIZE;x++){
    for(let z=0;z<CHUNK_SIZE;z++){
      for(let y=0;y<CHUNK_HEIGHT;y++){
        if(!getBlock(x,y,z)) continue;
        const neighbors = {
          px: getBlock(x+1,y,z),
          nx: getBlock(x-1,y,z),
          py: getBlock(x,y+1,z),
          ny: getBlock(x,y-1,z),
          pz: getBlock(x,y,z+1),
          nz: getBlock(x,y,z-1)
        };
        const worldX = cx*CHUNK_SIZE + x;
        const worldZ = cz*CHUNK_SIZE + z;
        const color = new THREE.Color().setHSL(0.25,0.6, Math.min(0.6, 0.3 + y/CHUNK_HEIGHT));
        if(!neighbors.px) addFace(faceVerts.px.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), 1,0,0, color);
        if(!neighbors.nx) addFace(faceVerts.nx.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), -1,0,0, color);
        if(!neighbors.py) addFace(faceVerts.py.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), 0,1,0, color);
        if(!neighbors.ny) addFace(faceVerts.ny.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), 0,-1,0, color);
        if(!neighbors.pz) addFace(faceVerts.pz.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), 0,0,1, color);
        if(!neighbors.nz) addFace(faceVerts.nz.map(v=>[v[0]+worldX, v[1]+y, v[2]+worldZ]).flat(), 0,0,-1, color);
      }
    }
  }
  if(positions.length===0) return null;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mat = new THREE.MeshLambertMaterial({vertexColors:true});
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(0,0,0);
  return mesh;
}

function updateChunks(){
  const pcx = Math.floor(camera.position.x / CHUNK_SIZE);
  const pcz = Math.floor(camera.position.z / CHUNK_SIZE);
  const needed = new Set();
  for(let dx=-RENDER_DISTANCE; dx<=RENDER_DISTANCE; dx++){
    for(let dz=-RENDER_DISTANCE; dz<=RENDER_DISTANCE; dz++){
      const k = chunkKey(pcx+dx, pcz+dz);
      needed.add(k);
      if(!chunks.has(k)){
        const mesh = generateChunk(pcx+dx, pcz+dz);
        if(mesh){ scene.add(mesh); chunks.set(k, mesh); }
        else chunks.set(k, null);
      }
    }
  }
  for(const [k,mesh] of chunks){
    if(!needed.has(k)){
      if(mesh) scene.remove(mesh);
      chunks.delete(k);
    }
  }
}

window.addEventListener('resize', ()=>{ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

function animate(){
  requestAnimationFrame(animate);
  updateChunks();
  renderer.render(scene, camera);
}
animate();
