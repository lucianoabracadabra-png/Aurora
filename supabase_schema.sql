-- =====================================================================
-- RECRIAÇÃO TOTAL DA BASE DO SUPABASE PARA O SISTEMA ARCANA RPG
-- Execute este script no SQL Editor do seu Supabase Dashboard:
-- https://supabase.com/dashboard/project/urofgdfhpvjcnwmdjvsp/sql
-- =====================================================================

-- 1. LIMPAR TABELAS E POLÍTICAS ANTERIORES (RESET TOTAL GARANTIDO)
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.gamemaster CASCADE;
DROP TABLE IF EXISTS public.battle CASCADE;

-- 2. CRIAR TABELA: characters (Fichas de Personagem)
CREATE TABLE public.characters (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#a855f7',
  character JSONB NOT NULL DEFAULT '{}'::jsonb,
  password TEXT DEFAULT '123123123',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. CRIAR TABELA: gamemaster (Painel do Mestre)
CREATE TABLE public.gamemaster (
  id TEXT PRIMARY KEY DEFAULT 'gm',
  name TEXT DEFAULT 'Game Master',
  password TEXT DEFAULT 'saidaquiburro',
  connected_characters TEXT[] DEFAULT ARRAY['jose', 'breno', 'lucas', 'gabo', 'kami']::text[],
  campaign_notes TEXT DEFAULT 'Campanha Principal Arcana - Supabase Conectado',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. CRIAR TABELA: battle (Battle Tracker & Linha Temporal)
CREATE TABLE public.battle (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Garante retrocompatibilidade de migração caso a tabela battle já existisse sem version:
ALTER TABLE IF EXISTS public.battle ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1;

-- =====================================================================
-- 5. HABILITAR SUPABASE REALTIME (ATUALIZAÇÃO AO VIVO EM WEBSOCKET)
-- =====================================================================
DO $$
BEGIN
  -- Cria a publicação se ainda não existir
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Adiciona as 3 tabelas na replicação Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'characters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gamemaster'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gamemaster;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'battle'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle;
  END IF;
END $$;

-- =====================================================================
-- 6. CONFIGURAR ROW LEVEL SECURITY (RLS) & POLÍTICAS DE ACESSO
-- =====================================================================
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamemaster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle ENABLE ROW LEVEL SECURITY;

-- Limpa políticas pré-existentes se houver
DROP POLICY IF EXISTS "Public select characters" ON public.characters;
DROP POLICY IF EXISTS "Public insert characters" ON public.characters;
DROP POLICY IF EXISTS "Public update characters" ON public.characters;
DROP POLICY IF EXISTS "Public delete characters" ON public.characters;

DROP POLICY IF EXISTS "Public select gamemaster" ON public.gamemaster;
DROP POLICY IF EXISTS "Public insert gamemaster" ON public.gamemaster;
DROP POLICY IF EXISTS "Public update gamemaster" ON public.gamemaster;

DROP POLICY IF EXISTS "Public select battle" ON public.battle;
DROP POLICY IF EXISTS "Public insert battle" ON public.battle;
DROP POLICY IF EXISTS "Public update battle" ON public.battle;

-- Políticas para CHARACTERS (Permissões abertas no Postgres; controle de autoria gerenciado no App)
CREATE POLICY "Public select characters" 
ON public.characters FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public insert characters" 
ON public.characters FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Public update characters" 
ON public.characters FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete characters" 
ON public.characters FOR DELETE 
TO public 
USING (true);

-- Políticas para GAMEMASTER
CREATE POLICY "Public select gamemaster" 
ON public.gamemaster FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public insert gamemaster" 
ON public.gamemaster FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Public update gamemaster" 
ON public.gamemaster FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- Políticas para BATTLE TRACKER
CREATE POLICY "Public select battle" 
ON public.battle FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public insert battle" 
ON public.battle FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Public update battle" 
ON public.battle FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- =====================================================================
-- 7. SEED INICIAL: REGISTROS PADRÃO DE JOGADORES, MESTRE E BATALHA
-- =====================================================================

-- 7.1 Game Master
INSERT INTO public.gamemaster (id, name, password, connected_characters, campaign_notes, updated_at)
VALUES (
  'gm',
  'Game Master',
  'saidaquiburro',
  ARRAY['jose', 'breno', 'lucas', 'gabo', 'kami']::text[],
  'Campanha Principal Arcana - Supabase Conectado',
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  connected_characters = EXCLUDED.connected_characters,
  campaign_notes = EXCLUDED.campaign_notes,
  updated_at = EXCLUDED.updated_at;

-- 7.2 Battle Tracker Inicial
INSERT INTO public.battle (id, data, version, updated_at)
VALUES (
  'main',
  '{
    "currentTick": 0,
    "previousTick": 0,
    "minTimespan": 15,
    "entities": [
      { "id": "player-jose", "name": "Jose", "type": "player", "color": "#a855f7", "currentTick": 0, "history": [], "steps": [], "hp": 20, "maxHp": 20, "defaultDelay": 3 },
      { "id": "player-breno", "name": "Breno", "type": "player", "color": "#06b6d4", "currentTick": 0, "history": [], "steps": [], "hp": 20, "maxHp": 20, "defaultDelay": 3 },
      { "id": "player-lucas", "name": "Lucas", "type": "player", "color": "#10b981", "currentTick": 0, "history": [], "steps": [], "hp": 20, "maxHp": 20, "defaultDelay": 3 },
      { "id": "player-gabo", "name": "Gabo", "type": "player", "color": "#f59e0b", "currentTick": 0, "history": [], "steps": [], "hp": 20, "maxHp": 20, "defaultDelay": 3 },
      { "id": "player-kami", "name": "Kami", "type": "player", "color": "#ec4899", "currentTick": 0, "history": [], "steps": [], "hp": 20, "maxHp": 20, "defaultDelay": 3 }
    ]
  }'::jsonb,
  1,
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  version = EXCLUDED.version,
  updated_at = EXCLUDED.updated_at;

-- 7.3 Fichas Iniciais dos 5 Personagens
INSERT INTO public.characters (username, name, color, password, character, created_at, updated_at)
VALUES 
  ('jose', 'Jose', '#a855f7', '123123123', '{"identity":{"name":"Jose","origin":"Aventureiro","languages":["Ma''isha","Igbalim"]},"alignment":{"altruism":1,"logic":1,"integrity":1},"personality":{"courage":1,"conviction":1,"serenity":1},"attributes":{"physical":{"strength":1,"dexterity":1,"agility":1,"constitution":1},"mental":{"intelligence":1,"perception":1,"reasoning":1,"wisdom":1},"social":{"empathy":1,"manipulation":1,"expression":1,"resilience":1}},"skills":{"physical":{"melee":1,"firearms":1,"archery":1,"throwing":1,"brawl":1,"combat":1,"stealth":1,"alertness":1},"mental":{"academics":1,"traps":1,"intuition":1,"investigation":1,"medicine":1,"occultism":1,"security":1,"survival":1},"social":{"bargain":1,"taming":1,"etiquette":1,"intimidation":1,"smoothTalk":1,"leadership":1,"riding":1,"seduction":1}},"customSkills":{"treinamentos":[],"ciencias":[],"artes":[]},"domains":{"water":1,"air":1,"anima":1,"fire":1,"earth":1},"abilities":[],"traits":[],"manaSpent":{"physical":0,"mental":0,"social":0},"naturezaSpent":{"water":0,"air":0,"anima":0,"fire":0,"earth":0},"health":{"head":["none","none","none","none","none","none","none","none"],"torso":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"leftArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"rightArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"leftLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"rightLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"]},"inventory":{"equippedSlots":{},"weapons":[],"armors":[],"projectiles":[],"accessories":[],"generalItems":[],"currency":{"gold":1,"silver":1,"copper":1,"gems":"","history":[]}}}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('breno', 'Breno', '#06b6d4', '123123123', '{"identity":{"name":"Breno","origin":"Aventureiro","languages":["Ma''isha","Igbalim"]},"alignment":{"altruism":1,"logic":1,"integrity":1},"personality":{"courage":1,"conviction":1,"serenity":1},"attributes":{"physical":{"strength":1,"dexterity":1,"agility":1,"constitution":1},"mental":{"intelligence":1,"perception":1,"reasoning":1,"wisdom":1},"social":{"empathy":1,"manipulation":1,"expression":1,"resilience":1}},"skills":{"physical":{"melee":1,"firearms":1,"archery":1,"throwing":1,"brawl":1,"combat":1,"stealth":1,"alertness":1},"mental":{"academics":1,"traps":1,"intuition":1,"investigation":1,"medicine":1,"occultism":1,"security":1,"survival":1},"social":{"bargain":1,"taming":1,"etiquette":1,"intimidation":1,"smoothTalk":1,"leadership":1,"riding":1,"seduction":1}},"customSkills":{"treinamentos":[],"ciencias":[],"artes":[]},"domains":{"water":1,"air":1,"anima":1,"fire":1,"earth":1},"abilities":[],"traits":[],"manaSpent":{"physical":0,"mental":0,"social":0},"naturezaSpent":{"water":0,"air":0,"anima":0,"fire":0,"earth":0},"health":{"head":["none","none","none","none","none","none","none","none"],"torso":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"leftArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"rightArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"leftLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"rightLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"]},"inventory":{"equippedSlots":{},"weapons":[],"armors":[],"projectiles":[],"accessories":[],"generalItems":[],"currency":{"gold":1,"silver":1,"copper":1,"gems":"","history":[]}}}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('lucas', 'Lucas', '#10b981', '123123123', '{"identity":{"name":"Lucas","origin":"Aventureiro","languages":["Ma''isha","Tantumá"]},"alignment":{"altruism":1,"logic":1,"integrity":1},"personality":{"courage":1,"conviction":1,"serenity":1},"attributes":{"physical":{"strength":1,"dexterity":1,"agility":1,"constitution":1},"mental":{"intelligence":1,"perception":1,"reasoning":1,"wisdom":1},"social":{"empathy":1,"manipulation":1,"expression":1,"resilience":1}},"skills":{"physical":{"melee":1,"firearms":1,"archery":1,"throwing":1,"brawl":1,"combat":1,"stealth":1,"alertness":1},"mental":{"academics":1,"traps":1,"intuition":1,"investigation":1,"medicine":1,"occultism":1,"security":1,"survival":1},"social":{"bargain":1,"taming":1,"etiquette":1,"intimidation":1,"smoothTalk":1,"leadership":1,"riding":1,"seduction":1}},"customSkills":{"treinamentos":[],"ciencias":[],"artes":[]},"domains":{"water":1,"air":1,"anima":1,"fire":1,"earth":1},"abilities":[],"traits":[],"manaSpent":{"physical":0,"mental":0,"social":0},"naturezaSpent":{"water":0,"air":0,"anima":0,"fire":0,"earth":0},"health":{"head":["none","none","none","none","none","none","none","none"],"torso":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"leftArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"rightArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"leftLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"rightLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"]},"inventory":{"equippedSlots":{},"weapons":[],"armors":[],"projectiles":[],"accessories":[],"generalItems":[],"currency":{"gold":1,"silver":1,"copper":1,"gems":"","history":[]}}}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('gabo', 'Gabo', '#f59e0b', '123123123', '{"identity":{"name":"Gabo","origin":"Aventureiro","languages":["Ma''isha","Igbalim"]},"alignment":{"altruism":1,"logic":1,"integrity":1},"personality":{"courage":1,"conviction":1,"serenity":1},"attributes":{"physical":{"strength":1,"dexterity":1,"agility":1,"constitution":1},"mental":{"intelligence":1,"perception":1,"reasoning":1,"wisdom":1},"social":{"empathy":1,"manipulation":1,"expression":1,"resilience":1}},"skills":{"physical":{"melee":1,"firearms":1,"archery":1,"throwing":1,"brawl":1,"combat":1,"stealth":1,"alertness":1},"mental":{"academics":1,"traps":1,"intuition":1,"investigation":1,"medicine":1,"occultism":1,"security":1,"survival":1},"social":{"bargain":1,"taming":1,"etiquette":1,"intimidation":1,"smoothTalk":1,"leadership":1,"riding":1,"seduction":1}},"customSkills":{"treinamentos":[],"ciencias":[],"artes":[]},"domains":{"water":1,"air":1,"anima":1,"fire":1,"earth":1},"abilities":[],"traits":[],"manaSpent":{"physical":0,"mental":0,"social":0},"naturezaSpent":{"water":0,"air":0,"anima":0,"fire":0,"earth":0},"health":{"head":["none","none","none","none","none","none","none","none"],"torso":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"leftArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"rightArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"leftLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"rightLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"]},"inventory":{"equippedSlots":{},"weapons":[],"armors":[],"projectiles":[],"accessories":[],"generalItems":[],"currency":{"gold":1,"silver":1,"copper":1,"gems":"","history":[]}}}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
  ('kami', 'Kami', '#ec4899', '123123123', '{"identity":{"name":"Kami","origin":"Aventureiro","languages":["Ma''isha","Tantumá"]},"alignment":{"altruism":1,"logic":1,"integrity":1},"personality":{"courage":1,"conviction":1,"serenity":1},"attributes":{"physical":{"strength":1,"dexterity":1,"agility":1,"constitution":1},"mental":{"intelligence":1,"perception":1,"reasoning":1,"wisdom":1},"social":{"empathy":1,"manipulation":1,"expression":1,"resilience":1}},"skills":{"physical":{"melee":1,"firearms":1,"archery":1,"throwing":1,"brawl":1,"combat":1,"stealth":1,"alertness":1},"mental":{"academics":1,"traps":1,"intuition":1,"investigation":1,"medicine":1,"occultism":1,"security":1,"survival":1},"social":{"bargain":1,"taming":1,"etiquette":1,"intimidation":1,"smoothTalk":1,"leadership":1,"riding":1,"seduction":1}},"customSkills":{"treinamentos":[],"ciencias":[],"artes":[]},"domains":{"water":1,"air":1,"anima":1,"fire":1,"earth":1},"abilities":[],"traits":[],"manaSpent":{"physical":0,"mental":0,"social":0},"naturezaSpent":{"water":0,"air":0,"anima":0,"fire":0,"earth":0},"health":{"head":["none","none","none","none","none","none","none","none"],"torso":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"leftArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"rightArm":["none","none","none","none","none","none","none","none","none","none","none","none"],"leftLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"],"rightLeg":["none","none","none","none","none","none","none","none","none","none","none","none","none","none","none","none"]},"inventory":{"equippedSlots":{},"weapons":[],"armors":[],"projectiles":[],"accessories":[],"generalItems":[],"currency":{"gold":1,"silver":1,"copper":1,"gems":"","history":[]}}}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now()))
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  character = EXCLUDED.character,
  updated_at = EXCLUDED.updated_at;
