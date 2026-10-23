export type Identity = {
  name: string;
  avatarUrl?: string;
  archetype?: string;
  height: string;
  weight: string;
  hair: string;
  eyes: string;
  skin: string;
  age: string;
  ideals: string;
  origin: string;
  languages: string[];
  background?: string;
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
  selected?: boolean;
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

export type EquipmentSlot = 
  // 1 Armadura (Armor)
  | 'head' // 1.1 Cabeça (Head)
  | 'shoulders' // 1.2 Ombros (Shoulders)
  | 'chest' // 1.3 Torso / Peitoral (Chest)
  | 'wrist' // 1.4 Pulsos / Braçadeiras (Wrist)
  | 'hands' // 1.5 Mãos / Luvas (Hands)
  | 'waist' // 1.6 Cintura / Cinto (Waist)
  | 'legs' // 1.7 Pernas / Calças (Legs)
  | 'feet' // 1.8 Pés / Botas (Feet)
  // 2 Não-Armadura / Utilitários (Non-armor)
  | 'neck' // 2.1 Pescoço / Colar (Neck)
  | 'back' // 2.2 Costas / Manto (Back)
  | 'finger' // 2.3 Dedo / Anel (Finger)
  | 'trinket' // 2.4 Berloque / Amuleto (Trinket)
  // 3 Armas (Weapons)
  | 'main_hand' // 3.1 Mão Primária (Uma Mão / Duas Mãos)
  | 'off_hand' // 3.2 Mão Secundária (Uma Mão / Duas Mãos)
  // Compatibilidade com dados legados
  | 'torso'
  | 'arm_left'
  | 'arm_right'
  | 'hands_main'
  | 'hands_off'
  | 'hands_gloves'
  | 'leg_left'
  | 'leg_right'
  | 'neck_back';

export type WeaponAttack = {
  damage: string; // ex: '1d10', '1d6', '2d10'
  type: string; // ex: 'per', 'cor', 'esm' (perfurante, cortante, esmagamento)
  ap: number; // penetração de armadura
  precision: number; // precisão / bônus de acerto
};

export type WeaponItem = {
  id: string;
  name: string;
  category: 'weapon';
  equipped: boolean;
  slot?: EquipmentSlot;
  thrust: WeaponAttack;
  swing: WeaponAttack;
  size: string; // ex: 'g', 'gg'
  weight: number; // em gramas, ex: 3000
  location: string; // ex: 'Em Mãos', 'Cinto', 'Mochila'
  stored?: boolean; // Se true, o item está no armazém e não pesa no personagem
  storageLocation?: string; // Onde o item está guardado (ex: 'Carroça', 'Estalagem', 'Cofre')
  reach?: string; // Alcance da arma: ex: 'Curto', '1m', '2m', 'Médio'
  resistance?: number; // Resistência da arma
  durabilityMax?: number; // Durabilidade máxima da arma
  durabilityCurrent?: number; // Durabilidade atual da arma
  extras?: string;
  description?: string;
  stars?: number; // 1 a 9
  rarity?: string;
};

export type ArmorItem = {
  id: string;
  name: string;
  category: 'armor';
  equipped: boolean;
  slot?: EquipmentSlot;
  slashing: number | string; // Cortante (Cor.)
  bludgeoning: number | string; // Esmagamento (Esm.)
  piercing: number | string; // Perfurante (Per.)
  coverage: number | string; // Cobertura (Cob.)
  resistance: number | string; // Resistência (Res.)
  durabilityMax: number; // Durabilidade máxima
  durabilityCurrent: number; // Durabilidade restante
  size: string; // ex: 'gg', 'ggg'
  weight: number; // em gramas
  location: string;
  stored?: boolean;
  storageLocation?: string;
  extras?: string;
  description?: string;
  stars?: number; // 1 a 9
  rarity?: string;
};

export type ProjectileItem = {
  id: string;
  name: string;
  category: 'projectile';
  equipped: boolean;
  slot?: EquipmentSlot;
  damage: string;
  type: string;
  ap: number;
  precision: number;
  quantity: number;
  size: string;
  weight: number; // em gramas
  location: string;
  stored?: boolean;
  storageLocation?: string;
  extras?: string;
  description?: string;
  stars?: number; // 1 a 9
  rarity?: string;
};

export type AccessoryItem = {
  id: string;
  name: string;
  category: 'accessory';
  equipped: boolean;
  slot?: EquipmentSlot;
  typeAndDesc?: string;
  effect?: string;
  description?: string;
  size?: string;
  weight: number; // em gramas
  location: string;
  stored?: boolean;
  storageLocation?: string;
  stars?: number; // 1 a 9
  rarity?: string;
};

export type GeneralItem = {
  id: string;
  name: string;
  category: 'general';
  itemType?: 'consumable' | 'tool' | 'supply' | 'valuable' | 'misc';
  quantity: number;
  weight: number; // em gramas por unidade
  equipped: boolean;
  slot?: EquipmentSlot;
  location: string;
  stored?: boolean;
  storageLocation?: string;
  description?: string;
  stars?: number; // 1 a 9
  rarity?: string;
};

export type CurrencyTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  coin: 'gold' | 'silver' | 'copper';
  reason?: string;
  timestamp: number;
};

export type Currency = {
  gold: number;
  silver: number;
  copper: number;
  gems?: string;
  history?: CurrencyTransaction[];
};

export type Inventory = {
  weapons: WeaponItem[];
  armors: ArmorItem[];
  projectiles: ProjectileItem[];
  accessories: AccessoryItem[];
  generalItems: GeneralItem[];
  currency: Currency;
};

export type FlowPatronData = {
  level: number;
  hp: number; // 0 a 10
  name?: string;
  notes?: string;
};

export type FlowAndPatron = {
  fluxo: FlowPatronData;
  patrono: FlowPatronData;
};

export type SpiritusData = {
  fluxo: number;
  patrono: number;
  rachadura: boolean[];
};

export type CombatEntityType = 'player' | 'ally' | 'enemy' | 'boss' | 'aliado' | 'neutro' | 'inimigo' | 'chefe';

export interface CombatStep {
  fromTick: number;
  toTick: number;
}

export interface CombatEntity {
  id: string;
  name: string;
  type: CombatEntityType;
  color: string;
  currentTick: number;
  /**
   * Histórico dos passos anteriores da entidade (do mais recente para o mais antigo).
   * O 1º passo anterior deve ser exibido com 70% de opacidade.
   * O 2º passo anterior deve ser exibido com 50% de opacidade.
   * O 3º passo anterior deve ser exibido com 20% de opacidade.
   */
  history: number[];
  /** Segmentos completos de movimento (de onde foi até onde está em cada rodada) */
  steps?: CombatStep[];
  hp?: number;
  maxHp?: number;
  notes?: string;
  defaultDelay?: number;
  health?: BodyHealth;
}

export interface BattleTrackerState {
  currentTick: number;
  minTimespan: number; // Mínimo de 15
  entities: CombatEntity[];
}

export interface CampaignCharacter {
  id: string;
  username?: string;
  name: string;
  avatarUrl?: string;
  color?: string;
  data: CharacterData;
}

export type FocusLevel = 'FE' | 'F1' | 'F2' | 'SF';
export type FocusDistributionType = 'padrao' | 'especializada' | 'generalista'; // 'padrao' = [F1, F2, SF], 'especializada' = [FE, SF, SF], 'generalista' = [F2, F2, F2]

export type FocusConfig = {
  distribution: FocusDistributionType;
  physical: FocusLevel;
  mental: FocusLevel;
  social: FocusLevel;
};

export type ExpBudget = {
  initial: number; // Banco de EXP Inicial / Criação
  campaign: number; // Banco de EXP de Campanha / Adicional
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
  inventory: Inventory;
  spiritus: SpiritusData;
  focusConfig?: FocusConfig;
  expBudget?: ExpBudget;
};
