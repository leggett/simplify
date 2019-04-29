const toggleOnTitle = 'Toggle simplify on';
const toggleOffTitle = 'Toggle simplify off';

function updateTitle(tabId, toggled) {
    chrome.pageAction.setTitle({
        tabId: tabId,
        title: toggled ? toggleOffTitle : toggleOnTitle
    });
}

function updateIcon(tabId, toggled) {
    chrome.pageAction.setIcon({
        tabId: tabId,
        path: toggled ? 'img/icon128.png' : 'img/icon128_off.png'
    });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'activate_page_action') {
        const tabId = sender.tab.id;

        updateTitle(tabId, true);
        chrome.pageAction.show(tabId);
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    const tabId = tab.id;

	chrome.tabs.sendMessage(tabId, {action: 'toggle_simpl'}, function(response) {
        updateTitle(tabId, response.toggled);
        updateIcon(tabId, response.toggled);
    });
});