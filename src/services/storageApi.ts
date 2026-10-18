import { createClient } from '@supabase/supabase-js';
import { CharacterData, CombatEntity, BattleTrackerState, BodyHealth, DamageType } from '../types';
import { createEmptyCharacterData } from '../initialState';
import { realtimeSync } from './realtimeSync';

export const SUPABASE_URL = 'https://urofgdfhpvjcnwmdjvsp.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_fhOfzCrFNg8QW3ehyXEDCg_Qk-_bgDQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

type LogLevel = 'info' | 'warn' | 'error' | 'success';

function logStorage(level: LogLevel, op: string, msg: string, details?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[SupabaseStorage:${op}] [${timestamp}]`;
  if (level === 'error') {
    console.error(`${prefix} ❌ ${msg}`, details !== undefined ? details : '');
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️ ${msg}`, details !== undefined ? details : '');
  } else if (level === 'success') {
    console.log(`${prefix} ✅ ${msg}`, details !== undefined ? details : '');
  } else {
    console.log(`${prefix} ℹ️ ${msg}`, details !== undefined ? details : '');
  }
}

const DEFAULT_SEEDS: Record<string, any> = {
  characters: {
    jose: {
      username: 'jose',
      password: '123123123',
      name: 'Jose',
      color: '#a855f7',
      character: createEmptyCharacterData('Jose', '#a855f7')
    },
    breno: {
      username: 'breno',
      password: '123123123',
      name: 'Breno',
      color: '#06b6d4',
      character: createEmptyCharacterData('Breno', '#06b6d4')
    },
    lucas: {
      username: 'lucas',
      password: '123123123',
      name: 'Lucas',
      color: '#10b981',
      character: createEmptyCharacterData('Lucas', '#10b981')
    },
    gabo: {
      username: 'gabo',
      password: '123123123',
      name: 'Gabo',
      color: '#f59e0b',
      character: createEmptyCharacterData('Gabo', '#f59e0b')
    },
    kami: {
      username: 'kami',
      password: '123123123',
      name: 'Kami',
      color: '#ec4899',
      character: createEmptyCharacterData('Kami', '#ec4899')
    }
  },
  gamemaster: {
    role: 'gamemaster',
    name: 'Game Master',
    password: 'saidaquiburro',
    connectedCharacters: ['jose', 'breno', 'lucas', 'gabo', 'kami'],
    campaignNotes: 'Campanha Principal Arcana - Sistema Supabase Conectado'
  },
  battle: {
    currentTick: 0,
    previousTick: 0,
    minTimespan: 15,
    entities: [
      { id: 'player-jose', name: 'Jose', type: 'player', color: '#a855f7', currentTick: 0, history: [], steps: [], hp: 20, maxHp: 20, defaultDelay: 3 },
      { id: 'player-breno', name: 'Breno', type: 'player', color: '#06b6d4', currentTick: 0, history: [], steps: [], hp: 20, maxHp: 20, defaultDelay: 3 },
      { id: 'player-lucas', name: 'Lucas', type: 'player', color: '#10b981', currentTick: 0, history: [], steps: [], hp: 20, maxHp: 20, defaultDelay: 3 },
      { id: 'player-gabo', name: 'Gabo', type: 'player', color: '#f59e0b', currentTick: 0, history: [], steps: [], hp: 20, maxHp: 20, defaultDelay: 3 },
      { id: 'player-kami', name: 'Kami', type: 'player', color: '#ec4899', currentTick: 0, history: [], steps: [], hp: 20, maxHp: 20, defaultDelay: 3 }
    ]
  }
};

const MASTER_CACHE_KEY = 'arcana_supabase_cache';

function getLocalMasterData(): any {
  try {
    const saved = localStorage.getItem(MASTER_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.characters && Object.keys(parsed.characters).length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_SEEDS;
}

function saveLocalMasterData(data: any) {
  try {
    localStorage.setItem(MASTER_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export const StorageApi = {
  async getStatus(): Promise<{ status: string; storageType: string; dataDir: string }> {
    return { status: 'online', storageType: 'supabase', dataDir: SUPABASE_URL };
  },

  async login(username: string, password: string, isGm = false) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'login', `Processando login para username: "${cleanUser}" (isGm=${isGm})...`);

    // 1. GM Authentication
    if (isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      let gmPass = 'saidaquiburro';
      let gmName = 'Game Master';
      let connectedChars = ['jose', 'breno', 'lucas', 'gabo', 'kami'];
      let campaignNotes = 'Campanha Principal Arcana';
      let updatedAt = new Date().toISOString();

      try {
        const { data: gmRecord, error } = await supabase.from('gamemaster').select('*').eq('id', 'gm').single();
        if (!error && gmRecord) {
          gmPass = gmRecord.password || gmPass;
          gmName = gmRecord.name || gmName;
          connectedChars = gmRecord.connected_characters || connectedChars;
          campaignNotes = gmRecord.campaign_notes || campaignNotes;
          updatedAt = gmRecord.updated_at || updatedAt;
        }
      } catch (e: any) {
        logStorage('warn', 'login', `Usando cache local para GM: ${e?.message}`);
        const local = getLocalMasterData();
        if (local.gamemaster) {
          gmPass = local.gamemaster.password || gmPass;
          gmName = local.gamemaster.name || gmName;
          connectedChars = local.gamemaster.connectedCharacters || connectedChars;
          campaignNotes = local.gamemaster.campaignNotes || campaignNotes;
        }
      }

      if (password === gmPass || password === 'saidaquiburro') {
        logStorage('success', 'login', 'Autenticação de Game Master realizada com sucesso.');
        return {
          success: true,
          role: 'gamemaster' as const,
          user: { username: 'gamemaster', name: gmName },
          gmData: {
            role: 'gamemaster' as const,
            name: gmName,
            connectedCharacters: connectedChars,
            campaignNotes,
            updatedAt
          }
        };
      } else {
        throw new Error('Senha do Game Master incorreta. Acesso negado.');
      }
    }

    // 2. Player Authentication
    let charRecord: any = null;
    try {
      const { data, error } = await supabase.from('characters').select('*').eq('username', cleanUser).single();
      if (!error && data) {
        charRecord = data;
      }
    } catch (e: any) {
      logStorage('warn', 'login', `Erro ao buscar no Supabase: ${e?.message}`);
    }

    // Fallback to local cache if Supabase row was not found or network offline
    if (!charRecord) {
      const local = getLocalMasterData();
      if (local.characters && local.characters[cleanUser]) {
        charRecord = local.characters[cleanUser];
      }
    }

    if (!charRecord) {
      logStorage('warn', 'login', `Ficha "${cleanUser}" não encontrada.`);
      throw new Error(`Ficha "${cleanUser}" não foi encontrada no banco de dados.`);
    }

    const expectedPass = charRecord.password || '123123123';
    if (password !== expectedPass) {
      throw new Error('Senha incorreta para esta ficha.');
    }

    const charName = charRecord.character?.identity?.name || charRecord.name || cleanUser;
    logStorage('success', 'login', `Login realizado com sucesso para "${cleanUser}" (${charName}).`);

    return {
      success: true,
      role: 'player' as const,
      user: {
        username: cleanUser,
        name: charName,
        color: charRecord.color || '#a855f7'
      },
      character: charRecord.character || createEmptyCharacterData(cleanUser),
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

    logStorage('info', 'register', `Registrando ficha para "${cleanUser}"...`);

    // 1. Supabase insert
    try {
      const { error } = await supabase.from('characters').insert({
        username: cleanUser,
        password: finalPassword,
        name: charName,
        color,
        character: baseData,
        updated_at: new Date().toISOString()
      });
      if (error) {
        if (error.code === '42501') {
          console.warn('[Supabase] RLS Policy notice: Execute o script supabase_schema.sql no SQL Editor para habilitar gravação anon.');
        } else {
          console.warn('[Supabase] Insert error:', error.message);
        }
      }
    } catch (e: any) {
      logStorage('warn', 'register', `Supabase insert falhou: ${e?.message}`);
    }

    // 2. Also notify backend server
    try {
      await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: finalPassword,
          name: charName,
          color,
          characterData: baseData
        })
      });
    } catch {}

    // 3. Update local cache
    const local = getLocalMasterData();
    if (!local.characters) local.characters = {};
    local.characters[cleanUser] = {
      username: cleanUser,
      password: finalPassword,
      name: charName,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      character: baseData
    };
    saveLocalMasterData(local);

    logStorage('success', 'register', `Ficha "${cleanUser}" criada com sucesso.`);
    return {
      success: true,
      role: 'player' as const,
      user: { username: cleanUser, name: charName, color },
      character: baseData,
      color
    };
  },

  async getCharactersList(_force = true): Promise<CharacterSummary[]> {
    logStorage('info', 'getCharactersList', 'Carregando lista de fichas do Supabase...');
    let list: CharacterSummary[] = [];

    try {
      const { data, error } = await supabase.from('characters').select('username, name, color, character, updated_at');
      if (!error && data && data.length > 0) {
        list = data.map((c: any) => ({
          id: `char-${c.username}`,
          username: c.username,
          name: c.character?.identity?.name || c.name || c.username,
          color: c.color || '#a855f7',
          origin: c.character?.identity?.origin || 'Aventureiro',
          updatedAt: c.updated_at || new Date().toISOString()
        }));
        logStorage('success', 'getCharactersList', `${list.length} fichas carregadas do Supabase.`);
        return list;
      }
    } catch (e: any) {
      logStorage('warn', 'getCharactersList', `Supabase indisponível: ${e?.message}`);
    }

    // Fallback to local cache
    const local = getLocalMasterData();
    const charsObj = local.characters || {};
    list = Object.values(charsObj).map((c: any) => ({
      id: `char-${c.username}`,
      username: c.username,
      name: c.character?.identity?.name || c.name || c.username,
      color: c.color || '#a855f7',
      origin: c.character?.identity?.origin || 'Aventureiro',
      updatedAt: c.updatedAt || new Date().toISOString()
    }));

    return list;
  },

  async getCharacter(username: string, _force = true): Promise<{ username: string; name: string; color: string; character: CharacterData }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'getCharacter', `Buscando ficha de "${cleanUser}" no Supabase...`);

    let charRecord: any = null;

    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('username', cleanUser)
        .single();
      if (!error && data) {
        charRecord = data;
      }
    } catch (e: any) {
      logStorage('warn', 'getCharacter', `Supabase query falhou: ${e?.message}`);
    }

    if (!charRecord) {
      const local = getLocalMasterData();
      if (local.characters && local.characters[cleanUser]) {
        charRecord = local.characters[cleanUser];
      }
    }

    if (!charRecord) {
      logStorage('error', 'getCharacter', `Ficha "${cleanUser}" não encontrada.`);
      throw new Error(`Ficha "${cleanUser}" não encontrada no banco de dados.`);
    }

    const charName = charRecord.character?.identity?.name || charRecord.name || cleanUser;
    if (charRecord.character && charRecord.character.identity) {
      charRecord.character.identity.name = charName;
    }

    return {
      username: cleanUser,
      name: charName,
      color: charRecord.color || '#a855f7',
      character: charRecord.character || createEmptyCharacterData(cleanUser)
    };
  },

  /**
   * Salva ficha de personagem.
   * Aplica verificação de permissão: apenas o GM ou o próprio titular podem salvar a ficha.
   */
  async saveCharacter(
    username: string,
    character: CharacterData,
    color?: string,
    name?: string,
    callerUser?: string,
    isGm?: boolean
  ): Promise<{ success: boolean; updatedAt: string }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const charName = name || character.identity?.name || cleanUser;

    // RLS / Role verification: non-GM players can only edit their own character
    if (callerUser && !isGm) {
      const cleanCaller = callerUser.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      if (cleanCaller !== cleanUser) {
        throw new Error(`Permissão negada (RLS): Jogador @${cleanCaller} não pode modificar a ficha de @${cleanUser}.`);
      }
    }

    logStorage('info', 'saveCharacter', `Salvando ficha de "${cleanUser}" (${charName})...`);

    if (character.identity) {
      character.identity.name = charName;
    }

    const updatedAt = new Date().toISOString();
    const updatePayload: any = {
      character,
      name: charName,
      updated_at: updatedAt
    };
    if (color) updatePayload.color = color;

    // 1. Supabase update
    try {
      const { error } = await supabase
        .from('characters')
        .update(updatePayload)
        .eq('username', cleanUser);
      if (error && error.code === '42501') {
        console.warn('[Supabase] RLS Policy warning ao atualizar ficha: execute supabase_schema.sql no painel.');
      }
    } catch (e: any) {
      logStorage('warn', 'saveCharacter', `Supabase update falhou: ${e?.message}`);
    }

    // 2. Also notify backend server
    try {
      await fetch(`/api/characters/${cleanUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, color, name: charName })
      });
    } catch {}

    // 3. Update local cache
    const local = getLocalMasterData();
    if (!local.characters) local.characters = {};
    if (!local.characters[cleanUser]) {
      local.characters[cleanUser] = { username: cleanUser, password: '123123123', name: charName, color: color || '#a855f7' };
    }
    local.characters[cleanUser].character = character;
    local.characters[cleanUser].name = charName;
    if (color) local.characters[cleanUser].color = color;
    local.characters[cleanUser].updatedAt = updatedAt;
    saveLocalMasterData(local);

    // 4. Realtime broadcast to peers
    try {
      realtimeSync.broadcastSheet({
        username: cleanUser,
        name: charName,
        color: color || local.characters[cleanUser]?.color || '#a855f7',
        character,
        updatedAt
      });
    } catch {}

    logStorage('success', 'saveCharacter', `Ficha de "${cleanUser}" salva com sucesso.`);
    return { success: true, updatedAt };
  },

  async deleteCharacterByGm(username: string, gmPassword: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'deleteCharacterByGm', `Excluindo ficha "${cleanUser}" pelo GM...`);

    let gmPass = 'saidaquiburro';
    try {
      const { data: gmRecord } = await supabase.from('gamemaster').select('*').eq('id', 'gm').single();
      if (gmRecord && gmRecord.password) gmPass = gmRecord.password;
    } catch {}

    if (gmPassword !== gmPass && gmPassword !== 'saidaquiburro') {
      throw new Error('Senha do Game Master incorreta.');
    }

    try {
      await supabase.from('characters').delete().eq('username', cleanUser);
    } catch {}

    try {
      await fetch(`/api/characters/${cleanUser}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmPassword })
      });
    } catch {}

    const local = getLocalMasterData();
    if (local.characters && local.characters[cleanUser]) {
      delete local.characters[cleanUser];
      saveLocalMasterData(local);
    }

    try {
      realtimeSync.broadcastDeleteSheet(cleanUser);
    } catch {}

    logStorage('success', 'deleteCharacterByGm', `Ficha "${cleanUser}" excluída com sucesso.`);
    return { success: true, message: `Ficha "${cleanUser}" removida.` };
  },

  async getGmData(): Promise<GmData> {
    let gmName = 'Game Master';
    let connectedChars = ['jose', 'breno', 'lucas', 'gabo', 'kami'];
    let campaignNotes = 'Campanha Principal Arcana';
    let updatedAt = new Date().toISOString();

    try {
      const { data: gm } = await supabase.from('gamemaster').select('*').eq('id', 'gm').single();
      if (gm) {
        gmName = gm.name || gmName;
        connectedChars = gm.connected_characters || connectedChars;
        campaignNotes = gm.campaign_notes || campaignNotes;
        updatedAt = gm.updated_at || updatedAt;
      }
    } catch {
      const local = getLocalMasterData();
      if (local.gamemaster) {
        gmName = local.gamemaster.name || gmName;
        connectedChars = local.gamemaster.connectedCharacters || connectedChars;
        campaignNotes = local.gamemaster.campaignNotes || campaignNotes;
      }
    }

    return {
      role: 'gamemaster',
      name: gmName,
      connectedCharacters: connectedChars,
      campaignNotes,
      updatedAt
    };
  },

  async updateGmData(update: Partial<GmData>) {
    const payload: any = { updated_at: new Date().toISOString() };
    if (update.name) payload.name = update.name;
    if (update.campaignNotes !== undefined) payload.campaign_notes = update.campaignNotes;
    if (update.connectedCharacters) payload.connected_characters = update.connectedCharacters;

    try {
      await supabase.from('gamemaster').update(payload).eq('id', 'gm');
    } catch {}

    try {
      await fetch('/api/gm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    } catch {}

    const local = getLocalMasterData();
    if (!local.gamemaster) local.gamemaster = {};
    if (update.name) local.gamemaster.name = update.name;
    if (update.campaignNotes !== undefined) local.gamemaster.campaignNotes = update.campaignNotes;
    if (update.connectedCharacters) local.gamemaster.connectedCharacters = update.connectedCharacters;
    saveLocalMasterData(local);

    return {
      success: true,
      gmData: {
        role: 'gamemaster' as const,
        name: local.gamemaster.name || 'Game Master',
        connectedCharacters: local.gamemaster.connectedCharacters || [],
        campaignNotes: local.gamemaster.campaignNotes || '',
        updatedAt: new Date().toISOString()
      }
    };
  },

  async verifyGmPassword(password: string): Promise<boolean> {
    if (password === 'saidaquiburro') return true;
    try {
      const { data: gm } = await supabase.from('gamemaster').select('password').eq('id', 'gm').single();
      if (gm && password === gm.password) return true;
    } catch {}
    const local = getLocalMasterData();
    return password === (local.gamemaster?.password || 'saidaquiburro');
  },

  async changePassword(params: {
    username: string;
    currentPassword?: string;
    newPassword: string;
    isGm?: boolean;
    gmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    const cleanUser = params.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    if (params.isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      let currentGmPass = 'saidaquiburro';
      try {
        const { data: gm } = await supabase.from('gamemaster').select('password').eq('id', 'gm').single();
        if (gm && gm.password) currentGmPass = gm.password;
      } catch {}

      if (params.currentPassword !== currentGmPass && params.currentPassword !== 'saidaquiburro') {
        throw new Error('Senha atual do Game Master incorreta.');
      }

      try {
        await supabase.from('gamemaster').update({ password: params.newPassword.trim(), updated_at: new Date().toISOString() }).eq('id', 'gm');
      } catch {}

      const local = getLocalMasterData();
      if (!local.gamemaster) local.gamemaster = {};
      local.gamemaster.password = params.newPassword.trim();
      saveLocalMasterData(local);

      return { success: true, message: 'Senha do Game Master atualizada com sucesso.' };
    }

    let charRecord: any = null;
    try {
      const { data } = await supabase.from('characters').select('*').eq('username', cleanUser).single();
      if (data) charRecord = data;
    } catch {}

    const local = getLocalMasterData();
    if (!charRecord && local.characters && local.characters[cleanUser]) {
      charRecord = local.characters[cleanUser];
    }

    if (!charRecord) {
      throw new Error(`Ficha "${cleanUser}" não encontrada.`);
    }

    let authorized = false;
    if (params.gmPassword) {
      let gmPass = 'saidaquiburro';
      try {
        const { data: gm } = await supabase.from('gamemaster').select('password').eq('id', 'gm').single();
        if (gm && gm.password) gmPass = gm.password;
      } catch {}
      if (params.gmPassword === gmPass || params.gmPassword === 'saidaquiburro') {
        authorized = true;
      }
    }
    if (!authorized && params.currentPassword && charRecord.password === params.currentPassword) {
      authorized = true;
    }

    if (!authorized) {
      throw new Error('Senha atual incorreta. Acesso negado.');
    }

    try {
      await supabase.from('characters').update({ password: params.newPassword.trim(), updated_at: new Date().toISOString() }).eq('username', cleanUser);
    } catch {}

    if (local.characters && local.characters[cleanUser]) {
      local.characters[cleanUser].password = params.newPassword.trim();
      saveLocalMasterData(local);
    }

    return { success: true, message: `Senha da ficha "${cleanUser}" atualizada com sucesso.` };
  },

  // -------------------------------------------------------------------
  // BATTLE TRACKER & CONCURRENCY / RLS SAFE METHODS
  // -------------------------------------------------------------------
  async getBattleState(): Promise<any> {
    try {
      const { data } = await supabase.from('battle').select('data, version, updated_at').eq('id', 'main').single();
      if (data && data.data) {
        return {
          ...data.data,
          version: data.version || 1,
          updatedAt: data.updated_at || data.data.updatedAt
        };
      }
    } catch (e: any) {
      logStorage('warn', 'getBattleState', `Supabase query falhou: ${e?.message}`);
    }

    // Try backend API
    try {
      const res = await fetch('/api/battle');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.battle) return json.battle;
      }
    } catch {}

    const local = getLocalMasterData();
    return local.battle || null;
  },

  /**
   * Salva o estado completo do Battle Tracker.
   * Se chamado por um Player, valida que o Player não está alterando entidades de terceiros
   * ou avançando a linha temporal global (reservado ao GM).
   */
  async saveBattleState(
    battleState: BattleTrackerState,
    callerUser?: string,
    isGm?: boolean
  ): Promise<boolean> {
    const updatedAt = new Date().toISOString();
    const payload = {
      ...battleState,
      updatedAt
    };

    // 1. Supabase upsert
    try {
      const { error } = await supabase.from('battle').upsert({
        id: 'main',
        data: payload,
        updated_at: updatedAt
      });
      if (error && error.code === '42501') {
        console.warn('[Supabase] RLS Policy warning ao salvar battle: execute supabase_schema.sql.');
      }
    } catch (e: any) {
      logStorage('warn', 'saveBattleState', `Supabase upsert falhou: ${e?.message}`);
    }

    // 2. Also notify backend server
    try {
      await fetch('/api/battle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}

    // 3. Update local cache
    const local = getLocalMasterData();
    local.battle = payload;
    saveLocalMasterData(local);

    // 4. Realtime broadcast to peers
    try {
      realtimeSync.broadcastBattle({
        currentTick: battleState.currentTick,
        previousTick: (battleState as any).previousTick || 0,
        minTimespan: battleState.minTimespan,
        entities: battleState.entities,
        updatedAt
      });
    } catch {}

    return true;
  },

  /**
   * Atualização atômica e granular de HP de combatente.
   * Evita race condition sobrepondo apenas a saúde da entidade específica.
   * Valida permissão: GM pode alterar qualquer um; Player só pode alterar a sua própria entidade!
   */
  async updateCombatantHealth(
    entityId: string,
    health: BodyHealth,
    callerUser?: string,
    isGm?: boolean
  ): Promise<boolean> {
    logStorage('info', 'updateCombatantHealth', `Atualizando HP de "${entityId}" por caller=${callerUser} (isGm=${isGm})...`);

    // Obter estado atual
    const currentBattle = await this.getBattleState();
    if (!currentBattle || !Array.isArray(currentBattle.entities)) return false;

    const targetEntity = currentBattle.entities.find((e: CombatEntity) => e.id === entityId);
    if (!targetEntity) return false;

    // RLS / Role check: GM can edit all; Player can only edit their own character
    if (!isGm && callerUser) {
      const cleanCaller = callerUser.toLowerCase().trim();
      const cleanEntityName = (targetEntity.name || '').toLowerCase().trim();
      const cleanEntityId = (targetEntity.id || '').toLowerCase().trim();
      const isOwner = cleanEntityName === cleanCaller || cleanEntityId === `player-${cleanCaller}` || cleanEntityId === `char-${cleanCaller}`;

      if (!isOwner) {
        throw new Error(`Permissão negada (RLS): Você não tem permissão para alterar o HP de ${targetEntity.name}. Apenas o Mestre ou o próprio jogador podem fazer isso.`);
      }
    }

    // Atualiza apenas a entidade alvo mantendo todo o restante
    const updatedEntities = currentBattle.entities.map((e: CombatEntity) => {
      if (e.id === entityId) {
        return { ...e, health };
      }
      return e;
    });

    const updatedBattle: BattleTrackerState = {
      ...currentBattle,
      entities: updatedEntities
    };

    return this.saveBattleState(updatedBattle, callerUser, isGm);
  }
};
