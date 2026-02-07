import { PackageData } from '../types';

const DB_NAME = 'SortingSystemDB';
const DB_VERSION = 1;
const STORE_NAME = 'packages';

class IndexedDBService {
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'tracking_number'
          });

          // 创建索引以提高查询性能
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('imported_at', 'imported_at', { unique: false });
          objectStore.createIndex('zone', 'zone', { unique: false });
        }
      };
    });
  }

  // 批量保存数据
  async saveAll(packages: PackageData[]): Promise<void> {
    if (!this.db) await this.init();

    // 如果是空数组，直接返回成功
    if (packages.length === 0) {
      console.log('[IndexedDB] 空数据，跳过保存');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      // 批量写入
      packages.forEach(pkg => {
        objectStore.put(pkg);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 保存单条数据
  async save(pkg: PackageData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(pkg);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  async getAll(): Promise<PackageData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 根据tracking_number获取单条数据
  async get(trackingNumber: string): Promise<PackageData | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(trackingNumber);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 清空所有数据
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取数据库统计信息
  async getStats(): Promise<{ total: number; scanned: number; pending: number }> {
    const packages = await this.getAll();
    const total = packages.length;
    const scanned = packages.filter(p => p.status === 'scanned').length;
    const pending = total - scanned;

    return { total, scanned, pending };
  }

  // 删除数据库
  async deleteDB(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 导出单例
export const indexedDB = new IndexedDBService();
