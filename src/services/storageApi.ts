import { CharacterData } from '../types';
import { initialCharacterData, createEmptyCharacterData } from '../initialState';
import { realtimeSync } from './realtimeSync';
import initialPantryJson from '../initialPantryData.json';

export interface CharacterSummary {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  color: string;
  origin?: string;
  updatedAt?: string;
}

export interface GmData {
  role: 'gamemaster';
  name: string;
  connectedCharacters: string[];
  campaignNotes: string;
  updatedAt?: string;
}

export interface AuthSession {
  role: 'gamemaster' | 'player' | 'guest';
  username: string;
  name: string;
  color?: string;
}

const PANTRY_ID = '872bd76e-a6c0-46a0-b338-a474ed699114';
const PANTRY_BASKET = 'arcana';

export const PantryApi = {
  async getBasket(): Promise<any> {
    try {
      const res = await fetch('/api/pantry');
      if (res.ok) {
        const data = await res.json();
        if (data && data.characters) {
          return data;
        }
      }
    } catch (e) {
      console.warn('[PantryApi] Error fetching basket via proxy:', e);
    }
    return null;
  },

  async saveBasket(data: any): Promise<boolean> {
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.warn('[PantryApi] Error saving basket via proxy:', e);
      return false;
    }
  }
};

// Internal cache / helper to get or initialize pantry data
let cachedPantryData: any = null;

async function fetchMasterData(forceRefresh = false): Promise<any> {
  if (!forceRefresh && cachedPantryData && cachedPantryData.characters && Object.keys(cachedPantryData.characters).length > 0) {
    return cachedPantryData;
  }
  try {
    const remote = await PantryApi.getBasket();
    if (remote && remote.characters && Object.keys(remote.characters).length > 0) {
      cachedPantryData = remote;
      try {
        localStorage.setItem('arcana_pantry_cached_master', JSON.stringify(remote));
      } catch {}
      return remote;
    }
  } catch (e) {
    console.warn('[StorageApi] Error fetching pantry basket:', e);
  }

  if (cachedPantryData && cachedPantryData.characters && Object.keys(cachedPantryData.characters).length > 0) {
    return cachedPantryData;
  }

  // Try local storage cache
  try {
    const local = localStorage.getItem('arcana_pantry_cached_master');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.characters && Object.keys(parsed.characters).length > 0) {
        cachedPantryData = parsed;
        return parsed;
      }
    }
  } catch {}

  // Last resort: initial seed
  cachedPantryData = initialPantryJson;
  return initialPantryJson;
}

async function persistMasterData(data: any): Promise<void> {
  cachedPantryData = data;
  try {
    localStorage.setItem('arcana_pantry_cached_master', JSON.stringify(data));
  } catch {}
  await PantryApi.saveBasket(data);
}

export const StorageApi = {
  async getStatus(): Promise<{ status: string; storageType: string; dataDir: string }> {
    return { status: 'online', storageType: 'pantry-cloud', dataDir: PANTRY_ID };
  },

  async login(username: string, password: string, isGm = false) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const data = await fetchMasterData();

    if (isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      const gm = data.gamemaster || { password: 'saidaquiburro', name: 'Game Master', connectedCharacters: [] };
      if (password === gm.password || password === 'saidaquiburro') {
        const charList = Object.values(data.characters || {}).map((c: any) => c.username);
        return {
          success: true,
          role: 'gamemaster',
          user: {
            username: 'gamemaster',
            name: gm.name || 'Game Master',
          },
          gmData: {
            role: 'gamemaster',
            name: gm.name || 'Game Master',
            connectedCharacters: gm.connectedCharacters || charList,
            campaignNotes: gm.campaignNotes || '',
            updatedAt: gm.updatedAt || new Date().toISOString()
          }
        };
      } else {
        throw new Error('Senha do Game Master incorreta. Acesso negado.');
      }
    }

    const characters = data.characters || {};
    const charRecord = characters[cleanUser];
    if (!charRecord) {
      throw new Error(`Ficha "${cleanUser}" não foi encontrada no Pantry.`);
    }

    const expectedPass = charRecord.password || '123123123';
    if (password !== expectedPass) {
      throw new Error('Senha incorreta para esta ficha.');
    }

    return {
      success: true,
      role: 'player',
      user: {
        username: cleanUser,
        name: charRecord.name || cleanUser,
        color: charRecord.color || '#a855f7'
      },
      character: charRecord.character,
      color: charRecord.color || '#a855f7'
    };
  },

  async loginGm(password: string) {
    return this.login('gamemaster', password, true);
  },

  async register(params: {
    username: string;
    password: string;
    name?: string;
    role?: string;
    color?: string;
    characterData?: CharacterData;
  }) {
    const cleanUser = params.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const charName = params.name && params.name.trim() ? params.name.trim() : cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1);
    const color = params.color || '#a855f7';
    const finalPassword = params.password || '123123123';
    const baseData = params.characterData || createEmptyCharacterData(charName, color);

    const data = await fetchMasterData();
    if (!data.characters) data.characters = {};

    if (data.characters[cleanUser]) {
      throw new Error(`Já existe uma ficha para o usuário "${cleanUser}".`);
    }

    data.characters[cleanUser] = {
      username: cleanUser,
      password: finalPassword,
      name: charName,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      character: baseData
    };

    if (data.gamemaster && data.gamemaster.connectedCharacters) {
      if (!data.gamemaster.connectedCharacters.includes(cleanUser)) {
        data.gamemaster.connectedCharacters.push(cleanUser);
      }
    }

    await persistMasterData(data);

    return {
      success: true,
      role: 'player',
      user: {
        username: cleanUser,
        name: charName,
        color
      },
      character: baseData,
      color
    };
  },

  async getCharactersList(force = true): Promise<CharacterSummary[]> {
    const data = await fetchMasterData(force);
    const characters = data.characters || {};
    return Object.values(characters).map((c: any) => ({
      id: `char-${c.username}`,
      username: c.username,
      name: c.name || c.character?.identity?.name || c.username,
      color: c.color || '#a855f7',
      origin: c.character?.identity?.origin || 'Aventureiro',
      updatedAt: c.updatedAt || new Date().toISOString()
    }));
  },

  async getCharacter(username: string, force = false): Promise<{ username: string; name: string; color: string; character: CharacterData }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const data = await fetchMasterData(force);
    const characters = data.characters || {};
    const charRecord = characters[cleanUser];

    if (charRecord) {
      const charName = charRecord.name || charRecord.character?.identity?.name || cleanUser;
      if (charRecord.character && charRecord.character.identity) {
        charRecord.character.identity.name = charName;
      }
      return {
        username: cleanUser,
        name: charName,
        color: charRecord.color || '#a855f7',
        character: charRecord.character || createEmptyCharacterData(cleanUser)
      };
    }

    throw new Error(`Ficha "${cleanUser}" não encontrada.`);
  },

  async saveCharacter(username: string, character: CharacterData, color?: string, name?: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const data = await fetchMasterData(false);
    if (!data.characters) data.characters = {};

    const charName = name || character.identity?.name || cleanUser;
    if (character.identity) {
      character.identity.name = charName;
    }

    if (!data.characters[cleanUser]) {
      data.characters[cleanUser] = {
        username: cleanUser,
        password: '123123123',
        name: charName,
        color: color || '#a855f7',
        createdAt: new Date().toISOString()
      };
    }

    data.characters[cleanUser].character = character;
    data.characters[cleanUser].name = charName;
    if (color) data.characters[cleanUser].color = color;
    data.characters[cleanUser].updatedAt = new Date().toISOString();

    await persistMasterData(data);

    try {
      realtimeSync.broadcastSheet({
        username: cleanUser,
        name: name || character.identity?.name || cleanUser,
        color: color || '#a855f7',
        character,
        updatedAt: new Date().toISOString()
      });
    } catch {}

    return { success: true, updatedAt: new Date().toISOString() };
  },

  async deleteCharacterByGm(username: string, gmPassword: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const data = await fetchMasterData();

    if (data.gamemaster && data.gamemaster.password && data.gamemaster.password !== gmPassword && gmPassword !== 'saidaquiburro') {
      throw new Error('Senha do Game Master incorreta.');
    }

    if (data.characters && data.characters[cleanUser]) {
      delete data.characters[cleanUser];
    }

    if (data.gamemaster && data.gamemaster.connectedCharacters) {
      data.gamemaster.connectedCharacters = data.gamemaster.connectedCharacters.filter((u: string) => u !== cleanUser);
    }

    await persistMasterData(data);

    try {
      realtimeSync.broadcastDeleteSheet(cleanUser);
    } catch {}

    return { success: true, message: `Ficha "${cleanUser}" removida.` };
  },

  async getGmData(): Promise<GmData> {
    const data = await fetchMasterData();
    const gm = data.gamemaster || {};
    const charList = Object.keys(data.characters || {});
    return {
      role: 'gamemaster',
      name: gm.name || 'Game Master',
      connectedCharacters: gm.connectedCharacters || charList,
      campaignNotes: gm.campaignNotes || '',
      updatedAt: gm.updatedAt || new Date().toISOString()
    };
  },

  async updateGmData(update: Partial<GmData>) {
    const data = await fetchMasterData();
    if (!data.gamemaster) data.gamemaster = {};
    data.gamemaster = { ...data.gamemaster, ...update, updatedAt: new Date().toISOString() };
    await persistMasterData(data);
    return { success: true, gmData: data.gamemaster };
  },

  async verifyGmPassword(password: string): Promise<boolean> {
    if (password === 'saidaquiburro') return true;
    const data = await fetchMasterData();
    const gm = data.gamemaster || {};
    return password === gm.password;
  },

  async changePassword(params: {
    username: string;
    currentPassword?: string;
    newPassword: string;
    isGm?: boolean;
    gmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    const cleanUser = params.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const data = await fetchMasterData();

    if (params.isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      const gm = data.gamemaster || { password: 'saidaquiburro' };
      if (params.currentPassword !== gm.password && params.currentPassword !== 'saidaquiburro') {
        throw new Error('Senha atual do Game Master incorreta.');
      }
      gm.password = params.newPassword.trim();
      gm.updatedAt = new Date().toISOString();
      data.gamemaster = gm;
      await persistMasterData(data);
      return { success: true, message: 'Senha do Game Master atualizada com sucesso.' };
    }

    const charRecord = data.characters?.[cleanUser];
    if (!charRecord) {
      throw new Error(`Ficha "${cleanUser}" não encontrada.`);
    }

    let authorized = false;
    if (params.gmPassword) {
      const gm = data.gamemaster || { password: 'saidaquiburro' };
      if (params.gmPassword === gm.password || params.gmPassword === 'saidaquiburro') {
        authorized = true;
      }
    }
    if (!authorized && params.currentPassword && charRecord.password === params.currentPassword) {
      authorized = true;
    }

    if (!authorized) {
      throw new Error('Senha atual incorreta. Acesso negado.');
    }

    charRecord.password = params.newPassword.trim();
    charRecord.updatedAt = new Date().toISOString();
    await persistMasterData(data);

    return { success: true, message: `Senha da ficha "${charRecord.name || cleanUser}" atualizada com sucesso.` };
  },

  async getBattleState(): Promise<any> {
    const data = await fetchMasterData();
    return data.battle || null;
  },

  async saveBattleState(battleState: any): Promise<boolean> {
    const data = await fetchMasterData();
    data.battle = { ...battleState, updatedAt: new Date().toISOString() };
    await persistMasterData(data);

    try {
      realtimeSync.broadcastBattle(battleState);
    } catch {}

    return true;
  }
};
