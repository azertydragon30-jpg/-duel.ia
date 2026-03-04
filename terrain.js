import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@3.0.0/dist/esm/simplex-noise.js';

// Terrain: plane geometry displaced by noise; biomes by height thresholds.
export class Terrain {
  constructor(scene){
    this.scene = scene;
    this.size = 200;
    this.segments = 256;
    this.mesh = null;
    this.noise = new SimplexNoise(Math.random);
  }

  generate(seed = 0){
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI/2);
    const pos = geom.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this.heightAt(x,z);
      pos.setY(i, h);
    }
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x88aa66, flatShading:false });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  heightAt(x,z){
    const s = 0.02;
    let h = 0;
    h += this.noise.noise2D(x*s, z*s) * 6;
    h += this.noise.noise2D(x*s*2, z*s*2) * 2;
    h += this.noise.noise2D(x*s*8, z*s*8) * 0.6;
    // add plateau/desert bias
    return Math.max(-2, h);
  }

  getBiomeAt(x,z){
    const h = this.heightAt(x,z);
    if(h < -1) return 'water';
    if(h < 1) return 'plains';
    if(h < 4) return 'forest';
    return 'mountain';
  }
}
