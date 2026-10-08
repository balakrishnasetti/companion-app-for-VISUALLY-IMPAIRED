const DATABASE_NAME = 'bala-offline-actions';
const STORE_NAME = 'pending';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support secure offline storage.'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'requestId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueue(action, payload, userId) {
  if (!['HAZARD_REPORT', 'FEEDBACK', 'PREFERENCES'].includes(action)) throw new Error('This action cannot be queued offline.');
  if (!userId) throw new Error('Sign in before saving an offline action.');
  const database = await openDatabase();
  const record = { requestId: crypto.randomUUID(), userId, action, payload, createdAt: Date.now() };
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).add(record);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return record;
}

export async function pendingActions(userId) {
  const database = await openDatabase();
  const records = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return records.filter((record) => record.userId === userId);
}

export async function removeAction(requestId) {
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(requestId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
