export function getFromStorage<T>(key: string): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] === undefined) return reject();

      return resolve(result[key]);
    });
  });
}

export function setToStorage(key: string, value: any): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}
