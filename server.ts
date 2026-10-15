import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { AURORA_TOOL_DEFINITIONS } from './src/utils/auroraTools';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const CHARACTERS_DIR = path.resolve(DATA_DIR, 'characters');
const GM_FILE = path.resolve(DATA_DIR, 'gamemaster.json');
const BATTLE_FILE = path.resolve(DATA_DIR, 'battle_tracker.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CHARACTERS_DIR)) {
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
}

// Seed default battle tracker file if missing
function ensureBattleFile() {
  if (!fs.existsSync(BATTLE_FILE)) {
    const defaultBattle = {
      currentTick: 0,
      previousTick: 0,
      minTimespan: 15,
      entities: [
        {
          id: 'player-jose',
          name: 'Jose',
          type: 'player',
          initiative: 5,
          currentTick: 0,
          color: '#a855f7',
          hp: 20,
          maxHp: 20,
          status: [],
          history: [],
          steps: []
        },
        {
          id: 'player-breno',
          name: 'Breno',
          type: 'player',
          initiative: 4,
          currentTick: 0,
          color: '#06b6d4',
          hp: 20,
          maxHp: 20,
          status: [],
          history: [],
          steps: []
        },
        {
          id: 'player-lucas',
          name: 'Lucas',
          type: 'player',
          initiative: 3,
          currentTick: 0,
          color: '#10b981',
          hp: 20,
          maxHp: 20,
          status: [],
          history: [],
          steps: []
        },
        {
          id: 'player-gabo',
          name: 'Gabo',
          type: 'player',
          initiative: 2,
          currentTick: 0,
          color: '#f59e0b',
          hp: 20,
          maxHp: 20,
          status: [],
          history: [],
          steps: []
        },
        {
          id: 'player-kami',
          name: 'Kami',
          type: 'player',
          initiative: 1,
          currentTick: 0,
          color: '#ec4899',
          hp: 20,
          maxHp: 20,
          status: [],
          history: [],
          steps: []
        }
      ],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(BATTLE_FILE, JSON.stringify(defaultBattle, null, 2), 'utf-8');
    console.log('[Server] Created battle_tracker.json with initial configuration');
  }
}

function sanitizeUsername(input: string): string {
  if (!input) return '';
  return input.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
}

// Seed default GM file if missing
function ensureGmFile() {
  if (!fs.existsSync(GM_FILE)) {
    const defaultGm = {
      role: 'gamemaster',
      name: 'Game Master',
      password: 'saidaquiburro',
      connectedCharacters: ['jose', 'breno', 'lucas', 'gabo', 'kami'],
      campaignNotes: 'Campanha Principal Aurora - Sistema File-System Database-less',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(GM_FILE, JSON.stringify(defaultGm, null, 2), 'utf-8');
    console.log('[Server] Created gamemaster.json with initial configuration');
  }
}

// Default base character template - Empty Character Sheet
function createBaseCharacter(name: string, role?: string, color?: string) {
  return {
    identity: {
      name: name || '',
      avatarUrl: '',
      height: '',
      weight: '',
      hair: '',
      eyes: '',
      skin: '',
      age: '',
      ideals: '',
      origin: role || '',
      languages: []
    },
    alignment: { altruism: 1, logic: 1, integrity: 1 },
    personality: { courage: 1, conviction: 1, serenity: 1 },
    attributes: {
      physical: { strength: 1, dexterity: 1, agility: 1, constitution: 1 },
      mental: { intelligence: 1, perception: 1, reasoning: 1, wisdom: 1 },
      social: { empathy: 1, manipulation: 1, expression: 1, resilience: 1 }
    },
    skills: {
      physical: { melee: 1, firearms: 1, archery: 1, throwing: 1, brawl: 1, combat: 1, stealth: 1, alertness: 1 },
      mental: { academics: 1, traps: 1, intuition: 1, investigation: 1, medicine: 1, occultism: 1, security: 1, survival: 1 },
      social: { bargain: 1, taming: 1, etiquette: 1, intimidation: 1, smoothTalk: 1, leadership: 1, riding: 1, seduction: 1 }
    },
    customSkills: { treinamentos: [], ciencias: [], artes: [] },
    domains: { water: 1, air: 1, anima: 1, fire: 1, earth: 1 },
    abilities: [],
    traits: [],
    manaSpent: { physical: 0, mental: 0, social: 0 },
    naturezaSpent: { water: 0, air: 0, anima: 0, fire: 0, earth: 0 },
    health: {
      head: Array(8).fill('none'),
      torso: Array(20).fill('none'),
      leftArm: Array(12).fill('none'),
      rightArm: Array(12).fill('none'),
      leftLeg: Array(16).fill('none'),
      rightLeg: Array(16).fill('none')
    },
    inventory: {
      equippedSlots: {},
      weapons: [],
      armors: [],
      projectiles: [],
      accessories: [],
      generalItems: [],
      currency: {
        gold: 1,
        silver: 1,
        copper: 1,
        gems: '',
        history: []
      }
    },
    flowAndPatron: {
      fluxo: { level: 1, hp: 1, name: '', notes: '' },
      patrono: { level: 1, hp: 1, name: '', notes: '' }
    }
  };
}

// Seed initial default characters if not present
function ensureDefaultCharacters() {
  const seeds = [
    { username: 'jose', name: 'Jose', role: 'Aventureiro', color: '#a855f7', password: '123123123' },
    { username: 'breno', name: 'Breno', role: 'Aventureiro', color: '#06b6d4', password: '123123123' },
    { username: 'lucas', name: 'Lucas', role: 'Aventureiro', color: '#10b981', password: '123123123' },
    { username: 'gabo', name: 'Gabo', role: 'Aventureiro', color: '#f59e0b', password: '123123123' },
    { username: 'kami', name: 'Kami', role: 'Aventureiro', color: '#ec4899', password: '123123123' },
  ];

  seeds.forEach((seed) => {
    const filePath = path.join(CHARACTERS_DIR, `${seed.username}.json`);
    if (!fs.existsSync(filePath)) {
      const payload = {
        username: seed.username,
        password: seed.password,
        name: seed.name,
        color: seed.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        character: createBaseCharacter(seed.name, seed.role, seed.color)
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`[Server] Seeded character: ${seed.username}.json`);
    }
  });
}

ensureGmFile();
ensureDefaultCharacters();
ensureBattleFile();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Health & Info
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'online',
      storageType: 'file-system',
      dataDir: DATA_DIR,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Authentication: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password, isGm } = req.body;

    // Check GM login
    if (isGm || username === 'gm' || username === 'gamemaster' || username === 'mestre') {
      try {
        if (!fs.existsSync(GM_FILE)) ensureGmFile();
        const gmRaw = fs.readFileSync(GM_FILE, 'utf-8');
        const gmData = JSON.parse(gmRaw);

        if (password === gmData.password) {
          return res.json({
            success: true,
            role: 'gamemaster',
            user: {
              username: 'gamemaster',
              name: gmData.name || 'Game Master',
            },
            gmData: {
              role: 'gamemaster',
              name: gmData.name,
              connectedCharacters: gmData.connectedCharacters || [],
              campaignNotes: gmData.campaignNotes || '',
              updatedAt: gmData.updatedAt
            }
          });
        } else {
          return res.status(401).json({
            success: false,
            error: 'Senha do Game Master incorreta. Acesso negado.'
          });
        }
      } catch (err: any) {
        return res.status(500).json({ success: false, error: 'Erro ao verificar conta do Mestre: ' + err.message });
      }
    }

    // Player login
    const safeUser = sanitizeUsername(username);
    if (!safeUser) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `Ficha para o usuário "${safeUser}" não foi encontrada no disco.` });
    }

    try {
      const fileRaw = fs.readFileSync(filePath, 'utf-8');
      const fileData = JSON.parse(fileRaw);

      if (fileData.password !== password) {
        return res.status(401).json({ success: false, error: 'Senha incorreta para esta ficha.' });
      }

      return res.json({
        success: true,
        role: 'player',
        user: {
          username: fileData.username || safeUser,
          name: fileData.character?.identity?.name || fileData.name || safeUser,
          color: fileData.color || '#a855f7'
        },
        character: fileData.character,
        color: fileData.color
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao ler arquivo da ficha: ' + err.message });
    }
  });

  // 3. Register / Create new character file (Supports both /api/auth/register and /api/characters)
  const handleRegisterOrCreateCharacter = (req: express.Request, res: express.Response) => {
    const { username, password, name, role, color, characterData } = req.body;
    const rawUser = username || req.params?.username || name;
    const safeUser = sanitizeUsername(rawUser);

    if (!safeUser || safeUser.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário deve ter pelo menos 2 caracteres alfanuméricos.' });
    }
    const finalPassword = password && password.trim() ? password : '123123123';

    const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ success: false, error: `Já existe um arquivo para o usuário "${safeUser}". Escolha outro nome ou faça login.` });
    }

    try {
      const charName = name && name.trim() ? name.trim() : safeUser.charAt(0).toUpperCase() + safeUser.slice(1);
      const initialChar = characterData || createBaseCharacter(charName, role || 'Aventureiro', color || '#a855f7');
      
      const payload = {
        username: safeUser,
        password: finalPassword,
        name: charName,
        color: color || '#a855f7',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        character: initialChar
      };

      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

      // Update connectedCharacters in gamemaster.json
      if (fs.existsSync(GM_FILE)) {
        try {
          const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));
          if (!gmData.connectedCharacters) gmData.connectedCharacters = [];
          if (!gmData.connectedCharacters.includes(safeUser)) {
            gmData.connectedCharacters.push(safeUser);
            gmData.updatedAt = new Date().toISOString();
            fs.writeFileSync(GM_FILE, JSON.stringify(gmData, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error('Failed to update GM connectedCharacters on register:', e);
        }
      }

      return res.json({
        success: true,
        role: 'player',
        user: {
          username: safeUser,
          name: charName,
          color: payload.color
        },
        character: payload.character,
        color: payload.color
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao criar arquivo da ficha: ' + err.message });
    }
  };

  app.post('/api/auth/register', handleRegisterOrCreateCharacter);
  app.post('/api/characters', handleRegisterOrCreateCharacter);
  app.post('/api/characters/:username', handleRegisterOrCreateCharacter);

  // 3.1 Change Password Endpoint (Player or GM)
  app.post('/api/auth/change-password', (req, res) => {
    const { username, currentPassword, newPassword, isGm, gmPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'A nova senha deve ter pelo menos 3 caracteres.' });
    }

    // Changing GM password
    if (isGm || username === 'gm' || username === 'gamemaster' || username === 'mestre') {
      try {
        if (!fs.existsSync(GM_FILE)) ensureGmFile();
        const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));

        if (currentPassword !== gmData.password) {
          return res.status(401).json({ success: false, error: 'Senha atual do Game Master incorreta.' });
        }

        gmData.password = newPassword.trim();
        gmData.updatedAt = new Date().toISOString();
        fs.writeFileSync(GM_FILE, JSON.stringify(gmData, null, 2), 'utf-8');
        console.log('[Server] Game Master password updated successfully');
        return res.json({ success: true, message: 'Senha do Game Master atualizada com sucesso.' });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: 'Erro ao alterar senha do Mestre: ' + err.message });
      }
    }

    // Changing Player character password
    const safeUser = sanitizeUsername(username);
    if (!safeUser) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `Ficha "${safeUser}" não foi encontrada no servidor.` });
    }

    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Authorized if matching current character password OR valid GM password provided
      let authorized = false;
      if (gmPassword) {
        if (!fs.existsSync(GM_FILE)) ensureGmFile();
        const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));
        if (gmPassword === gmData.password) {
          authorized = true;
        }
      }
      if (!authorized && currentPassword && fileData.password === currentPassword) {
        authorized = true;
      }

      if (!authorized) {
        return res.status(401).json({ success: false, error: 'Senha atual incorreta. Acesso negado.' });
      }

      fileData.password = newPassword.trim();
      fileData.updatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
      console.log(`[Server] Password updated for character: ${safeUser}.json`);

      return res.json({
        success: true,
        message: `Senha da ficha "${fileData.name || safeUser}" atualizada com sucesso.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao alterar senha da ficha: ' + err.message });
    }
  });

  // 4. List all character sheets (from file-system)
  app.get('/api/characters', (_req, res) => {
    try {
      const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json'));
      const list = files.map((file) => {
        try {
          const raw = fs.readFileSync(path.join(CHARACTERS_DIR, file), 'utf-8');
          const data = JSON.parse(raw);
          const safeUser = file.replace('.json', '');
          return {
            id: `char-${safeUser}`,
            username: safeUser,
            name: data.character?.identity?.name || data.name || safeUser,
            avatarUrl: data.character?.identity?.avatarUrl || '',
            color: data.color || '#a855f7',
            origin: data.character?.identity?.origin || '',
            updatedAt: data.updatedAt || ''
          };
        } catch {
          const safeUser = file.replace('.json', '');
          return {
            id: `char-${safeUser}`,
            username: safeUser,
            name: safeUser,
            color: '#a855f7'
          };
        }
      });

      return res.json({ success: true, characters: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao listar fichas: ' + err.message });
    }
  });

  // 5. Get a specific character sheet
  app.get('/api/characters/:username', (req, res) => {
    const safeUser = sanitizeUsername(req.params.username);
    const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Ficha não encontrada no disco.' });
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return res.json({
        success: true,
        username: safeUser,
        name: data.character?.identity?.name || data.name || safeUser,
        color: data.color || '#a855f7',
        character: data.character,
        updatedAt: data.updatedAt
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao carregar ficha: ' + err.message });
    }
  });

  // 6. Save/Update character sheet to its JSON file
  app.put('/api/characters/:username', (req, res) => {
    const safeUser = sanitizeUsername(req.params.username);
    const { character, color, name } = req.body;

    const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);
    let existingData: any = {};

    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        existingData = {};
      }
    }

    const updatedData = {
      ...existingData,
      username: safeUser,
      password: existingData.password || '123123123',
      name: name || character?.identity?.name || existingData.name || safeUser,
      color: color || existingData.color || '#a855f7',
      character: character || existingData.character,
      updatedAt: new Date().toISOString()
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

      // Update connectedCharacters in GM file if needed
      if (fs.existsSync(GM_FILE)) {
        try {
          const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));
          if (!gmData.connectedCharacters) gmData.connectedCharacters = [];
          if (!gmData.connectedCharacters.includes(safeUser)) {
            gmData.connectedCharacters.push(safeUser);
            gmData.updatedAt = new Date().toISOString();
            fs.writeFileSync(GM_FILE, JSON.stringify(gmData, null, 2), 'utf-8');
          }
        } catch {}
      }

      return res.json({
        success: true,
        message: `Ficha ${safeUser}.json salva no disco com sucesso.`,
        updatedAt: updatedData.updatedAt
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao salvar ficha: ' + err.message });
    }
  });

  // 7. Delete character sheet (GM permission only, requires GM password "saidaquiburro")
  app.delete('/api/characters/:username', (req, res) => {
    const safeUser = sanitizeUsername(req.params.username);
    const { gmPassword } = req.body;

    // Verify GM password against gamemaster.json
    try {
      if (!fs.existsSync(GM_FILE)) ensureGmFile();
      const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));

      if (!gmPassword || gmPassword !== gmData.password) {
        return res.status(403).json({
          success: false,
          error: 'Senha do Game Master incorreta. Apenas o Mestre pode apagar arquivos de ficha.'
        });
      }

      const filePath = path.join(CHARACTERS_DIR, `${safeUser}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Server] Deleted character file: ${safeUser}.json by GM`);
      }

      // Remove from GM connected characters
      if (gmData.connectedCharacters) {
        gmData.connectedCharacters = gmData.connectedCharacters.filter((u: string) => u !== safeUser);
        gmData.updatedAt = new Date().toISOString();
        fs.writeFileSync(GM_FILE, JSON.stringify(gmData, null, 2), 'utf-8');
      }

      return res.json({
        success: true,
        message: `Ficha "${safeUser}.json" foi apagada do disco com sucesso.`,
        deletedUser: safeUser
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao apagar ficha: ' + err.message });
    }
  });

  // 8. GM Data Endpoint (get connected sheets, campaign notes)
  app.get('/api/gm', (_req, res) => {
    try {
      if (!fs.existsSync(GM_FILE)) ensureGmFile();
      const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));

      // Also read current files on disk to ensure all sheets are synchronized
      const diskFiles = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
      const combined = Array.from(new Set([...(gmData.connectedCharacters || []), ...diskFiles]));
      
      // Update GM connected characters with disk reality
      gmData.connectedCharacters = combined;
      fs.writeFileSync(GM_FILE, JSON.stringify(gmData, null, 2), 'utf-8');

      return res.json({
        success: true,
        gmData: {
          role: 'gamemaster',
          name: gmData.name,
          connectedCharacters: combined,
          campaignNotes: gmData.campaignNotes || '',
          updatedAt: gmData.updatedAt
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao carregar dados do Mestre: ' + err.message });
    }
  });

  // 9. Update GM settings (campaign notes, connected characters order, etc.)
  app.put('/api/gm', (req, res) => {
    try {
      if (!fs.existsSync(GM_FILE)) ensureGmFile();
      const current = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));
      const { campaignNotes, connectedCharacters, name } = req.body;

      const updated = {
        ...current,
        name: name || current.name,
        campaignNotes: campaignNotes !== undefined ? campaignNotes : current.campaignNotes,
        connectedCharacters: connectedCharacters || current.connectedCharacters,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(GM_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      return res.json({ success: true, gmData: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao atualizar dados do Mestre: ' + err.message });
    }
  });

  // 10. Verify GM Password
  app.post('/api/gm/verify', (req, res) => {
    const { password } = req.body;
    try {
      if (!fs.existsSync(GM_FILE)) ensureGmFile();
      const gmData = JSON.parse(fs.readFileSync(GM_FILE, 'utf-8'));
      if (password === gmData.password) {
        return res.json({ success: true });
      } else {
        return res.status(401).json({ success: false, error: 'Senha do Game Master incorreta.' });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Battle Tracker Endpoints (Shared live timeline for all players & GM)
  app.get('/api/battle', (_req, res) => {
    try {
      if (!fs.existsSync(BATTLE_FILE)) ensureBattleFile();
      const raw = fs.readFileSync(BATTLE_FILE, 'utf-8');
      const battleData = JSON.parse(raw);
      return res.json({ success: true, battle: battleData });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao carregar Battle Tracker: ' + err.message });
    }
  });

  app.put('/api/battle', (req, res) => {
    try {
      if (!fs.existsSync(BATTLE_FILE)) ensureBattleFile();
      const { currentTick, previousTick, minTimespan, entities } = req.body;
      const updatedBattle = {
        currentTick: typeof currentTick === 'number' ? currentTick : 0,
        previousTick: typeof previousTick === 'number' ? previousTick : 0,
        minTimespan: typeof minTimespan === 'number' ? minTimespan : 15,
        entities: Array.isArray(entities) ? entities : [],
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(BATTLE_FILE, JSON.stringify(updatedBattle, null, 2), 'utf-8');
      return res.json({ success: true, battle: updatedBattle });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao salvar Battle Tracker: ' + err.message });
    }
  });

  // Helper converters for Gemini Function Declarations
  function convertToGeminiType(typeStr: string): Type {
    switch (typeStr?.toLowerCase()) {
      case 'string': return Type.STRING;
      case 'number': return Type.NUMBER;
      case 'boolean': return Type.BOOLEAN;
      case 'array': return Type.ARRAY;
      case 'object': return Type.OBJECT;
      default: return Type.STRING;
    }
  }

  function mapPropertiesToGemini(properties: any): Record<string, any> {
    const result: Record<string, any> = {};
    if (!properties) return result;
    for (const [key, prop] of Object.entries<any>(properties)) {
      const geminiProp: any = {
        type: convertToGeminiType(prop.type),
        description: prop.description || ''
      };
      if (prop.enum && Array.isArray(prop.enum)) {
        geminiProp.enum = prop.enum;
      }
      if (prop.type === 'object' && prop.properties) {
        geminiProp.properties = mapPropertiesToGemini(prop.properties);
      }
      result[key] = geminiProp;
    }
    return result;
  }

  function getGeminiFunctionDeclarations() {
    return AURORA_TOOL_DEFINITIONS.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: mapPropertiesToGemini(tool.parameters.properties),
        required: tool.parameters.required || []
      }
    }));
  }

  function getGroqTools() {
    return AURORA_TOOL_DEFINITIONS.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  const AURORA_SYSTEM_PROMPT = `Você é a Aurora, a inteligência arcana e assistente mágica de fichas de RPG do Sistema Arcana.
Seu papel é interagir com o jogador de forma acolhedora, imersiva, sábia e precisa.
Você tem acesso para ler e alterar ABSOLUTAMENTE TODOS os dados e campos da ficha do personagem chamando ferramentas (Function Calling / Tool Calling).

TODOS OS CAMPOS DA FICHA ESTÃO SOB SEU CONTROLE:
0. CONSULTA GERAL OU POR SEÇÃO: Para ler dados específicos com precisão (como idiomas conhecidos, atributos, inventário, etc.), você pode responder diretamente com base no contexto OU chamar a ferramenta 'query_character_sheet'.
1. IDIOMAS: Para ler idiomas, veja "IDIOMAS CONHECIDOS" no contexto da ficha ou consulte 'query_character_sheet'. Se o usuário perguntar quais idiomas ele fala, cite-os imediatamente. Para adicionar ou remover idiomas que o personagem aprendeu ou fala, chame 'manage_language' (ex: "aprendi élfico", "remova o idioma anão").
2. IDENTIDADE: Campos de nome, idade, altura, peso, cabelos, olhos, pele, ideais, origem, avatarUrl são alterados via 'manage_identity'.
3. VANTAGENS E DESVANTAGENS: Adicione ou remova traços via 'manage_trait' (especificando tipo "advantage" ou "disadvantage", pontos e descrição).
4. HABILIDADES: Adicione, remova ou ative/desative habilidades especiais via 'manage_ability'.
5. ATRIBUTOS E PERÍCIAS: Altere atributos via 'modify_attribute', perícias padrão via 'modify_skill', e perícias customizadas em Treinamentos/Ciências/Artes via 'manage_custom_skill'.
6. MANA E NATUREZA: Gerencie mana via 'manage_mana' (física/vigor, mental/foco, social/graça) e natureza elemental gasta/recuperada via 'manage_natureza'.
7. MOEDAS E ECONOMIA: O sistema Arcana aceita estritamente: Ouro (gold / PO), Prata (silver / PP) e Cobre (copper / PC). Use 'manage_currency'. NUNCA invente moedas que não existem (ex: diamantes, rubis ou platinas como moedas correntes não existem e devem ser recusados com aviso).
8. SAÚDE E FERIMENTOS: Use 'manage_health' para aplicar ferimentos (simples, letal, agravado) em partes do corpo (head, torso, arms, legs) ou curar partes/tudo.
9. INVENTÁRIO: Adicione, remova, aumente quantidades ou equipe/desequipe armas, armaduras, projéteis, acessórios e itens gerais com 'manage_inventory_item'.
10. FLUXO E PATRONO: Níveis e HP (0-10) controlados via 'manage_flow_patron'.
11. ROLAGEM DE DADOS: Role qualquer teste ou jogada com 'roll_dice'.

DIRETRIZES DE DIÁLOGO:
• Quando o usuário perguntar sobre o que ele tem na ficha (ex: "quais idiomas eu falo?", "quanto de ouro eu tenho?", "quais armas estão na minha mochila?"), responda com precisão imediata baseado no contexto detalhado fornecido ou chame 'query_character_sheet'.
• Quando o usuário pedir qualquer alteração, CHAME A FERRAMENTA CORRESPONDENTE imediatamente.
• Você pode chamar múltiplas ferramentas na mesma resposta se o jogador pedir ações combinadas.
• Responda em português com formatação markdown leve (negrito, itálico) e tom acolhedor e arcano.`;

  // 11. Aurora AI Assistant Chat Endpoint (Gemini & Groq with Tool-Calling)
  app.post('/api/aurora/chat', async (req, res) => {
    const { provider, apiKey, messages, characterContext, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de mensagens não fornecida.' });
    }

    const fullSystemInstruction = `${AURORA_SYSTEM_PROMPT}\n\n${characterContext || ''}`;

    // --- PROVIDER: GEMINI ---
    if (provider === 'gemini') {
      const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim())
        ? apiKey.trim()
        : (process.env.GEMINI_API_KEY || '');

      if (!effectiveKey) {
        return res.status(400).json({
          success: false,
          error: 'Chave da Gemini API não configurada. Por favor, insira sua chave gratuita nas opções da Aurora.'
        });
      }

      try {
        const ai = new GoogleGenAI({
          apiKey: effectiveKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const contents = messages.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(m.content || '') }]
        }));

        const geminiTools = getGeminiFunctionDeclarations();

        let response: any = null;
        let lastError: any = null;

        // Modelos configuráveis pelo usuário (Default: models/gemini-2.5-flash)
        const defaultGemini = 'gemini-2.5-flash';
        const rawRequested = typeof model === 'string' && model.trim() ? model.trim() : defaultGemini;
        const normalizedRequested = rawRequested.replace(/^models\//, '');

        const modelsToTry = [
          normalizedRequested,
          'gemini-2.5-flash',
          'gemini-3.8-flash',
          'gemini-3.1-pro-preview',
          'gemini-3.1-flash-lite'
        ].filter((v, i, a) => a.indexOf(v) === i);

        for (const modelName of modelsToTry) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: fullSystemInstruction,
                tools: [{ functionDeclarations: geminiTools }]
              }
            });
            if (response) break;
          } catch (modelErr: any) {
            lastError = modelErr;
            const errStr = String(modelErr?.message || modelErr || '');
            if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE') || errStr.includes('not found')) {
              console.warn(`[Gemini] ${modelName} returned issue (${errStr}), trying fallback candidate...`);
              await new Promise(r => setTimeout(r, 500));
              continue;
            } else {
              throw modelErr;
            }
          }
        }

        if (!response && lastError) {
          throw lastError;
        }

        const toolCalls: any[] = [];
        if (response.functionCalls && Array.isArray(response.functionCalls)) {
          for (const fc of response.functionCalls) {
            toolCalls.push({
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: fc.name,
              args: fc.args
            });
          }
        }

        const replyText = response.text || '';
        return res.json({
          success: true,
          provider: 'gemini',
          text: replyText,
          toolCalls
        });
      } catch (err: any) {
        console.error('[Aurora Gemini Error]', err);
        const errMessage = String(err?.message || '');
        if (errMessage.includes('503') || errMessage.includes('high demand') || errMessage.includes('UNAVAILABLE')) {
          return res.status(503).json({
            success: false,
            error: 'Os servidores da Gemini API estão passando por uma alta demanda temporária (Erro 503). Aguarde alguns segundos e tente novamente, ou utilize o modo Groq / NLP.'
          });
        }
        return res.status(500).json({
          success: false,
          error: `Erro ao comunicar com a Gemini API: ${errMessage || 'Falha na requisição'}`
        });
      }
    }

    // --- PROVIDER: GROQ ---
    if (provider === 'groq') {
      const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim())
        ? apiKey.trim()
        : (process.env.GROQ_API_KEY || '');

      if (!effectiveKey) {
        return res.status(400).json({
          success: false,
          error: 'Chave da Groq API não configurada. Por favor, insira sua chave gratuita nas opções da Aurora.'
        });
      }

      try {
        const groqMessages = [
          { role: 'system', content: fullSystemInstruction },
          ...messages.map((m: any) => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: String(m.content || '')
          }))
        ];

        const groqTools = getGroqTools();

        // Modelos configuráveis pelo usuário (Default: openai/gpt-oss-120b)
        const defaultGroq = 'openai/gpt-oss-120b';
        const requestedGroq = typeof model === 'string' && model.trim() ? model.trim() : defaultGroq;

        const groqModelsToTry = [
          requestedGroq,
          'openai/gpt-oss-120b',
          'qwen/qwen3.8-27b',
          'openai/gpt-oss-20b',
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant'
        ].filter((v, i, a) => a.indexOf(v) === i);

        let groqData: any = null;
        let lastGroqError: string = '';

        for (const modelCandidate of groqModelsToTry) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${effectiveKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: modelCandidate,
                messages: groqMessages,
                tools: groqTools,
                tool_choice: 'auto',
                temperature: 0.3
              })
            });

            const rawText = await groqRes.text();
            let parsedData: any = {};
            try {
              parsedData = JSON.parse(rawText);
            } catch (jsonErr) {
              lastGroqError = 'Resposta inválida recebida da Groq API.';
              continue;
            }

            if (!groqRes.ok) {
              const errMsg = parsedData?.error?.message || `Erro HTTP ${groqRes.status}`;
              if (
                errMsg.includes('does not exist') ||
                errMsg.includes('do not have access') ||
                errMsg.includes('decommissioned') ||
                errMsg.includes('not found') ||
                errMsg.includes('deprecated')
              ) {
                console.warn(`[Groq] Model ${modelCandidate} not accessible (${errMsg}), trying fallback candidate...`);
                lastGroqError = errMsg;
                continue;
              } else {
                lastGroqError = errMsg;
                break;
              }
            }

            groqData = parsedData;
            break;
          } catch (fetchErr: any) {
            lastGroqError = fetchErr?.message || 'Falha de rede com a Groq API';
          }
        }

        if (!groqData) {
          return res.status(400).json({
            success: false,
            error: lastGroqError || 'Não foi possível encontrar um modelo acessível com sua chave Groq.'
          });
        }

        const choice = groqData.choices?.[0]?.message;
        const replyText = choice?.content || '';
        const toolCalls: any[] = [];

        if (choice?.tool_calls && Array.isArray(choice.tool_calls)) {
          for (const tc of choice.tool_calls) {
            let parsedArgs = {};
            try {
              parsedArgs = typeof tc.function.arguments === 'string'
                ? JSON.parse(tc.function.arguments)
                : (tc.function.arguments || {});
            } catch (argErr) {
              console.warn('[Groq Tool Args Parse Error]', argErr);
              parsedArgs = {};
            }

            toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              args: parsedArgs
            });
          }
        }

        return res.json({
          success: true,
          provider: 'groq',
          text: replyText,
          toolCalls
        });
      } catch (err: any) {
        console.error('[Aurora Groq Error]', err);
        return res.status(500).json({
          success: false,
          error: `Erro ao comunicar com a Groq API: ${err?.message || 'Falha na requisição'}`
        });
      }
    }

    return res.status(400).json({ success: false, error: 'Provedor desconhecido. Escolha "gemini" ou "groq".' });
  });

  // Mount Vite or serve static files
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Arcana Server] Database-less File-System RPG Companion running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Arcana Server] Failed to start:', err);
  process.exit(1);
});
