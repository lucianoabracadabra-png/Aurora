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
      connectedCharacters: ['elias', 'valerius', 'kaelen'],
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
      name: name || 'Novo Personagem',
      avatarUrl: '',
      height: '',
      weight: '',
      hair: '',
      eyes: '',
      skin: '',
      age: '',
      ideals: '',
      origin: '',
      languages: []
    },
    alignment: { altruism: 0, logic: 0, integrity: 0 },
    personality: { courage: 0, conviction: 0, serenity: 0 },
    attributes: {
      physical: { strength: 0, dexterity: 0, agility: 0, constitution: 0 },
      mental: { intelligence: 0, perception: 0, reasoning: 0, wisdom: 0 },
      social: { empathy: 0, manipulation: 0, expression: 0, resilience: 0 }
    },
    skills: {
      physical: { melee: 0, firearms: 0, archery: 0, throwing: 0, brawl: 0, combat: 0, stealth: 0, alertness: 0 },
      mental: { academics: 0, traps: 0, intuition: 0, investigation: 0, medicine: 0, occultism: 0, security: 0, survival: 0 },
      social: { bargain: 0, taming: 0, etiquette: 0, intimidation: 0, smoothTalk: 0, leadership: 0, riding: 0, seduction: 0 }
    },
    customSkills: { treinamentos: [], ciencias: [], artes: [] },
    domains: { water: 0, air: 0, anima: 0, fire: 0, earth: 0 },
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
        gold: 0,
        silver: 0,
        copper: 0,
        gems: '',
        history: []
      }
    },
    flowAndPatron: {
      fluxo: { level: 0, hp: 10, name: '', notes: '' },
      patrono: { level: 0, hp: 10, name: '', notes: '' }
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
Seu papel é interagir com o jogador de forma acolhedora, imersiva e eficiente.
Você tem acesso para alterar e consultar os dados da ficha do personagem chamando ferramentas (Function Calling / Tool Calling).

REGRAS ESSENCIAIS:
1. SEMPRE que o usuário pedir para alterar valores, gastar ou recuperar mana, rolar dados, modificar atributos, perícias, alinhamento, domínios de magia, saúde ou moedas, CHAME a ferramenta correspondente.
2. NUNCA invente moedas que não existem! O sistema Arcana aceita estritamente: Ouro (gold / PO), Prata (silver / PP) e Cobre (copper / PC). Se o usuário pedir platina, gemas como moeda direta ou moeda moderna, recuse ou alerte explicando que apenas Ouro, Prata e Cobre existem como moeda corrente no Arcana.
3. Você pode chamar MÚLTIPLAS ferramentas na mesma resposta se o jogador pedir várias ações (ex: "gastei 5 de ouro e comprei uma espada" -> chama manage_currency E manage_inventory_item).
4. Ao rolar dados ou aplicar dano/cura, chame as respectivas ferramentas 'roll_dice' ou 'manage_health'.
5. Responda em português com tom amigável e místico (usando formatação markdown leve com negrito e itálico).
6. Se o usuário fizer apenas uma pergunta sobre seus pontos atuais (ex: "quanto de mana eu tenho?"), responda diretamente baseado no contexto fornecido.`;

  // 11. Aurora AI Assistant Chat Endpoint (Gemini & Groq with Tool-Calling)
  app.post('/api/aurora/chat', async (req, res) => {
    const { provider, apiKey, messages, characterContext } = req.body;

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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: fullSystemInstruction,
            tools: [{ functionDeclarations: geminiTools }]
          }
        });

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
        return res.status(500).json({
          success: false,
          error: `Erro ao comunicar com a Gemini API: ${err?.message || 'Falha na requisição'}`
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

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            tools: groqTools,
            tool_choice: 'auto',
            temperature: 0.3
          })
        });

        const rawText = await groqRes.text();
        let groqData: any = {};
        try {
          groqData = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error('[Groq JSON Parse Error]', jsonErr, rawText);
          return res.status(500).json({ success: false, error: 'Resposta inválida recebida da Groq API.' });
        }

        if (!groqRes.ok) {
          const errMsg = groqData?.error?.message || `Erro HTTP ${groqRes.status} da Groq API`;
          return res.status(groqRes.status).json({ success: false, error: errMsg });
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
