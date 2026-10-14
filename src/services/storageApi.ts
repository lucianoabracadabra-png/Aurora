import { CharacterData } from '../types';
import { initialCharacterData, createEmptyCharacterData } from '../initialState';

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

const LOCAL_STORAGE_PREFIX = 'arcana_char_data_';
const LOCAL_CHAR_LIST_KEY = 'arcana_local_characters_list';
const LOCAL_CHAR_PASSWORDS_KEY = 'arcana_char_passwords';

function getLocalCharList(): CharacterSummary[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAR_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalCharList(list: CharacterSummary[]) {
  try {
    localStorage.setItem(LOCAL_CHAR_LIST_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_CHAR_PASSWORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { elias: '123', valerius: '123', kaelen: '123' };
}

function saveLocalPassword(username: string, pass: string) {
  try {
    const p = getLocalPasswords();
    p[username.toLowerCase().trim()] = pass;
    localStorage.setItem(LOCAL_CHAR_PASSWORDS_KEY, JSON.stringify(p));
  } catch {}
}

export const StorageApi = {
  async getStatus(): Promise<{ status: string; storageType: string; dataDir: string }> {
    try {
      const res = await fetch('/api/status');
      if (res.ok) return await res.json();
    } catch {}
    return { status: 'online', storageType: 'file-system', dataDir: '/data' };
  },

  async login(username: string, password: string, isGm = false) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // 1. Try server login first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password, isGm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return data;
      }
      if (res.status === 401 || res.status === 404) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Senha') || err.message.includes('Ficha') || err.message.includes('não foi encontrada') || err.message.includes('Credenciais') || err.message.includes('incorreta'))) {
        throw err;
      }
      console.warn('[StorageApi] Server login unavailable or error, checking local cache:', err.message);
    }

    // 2. Fallback to LocalStorage / Offline credentials
    if (isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      if (password === 'saidaquiburro') {
        return {
          success: true,
          role: 'gamemaster',
          user: {
            username: 'gamemaster',
            name: 'Game Master',
          },
          gmData: {
            role: 'gamemaster',
            name: 'Game Master',
            connectedCharacters: getLocalCharList().map(c => c.username),
            campaignNotes: '',
            updatedAt: new Date().toISOString()
          }
        };
      } else {
        throw new Error('Senha do Game Master incorreta. Acesso negado.');
      }
    }

    // Player local fallback
    const list = getLocalCharList();
    const found = list.find(c => c.username === cleanUser);
    if (!found) {
      throw new Error(`Ficha "${cleanUser}" não foi encontrada. Crie uma nova ficha na aba "Nova Ficha".`);
    }

    const passwords = getLocalPasswords();
    const expected = passwords[cleanUser] || '123';
    if (password !== expected) {
      throw new Error('Senha incorreta para esta ficha.');
    }

    let charData: CharacterData = cleanUser === 'elias' ? initialCharacterData : createEmptyCharacterData(found.name || cleanUser, found.color);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFIX + cleanUser);
      if (stored) {
        charData = JSON.parse(stored);
      }
    } catch {}

    return {
      success: true,
      role: 'player',
      user: {
        username: cleanUser,
        name: found.name || cleanUser,
        color: found.color || '#a855f7'
      },
      character: charData,
      color: found.color || '#a855f7'
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
    const finalPassword = params.password || '123';

    // New characters are completely blank sheets
    const baseData: CharacterData = params.characterData || createEmptyCharacterData(charName, color);

    // Always persist to local cache first so it's guaranteed to exist
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + cleanUser, JSON.stringify(baseData));
      const currentList = getLocalCharList();
      const existingIdx = currentList.findIndex(c => c.username === cleanUser);
      const summaryItem: CharacterSummary = {
        id: `char-${cleanUser}`,
        username: cleanUser,
        name: charName,
        color,
        origin: params.role || 'Aventureiro',
        updatedAt: new Date().toISOString()
      };
      if (existingIdx >= 0) {
        currentList[existingIdx] = summaryItem;
      } else {
        currentList.push(summaryItem);
      }
      saveLocalCharList(currentList);
      saveLocalPassword(cleanUser, finalPassword);
    } catch (e) {
      console.warn('[StorageApi] LocalStorage save warning:', e);
    }

    // Try server sync (supports both /api/auth/register and /api/characters)
    try {
      let res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          username: cleanUser,
          name: charName,
          password: finalPassword,
          color,
        }),
      });

      if (!res.ok && res.status === 404) {
        // Fallback endpoint if route is different
        res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            username: cleanUser,
            name: charName,
            password: finalPassword,
            color,
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch (err: any) {
      console.info('[StorageApi] Servidor de disco indisponível ou 404 (ambiente estático/Vercel); ficha criada com persistência local (cache):', err.message);
    }

    // Return successfully initialized character data from local persistence
    return {
      success: true,
      role: 'player',
      user: {
        username: cleanUser,
        name: charName,
        color,
      },
      character: baseData,
      color,
    };
  },

  async getCharactersList(): Promise<CharacterSummary[]> {
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.characters)) {
          saveLocalCharList(data.characters);
          return data.characters;
        }
      }
    } catch (e) {
      console.warn('[StorageApi] Failed to fetch server character list, using local cache:', e);
    }

    return getLocalCharList();
  },

  async getCharacter(username: string): Promise<{ username: string; name: string; color: string; character: CharacterData }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(cleanUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.character) return data;
      }
    } catch (e) {
      console.warn('[StorageApi] Server fetch for character failed, falling back to cache:', e);
    }

    // Local fallback
    const list = getLocalCharList();
    const found = list.find(c => c.username === cleanUser);
    let charData: CharacterData = cleanUser === 'elias' ? initialCharacterData : createEmptyCharacterData(found?.name || cleanUser, found?.color);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFIX + cleanUser);
      if (stored) {
        charData = JSON.parse(stored);
      }
    } catch {}

    return {
      username: cleanUser,
      name: found?.name || cleanUser,
      color: found?.color || '#a855f7',
      character: charData,
    };
  },

  async saveCharacter(username: string, character: CharacterData, color?: string, name?: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // 1. Always save immediately to LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + cleanUser, JSON.stringify(character));
      const list = getLocalCharList();
      const existing = list.find(c => c.username === cleanUser);
      if (existing) {
        existing.name = name || character.identity?.name || existing.name;
        if (color) existing.color = color;
        existing.updatedAt = new Date().toISOString();
        saveLocalCharList(list);
      }
    } catch (e) {
      console.warn('[StorageApi] LocalStorage save warning:', e);
    }

    // 2. Try server save
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(cleanUser)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, color, name }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      // Server not reachable (e.g. static host/Vercel)
      console.info('[StorageApi] File-system server offline or 404, saved to local cache.');
    }

    return { success: true, localOnly: true, updatedAt: new Date().toISOString() };
  },

  async deleteCharacterByGm(username: string, gmPassword: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // Delete locally
    try {
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + cleanUser);
      const list = getLocalCharList().filter(c => c.username !== cleanUser);
      saveLocalCharList(list);
    } catch {}

    // Try server delete
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(cleanUser)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('[StorageApi] Server delete error, removed locally:', e);
    }

    return { success: true, message: `Ficha "${cleanUser}" removida.` };
  },

  async getGmData(): Promise<GmData> {
    try {
      const res = await fetch('/api/gm');
      if (res.ok) {
        const data = await res.json();
        return data.gmData;
      }
    } catch {}

    return {
      role: 'gamemaster',
      name: 'Game Master',
      connectedCharacters: getLocalCharList().map(c => c.username),
      campaignNotes: '',
      updatedAt: new Date().toISOString(),
    };
  },

  async updateGmData(update: Partial<GmData>) {
    try {
      const res = await fetch('/api/gm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {}

    return { success: true, gmData: update };
  },

  async verifyGmPassword(password: string): Promise<boolean> {
    if (password === 'saidaquiburro') return true;
    try {
      const res = await fetch('/api/gm/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch {}
    return false;
  }
};
