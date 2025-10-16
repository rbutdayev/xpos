interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // time to live in milliseconds
}

class DashboardCache {
    private cache = new Map<string, CacheItem<any>>();

    set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    has(key: string): boolean {
        const item = this.cache.get(key);
        
        if (!item) {
            return false;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired items
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache statistics
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // Get cache key with parameters
    generateKey(base: string, params: Record<string, any> = {}): string {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        return paramString ? `${base}?${paramString}` : base;
    }
}

// Create singleton instance
const dashboardCache = new DashboardCache();

// Cleanup expired items every 10 minutes
setInterval(() => {
    dashboardCache.cleanup();
}, 10 * 60 * 1000);

export default dashboardCache;