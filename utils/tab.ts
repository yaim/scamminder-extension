export function createTab(
  options: chrome.tabs.CreateProperties
): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(options, (tab) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      return resolve(tab);
    });
  });
}

export function getTabById(id: number): Promise<chrome.tabs.Tab> {
  return new Promise((resolve) => {
    chrome.tabs.get(id, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.warn("Failed to get tab:", chrome.runtime.lastError);
        return;
      }
      resolve(tab);
    });
  });
}

export function getCurrentTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
      resolve(tabs[0])
    );
  });
}

export function getTabUrl(tab: chrome.tabs.Tab): URL | undefined {
  if (!tab || !tab.url) return;
  try {
    return new URL(tab.url);
  } catch (err) {
    return;
  }
}

export function openPopupInTab(tabId: number) {
  chrome.tabs.update(tabId, { active: true }, () => {
    if (chrome.runtime.lastError) return;
    chrome.action.openPopup();
  });
}
