import { CharacterData } from '../types';

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

export const StorageApi = {
  async getStatus(): Promise<{ status: string; storageType: string; dataDir: string }> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Falha ao conectar com o servidor File-System');
    return res.json();
  },

  async login(username: string, password: string, isGm = false) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, isGm }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao autenticar.');
    }
    return data;
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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao criar arquivo da ficha.');
    }
    return data;
  },

  async getCharactersList(): Promise<CharacterSummary[]> {
    const res = await fetch('/api/characters');
    if (!res.ok) throw new Error('Falha ao listar fichas do disco.');
    const data = await res.json();
    return data.characters || [];
  },

  async getCharacter(username: string): Promise<{ username: string; name: string; color: string; character: CharacterData }> {
    const res = await fetch(`/api/characters/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`Ficha ${username}.json não encontrada.`);
    const data = await res.json();
    return data;
  },

  async saveCharacter(username: string, character: CharacterData, color?: string, name?: string) {
    const res = await fetch(`/api/characters/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, color, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Erro ao salvar ${username}.json no disco.`);
    }
    return data;
  },

  async deleteCharacterByGm(username: string, gmPassword: string) {
    const res = await fetch(`/api/characters/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao apagar ficha. Verifique a senha do Game Master.');
    }
    return data;
  },

  async getGmData(): Promise<GmData> {
    const res = await fetch('/api/gm');
    if (!res.ok) throw new Error('Falha ao carregar dados do Game Master.');
    const data = await res.json();
    return data.gmData;
  },

  async updateGmData(update: Partial<GmData>) {
    const res = await fetch('/api/gm', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erro ao atualizar dados do Game Master.');
    }
    return data;
  },

  async verifyGmPassword(password: string): Promise<boolean> {
    const res = await fetch('/api/gm/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return !!data.success;
  }
};
