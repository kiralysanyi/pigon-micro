const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("fileDB", 2);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "id" });
            }
        };

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

export const saveFile = async (id: string, file: Blob): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", "readwrite");
        transaction.objectStore("files").put({ id, file });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getFile = async (id: string): Promise<Blob> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", "readonly");
        const request = transaction.objectStore("files").get(id);
        request.onsuccess = () => {
            if (request.result) resolve(request.result.file);
            else reject(new Error("File not found"));
        };
        request.onerror = () => reject(request.error);
    });
};