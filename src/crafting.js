export class Crafting {
  constructor(){
    // simple recipes
    this.recipes = {
      'wooden_pick': { wood:3, stone:2 },
      'campfire': { wood:5, stone:2 }
    };
  }

  craft(item){
    const inv = JSON.parse(localStorage.getItem('inv')||'{}');
    const recipe = this.recipes[item];
    if(!recipe) return { ok:false, msg:'Recette inconnue' };
    for(const k in recipe) if((inv[k]||0) < recipe[k]) return { ok:false, msg:'Ressources manquantes' };
    for(const k in recipe) inv[k] -= recipe[k];
    inv[item] = (inv[item]||0)+1;
    localStorage.setItem('inv', JSON.stringify(inv));
    return { ok:true, msg:`${item} fabriqué` };
  }
}
