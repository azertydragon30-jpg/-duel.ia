import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/controls/PointerLockControls.js';
import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';

const noise2D = createNoise2D(); // valeur entre -1 et 1

function heightAt(x,z){
  const scale = 80;
  const amp = 24;
  const base = 32;
  let h = 0;
  h += noise2D(x/scale, z/scale) * amp;
  h += noise2D(x/(scale/2), z/(scale/2)) * (amp/4);
  h += noise2D(x/(scale/4), z/(scale/4)) * (amp/8);
  return Math.floor(h + base);
}

// ... (reste du code de génération de chunks et rendu identique à ton prototype)
