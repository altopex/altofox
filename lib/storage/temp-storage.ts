/**
 * Ephemeral In-Memory Temporary Storage for Generated Websites.
 * 
 * Manages the lifecycle of unsaved websites:
 * GENERATE -> PREVIEW -> DOWNLOAD -> CLEANUP
 * 
 * Does NOT write large HTML/CSS/JS/asset files to the permanent database.
 * Auto-prunes expired sessions with a configurable TTL (default 1 hour).
 */

export interface TempWebsiteFile {
  path: string;
  content: string | Buffer;
  mimeType?: string | null;
}

export interface TempWebsite {
  id: string;
  name: string;
  files: TempWebsiteFile[];
  photos?: any[];
  qualityReport?: any;
  notes?: string;
  provider?: string;
  model?: string;
  domain?: string;
  themeName?: string;
  customContentInstructions?: string;
  formData?: any;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

class TempWebsiteStorage {
  private store = new Map<string, TempWebsite>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically sweep expired temporary websites every 10 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired();
      }, 10 * 60 * 1000);

      // Unref interval so it does not keep node process alive in tests/scripts
      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Registers a temporary generated website with TTL.
   */
  public register(
    data: Omit<TempWebsite, "createdAt" | "expiresAt"> & { ttlMs?: number }
  ): TempWebsite {
    this.cleanupExpired();

    const now = Date.now();
    const ttl = data.ttlMs || DEFAULT_TTL_MS;
    const tempItem: TempWebsite = {
      id: data.id,
      name: data.name,
      files: data.files,
      photos: data.photos || [],
      qualityReport: data.qualityReport,
      notes: data.notes,
      provider: data.provider,
      model: data.model,
      domain: data.domain,
      themeName: data.themeName,
      customContentInstructions: data.customContentInstructions,
      formData: data.formData,
      createdAt: now,
      expiresAt: now + ttl,
    };

    this.store.set(data.id, tempItem);
    return tempItem;
  }

  /**
   * Retrieves a temporary website by ID if not expired.
   */
  public get(id: string): TempWebsite | null {
    const item = this.store.get(id);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(id);
      return null;
    }

    return item;
  }

  /**
   * Checks if a temporary website exists and is valid.
   */
  public has(id: string): boolean {
    return this.get(id) !== null;
  }

  /**
   * Explicitly removes a temporary website (e.g. after user downloads or decides to save).
   */
  public delete(id: string): boolean {
    return this.store.delete(id);
  }

  /**
   * Sweeps and prunes all expired temporary websites.
   * Returns the count of removed items.
   */
  public cleanupExpired(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(id);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Returns current count of active temporary websites.
   */
  public size(): number {
    this.cleanupExpired();
    return this.store.size;
  }

  /**
   * Clears all temporary websites.
   */
  public clear(): void {
    this.store.clear();
  }
}

// Global singleton to persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __tempWebsiteStorage: TempWebsiteStorage | undefined;
}

export const tempStorage: TempWebsiteStorage =
  global.__tempWebsiteStorage || new TempWebsiteStorage();

if (process.env.NODE_ENV !== "production") {
  global.__tempWebsiteStorage = tempStorage;
}
