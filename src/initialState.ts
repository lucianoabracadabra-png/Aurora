import { CharacterData } from './types';
import defaultPortrait from './assets/images/character_portrait_1789770891084.jpg';

export const initialCharacterData: CharacterData = {
  identity: {
    name: 'Elias Iyanu',
    avatarUrl: defaultPortrait,
    height: '1.85m',
    weight: '90kg',
    hair: 'Careca',
    eyes: 'Castanhos escuros',
    skin: 'Negra',
    age: '23',
    ideals: 'Dever, Comunidade, Cultura',
    origin: 'Coração do deserto de Igbalim',
    languages: ['Ma\'isha', 'Igbalim', 'Tantumá'],
  },
  alignment: {
    altruism: 100,
    logic: 100,
    integrity: 0,
  },
  personality: {
    courage: 2,
    conviction: 4,
    serenity: 2,
  },
  attributes: {
    physical: { strength: 3, dexterity: 2, agility: 2, constitution: 3 },
    mental: { intelligence: 2, perception: 3, reasoning: 2, wisdom: 1 },
    social: { empathy: 2, manipulation: 1, expression: 2, resilience: 4 },
  },
  skills: {
    physical: { melee: 3, firearms: 0, archery: 0, throwing: 1, brawl: 2, combat: 2, stealth: 1, alertness: 2 },
    mental: { academics: 1, traps: 0, intuition: 2, investigation: 1, medicine: 0, occultism: 1, security: 0, survival: 3 },
    social: { bargain: 1, taming: 2, etiquette: 1, intimidation: 2, smoothTalk: 0, leadership: 3, riding: 2, seduction: 0 },
  },
  customSkills: {
    treinamentos: [],
    ciencias: [],
    artes: [],
  },
  manaSpent: {
    physical: 0,
    mental: 0,
    social: 0,
  },
  domains: {
    water: 0,
    air: 0,
    anima: 2,
    fire: 1,
    earth: 2,
  },
  naturezaSpent: {
    water: 0,
    air: 0,
    anima: 0,
    fire: 0,
    earth: 0,
  },
  abilities: [
    { id: 'a1', name: 'Bardo de Guerra', description: 'Consegue mesmo em ambientes de batalha, construir rituais', mechanic: 'Foco de bardo + sem debuff instrumento improvisado', cost: '' },
    { id: 'a2', name: 'Golpe Planejado', description: 'strategy do grego strategios', mechanic: 'Batalha+Per dif= perícia+atributo atk+3 sc=bônus acerto', cost: '2 vigor' },
    { id: 'a3', name: 'Potência Vital', description: 'A energia vital fortalece o corpo', mechanic: 'Atributo físico 1.5x em 1 teste', cost: '1 anima' },
    { id: 'a4', name: 'Posição do Pilar', description: 'Firma o toco pra tankar tudo', mechanic: 'usa Cnst+Agi/2 na dif de acerto', cost: '1 vig por golpe' },
    { id: 'a5', name: 'Fortitude Ancestral', description: 'A entidade grandiosa resiste', mechanic: 'soma espírito resistência mágica', cost: '' },
    { id: 'a6', name: 'Reforço Mágico', description: 'A magia do pilar sustenta', mechanic: 'ritual+empatia, dif=complexidade mágica, sc=+estabilidade+du x mana = max bônus cad', cost: '' },
    { id: 'a7', name: 'Nexo Mágico do Pilar', description: 'Toda magia segue o ritmo do pilar', mechanic: 'batuque+empatia, dif=complex mágica, 3 sc=soma limite mágic 3 +1 por ritual', cost: '' }
  ],
  traits: [
    { id: 't1', name: 'Fisicamente Impressionante', type: 'advantage', description: '', value: 1 },
    { id: 't2', name: 'Membro de Organização', type: 'advantage', description: '', value: 1 },
    { id: 't3', name: 'Grandiosidade', type: 'advantage', description: '', value: 4 },
    { id: 't4', name: 'Constituição de Ferro', type: 'advantage', description: '', value: 1 },
    { id: 't5', name: 'Contatos', type: 'advantage', description: '', value: 1 },
    { id: 't6', name: 'Domínio', type: 'advantage', description: '', value: 1 },
    { id: 't7', name: 'Constelação Reencarnada', type: 'advantage', description: '', value: 1 },
    { id: 't8', name: 'Eunuco + Mercenário', type: 'disadvantage', description: '', value: 2 },
    { id: 't9', name: 'Cicatriz de Batalha (Coxa)', type: 'disadvantage', description: '', value: 1 },
    { id: 't10', name: 'Magia Grandiosa', type: 'disadvantage', description: '', value: 1 },
    { id: 't11', name: 'Honesto', type: 'disadvantage', description: '', value: 1 },
    { id: 't12', name: 'Curioso', type: 'disadvantage', description: '', value: 1 },
    { id: 't13', name: 'Segredo (Salvei os Gêmeos)', type: 'disadvantage', description: '', value: 1 },
    { id: 't14', name: 'Coração Mole (Crianças)', type: 'disadvantage', description: '', value: 1 },
    { id: 't15', name: 'Maldição: Megalomania', type: 'disadvantage', description: '', value: 1 }
  ],
  health: {
    head: Array(8).fill('none'),
    torso: Array(20).fill('none'),
    leftArm: Array(12).fill('none'),
    rightArm: Array(12).fill('none'),
    leftLeg: Array(16).fill('none'),
    rightLeg: Array(16).fill('none'),
  },
};
