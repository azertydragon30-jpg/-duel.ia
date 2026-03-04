import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';

export class Resources {
  constructor(scene, terrain){
    this.scene = scene; this.terrain = terrain;
    this.nodes = [];
    this.pickRange = 2.0;
    this.cooldowns = new Map();
  }

  spawnCluster(type, count){
    for(let i=0;i<count;i++){
      const x = (Math.random()-0.5)*this.terrain.size;
      const z = (Math.random()-0.5)*this.terrain.size;
      const biome = this.terrain.getBiomeAt(x,z);
      // simple biome filter
      if(type==='wood' && biome==='forest' || type==='stone' && biome!=='water' || type==='iron' && biome==='mountain'){
        this.spawnNode(type, x, z);
      } else {
        i--; continue;
      }
    }
  }

  spawnNode(type,x,z){
    const y = this.terrain.heightAt(x,z) + 0.4;
    const color = type==='wood'?0x8b5a2b: type==='stone'?0x888888:0xffcc00;
    const geo = new THREE.BoxGeometry(0.8,0.8,0.8);
    const mat = new THREE.MeshStandardMaterial({color});
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x,y,z);
    m.userData = { type, hp: 1 };
    this.scene.add(m);
    this.nodes.push(m);
  }

  update(dt, player){
    // pick interaction (E)
    if(window.gameInput === undefined) window.gameInput = {};
    if(window.gameInput.pick) {
      this.tryPick(player);
      window.gameInput.pick = false;
    }
  }

  tryPick(player){
    for(const n of this.nodes){
      if(n.userData && n.position.distanceTo(player.pos) < this.pickRange){
        // collect
        this.scene.remove(n);
        this.nodes = this.nodes.filter(x=>x!==n);
        const inv = JSON.parse(localStorage.getItem('inv')||'{}');
        inv[n.userData.type] = (inv[n.userData.type]||0)+1;
        localStorage.setItem('inv', JSON.stringify(inv));
        document.getElementById('inv-count').textContent = Object.values(inv).reduce((a,b)=>a+b,0);
        document.getElementById('message').textContent = `Ressource collectée: ${n.userData.type}`;
        setTimeout(()=>document.getElementById('message').textContent='',2000);
        break;
      }
    }
  }
}
