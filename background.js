chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_selection_mode" }).catch(() => {
        console.log("Content script not ready or selection mode failed.");
    });
});

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === "update_badge") {
        const text = request.active ? "ON" : "OFF";
        const color = request.active ? "#22c55e" : "#ef4444";
        chrome.action.setBadgeText({ text: text, tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: color, tabId: sender.tab.id });
    }
});
