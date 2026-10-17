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

// Structured logger for StorageApi and Pantry operations
type LogLevel = 'info' | 'warn' | 'error' | 'success';

function logStorage(level: LogLevel, op: string, msg: string, details?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[StorageApi:${op}] [${timestamp}]`;
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

// Exponential backoff retry utility
interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  operationName?: string;
}

async function retryWithBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 400,
    backoffFactor = 2,
    operationName = 'Operation'
  } = options;

  let attempt = 1;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation(attempt);
    } catch (err: any) {
      const isLastAttempt = attempt >= maxRetries;
      const errorDetails = {
        message: err?.message || String(err),
        status: err?.status,
        attempt,
        maxRetries,
        nextRetryInMs: isLastAttempt ? 0 : delay,
        stack: err?.stack
      };

      logStorage(
        'warn',
        operationName,
        `Tentativa ${attempt}/${maxRetries} falhou: ${err?.message || err}`,
        errorDetails
      );

      if (isLastAttempt) {
        logStorage(
          'error',
          operationName,
          `Falha definitiva após ${maxRetries} tentativas consecutivas.`,
          errorDetails
        );
        throw err;
      }

      // Add ±15% random jitter to avoid thundering herd
      const jitter = delay * 0.15 * (Math.random() * 2 - 1);
      const actualDelay = Math.max(150, Math.round(delay + jitter));

      logStorage(
        'info',
        operationName,
        `Aguardando ${actualDelay}ms antes de executar a tentativa ${attempt + 1}/${maxRetries}...`
      );

      await new Promise((res) => setTimeout(res, actualDelay));
      delay = Math.round(delay * backoffFactor);
      attempt++;
    }
  }
}

export const PantryApi = {
  async getBasket(force = false): Promise<any> {
    try {
      logStorage('info', 'PantryApi.getBasket', `Buscando basket do Pantry (forceRefresh=${force})...`);
      const res = await fetch('/api/pantry', {
        headers: force ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } : undefined,
        cache: force ? 'no-store' : 'default'
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.characters) {
          const charCount = Object.keys(data.characters).length;
          logStorage('success', 'PantryApi.getBasket', `Basket carregado com sucesso (${charCount} fichas encontradas).`);
          return data;
        } else {
          logStorage('warn', 'PantryApi.getBasket', 'Resposta HTTP 200 recebida, mas objeto não contém estrutura de "characters".', data);
        }
      } else {
        logStorage('error', 'PantryApi.getBasket', `Falha HTTP ${res.status} (${res.statusText}) ao consultar /api/pantry.`);
      }
    } catch (e: any) {
      logStorage('error', 'PantryApi.getBasket', `Erro de rede ao buscar Pantry via proxy: ${e?.message || e}`, {
        message: e?.message,
        stack: e?.stack
      });
    }
    return null;
  },

  async saveBasket(data: any): Promise<boolean> {
    const charCount = data?.characters ? Object.keys(data.characters).length : 0;
    logStorage('info', 'PantryApi.saveBasket', `Iniciando persistência de ${charCount} fichas com retry automático...`);

    try {
      return await retryWithBackoff(
        async (attempt) => {
          const res = await fetch('/api/pantry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            const err: any = new Error(`Falha HTTP ${res.status} ao salvar no Pantry (${res.statusText}): ${errorText.slice(0, 180)}`);
            err.status = res.status;
            throw err;
          }

          logStorage('success', 'PantryApi.saveBasket', `Basket salvo com sucesso no Pantry (Tentativa ${attempt}).`);
          return true;
        },
        {
          maxRetries: 3,
          initialDelayMs: 400,
          backoffFactor: 2,
          operationName: 'PantryApi.saveBasket'
        }
      );
    } catch (e: any) {
      logStorage('error', 'PantryApi.saveBasket', `Falha irrecuperável ao salvar basket no Pantry: ${e?.message}`, {
        error: e?.message,
        stack: e?.stack
      });
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
    const remote = await PantryApi.getBasket(forceRefresh);
    if (remote && remote.characters && Object.keys(remote.characters).length > 0) {
      cachedPantryData = remote;
      try {
        localStorage.setItem('arcana_pantry_cached_master', JSON.stringify(remote));
      } catch {}
      return remote;
    }
  } catch (e: any) {
    logStorage('warn', 'fetchMasterData', `Falha ao sincronizar remotamente, buscando alternativas de cache: ${e?.message}`);
  }

  if (cachedPantryData && cachedPantryData.characters && Object.keys(cachedPantryData.characters).length > 0) {
    logStorage('info', 'fetchMasterData', 'Utilizando dados existentes da memória local.');
    return cachedPantryData;
  }

  // Try local storage cache
  try {
    const local = localStorage.getItem('arcana_pantry_cached_master');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.characters && Object.keys(parsed.characters).length > 0) {
        cachedPantryData = parsed;
        logStorage('info', 'fetchMasterData', 'Utilizando snapshot persistido no localStorage.');
        return parsed;
      }
    }
  } catch {}

  // Last resort: initial seed
  logStorage('warn', 'fetchMasterData', 'Nenhum dado remoto ou local encontrado. Recorrendo ao seed inicial (initialPantryData.json).');
  cachedPantryData = initialPantryJson;
  return initialPantryJson;
}

async function persistMasterData(data: any): Promise<boolean> {
  cachedPantryData = data;
  try {
    localStorage.setItem('arcana_pantry_cached_master', JSON.stringify(data));
  } catch {}
  return await PantryApi.saveBasket(data);
}

export const StorageApi = {
  async getStatus(): Promise<{ status: string; storageType: string; dataDir: string }> {
    return { status: 'online', storageType: 'pantry-cloud', dataDir: PANTRY_ID };
  },

  async login(username: string, password: string, isGm = false) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'login', `Processando login para username: "${cleanUser}" (isGm=${isGm})...`);

    // Always force refresh to get latest state on login
    const data = await fetchMasterData(true);

    if (isGm || cleanUser === 'gm' || cleanUser === 'gamemaster' || cleanUser === 'mestre') {
      const gm = data.gamemaster || { password: 'saidaquiburro', name: 'Game Master', connectedCharacters: [] };
      if (password === gm.password || password === 'saidaquiburro') {
        const charList = Object.values(data.characters || {}).map((c: any) => c.username);
        logStorage('success', 'login', 'Autenticação de Game Master realizada com sucesso.');
        return {
          success: true,
          role: 'gamemaster' as const,
          user: {
            username: 'gamemaster',
            name: gm.name || 'Game Master',
          },
          gmData: {
            role: 'gamemaster' as const,
            name: gm.name || 'Game Master',
            connectedCharacters: gm.connectedCharacters || charList,
            campaignNotes: gm.campaignNotes || '',
            updatedAt: gm.updatedAt || new Date().toISOString()
          }
        };
      } else {
        logStorage('warn', 'login', 'Tentativa de login de Game Master recusada: senha incorreta.');
        throw new Error('Senha do Game Master incorreta. Acesso negado.');
      }
    }

    const characters = data.characters || {};
    const charRecord = characters[cleanUser];
    if (!charRecord) {
      logStorage('warn', 'login', `Ficha "${cleanUser}" não encontrada no Pantry. Fichas registradas: ${Object.keys(characters).join(', ')}`);
      throw new Error(`Ficha "${cleanUser}" não foi encontrada no Pantry.`);
    }

    const expectedPass = charRecord.password || '123123123';
    if (password !== expectedPass) {
      logStorage('warn', 'login', `Senha incorreta informada para o usuário "${cleanUser}".`);
      throw new Error('Senha incorreta para esta ficha.');
    }

    const charName = charRecord.character?.identity?.name || charRecord.name || cleanUser;
    logStorage('success', 'login', `Login realizado com sucesso para o usuário "${cleanUser}" (Personagem: "${charName}").`);

    return {
      success: true,
      role: 'player' as const,
      user: {
        username: cleanUser,
        name: charName,
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

    logStorage('info', 'register', `Registrando nova ficha para username "${cleanUser}" (Nome: "${charName}")...`);
    const data = await fetchMasterData(true);
    if (!data.characters) data.characters = {};

    if (data.characters[cleanUser]) {
      logStorage('warn', 'register', `Tentativa de registro duplicado para username "${cleanUser}".`);
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

    const saved = await persistMasterData(data);
    if (!saved) {
      logStorage('error', 'register', `Falha ao persistir nova ficha de "${cleanUser}" no Pantry.`);
      throw new Error(`Erro ao salvar nova ficha de "${cleanUser}" no servidor.`);
    }

    logStorage('success', 'register', `Ficha do usuário "${cleanUser}" cadastrada e salva com sucesso.`);
    return {
      success: true,
      role: 'player' as const,
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
    logStorage('info', 'getCharactersList', `Carregando lista de fichas (force=${force})...`);
    try {
      const data = await fetchMasterData(force);
      const characters = data.characters || {};
      const list = Object.values(characters).map((c: any) => ({
        id: `char-${c.username}`,
        username: c.username,
        name: c.character?.identity?.name || c.name || c.username,
        color: c.color || '#a855f7',
        origin: c.character?.identity?.origin || 'Aventureiro',
        updatedAt: c.updatedAt || new Date().toISOString()
      }));
      logStorage('success', 'getCharactersList', `${list.length} fichas retornadas do Pantry: ${list.map(l => l.username).join(', ')}`);
      return list;
    } catch (e: any) {
      logStorage('error', 'getCharactersList', `Erro ao listar fichas: ${e?.message || e}`, e);
      return [];
    }
  },

  async getCharacter(username: string, force = true): Promise<{ username: string; name: string; color: string; character: CharacterData }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'getCharacter', `Puxando ficha completa do username: "${cleanUser}" (force=${force})...`);

    const data = await fetchMasterData(force);
    const characters = data.characters || {};
    const charRecord = characters[cleanUser];

    if (charRecord) {
      const charName = charRecord.character?.identity?.name || charRecord.name || cleanUser;
      if (charRecord.character && charRecord.character.identity) {
        charRecord.character.identity.name = charName;
      }
      logStorage('success', 'getCharacter', `Ficha "${cleanUser}" recuperada com sucesso (Personagem: "${charName}").`);
      return {
        username: cleanUser,
        name: charName,
        color: charRecord.color || '#a855f7',
        character: charRecord.character || createEmptyCharacterData(cleanUser)
      };
    }

    logStorage('error', 'getCharacter', `Ficha "${cleanUser}" NÃO foi encontrada no Pantry. Registros disponíveis:`, Object.keys(characters));
    throw new Error(`Ficha "${cleanUser}" não encontrada no Pantry.`);
  },

  async saveCharacter(username: string, character: CharacterData, color?: string, name?: string): Promise<{ success: boolean; updatedAt: string }> {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const charName = name || character.identity?.name || cleanUser;
    logStorage('info', 'saveCharacter', `Iniciando salvamento da ficha de "${cleanUser}" (Nome: "${charName}")...`);

    // Ensure identity has the name
    if (character.identity) {
      character.identity.name = charName;
    }

    const data = await fetchMasterData(false);
    if (!data.characters) data.characters = {};

    if (!data.characters[cleanUser]) {
      logStorage('info', 'saveCharacter', `Criando novo registro no basket para "${cleanUser}"...`);
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
    const updatedAt = new Date().toISOString();
    data.characters[cleanUser].updatedAt = updatedAt;

    const saved = await persistMasterData(data);
    if (!saved) {
      logStorage('error', 'saveCharacter', `Falha ao persistir a ficha de "${cleanUser}" no Pantry após tentativas de retry.`);
      throw new Error(`Não foi possível salvar a ficha de "${cleanUser}" no Pantry.`);
    }

    try {
      realtimeSync.broadcastSheet({
        username: cleanUser,
        name: charName,
        color: color || data.characters[cleanUser].color || '#a855f7',
        character,
        updatedAt
      });
    } catch (e: any) {
      logStorage('warn', 'saveCharacter', `Erro no broadcast realtime da ficha: ${e?.message}`);
    }

    logStorage('success', 'saveCharacter', `Ficha de "${cleanUser}" salva e sincronizada com sucesso no Pantry.`);
    return { success: true, updatedAt };
  },

  async deleteCharacterByGm(username: string, gmPassword: string) {
    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    logStorage('info', 'deleteCharacterByGm', `Solicitação de exclusão da ficha "${cleanUser}" pelo GM...`);
    const data = await fetchMasterData(true);

    if (data.gamemaster && data.gamemaster.password && data.gamemaster.password !== gmPassword && gmPassword !== 'saidaquiburro') {
      logStorage('warn', 'deleteCharacterByGm', 'Tentativa de exclusão com senha inválida do Game Master.');
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

    logStorage('success', 'deleteCharacterByGm', `Ficha "${cleanUser}" excluída com sucesso.`);
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
    const data = await fetchMasterData(true);

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
