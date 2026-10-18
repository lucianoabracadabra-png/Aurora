import { joinRoom, Room, MessageAction } from 'trystero/nostr';
import { CharacterData, BodyHealth } from '../types';
import { supabase } from './storageApi';

export interface SheetSyncMessage {
  username: string;
  name?: string;
  color?: string;
  character: CharacterData;
  updatedAt: string;
}

export interface DeleteSheetSyncMessage {
  username: string;
}

export interface BattleSyncMessage {
  currentTick: number;
  previousTick: number;
  minTimespan: number;
  entities: any[];
  updatedAt: string;
}

export interface EntityHealthSyncMessage {
  entityId: string;
  health: BodyHealth;
  updatedAt: string;
  updater?: string;
}

type BattleListener = (battle: BattleSyncMessage) => void;
type EntityHealthListener = (msg: EntityHealthSyncMessage) => void;
type SheetListener = (sheet: SheetSyncMessage) => void;
type DeleteSheetListener = (data: DeleteSheetSyncMessage) => void;
type PeerCountListener = (count: number) => void;

class RealtimeSyncService {
  private room: Room | null = null;
  private isInitialized = false;
  private peers = new Set<string>();

  // Trystero Actions
  private battleAction?: MessageAction<any>;
  private sheetAction?: MessageAction<any>;
  private deleteSheetAction?: MessageAction<any>;
  private reqSyncAction?: MessageAction<any>;
  private fullSyncAction?: MessageAction<any>;

  // Supabase Realtime Channel
  private supabaseChannel: any = null;

  // Listeners
  private battleListeners = new Set<BattleListener>();
  private entityHealthListeners = new Set<EntityHealthListener>();
  private sheetListeners = new Set<SheetListener>();
  private deleteSheetListeners = new Set<DeleteSheetListener>();
  private peerCountListeners = new Set<PeerCountListener>();

  // Local BroadcastChannel for instant multi-tab sync on same machine
  private localChannel: BroadcastChannel | null = null;

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Local BroadcastChannel for instant multi-tab sync
    try {
      this.localChannel = new BroadcastChannel('aurora_rpg_local_sync');
      this.localChannel.onmessage = (event) => {
        const { type, data } = event.data || {};
        if (type === 'BATTLE') {
          this.battleListeners.forEach((fn) => fn(data));
        } else if (type === 'ENTITY_HEALTH') {
          this.entityHealthListeners.forEach((fn) => fn(data));
        } else if (type === 'SHEET') {
          this.sheetListeners.forEach((fn) => fn(data));
        } else if (type === 'DELETE_SHEET') {
          this.deleteSheetListeners.forEach((fn) => fn(data));
        }
      };
    } catch {}

    // 2. Supabase Realtime Channel (WebSocket Pub/Sub)
    try {
      this.supabaseChannel = supabase.channel('arcana_room', {
        config: { broadcast: { self: false } }
      });

      this.supabaseChannel
        .on('broadcast', { event: 'battle_update' }, ({ payload }: any) => {
          if (payload) this.battleListeners.forEach((fn) => fn(payload));
        })
        .on('broadcast', { event: 'entity_health_update' }, ({ payload }: any) => {
          if (payload) this.entityHealthListeners.forEach((fn) => fn(payload));
        })
        .on('broadcast', { event: 'sheet_update' }, ({ payload }: any) => {
          if (payload) this.sheetListeners.forEach((fn) => fn(payload));
        })
        .on('broadcast', { event: 'delete_sheet' }, ({ payload }: any) => {
          if (payload) this.deleteSheetListeners.forEach((fn) => fn(payload));
        })
        // Also listen to Postgres table changes in public schema
        .on('postgres_changes', { event: '*', schema: 'public', table: 'battle' }, (payload: any) => {
          if (payload?.new?.data) {
            this.battleListeners.forEach((fn) => fn(payload.new.data));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (payload: any) => {
          if (payload?.new) {
            const c = payload.new;
            this.sheetListeners.forEach((fn) => fn({
              username: c.username,
              name: c.name,
              color: c.color,
              character: c.character,
              updatedAt: c.updated_at
            }));
          }
        })
        .subscribe((status: string) => {
          console.log('[Supabase:Realtime] Channel status:', status);
        });
    } catch (err) {
      console.warn('[RealtimeSync] Supabase Realtime init error:', err);
    }

    // 3. Trystero WebRTC Mesh fallback
    try {
      const config = { appId: 'aurora-rpg-v1' };
      this.room = joinRoom(config, 'aurora-global-table');

      this.battleAction = this.room.makeAction('battle');
      this.sheetAction = this.room.makeAction('sheet');
      this.deleteSheetAction = this.room.makeAction('delete_sheet');
      this.reqSyncAction = this.room.makeAction('req_sync');
      this.fullSyncAction = this.room.makeAction('full_sync');

      this.battleAction.onMessage = (data: any) => {
        this.battleListeners.forEach((fn) => fn(data as BattleSyncMessage));
      };

      this.sheetAction.onMessage = (data: any) => {
        this.sheetListeners.forEach((fn) => fn(data as SheetSyncMessage));
      };

      this.deleteSheetAction.onMessage = (data: any) => {
        this.deleteSheetListeners.forEach((fn) => fn(data as DeleteSheetSyncMessage));
      };

      this.reqSyncAction.onMessage = (_dummy: any, context) => {
        try {
          const rawBattle = localStorage.getItem('arcana_battle_tracker_state');
          let battle: BattleSyncMessage | undefined;
          if (rawBattle) {
            battle = JSON.parse(rawBattle);
          }
          if (battle && this.fullSyncAction) {
            this.fullSyncAction.send({ battle }, { target: context.peerId });
          }
        } catch {}
      };

      this.fullSyncAction.onMessage = (payload: any) => {
        if (payload?.battle) {
          this.battleListeners.forEach((fn) => fn(payload.battle));
        }
        if (payload?.sheets && Array.isArray(payload.sheets)) {
          payload.sheets.forEach((s: SheetSyncMessage) => {
            this.sheetListeners.forEach((fn) => fn(s));
          });
        }
      };

      this.room.onPeerJoin = (peerId: string) => {
        this.peers.add(peerId);
        this.notifyPeerCount();
        if (this.reqSyncAction) {
          this.reqSyncAction.send({ req: true }, { target: peerId });
        }
      };

      this.room.onPeerLeave = (peerId: string) => {
        this.peers.delete(peerId);
        this.notifyPeerCount();
      };
    } catch (err) {
      console.warn('[RealtimeSync] WebRTC initialization skipped:', err);
    }
  }

  broadcastBattle(battle: BattleSyncMessage) {
    // 1. Broadcast locally (multi-tab)
    try {
      this.localChannel?.postMessage({ type: 'BATTLE', data: battle });
    } catch {}

    // 2. Broadcast via Supabase Realtime
    try {
      if (this.supabaseChannel) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'battle_update',
          payload: battle
        });
      }
    } catch {}

    // 3. Broadcast globally over WebRTC
    try {
      if (this.battleAction) {
        this.battleAction.send(battle as any);
      }
    } catch (e) {
      console.warn('[RealtimeSync] broadcastBattle error:', e);
    }
  }

  broadcastEntityHealth(msg: EntityHealthSyncMessage) {
    try {
      this.localChannel?.postMessage({ type: 'ENTITY_HEALTH', data: msg });
    } catch {}

    try {
      if (this.supabaseChannel) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'entity_health_update',
          payload: msg
        });
      }
    } catch {}
  }

  broadcastSheet(sheet: SheetSyncMessage) {
    // 1. Broadcast locally
    try {
      this.localChannel?.postMessage({ type: 'SHEET', data: sheet });
    } catch {}

    // 2. Broadcast via Supabase Realtime
    try {
      if (this.supabaseChannel) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'sheet_update',
          payload: sheet
        });
      }
    } catch {}

    // 3. Broadcast globally
    try {
      if (this.sheetAction) {
        this.sheetAction.send(sheet as any);
      }
    } catch (e) {
      console.warn('[RealtimeSync] broadcastSheet error:', e);
    }
  }

  broadcastDeleteSheet(username: string) {
    try {
      this.localChannel?.postMessage({ type: 'DELETE_SHEET', data: { username } });
    } catch {}

    try {
      if (this.supabaseChannel) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'delete_sheet',
          payload: { username }
        });
      }
    } catch {}

    try {
      if (this.deleteSheetAction) {
        this.deleteSheetAction.send({ username });
      }
    } catch {}
  }

  onBattleUpdate(fn: BattleListener): () => void {
    this.battleListeners.add(fn);
    return () => this.battleListeners.delete(fn);
  }

  onEntityHealthUpdate(fn: EntityHealthListener): () => void {
    this.entityHealthListeners.add(fn);
    return () => this.entityHealthListeners.delete(fn);
  }

  onSheetUpdate(fn: SheetListener): () => void {
    this.sheetListeners.add(fn);
    return () => this.sheetListeners.delete(fn);
  }

  onDeleteSheet(fn: DeleteSheetListener): () => void {
    this.deleteSheetListeners.add(fn);
    return () => this.deleteSheetListeners.delete(fn);
  }

  onPeerCountChange(fn: PeerCountListener): () => void {
    this.peerCountListeners.add(fn);
    fn(this.peers.size);
    return () => this.peerCountListeners.delete(fn);
  }

  private notifyPeerCount() {
    const count = this.peers.size;
    this.peerCountListeners.forEach((fn) => fn(count));
  }

  getConnectedPeersCount(): number {
    return this.peers.size;
  }
}

export const realtimeSync = new RealtimeSyncService();
