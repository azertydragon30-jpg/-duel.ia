import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';

export class Player {
  constructor(scene, camera, terrain){
    this.scene = scene; this.camera = camera; this.terrain = terrain;
    this.speed = 6;
    this.pos = new THREE.Vector3(0,5,0);
    this.velocity = new THREE.Vector3();
    this.mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.5,1.0,4,8), new THREE.MeshStandardMaterial({color:0x00aaff}));
    this.mesh.position.copy(this.pos);
    scene.add(this.mesh);
    camera.position.set(0,2,6);
    this.keys = {};
    window.addEventListener('keydown', e=> this.keys[e.code]=true);
    window.addEventListener('keyup', e=> this.keys[e.code]=false);
    this.ray = new THREE.Raycaster();
    this.hp = 100;
  }

  update(dt){
    const dir = new THREE.Vector3();
    if(this.keys['KeyW']) dir.z -= 1;
    if(this.keys['KeyS']) dir.z += 1;
    if(this.keys['KeyA']) dir.x -= 1;
    if(this.keys['KeyD']) dir.x += 1;
    dir.normalize();
    dir.multiplyScalar(this.speed * dt);
    this.pos.add(dir);
    // simple ground snap
    const groundY = this.terrain.heightAt(this.pos.x, this.pos.z);
    this.pos.y = groundY + 1.0;
    this.mesh.position.copy(this.pos);
    // camera follow
    this.camera.position.lerp(new THREE.Vector3(this.pos.x, this.pos.y+2, this.pos.z+6), 0.12);
    this.camera.lookAt(this.pos);
  }
}
