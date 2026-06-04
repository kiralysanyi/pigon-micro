const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("kdb", 2);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("keys")) {
                db.createObjectStore("keys", { keyPath: "id" });
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

export const saveKey = async (id: string, key: CryptoKey): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("keys", "readwrite");
        transaction.objectStore("keys").put({ id, key });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getKey = async (id: string): Promise<CryptoKey> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("keys", "readonly");
        const request = transaction.objectStore("keys").get(id);
        request.onsuccess = () => {
            if (request.result) resolve(request.result.key);
            else reject(new Error("File not found"));
        };
        request.onerror = () => reject(request.error);
    });
};

export const clearKeys = async () => {
    indexedDB.deleteDatabase("kdb");
    return;
}