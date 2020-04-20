// Function to save settings
function saveOptions(e) {
  if (
    e.target.nodeName == 'BUTTON' ||
    e.target.nodeName == 'LABEL' ||
    e.target.nodeName == 'SPAN'
  ) {
    let checkToggle = document
      .getElementById('kbsToggle')
      .classList.contains('on');
    let checkMenu = document.getElementById('kbsMenu').classList.contains('on');
    let checkEscapeBack = document
      .getElementById('kbsEscape')
      .classList.contains('on');
    let checkMinimizeSearch = document
      .getElementById('minimizeSearch')
      .classList.contains('on');
    let checkHideAddons = document
      .getElementById('hideAddons')
      .classList.contains('on');
    let checkHideUnreads = document
      .getElementById('hideUnreadCount')
      .classList.contains('on');
    let checkBundleCategories = document
      .getElementById('bundleCategories')
      .classList.contains('on');
    let checkDateGrouping = document
      .getElementById('dateGrouping')
      .classList.contains('on');
    let checkDebug = document.getElementById('debug').classList.contains('on');

    chrome.storage.local.set({
      kbsToggle: checkToggle,
      kbsMenu: checkMenu,
      kbsEscape: checkEscapeBack,
      minimizeSearch: checkMinimizeSearch,
      hideAddons: checkHideAddons,
      dateGrouping: checkDateGrouping,
      hideUnreads: checkHideUnreads,
      bundleCategories: checkBundleCategories,
      debug: checkDebug,
    });
  }
}

// Restores select box and checkbox state using the preferences
function restoreOptions() {
  // Save settings when user interacts with page
  document.addEventListener('click', saveOptions);

  // Use default values to initialize settings
  chrome.storage.local.get(
    {
      kbsToggle: false,
      kbsMenu: false,
      kbsEscape: false,
      minimizeSearch: false,
      hideAddons: false,
      dateGrouping: false,
      hideUnreads: false,
      bundleCategories: false,
      debug: false,
    },
    function (items) {
      if (items.kbsToggle)
        document.getElementById('kbsToggle').classList.add('on');
      if (items.kbsMenu) document.getElementById('kbsMenu').classList.add('on');
      if (items.kbsEscape)
        document.getElementById('kbsEscape').classList.add('on');
      if (items.minimizeSearch)
        document.getElementById('minimizeSearch').classList.add('on');
      if (items.hideAddons)
        document.getElementById('hideAddons').classList.add('on');
      if (items.dateGrouping)
        document.getElementById('dateGrouping').classList.add('on');
      if (items.hideUnreads)
        document.getElementById('hideUnreadCount').classList.add('on');
      if (items.bundleCategories)
        document.getElementById('bundleCategories').classList.add('on');
      if (items.debug) document.getElementById('debug').classList.add('on');
    }
  );
}
document.addEventListener('DOMContentLoaded', restoreOptions);

// Run on load
window.addEventListener(
  'load',
  function () {
    // Change Ctrl button to Cmd for Mac
    if (window.navigator.platform.indexOf('Mac') >= 0) {
      document.getElementById('systemKey1').innerText = 'Cmd';
      document.getElementById('systemKey2').innerText = 'Cmd';
    }

    // Setup toggles
    const toggles = document.querySelectorAll('button.toggle');
    for (let i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener(
        'click',
        function () {
          this.classList.toggle('on');
        },
        false
      );
    }
  },
  false
);
