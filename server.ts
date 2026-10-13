import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const CHARACTERS_DIR = path.resolve(DATA_DIR, 'characters');
const GM_FILE = path.resolve(DATA_DIR, 'gamemaster.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CHARACTERS_DIR)) {
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
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
      connectedCharacters: ['arcana', 'valerius', 'kaelen'],
      campaignNotes: 'Campanha Principal Arcana - Sistema File-System Database-less',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(GM_FILE, JSON.stringify(defaultGm, null, 2), 'utf-8');
    console.log('[Server] Created gamemaster.json with initial configuration');
  }
}

// Default base character template
function createBaseCharacter(name: string, role: string, color: string) {
  return {
    identity: {
      name,
      avatarUrl: '',
      height: '1.80m',
      weight: '75kg',
      hair: 'Escuro',
      eyes: 'Castanhos',
      skin: 'Bronzeada',
      age: '24',
      ideals: 'Honra e Descoberta',
      origin: role,
      languages: ['Comum', 'Arcano']
    },
    alignment: { altruism: 70, logic: 60, integrity: 80 },
    personality: { courage: 3, conviction: 3, serenity: 2 },
    attributes: {
      physical: { strength: 2, dexterity: 2, agility: 2, constitution: 2 },
      mental: { intelligence: 2, perception: 2, reasoning: 2, wisdom: 2 },
      social: { empathy: 2, manipulation: 1, expression: 2, resilience: 3 }
    },
    skills: {
      physical: { melee: 2, firearms: 0, archery: 1, throwing: 0, brawl: 1, combat: 2, stealth: 1, alertness: 2 },
      mental: { academics: 2, traps: 0, intuition: 2, investigation: 1, medicine: 1, occultism: 2, security: 0, survival: 1 },
      social: { bargain: 1, taming: 1, etiquette: 1, intimidation: 1, smoothTalk: 1, leadership: 2, riding: 1, seduction: 0 }
    },
    customSkills: { treinamentos: [], ciencias: [], artes: [] },
    domains: { water: 1, air: 1, anima: 2, fire: 1, earth: 1 },
    abilities: [],
    traits: [
      { id: 't1', name: 'Determinação de Ferro', type: 'advantage', description: 'Bônus em testes de resistência mental', value: 2 },
      { id: 't2', name: 'Curioso Demais', type: 'disadvantage', description: 'Dificuldade em ignorar mistérios perigosos', value: -1 }
    ],
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
      weapons: [
        {
          id: 'w1',
          name: 'Espada Rúnica',
          category: 'weapon',
          equipped: true,
          slot: 'main_hand',
          thrust: { damage: '1d8', type: 'per', ap: 2, precision: 1 },
          swing: { damage: '1d10', type: 'cor', ap: 1, precision: 0 },
          size: 'm',
          weight: 1500,
          location: 'Em Mãos'
        }
      ],
      armors: [],
      generalItems: [
        { id: 'i1', name: 'Mochila de Couro', quantity: 1, weight: 1000, description: 'Mochila resistente', location: 'Costas' },
        { id: 'i2', name: 'Poção de Vitalidade', quantity: 2, weight: 250, description: 'Restaura vitalidade básica', location: 'Cinto' }
      ],
      currency: {
        gold: 15,
        silver: 40,
        copper: 80,
        gems: '1x Granada menor',
        history: []
      }
    },
    flowAndPatron: {
      fluxo: { activeDomain: 'anima', title: 'Fluxo Espiritual', description: 'Harmonia com forças ancestrais' },
      patrono: { activeDomain: 'air', title: 'Voz dos Ventos', description: 'Guia nas correntes do destino' }
    }
  };
}

// Seed initial default characters if not present
function ensureDefaultCharacters() {
  const seeds = [
    { username: 'elias', name: 'Elias Iyanu', role: 'Místico do Deserto', color: '#a855f7', password: '123' },
    { username: 'valerius', name: 'Valerius', role: 'Guerreiro Paladino', color: '#10b981', password: '123' },
    { username: 'kaelen', name: 'Kaelen', role: 'Erudito dos Astros', color: '#06b6d4', password: '123' },
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
    const finalPassword = password && password.trim() ? password : '123';

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
      password: existingData.password || '123',
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
