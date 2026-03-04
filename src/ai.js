import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';

export class AIManager {
  constructor(scene, terrain, player){
    this.scene = scene; this.terrain = terrain; this.player = player;
    this.entities = [];
    // spawn a simple predator
    this.spawnPredator(10,10);
  }

  spawnPredator(x,z){
    const y = this.terrain.heightAt(x,z)+0.5;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), new THREE.MeshStandardMaterial({color:0xff4444}));
    m.position.set(x,y,z);
    m.userData = { type:'predator', state:'idle' };
    this.scene.add(m);
    this.entities.push(m);
  }

  update(dt){
    for(const e of this.entities){
      const toPlayer = this.player.pos.clone().sub(e.position);
      const dist = toPlayer.length();
      if(dist < 12){
        // pursue
        toPlayer.normalize().multiplyScalar(3*dt);
        e.position.add(toPlayer);
        // simple attack
        if(dist < 1.2){
          this.player.hp = Math.max(0, this.player.hp - 10*dt);
          document.getElementById('hp').textContent = Math.round(this.player.hp);
        }
      } else {
        // wander
        e.position.x += (Math.random()-0.5)*0.2*dt;
        e.position.z += (Math.random()-0.5)*0.2*dt;
        e.position.y = this.terrain.heightAt(e.position.x, e.position.z) + 0.5;
      }
    }
  }
}
