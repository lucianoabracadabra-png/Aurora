import React, { useState, useEffect, useRef } from 'react';
import { initialCharacterData, createEmptyCharacterData } from './initialState';
import { CharacterData, Identity as IdentityType, Alignment as AlignmentType, Personality as PersonalityType, Attributes as AttributesType, Skills as SkillsType, Domains as DomainsType, Ability, Trait, Inventory, FlowAndPatron as FlowAndPatronType, FlowPatronData, CampaignCharacter, CustomSkill } from './types';
import { User, ScrollText, Sparkles, Check, Lock, Unlock, Pencil, X, Heart, Minus, Plus, RotateCcw, Swords, Backpack, HelpCircle, Crown, HardDrive, FileCode, Save, ShieldCheck, FileText } from 'lucide-react';

import { BentoBox } from './components/BentoBox';
import { Identity } from './components/Identity';
import { Alignment } from './components/Alignment';
import { Personality } from './components/Personality';
import { Domains } from './components/Domains';
import { NaturezaTracker } from './components/NaturezaTracker';
import { Abilities } from './components/Abilities';
import { Traits } from './components/Traits';
import { DotRating } from './components/DotRating';
import { HealthTracker } from './components/HealthTracker';
import { DiceRollerModal, DiceRollRequest } from './components/DiceRollerModal';
import { InventoryManager } from './components/InventoryManager';
import { GalaxyAuroraBackground } from './components/GalaxyAuroraBackground';
import { UserGuideModal } from './components/UserGuideModal';
import { FlowAndPatron } from './components/FlowAndPatron';
import { AttributeInput } from './components/AttributeInput';
import { CustomSkillsSection } from './components/CustomSkillsSection';
import { StatIntersectionBox } from './components/StatIntersectionBox';
import { GmRosterBar } from './components/GmRosterBar';
import { BattleTrackerEnvironment } from './components/BattleTrackerEnvironment';
import { AuthModal } from './components/AuthModal';
import { DeleteCharacterModal } from './components/DeleteCharacterModal';
import { AuroraAssistant } from './components/AuroraAssistant';
import { StorageApi, CharacterSummary, AuthSession } from './services/storageApi';

function normalizeCharacterData(parsed: any): CharacterData {
  if (!parsed || typeof parsed !== 'object') return createEmptyCharacterData();

  if (!parsed.identity) {
    parsed.identity = {
      name: 'Novo Personagem',
      avatarUrl: '',
      height: '',
      weight: '',
      hair: '',
      eyes: '',
      skin: '',
      age: '',
      ideals: '',
      origin: '',
      languages: [],
    };
  }

  if (!parsed.alignment) {
    parsed.alignment = { altruism: 0, logic: 0, integrity: 0 };
  }

  if (!parsed.personality) {
    parsed.personality = { courage: 0, conviction: 0, serenity: 0 };
  }

  if (!parsed.attributes) {
    parsed.attributes = {
      physical: { strength: 0, dexterity: 0, agility: 0, constitution: 0 },
      mental: { intelligence: 0, perception: 0, reasoning: 0, wisdom: 0 },
      social: { empathy: 0, manipulation: 0, expression: 0, resilience: 0 },
    };
  }

  if (!parsed.skills) {
    parsed.skills = {
      physical: { melee: 0, firearms: 0, archery: 0, throwing: 0, brawl: 0, combat: 0, stealth: 0, alertness: 0 },
      mental: { academics: 0, traps: 0, intuition: 0, investigation: 0, medicine: 0, occultism: 0, security: 0, survival: 0 },
      social: { bargain: 0, taming: 0, etiquette: 0, intimidation: 0, smoothTalk: 0, leadership: 0, riding: 0, seduction: 0 },
    };
  }

  if (!parsed.domains) {
    parsed.domains = { water: 0, air: 0, anima: 0, fire: 0, earth: 0 };
  }

  if (!parsed.customSkills) {
    parsed.customSkills = { treinamentos: [], ciencias: [], artes: [] };
  } else {
    if (!parsed.customSkills.treinamentos) parsed.customSkills.treinamentos = [];
    if (!parsed.customSkills.ciencias) parsed.customSkills.ciencias = [];
    if (!parsed.customSkills.artes) parsed.customSkills.artes = [];
  }

  if (!parsed.manaSpent) {
    parsed.manaSpent = { physical: 0, mental: 0, social: 0 };
  }

  if (!parsed.naturezaSpent) {
    parsed.naturezaSpent = { water: 0, air: 0, anima: 0, fire: 0, earth: 0 };
  }

  const fitHealth = (arr: any, count: number) => {
    const res = Array(count).fill('none');
    if (Array.isArray(arr)) {
      for (let i = 0; i < Math.min(arr.length, count); i++) {
        res[i] = arr[i];
      }
    }
    return res;
  };

  parsed.health = {
    head: fitHealth(parsed.health?.head, 8),
    torso: fitHealth(parsed.health?.torso, 20),
    leftArm: fitHealth(parsed.health?.leftArm, 12),
    rightArm: fitHealth(parsed.health?.rightArm, 12),
    leftLeg: fitHealth(parsed.health?.leftLeg, 16),
    rightLeg: fitHealth(parsed.health?.rightLeg, 16),
  };

  if (!parsed.traits || !Array.isArray(parsed.traits)) {
    parsed.traits = [];
  }

  if (!parsed.abilities || !Array.isArray(parsed.abilities)) {
    parsed.abilities = [];
  }

  if (!parsed.inventory) {
    parsed.inventory = {
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
        history: [],
      },
    };
  } else {
    if (!Array.isArray(parsed.inventory.weapons)) parsed.inventory.weapons = [];
    if (!Array.isArray(parsed.inventory.armors)) parsed.inventory.armors = [];
    if (!Array.isArray(parsed.inventory.projectiles)) parsed.inventory.projectiles = [];
    if (!Array.isArray(parsed.inventory.accessories)) parsed.inventory.accessories = [];
    if (!Array.isArray(parsed.inventory.generalItems)) parsed.inventory.generalItems = [];
    if (!parsed.inventory.currency) {
      parsed.inventory.currency = {
        gold: 0,
        silver: 0,
        copper: 0,
        gems: '',
        history: [],
      };
    } else {
      if (parsed.inventory.currency.silver > 100) parsed.inventory.currency.silver = 100;
      if (parsed.inventory.currency.copper > 100) parsed.inventory.copper = 100;
      if (parsed.inventory.currency.gems && parsed.inventory.currency.gems.includes('lápis')) {
        parsed.inventory.currency.gems = '';
      }
      if (!Array.isArray(parsed.inventory.currency.history)) {
        parsed.inventory.currency.history = [];
      }
    }
  }

  if (!parsed.flowAndPatron) {
    parsed.flowAndPatron = {
      fluxo: { level: 0, hp: 10, name: '', notes: '' },
      patrono: { level: 0, hp: 10, name: '', notes: '' },
    };
  }

  return parsed;
}

export default function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [isAuroraOpen, setIsAuroraOpen] = useState(false);
  const [isGmView, setIsGmView] = useState<boolean>(() => {
    return localStorage.getItem('arcana_is_gm_view') === 'true';
  });

  // Authentication session (Player or Game Master) - Inicia nulo se não houver no cache
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('arcana_auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username && parsed.role) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'player' | 'gm' | 'register' | 'change-password'>('player');
  const [characterToDelete, setCharacterToDelete] = useState<CampaignCharacter | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterSummary[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');

  const [campaignCharacters, setCampaignCharacters] = useState<CampaignCharacter[]>(() => {
    const saved = localStorage.getItem('arcana_campaign_characters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If previous cache only has old deleted characters, discard it
          const hasOldSeeds = parsed.some((c: any) => c.id === 'char-elias' || c.id === 'char-valerius');
          if (!hasOldSeeds) {
            return parsed.map((c: any) => ({
              ...c,
              data: normalizeCharacterData(c.data)
            }));
          }
        }
      } catch (e) {
        console.error('Error loading campaign characters:', e);
      }
    }

    return [
      {
        id: 'char-jose',
        name: 'Jose',
        color: '#a855f7',
        data: createEmptyCharacterData('Jose', '#a855f7')
      },
      {
        id: 'char-breno',
        name: 'Breno',
        color: '#06b6d4',
        data: createEmptyCharacterData('Breno', '#06b6d4')
      },
      {
        id: 'char-lucas',
        name: 'Lucas',
        color: '#10b981',
        data: createEmptyCharacterData('Lucas', '#10b981')
      },
      {
        id: 'char-gabo',
        name: 'Gabo',
        color: '#f59e0b',
        data: createEmptyCharacterData('Gabo', '#f59e0b')
      },
      {
        id: 'char-kami',
        name: 'Kami',
        color: '#ec4899',
        data: createEmptyCharacterData('Kami', '#ec4899')
      }
    ];
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const saved = localStorage.getItem('arcana_active_character_id');
    if (saved && saved !== 'char-elias' && saved !== 'char-valerius' && saved !== 'char-kaelen') {
      return saved;
    }
    return 'char-jose';
  });

  const activeChar = campaignCharacters.find((c) => c.id === activeCharacterId) || campaignCharacters[0];
  const [data, setData] = useState<CharacterData>(() => activeChar?.data || initialCharacterData);

  // Sync auth session to localStorage
  useEffect(() => {
    if (authSession) {
      localStorage.setItem('arcana_auth_session', JSON.stringify(authSession));
    } else {
      localStorage.removeItem('arcana_auth_session');
    }
  }, [authSession]);

  // Keep GM view saved
  useEffect(() => {
    localStorage.setItem('arcana_is_gm_view', isGmView ? 'true' : 'false');
  }, [isGmView]);

  const loadedCharacterIdRef = useRef<string>(activeCharacterId);
  const lastSavedJsonRef = useRef<string>('');
  const isInitialMountRef = useRef<boolean>(true);

  // Function to load all characters directly from file-system
  const loadCharactersFromFileSystem = async (silent = false) => {
    try {
      const list = await StorageApi.getCharactersList();
      setAvailableCharacters(list);

      if (list.length > 0) {
        const fullCharacters = await Promise.all(
          list.map(async (item) => {
            try {
              const res = await StorageApi.getCharacter(item.username);
              return {
                id: `char-${item.username}`,
                name: res.name || item.name,
                avatarUrl: item.avatarUrl,
                color: item.color,
                data: normalizeCharacterData(res.character)
              };
            } catch {
              return {
                id: `char-${item.username}`,
                name: item.name,
                avatarUrl: item.avatarUrl,
                color: item.color,
                data: createEmptyCharacterData(item.name, item.color)
              };
            }
          })
        );

        setCampaignCharacters(fullCharacters);

        // Check if activeCharacterId still exists
        const currentActiveUsername = activeCharacterId.replace(/^char-/, '');
        const currentExists = list.some((c) => c.username === currentActiveUsername);
        if (!currentExists && fullCharacters.length > 0) {
          const nextChar = fullCharacters[0];
          setActiveCharacterId(nextChar.id);
          loadedCharacterIdRef.current = nextChar.id;
          lastSavedJsonRef.current = JSON.stringify(nextChar.data);
          setData(nextChar.data);
        } else {
          const currentMatch = fullCharacters.find((c) => c.id === activeCharacterId);
          if (currentMatch) {
            if (isInitialMountRef.current) {
              loadedCharacterIdRef.current = currentMatch.id;
              lastSavedJsonRef.current = JSON.stringify(currentMatch.data);
              setData(currentMatch.data);
            } else if (!isEditing) {
              const serverJson = JSON.stringify(currentMatch.data);
              if (serverJson !== lastSavedJsonRef.current && lastSavedJsonRef.current !== '') {
                lastSavedJsonRef.current = serverJson;
                setData(currentMatch.data);
              }
            }
          }
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn('File-system fetch failed (server offline or starting), using local cache:', err);
      }
    } finally {
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      }
    }
  };

  // Load characters on initial mount
  useEffect(() => {
    loadCharactersFromFileSystem();
  }, []);

  // Periodic polling & window focus sync (keeps all players and GM synced with server files)
  useEffect(() => {
    const interval = setInterval(() => {
      loadCharactersFromFileSystem(true);
    }, 4000);

    const handleFocus = () => {
      loadCharactersFromFileSystem(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeCharacterId, isEditing]);

  // When activeCharacterId changes, sync sheet data safely
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const target = campaignCharacters.find((c) => c.id === activeCharacterId);
    if (target) {
      loadedCharacterIdRef.current = activeCharacterId;
      lastSavedJsonRef.current = JSON.stringify(target.data);
      setData(target.data);
    }
    localStorage.setItem('arcana_active_character_id', activeCharacterId);
  }, [activeCharacterId]);

  // Debounced Auto-Save to File-System JSON file
  const saveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    // Prevent saving if on initial mount or during character switch transition
    if (isInitialMountRef.current) return;
    if (loadedCharacterIdRef.current !== activeCharacterId) return;

    const safeUser = activeCharacterId.replace(/^char-/, '');
    if (!safeUser) return;

    const currentJson = JSON.stringify(data);
    if (currentJson === lastSavedJsonRef.current && lastSavedJsonRef.current !== '') {
      // Nothing changed, don't re-save
      return;
    }

    // Local state sync
    setCampaignCharacters((prev) => {
      const updated = prev.map((char) => {
        if (char.id === activeCharacterId) {
          return {
            ...char,
            name: data.identity?.name || char.name,
            avatarUrl: data.identity?.avatarUrl,
            data
          };
        }
        return char;
      });
      localStorage.setItem('arcana_campaign_characters', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('arcana_character_data', currentJson);

    // File-System save
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await StorageApi.saveCharacter(safeUser, data, activeChar?.color, data.identity?.name);
        lastSavedJsonRef.current = currentJson;
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save to disk:', err);
        setSaveStatus('error');
      }
    }, 700);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, activeCharacterId]);

  // Handler for adding a new character directly to disk
  const handleAddCampaignCharacter = async (
    name: string,
    role?: string,
    color?: string,
    username?: string,
    password?: string
  ) => {
    const safeUser = username || name.toLowerCase().replace(/[^a-z0-9_-]/g, '') || `char_${Date.now()}`;
    const newId = `char-${safeUser}`;
    const emptyData = createEmptyCharacterData(name, color || '#06b6d4');

    try {
      setSaveStatus('saving');
      const res = await StorageApi.register({
        username: safeUser,
        password: password || '1',
        name,
        role: role || '',
        color: color || '#06b6d4',
        characterData: emptyData,
      });

      const newChar: CampaignCharacter = {
        id: newId,
        name,
        color: color || '#06b6d4',
        data: normalizeCharacterData(res.character || emptyData)
      };

      setCampaignCharacters((prev) => [...prev.filter((c) => c.id !== newId), newChar]);
      setActiveCharacterId(newId);
      loadedCharacterIdRef.current = newId;
      lastSavedJsonRef.current = JSON.stringify(newChar.data);
      setData(newChar.data);
      setSaveStatus('saved');
      loadCharactersFromFileSystem();
    } catch (err: any) {
      console.warn('Fallback creating character:', err);
      const fallbackChar: CampaignCharacter = {
        id: newId,
        name,
        color: color || '#06b6d4',
        data: emptyData
      };
      setCampaignCharacters((prev) => [...prev.filter((c) => c.id !== newId), fallbackChar]);
      setActiveCharacterId(newId);
      loadedCharacterIdRef.current = newId;
      lastSavedJsonRef.current = JSON.stringify(emptyData);
      setData(fallbackChar.data);
      setSaveStatus('saved');
    }
  };

  // Handler for deleting a character file with GM password 'saidaquiburro'
  const handleConfirmDeleteCharacter = async (username: string, gmPassword: string) => {
    await StorageApi.deleteCharacterByGm(username, gmPassword);
    const targetId = `char-${username}`;

    setCampaignCharacters((prev) => {
      const remaining = prev.filter((c) => c.id !== targetId);
      if (remaining.length > 0 && activeCharacterId === targetId) {
        setActiveCharacterId(remaining[0].id);
        setData(remaining[0].data);
      }
      return remaining;
    });

    loadCharactersFromFileSystem();
  };

  // Toggle GM View - prompts for password 'saidaquiburro' if not yet authenticated as GM
  const handleToggleGmView = () => {
    if (!isGmView) {
      if (authSession?.role !== 'gamemaster') {
        setAuthModalTab('gm');
        setIsAuthModalOpen(true);
        return;
      }
      setIsGmView(true);
    } else {
      setIsGmView(false);
    }
  };

  // Handle successful login from modal or initial screen
  const handleLoginSuccess = (
    newSession: { role: 'player' | 'gamemaster'; username: string; name: string; color?: string },
    characterData?: any
  ) => {
    setAuthSession(newSession);

    if (newSession.role === 'gamemaster') {
      setIsGmView(true);
      loadCharactersFromFileSystem();
    } else {
      // Player login
      const targetId = `char-${newSession.username}`;
      setActiveCharacterId(targetId);
      if (characterData) {
        setData(normalizeCharacterData(characterData));
      }
      loadCharactersFromFileSystem();
    }
  };

  // Desconectar / Sair da conta (limpa o cache e volta para a tela inicial de login)
  const handleLogout = () => {
    localStorage.removeItem('arcana_auth_session');
    setAuthSession(null);
    setIsGmView(false);
    setIsAuthModalOpen(false);
  };
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'inventory' | 'magic'>('profile');
  const [diceRollRequest, setDiceRollRequest] = useState<DiceRollRequest | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeEnvironment, setActiveEnvironment] = useState<'sheet' | 'battleTracker'>('sheet');

  const rollAttribute = (name: string, value: number, theme: 'rose' | 'cyan' | 'emerald') => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'attribute',
      name,
      value,
      theme,
    });
  };

  const rollSkill = (name: string, dots: number, theme: 'rose' | 'cyan' | 'emerald') => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'skill',
      name,
      dots,
      theme,
    });
  };

  const rollPersonality = (name: string, value: number) => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'personality',
      name,
      dots: value,
      theme: 'violet',
    });
  };

  const rollDamage = (name: string, actionName: string, formula: string, damageType: string, ap?: number, precision?: number) => {
    if (isEditing) return;
    setDiceRollRequest({
      type: 'damage',
      name,
      actionName,
      formula,
      damageType,
      ap,
      precision,
      theme: 'amber',
    });
  };

  const updateInventory = (updater: (prev: Inventory) => Inventory) => {
    setData((prev) => ({
      ...prev,
      inventory: updater(prev.inventory || initialCharacterData.inventory),
    }));
  };

  // Save to local storage whenever data changes
  useEffect(() => {
    localStorage.setItem('arcana_character_data', JSON.stringify(data));
  }, [data]);

  const updateIdentity = (field: keyof IdentityType, value: string | string[]) => {
    setData((prev) => ({ ...prev, identity: { ...prev.identity, [field]: value } }));
  };

  const updateAlignment = (field: keyof AlignmentType, value: number) => {
    setData((prev) => ({ ...prev, alignment: { ...prev.alignment, [field]: value } }));
  };

  const updatePersonality = (field: keyof PersonalityType, value: number) => {
    setData((prev) => ({ ...prev, personality: { ...prev.personality, [field]: value } }));
  };

  const updateAttributes = (category: keyof AttributesType, field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [category]: {
          ...prev.attributes[category],
          [field]: value,
        },
      },
    }));
  };

  const updateSkills = (category: keyof SkillsType, field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: {
          ...prev.skills[category],
          [field]: value,
        },
      },
    }));
  };

  const updateDomains = (field: keyof DomainsType, value: number) => {
    setData((prev) => ({ ...prev, domains: { ...prev.domains, [field]: value } }));
  };

  const addAbility = (ability: Omit<Ability, 'id'>) => {
    const newAbility = { ...ability, id: Math.random().toString(36).substring(7) };
    setData((prev) => ({ ...prev, abilities: [...prev.abilities, newAbility] }));
  };

  const removeAbility = (id: string) => {
    setData((prev) => ({ ...prev, abilities: prev.abilities.filter((a) => a.id !== id) }));
  };

  const toggleAbilitySelect = (id: string) => {
    setData((prev) => ({
      ...prev,
      abilities: prev.abilities.map((a) =>
        a.id === id ? { ...a, selected: !(a.selected ?? true) } : a
      ),
    }));
  };

  const addTrait = (trait: Omit<Trait, 'id'>) => {
    const newTrait = { ...trait, id: Math.random().toString(36).substring(7) };
    setData((prev) => ({ ...prev, traits: [...prev.traits, newTrait] }));
  };

  const updateTrait = (updatedTrait: Trait) => {
    setData((prev) => ({
      ...prev,
      traits: prev.traits.map((t) => (t.id === updatedTrait.id ? updatedTrait : t))
    }));
  };

  const removeTrait = (id: string) => {
    setData((prev) => ({ ...prev, traits: prev.traits.filter((t) => t.id !== id) }));
  };

  const addCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', name: string) => {
    const newSkill = { id: Math.random().toString(36).substring(7), name, value: 0 };
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: [...prev.customSkills[category], newSkill],
      }
    }));
  };

  const updateCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', id: string, value: number) => {
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: prev.customSkills[category].map(skill => skill.id === id ? { ...skill, value } : skill),
      }
    }));
  };

  const removeCustomSkill = (category: 'treinamentos' | 'ciencias' | 'artes', id: string) => {
    setData((prev) => ({
      ...prev,
      customSkills: {
        ...prev.customSkills,
        [category]: prev.customSkills[category].filter(skill => skill.id !== id),
      }
    }));
  };

  const updateFlowAndPatron = (type: 'fluxo' | 'patrono', field: keyof FlowPatronData, value: any) => {
    setData((prev) => {
      const cur = prev.flowAndPatron || initialCharacterData.flowAndPatron!;
      return {
        ...prev,
        flowAndPatron: {
          ...cur,
          [type]: {
            ...cur[type],
            [field]: value
          }
        }
      };
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const profile = document.getElementById('profile');
      const stats = document.getElementById('stats');
      const inventory = document.getElementById('inventory');
      const magic = document.getElementById('magic');

      if (!profile || !stats || !magic) return;

      const scrollPosition = window.scrollY + window.innerHeight / 3;

      if (scrollPosition < stats.offsetTop) {
        setActiveTab('profile');
      } else if (inventory && scrollPosition < inventory.offsetTop) {
        setActiveTab('stats');
      } else if (inventory && scrollPosition < magic.offsetTop) {
        setActiveTab('inventory');
      } else {
        setActiveTab('magic');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial tab
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (!authSession) {
    return (
      <div className="min-h-screen bg-[#02000c] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
        <GalaxyAuroraBackground />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Aurora Header */}
        <div className="relative z-10 flex flex-col items-center mb-6 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/15 border border-violet-400/40 flex items-center justify-center text-violet-300 shadow-[0_0_25px_rgba(167,139,250,0.4)] mb-3">
            <Sparkles size={26} className="text-violet-300 drop-shadow-[0_0_10px_#a855f7]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-cyan-200 tracking-wider drop-shadow-sm uppercase">
            Aurora
          </h1>
          <p className="text-xs sm:text-sm text-violet-300/70 font-medium mt-1">
            Sistema Arcana & Gestão de Fichas
          </p>
        </div>

        {/* Central Auth Interface (Autenticação & Persistência) */}
        <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
          <AuthModal
            isOpen={true}
            isInitialScreen={true}
            availableCharacters={availableCharacters}
            onLoginSuccess={handleLoginSuccess}
            defaultTab={authModalTab}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02000c] text-slate-200 font-sans pb-24 selection:bg-violet-500/30 relative overflow-hidden">
      {/* Dynamic Galaxy Aurora Background with 3 Parallax Star Layers */}
      <GalaxyAuroraBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#030014]/85 backdrop-blur-2xl border-b border-white/5 px-3 sm:px-6 py-2.5 sm:py-3 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4 flex-wrap">
          
          {/* Lado Esquerdo: Marca & Status de Salvamento */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            {/* Title Aurora */}
            <h1 className="text-xs sm:text-sm tracking-[0.3em] font-light uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)] shrink-0 select-none">
              Aurora
            </h1>

            {/* Status de Salvamento (separado, exibe apenas a bolinha e o estado) */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs shadow-inner min-w-0 transition-colors"
              title={
                saveStatus === 'saving'
                  ? 'Salvando alterações no disco...'
                  : saveStatus === 'error'
                  ? 'Erro ao salvar alterações no disco'
                  : `Todas as alterações foram salvas (${data.identity?.name || 'Personagem'})`
              }
            >
              <span
                className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                  saveStatus === 'saving'
                    ? 'bg-amber-400 animate-ping'
                    : saveStatus === 'error'
                    ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                }`}
              />
              <span className="text-[11px] font-semibold text-white/90">
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'error' ? 'Não salvo' : 'Salvo'}
              </span>
            </div>
          </div>

          {/* Lado Direito: 1. Login -> 2. Switch Ficha/Battle Tracker -> 3. Edit/Lock -> 4. ? -> 5. Aurora -> 6. GM */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Login (User Account / Session Button) */}
            <button
              type="button"
              onClick={() => {
                if (authSession) {
                  setAuthModalTab('change-password');
                } else {
                  setAuthModalTab('player');
                }
                setIsAuthModalOpen(true);
              }}
              className={`h-8 px-2 sm:px-2.5 rounded-full border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95 ${
                authSession?.role === 'gamemaster'
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-violet-500/15 border-violet-400/40 text-violet-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              }`}
              title={
                authSession
                  ? `Conectado como ${authSession.name || authSession.username} (Clique para Mudar Senha ou Trocar de Conta)`
                  : 'Autenticação & Persistência / Fazer Login'
              }
            >
              {authSession?.role === 'gamemaster' ? (
                <Crown size={13} className="text-amber-400 shrink-0" />
              ) : (
                <User size={13} className="text-violet-400 shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[90px] truncate text-[11px]">
                {authSession?.role === 'gamemaster' ? 'Mestre' : data.identity?.name || authSession?.name || authSession?.username || 'Login'}
              </span>
            </button>

            {/* 2. Switch de 2 Ícones: Ficha (Folha) vs Battle Tracker (Espadinhas) */}
            <div 
              className="flex items-center p-0.5 bg-[#060212] border border-white/10 rounded-full shadow-inner gap-0.5 shrink-0"
              role="group"
              aria-label="Alternar entre Ficha e Battle Tracker"
            >
              <button
                type="button"
                onClick={() => setActiveEnvironment('sheet')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  activeEnvironment === 'sheet'
                    ? 'bg-violet-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.6)] border border-violet-400/50'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}
                title="Ficha do Personagem (Folha)"
                aria-label="Ficha do Personagem"
              >
                <FileText size={15} className={activeEnvironment === 'sheet' ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]' : ''} />
              </button>

              <button
                type="button"
                onClick={() => setActiveEnvironment('battleTracker')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  activeEnvironment === 'battleTracker'
                    ? 'bg-amber-500 text-black shadow-[0_0_14px_rgba(245,158,11,0.65)] font-bold border border-amber-300'
                    : 'text-amber-300/40 hover:text-amber-200 hover:bg-white/5 border border-transparent'
                }`}
                title="Battle Tracker (Espadinhas)"
                aria-label="Battle Tracker"
              >
                <Swords size={15} className={activeEnvironment === 'battleTracker' ? 'drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]' : ''} />
              </button>
            </div>

            {/* Divisor sutil */}
            <div className="w-px h-5 bg-white/10 mx-0.5 hidden xs:block" />

            {/* 3. Edit / Lock (ícones invertidos: travado mostra lápis para editar, editando mostra cadeado para travar) */}
            <button 
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isEditing 
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40'
                  : 'bg-white/[0.03] hover:bg-emerald-500/20 border-emerald-400/30 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
              }`}
              title={isEditing ? 'Travar Ficha (Modo de Leitura / Jogo Ativo)' : 'Editar Ficha (Modo de Edição Ativo)'}
            >
              {isEditing ? <Lock size={14} /> : <Pencil size={14} />}
            </button>

            {/* 4. Question mark (Ajuda & Guia ?) */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-cyan-500/15 active:scale-95 border border-cyan-400/30 hover:border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
              title="Guia de Ferramentas, Atalhos e Usabilidade (?)"
            >
              <HelpCircle size={15} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            </button>

            {/* 5. Aurora (Assistente Semi-Inteligente) */}
            <button
              type="button"
              onClick={() => setIsAuroraOpen(!isAuroraOpen)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer relative active:scale-95 ${
                isAuroraOpen
                  ? 'bg-gradient-to-br from-violet-600/40 via-indigo-600/40 to-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.45)] ring-1 ring-cyan-400/50 scale-105'
                  : 'bg-white/[0.03] hover:bg-violet-500/20 border-violet-400/35 hover:border-violet-400/60 text-violet-300 hover:text-white shadow-[0_0_15px_rgba(167,139,250,0.2)]'
              }`}
              title={isAuroraOpen ? 'Fechar Aurora' : 'Aurora: Assistente de Ficha'}
            >
              <Sparkles 
                size={14} 
                className={`text-violet-400 drop-shadow-[0_0_6px_currentColor] transition-transform ${
                  isAuroraOpen ? 'text-cyan-300 rotate-12 scale-110' : ''
                }`} 
              />
              {!isAuroraOpen && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] animate-pulse" />
              )}
            </button>

            {/* 6. GM (Game Master / Player View) */}
            <button
              type="button"
              onClick={handleToggleGmView}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                isGmView
                  ? 'bg-amber-500/25 border-amber-400/70 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/50'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/25 text-white/35 hover:text-white/60'
              }`}
              title={
                isGmView
                  ? 'Visão do Mestre Ativa (Clique para mudar para Visão do Jogador)'
                  : 'Visão do Jogador (Clique para autenticar como Mestre e alternar para GM View)'
              }
            >
              <Crown 
                size={14} 
                className={
                  isGmView 
                    ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110' 
                    : 'text-neutral-400'
                } 
              />
            </button>
          </div>

        </div>
      </header>

      {/* Campaign Characters Roster Bar (Visível estritamente para o Mestre: isGmView) */}
      {isGmView && (
        <GmRosterBar
          characters={campaignCharacters}
          activeCharacterId={activeCharacterId}
          onSelectCharacter={(id) => {
            setActiveCharacterId(id);
            const targetChar = campaignCharacters.find((c) => c.id === id);
            if (targetChar) {
              loadedCharacterIdRef.current = id;
              lastSavedJsonRef.current = JSON.stringify(targetChar.data);
              setData(targetChar.data);
            }
          }}
          onAddCharacter={handleAddCampaignCharacter}
          onRequestDeleteCharacter={(char) => setCharacterToDelete(char)}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          isGmView={isGmView}
        />
      )}

      {/* CONDITIONAL ENVIRONMENT RENDER */}
      {activeEnvironment === 'battleTracker' ? (
        <BattleTrackerEnvironment
          characterName={data.identity.name}
          characterAvatar={data.identity.avatarUrl}
          isGmView={isGmView}
          activeCharacterData={data}
          onSwitchToSheet={() => setActiveEnvironment('sheet')}
        />
      ) : (
        <main className="p-4 flex flex-col gap-8 max-w-lg mx-auto relative z-0">
        <section id="profile" className="flex flex-col gap-6">
          <BentoBox 
            title="Identidade" 
            titleClassName="text-violet-400"
            className="cursor-pointer group"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest('input') || 
                target.closest('textarea') || 
                target.closest('button') || 
                target.closest('.language-selector-container') ||
                target.closest('.alignment-container') ||
                target.closest('.identity-image-container')
              ) {
                return;
              }
              setIsIdentityExpanded(!isIdentityExpanded);
            }}
            rightContent={
              <div className="flex gap-1 transition-all duration-300">
                {isIdentityExpanded ? (
                  <>
                    <div className="w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_currentColor]" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-60" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30" />
                  </>
                ) : (
                  <>
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                    <div className="w-1 h-1 rounded-full bg-violet-400 opacity-30 group-hover:bg-violet-400 group-hover:opacity-50 transition-all duration-300" />
                  </>
                )}
              </div>
            }
          >
            <Identity data={data.identity} update={updateIdentity} readonly={!isEditing} expanded={isIdentityExpanded} />
            
            <div 
              className={`grid transition-all duration-500 ease-in-out alignment-container ${
                isIdentityExpanded ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-white/5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden">
                <h3 className="text-[10px] tracking-widest text-violet-400/60 uppercase font-medium mb-4">Alinhamento</h3>
                <Alignment data={data.alignment} update={updateAlignment} readonly={!isEditing} expanded={isIdentityExpanded} />
              </div>
            </div>
          </BentoBox>

          <BentoBox title="Personalidade" titleClassName="text-violet-400">
            <Personality 
              data={data.personality} 
              update={updatePersonality} 
              readonly={!isEditing} 
              onRoll={rollPersonality}
            />
          </BentoBox>

          <BentoBox title="Vantagens & Desvantagens" titleClassName="text-violet-400">
            <Traits data={data.traits} add={addTrait} update={updateTrait} remove={removeTrait} readonly={!isEditing} />
          </BentoBox>

          {/* FLUXO E PATRONO */}
          <FlowAndPatron 
            data={data.flowAndPatron || initialCharacterData.flowAndPatron!}
            update={updateFlowAndPatron}
            readonly={!isEditing}
          />

          {/* PONTOS DE VIDA - Solto no fundo */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Heart size={15} className="fill-rose-500/20 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <span>Pontos de Vida</span>
              </div>
              <div className="flex items-center gap-2.5 text-[9px] text-white/50 tracking-wider">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" /> Simples</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" /> Letal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)]" /> Agravado</span>
              </div>
            </div>

            <HealthTracker 
              data={data.health} 
              update={(part, idx, val) => setData(prev => {
                const newPart = [...prev.health[part]];
                newPart[idx] = val;
                return { ...prev, health: { ...prev.health, [part]: newPart } };
              })}
              readonly={false} 
            />
          </div>
        </section>

        <section id="stats" className="flex flex-col gap-6">
          {/* FÍSICO */}
          <StatIntersectionBox 
            title="Físico" 
            theme="rose"
            manaTotal={(Object.values(data.attributes.physical) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.physical}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, physical: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-rose-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Força" value={data.attributes.physical.strength} onChange={(v: number) => updateAttributes('physical', 'strength', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Força', data.attributes.physical.strength, 'rose')} />
                  <AttributeInput label="Destreza" value={data.attributes.physical.dexterity} onChange={(v: number) => updateAttributes('physical', 'dexterity', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Destreza', data.attributes.physical.dexterity, 'rose')} />
                  <AttributeInput label="Agilidade" value={data.attributes.physical.agility} onChange={(v: number) => updateAttributes('physical', 'agility', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Agilidade', data.attributes.physical.agility, 'rose')} />
                  <AttributeInput label="Constituição" value={data.attributes.physical.constitution} onChange={(v: number) => updateAttributes('physical', 'constitution', v)} theme="rose" readonly={!isEditing} onRoll={() => rollAttribute('Constituição', data.attributes.physical.constitution, 'rose')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-rose-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Armas Brancas" value={data.skills.physical.melee} onChange={(v) => updateSkills('physical', 'melee', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Armas Brancas', data.skills.physical.melee, 'rose')} />
                  <DotRating label="Armas de Fogo" value={data.skills.physical.firearms} onChange={(v) => updateSkills('physical', 'firearms', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Armas de Fogo', data.skills.physical.firearms, 'rose')} />
                  <DotRating label="Arquearia" value={data.skills.physical.archery} onChange={(v) => updateSkills('physical', 'archery', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Arquearia', data.skills.physical.archery, 'rose')} />
                  <DotRating label="Arremesso" value={data.skills.physical.throwing} onChange={(v) => updateSkills('physical', 'throwing', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Arremesso', data.skills.physical.throwing, 'rose')} />
                  <DotRating label="Briga" value={data.skills.physical.brawl} onChange={(v) => updateSkills('physical', 'brawl', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Briga', data.skills.physical.brawl, 'rose')} />
                  <DotRating label="Combate" value={data.skills.physical.combat} onChange={(v) => updateSkills('physical', 'combat', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Combate', data.skills.physical.combat, 'rose')} />
                  <DotRating label="Furtividade" value={data.skills.physical.stealth} onChange={(v) => updateSkills('physical', 'stealth', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Furtividade', data.skills.physical.stealth, 'rose')} />
                  <DotRating label="Prontidão" value={data.skills.physical.alertness} onChange={(v) => updateSkills('physical', 'alertness', v)} theme="rose" readonly={!isEditing} onRoll={() => rollSkill('Prontidão', data.skills.physical.alertness, 'rose')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Treinamentos" 
                skills={data.customSkills.treinamentos} 
                add={(name) => addCustomSkill('treinamentos', name)} 
                update={(id, v) => updateCustomSkill('treinamentos', id, v)} 
                remove={(id) => removeCustomSkill('treinamentos', id)} 
                readonly={!isEditing} 
                theme="rose" 
                onRoll={(name, val) => rollSkill(name, val, 'rose')}
              />
            </div>
          </StatIntersectionBox>

          {/* MENTAL */}
          <StatIntersectionBox 
            title="Mental" 
            theme="cyan"
            manaTotal={(Object.values(data.attributes.mental) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.mental}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, mental: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-cyan-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Inteligência" value={data.attributes.mental.intelligence} onChange={(v: number) => updateAttributes('mental', 'intelligence', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Inteligência', data.attributes.mental.intelligence, 'cyan')} />
                  <AttributeInput label="Percepção" value={data.attributes.mental.perception} onChange={(v: number) => updateAttributes('mental', 'perception', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Percepção', data.attributes.mental.perception, 'cyan')} />
                  <AttributeInput label="Raciocínio" value={data.attributes.mental.reasoning} onChange={(v: number) => updateAttributes('mental', 'reasoning', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Raciocínio', data.attributes.mental.reasoning, 'cyan')} />
                  <AttributeInput label="Sabedoria" value={data.attributes.mental.wisdom} onChange={(v: number) => updateAttributes('mental', 'wisdom', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollAttribute('Sabedoria', data.attributes.mental.wisdom, 'cyan')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-cyan-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Acadêmicos" value={data.skills.mental.academics} onChange={(v) => updateSkills('mental', 'academics', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Acadêmicos', data.skills.mental.academics, 'cyan')} />
                  <DotRating label="Armadilhas" value={data.skills.mental.traps} onChange={(v) => updateSkills('mental', 'traps', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Armadilhas', data.skills.mental.traps, 'cyan')} />
                  <DotRating label="Intuição" value={data.skills.mental.intuition} onChange={(v) => updateSkills('mental', 'intuition', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Intuição', data.skills.mental.intuition, 'cyan')} />
                  <DotRating label="Investigação" value={data.skills.mental.investigation} onChange={(v) => updateSkills('mental', 'investigation', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Investigação', data.skills.mental.investigation, 'cyan')} />
                  <DotRating label="Medicina" value={data.skills.mental.medicine} onChange={(v) => updateSkills('mental', 'medicine', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Medicina', data.skills.mental.medicine, 'cyan')} />
                  <DotRating label="Ocultismo" value={data.skills.mental.occultism} onChange={(v) => updateSkills('mental', 'occultism', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Ocultismo', data.skills.mental.occultism, 'cyan')} />
                  <DotRating label="Segurança" value={data.skills.mental.security} onChange={(v) => updateSkills('mental', 'security', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Segurança', data.skills.mental.security, 'cyan')} />
                  <DotRating label="Sobrevivência" value={data.skills.mental.survival} onChange={(v) => updateSkills('mental', 'survival', v)} theme="cyan" readonly={!isEditing} onRoll={() => rollSkill('Sobrevivência', data.skills.mental.survival, 'cyan')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Ciências" 
                skills={data.customSkills.ciencias} 
                add={(name) => addCustomSkill('ciencias', name)} 
                update={(id, v) => updateCustomSkill('ciencias', id, v)} 
                remove={(id) => removeCustomSkill('ciencias', id)} 
                readonly={!isEditing} 
                theme="cyan" 
                onRoll={(name, val) => rollSkill(name, val, 'cyan')}
              />
            </div>
          </StatIntersectionBox>

          {/* SOCIAL */}
          <StatIntersectionBox 
            title="Social" 
            theme="emerald"
            manaTotal={(Object.values(data.attributes.social) as number[]).reduce((a, b) => a + b, 0)}
            manaSpent={data.manaSpent.social}
            onManaChange={(v: number) => setData(prev => ({ ...prev, manaSpent: { ...prev.manaSpent, social: v } }))}
            readonly={!isEditing}
          >
            <div className="flex flex-col gap-6" tabIndex={0}>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] tracking-widest text-emerald-400/60 uppercase font-medium mb-1 text-left">Atributos</h3>
                <div className="grid grid-cols-4 gap-3">
                  <AttributeInput label="Empatia" value={data.attributes.social.empathy} onChange={(v: number) => updateAttributes('social', 'empathy', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Empatia', data.attributes.social.empathy, 'emerald')} />
                  <AttributeInput label="Manipulação" value={data.attributes.social.manipulation} onChange={(v: number) => updateAttributes('social', 'manipulation', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Manipulação', data.attributes.social.manipulation, 'emerald')} />
                  <AttributeInput label="Expressão" value={data.attributes.social.expression} onChange={(v: number) => updateAttributes('social', 'expression', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Expressão', data.attributes.social.expression, 'emerald')} />
                  <AttributeInput label="Resiliência" value={data.attributes.social.resilience} onChange={(v: number) => updateAttributes('social', 'resilience', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollAttribute('Resiliência', data.attributes.social.resilience, 'emerald')} />
                </div>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] tracking-widest text-emerald-400/60 uppercase font-medium text-left">Perícias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DotRating label="Barganha" value={data.skills.social.bargain} onChange={(v) => updateSkills('social', 'bargain', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Barganha', data.skills.social.bargain, 'emerald')} />
                  <DotRating label="Adestramento" value={data.skills.social.taming} onChange={(v) => updateSkills('social', 'taming', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Adestramento', data.skills.social.taming, 'emerald')} />
                  <DotRating label="Etiqueta" value={data.skills.social.etiquette} onChange={(v) => updateSkills('social', 'etiquette', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Etiqueta', data.skills.social.etiquette, 'emerald')} />
                  <DotRating label="Intimidação" value={data.skills.social.intimidation} onChange={(v) => updateSkills('social', 'intimidation', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Intimidação', data.skills.social.intimidation, 'emerald')} />
                  <DotRating label="Lábia" value={data.skills.social.smoothTalk} onChange={(v) => updateSkills('social', 'smoothTalk', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Lábia', data.skills.social.smoothTalk, 'emerald')} />
                  <DotRating label="Liderança" value={data.skills.social.leadership} onChange={(v) => updateSkills('social', 'leadership', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Liderança', data.skills.social.leadership, 'emerald')} />
                  <DotRating label="Montaria" value={data.skills.social.riding} onChange={(v) => updateSkills('social', 'riding', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Montaria', data.skills.social.riding, 'emerald')} />
                  <DotRating label="Sedução" value={data.skills.social.seduction} onChange={(v) => updateSkills('social', 'seduction', v)} theme="emerald" readonly={!isEditing} onRoll={() => rollSkill('Sedução', data.skills.social.seduction, 'emerald')} />
                </div>
              </div>
                
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent w-full" />
              
              <CustomSkillsSection 
                title="Artes" 
                skills={data.customSkills.artes} 
                add={(name) => addCustomSkill('artes', name)} 
                update={(id, v) => updateCustomSkill('artes', id, v)} 
                remove={(id) => removeCustomSkill('artes', id)} 
                readonly={!isEditing} 
                theme="emerald" 
                onRoll={(name, val) => rollSkill(name, val, 'emerald')}
              />
            </div>
          </StatIntersectionBox>
        </section>

        {/* ARSENAL & INVENTÁRIO (MODO TÁTICO & COMPLETO) */}
        <section id="inventory" className="flex flex-col gap-6">
          <InventoryManager
            inventory={data.inventory || initialCharacterData.inventory}
            onUpdateInventory={updateInventory}
            readonly={false}
            onRollDamage={rollDamage}
          />
        </section>

        <section id="magic" className="flex flex-col gap-6">
          {/* DOMÍNIOS ELEMENTAIS - Solto no fundo */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Sparkles size={15} className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)]" />
                <span>Domínios Elementais</span>
              </div>
            </div>

            <Domains 
              data={data.domains} 
              update={updateDomains} 
              readonly={!isEditing} 
            />
          </div>

          {/* RESERVA DE NATUREZA - Separada */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-[11px] tracking-[0.25em] uppercase">
                <Sparkles size={15} className="text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]" />
                <span>Natureza Elemental</span>
              </div>
            </div>

            <NaturezaTracker 
              domains={data.domains} 
              personalityTotal={(Object.values(data.personality) as number[]).reduce((a, b) => a + b, 0)}
              naturezaSpent={data.naturezaSpent}
              onNaturezaChange={(domain, v) => setData(prev => ({ ...prev, naturezaSpent: { ...prev.naturezaSpent, [domain]: v } }))}
              readonly={false}
            />
          </div>

          <BentoBox title="Habilidades Especiais" titleClassName="text-fuchsia-400">
            <Abilities 
              data={data.abilities} 
              add={addAbility} 
              remove={removeAbility} 
              toggleSelect={toggleAbilitySelect}
              readonly={!isEditing} 
            />
          </BentoBox>
        </section>
      </main>
      )}

      {/* Fixed Bottom Navigation - Neon Minimalist (Sheet Environment Only) */}
      {activeEnvironment === 'sheet' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#030014]/80 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToSection('profile')}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                activeTab === 'profile' ? 'bg-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Perfil & Saúde"
            >
              <User size={20} className={activeTab === 'profile' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
            </button>
            <button
              onClick={() => scrollToSection('stats')}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                activeTab === 'stats' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Atributos & Perícias"
            >
              <ScrollText size={20} className={activeTab === 'stats' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
            </button>
            <button
              onClick={() => scrollToSection('inventory')}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                activeTab === 'inventory' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Equipamento & Inventário"
            >
              <Backpack size={20} className={activeTab === 'inventory' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
            </button>
            <button
              onClick={() => scrollToSection('magic')}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                activeTab === 'magic' ? 'bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title="Domínios & Magia"
            >
              <Sparkles size={20} className={activeTab === 'magic' ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
            </button>
          </div>
        </nav>
      )}

      {/* Dice Roller Tool */}
      <DiceRollerModal 
        request={diceRollRequest} 
        onClose={() => setDiceRollRequest(null)} 
        attributes={data.attributes}
      />

      {/* Guia de Ferramentas & Usabilidade (?) */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Autenticação & Troca de Conta / Ficha File-System */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        availableCharacters={availableCharacters}
        onLoginSuccess={handleLoginSuccess}
        defaultTab={authModalTab}
        currentSession={authSession}
        onLogout={handleLogout}
      />

      {/* Confirmação de Exclusão de Ficha pelo Game Master */}
      <DeleteCharacterModal
        isOpen={!!characterToDelete}
        onClose={() => setCharacterToDelete(null)}
        characterUsername={characterToDelete ? characterToDelete.id.replace(/^char-/, '') : ''}
        characterName={characterToDelete ? characterToDelete.name : ''}
        onConfirmDelete={handleConfirmDeleteCharacter}
      />

      {/* Aurora: Auxiliar Semi-Inteligente da Ficha (Zero Custos de IA / Regras Determinísticas) */}
      <AuroraAssistant
        isOpen={isAuroraOpen}
        onClose={() => setIsAuroraOpen(false)}
        characterData={data}
        onUpdateCharacterData={(updater) => {
          setData(updater);
        }}
        accentColor={activeChar?.color || '#a855f7'}
      />
    </div>
  );
}

