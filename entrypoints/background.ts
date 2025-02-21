import { getAnalysis } from "@/utils/analysis";
import { getFromStorage, setToStorage } from "@/utils/storage";
import { createTab, getTabById, getTabUrl, openPopupInTab } from "@/utils/tab";
import { getTrustLevel, getTrustLevelSpec } from "@/utils/trust-level";

export default defineBackground(() => {
  const processedTabs = new Map();

  /* ====================
     Event Listeners
     ==================== */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "openAssist") openAssist();
  });

  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId != 0) return;

    getTabById(details.tabId).then((tab) => {
      if (chrome.runtime.lastError || !tab || !tab.url) return;

      processedTabs.set(tab.id, tab.url);
      checkTabRate(tab);
    });
  });

  /* ====================
     Main Functions
     ==================== */
  async function openAssist(): Promise<void> {
    try {
      const tab = await createTab({
        url: "https://scamminder.com/#open-assist",
      });
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["/content-scripts/assist.js"],
      });
    } catch (error) {
      console.error("Error opening assist:", error);
    }
  }

  async function checkTabRate(tab: chrome.tabs.Tab) {
    try {
      const url = getTabUrl(tab);

      if (!url || !["http:", "https:"].includes(url.protocol)) return;

      setWaitingForAnalysis(tab);

      const rateData = await getFromStorage<{ path: string; rate: number }>(
        url.host
      )
        .then((rate) => rate)
        .catch(() => getAnalysis(url.host));

      setToStorage(url.host, rateData);
      setRate(tab, rateData.rate);

      const trustSpec = getTrustLevelSpec(getTrustLevel(rateData.rate));

      if (tab.id && trustSpec.shouldWarn) {
        openPopupInTab(tab.id);
      }
    } catch (error) {
      console.error("Error checking rate:", error);
    }
  }

  /* ====================
     UI Update Functions
     ==================== */
  function setWaitingForAnalysis(tab: chrome.tabs.Tab) {
    chrome.action.setIcon({
      path: {
        16: "/icon/gray-16.png",
        32: "/icon/gray-32.png",
        48: "/icon/gray-48.png",
        96: "/icon/gray-96.png",
        128: "/icon/gray-128.png",
        256: "/icon/gray-256.png",
      },
      tabId: tab.id!,
    });
    chrome.action.setBadgeText({ text: "⟳", tabId: tab.id });
  }

  function setRate(tab: chrome.tabs.Tab, rate: number) {
    chrome.action.setIcon({
      path: {
        16: "/icon/16.png",
        32: "/icon/32.png",
        48: "/icon/48.png",
        96: "/icon/96.png",
        128: "/icon/128.png",
        256: "/icon/256.png",
      },
      tabId: tab.id!,
    });
    const trust = getTrustLevel(rate);
    const trustSpec = getTrustLevelSpec(trust);
    chrome.action.setBadgeText({ text: rate.toString(), tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({
      color: trustSpec.color,
      tabId: tab.id,
    });
  }
});
