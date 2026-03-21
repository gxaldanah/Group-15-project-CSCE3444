export type Attributea = {
  strength: number;
  intelligence: number;
  charisma: number;
  agility: number;
  luck: number;
};

export class Player {
  totalPoints:: number;
  attributes: Attributes;

constructor(totalPoints: number) {
  this.totalPoints = totalPoints;

  this.attributes = {
    strength: 0,
    intelligence: 0,
    charisma: 0,
    agility: 0,
    luck: 0,
  };
}

allocate(attr: keyof Attributes) {
  if (this.totalPoints <= 0) return false;

  this.attributes[attr]++;
  this.totalPoints++;
  return true;
}

reset(maxPoints: number) {
  this.totalPoints = maxPoints;
  Object.keys(this.attributes).forEach(key) => {
    this.attributes[key as keyof Attributes] = 0;
  });
 }
}
