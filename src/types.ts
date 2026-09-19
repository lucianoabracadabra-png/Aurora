export type Identity = {
  name: string;
  avatarUrl?: string;
  height: string;
  weight: string;
  hair: string;
  eyes: string;
  skin: string;
  age: string;
  ideals: string;
  origin: string;
  languages: string[];
};

export type Alignment = {
  altruism: number; // 0 = Individualism, 100 = Altruism
  logic: number; // 0 = Emotion, 100 = Logic
  integrity: number; // 0 = Corruption, 100 = Integrity
};

export type Personality = {
  courage: number;
  conviction: number;
  serenity: number;
};

export type Attributes = {
  physical: { strength: number; dexterity: number; agility: number; constitution: number };
  mental: { intelligence: number; perception: number; reasoning: number; wisdom: number };
  social: { empathy: number; manipulation: number; expression: number; resilience: number };
};

export type Skills = {
  physical: { melee: number; firearms: number; archery: number; throwing: number; brawl: number; combat: number; stealth: number; alertness: number };
  mental: { academics: number; traps: number; intuition: number; investigation: number; medicine: number; occultism: number; security: number; survival: number };
  social: { bargain: number; taming: number; etiquette: number; intimidation: number; smoothTalk: number; leadership: number; riding: number; seduction: number };
};

export type Domains = {
  water: number;
  air: number;
  anima: number;
  fire: number;
  earth: number;
};

export type Ability = {
  id: string;
  name: string;
  description: string;
  mechanic: string;
  cost: string;
};

export type Trait = {
  id: string;
  name: string;
  type: 'advantage' | 'disadvantage';
  description: string;
  value: number;
};

export type CustomSkill = {
  id: string;
  name: string;
  value: number;
};

export type CustomSkills = {
  treinamentos: CustomSkill[];
  ciencias: CustomSkill[];
  artes: CustomSkill[];
};

export type ManaSpent = {
  physical: number;
  mental: number;
  social: number;
};

export type NaturezaSpent = {
  water: number;
  air: number;
  anima: number;
  fire: number;
  earth: number;
};

export type DamageType = 'none' | 'simple' | 'lethal' | 'aggravated';

export type BodyHealth = {
  head: DamageType[];
  torso: DamageType[];
  leftArm: DamageType[];
  rightArm: DamageType[];
  leftLeg: DamageType[];
  rightLeg: DamageType[];
};

export type CharacterData = {
  identity: Identity;
  alignment: Alignment;
  personality: Personality;
  attributes: Attributes;
  skills: Skills;
  customSkills: CustomSkills;
  domains: Domains;
  abilities: Ability[];
  traits: Trait[];
  manaSpent: ManaSpent;
  naturezaSpent: NaturezaSpent;
  health: BodyHealth;
};
