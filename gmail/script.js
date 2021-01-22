/* ==================================================
 * SIMPLIFY GMAIL v1.7.21
 * By Michael Leggett: leggett.org
 * Copyright (c) 2020 Michael Hart Leggett
 * Repo: github.com/leggett/simplify/blob/master/gmail/
 * License: github.com/leggett/simplify/blob/master/gmail/LICENSE.md
 * More info: simpl.fyi
 */

// == SIMPL =====================================================

// Add simpl style to html tag
const htmlEl = document.documentElement;
htmlEl.classList.add("simpl");

// Toggles custom style and returns latest state
function toggleSimpl() {
  return htmlEl.classList.toggle("simpl");
}

// Handle messages from background script that
// supports page action to toggle Simplify on/off
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "toggle_simpl") {
    const isNowToggled = toggleSimpl();
    sendResponse({ toggled: isNowToggled });
  }
});

// Activate page action button
chrome.runtime.sendMessage({ action: "activate_page_action" });

// == SIMPLIFY SETTINGS =====================================================

// Initialize debug as off
let simplifyDebug = false;

// Load Simplify Settings
let simplSettings = {};
if (simplifyDebug) console.log("About to try to get settings");
chrome.storage.local.get(null, function (results) {
  if (simplifyDebug) console.log("About to parse settings");
  if (results == null) {
    if (simplifyDebug) console.log("No settings yet -- maybe initialize them");
  } else {
    simplSettings = results;
    if (simplifyDebug) console.log(simplSettings);
  }
  applySettings(simplSettings);
  if (simplifyDebug) console.log("Got settings");
});

// Print Simplify version number if debug is running
console.log(
  "Simplify version " + chrome.runtime.getManifest().version + " loaded"
);

// Apply setting
function applySettings(settings) {
  if (simplifyDebug) console.log("Apply settings");
  /*
	TODO: something is breaking here
	*/
  for (let key in settings) {
    if (simplifyDebug) console.log("Applying setting: " + key);
    switch (key) {
      case "hideAddons":
        simplSettings.hideAddons = settings[key];
        if (simplSettings.hideAddons) {
          htmlEl.classList.add("hideAddons");
        } else {
          htmlEl.classList.remove("hideAddons");
        }
        break;
      case "minimizeSearch":
        simplSettings.minimizeSearch = settings[key];
        if (simplSettings.minimizeSearch) {
          htmlEl.classList.add("hideSearch");
        } else {
          htmlEl.classList.remove("hideSearch");
        }
        break;
      case "kbsMenu":
        simplSettings.kbsMenu = settings[key];
        break;
      case "kbsToggle":
        simplSettings.kbsToggle = settings[key];
        break;
      case "kbsEscape":
        simplSettings.kbsEscape = settings[key];
        break;
      case "dateGrouping":
        simplSettings.dateGrouping = settings[key];
        if (simplSettings.dateGrouping) {
          observeThreadlist();
        } else {
          threadlistObserver.disconnect();
        }
        break;
      case "hideUnreads":
        simplSettings.hideUnreads = settings[key];
        if (simplSettings.hideUnreads) {
          htmlEl.classList.add("hideUnreads");
        } else {
          htmlEl.classList.remove("hideUnreads");
        }
        break;
      case "bundleCategories":
        simplSettings.bundleCategories = settings[key];
        break;
      case "debug":
        simplSettings.debug = settings[key];
        /* This is applied too late to really work...
				 * maybe you change the setting and restart the app?
				 * or I can use localStorage?
				if (simplSettings.debug) {
					simplifyDebug = true;
				} else {
					simplifyDebug = false;
				}
				*/
        break;
      case "minSearch":
        // No longer used, delete it
        chrome.storage.local.remove(["minSearch"]);
        break;
      default:
        console.log("No case for applying setting: " + key);
        break;
    }
  }
  if (simplifyDebug) console.log("Apply settings: " + JSON.stringify(settings));
}

// Detect changes in settings and make appropriate changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    let newSettings = {};
    newSettings[key] = changes[key].newValue;
    applySettings(newSettings);
  }
});

// Add Simplify Settings link to gear menu
/*
let addSettingsLinkLoops = 0;
function addSettingsGearListener() {
	let settingsGear = document.querySelector('div[gh="s"]');
	if (settingsGear) {
		console.log('found settings gear');
		// TODO -- add event listener to all children of settingsGear
		settingsGear.children[0].children[0].addEventListener('click', addSettingsLink, true);
	} else if (addSettingsLinkLoops < 10) {
		setTimeout(addSettingsGearListener, 1000);
		addSettingsLinkLoops++;
	}
}
function addSettingsLink() {
	// Make sure it doesn't already exist
	if (!document.querySelector('#simplifySettingsLink')) {
		// Find the themes menu item
		let themesMenuItem = document.querySelector('#pbwc');
		if (themesMenuItem) {
			// Clone and modify the themes menu item and insert it back into the gear menu
			let menuItemClone = themesMenuItem.cloneNode(true);
			menuItemClone.id = 'simplifySettingsLink';
			menuItemClone.children[0].innerText = 'Simplify Settings';
			themesMenuItem.parentNode.insertBefore(menuItemClone, themesMenuItem.nextSibling);
			document.querySelector('#simplifySettingsLink').addEventListener('click', function() {
				window.open(optionsUrl, '_blank');
			}, false);
			console.log('added Simplify Settings menu item');
		}
		// let settingsGear = document.querySelector('div[gh="s"]');
		// settingsGear.removeEventListener('click', addSettingsLink, false);
	}
}
*/

// == IN-GMAIL SIMPLIFY NOTIFICATIONS ======================================
const optionsUrl = chrome.extension.getURL("options.html");
function showNotification(msg, actions, hideAfter) {
  let notificationBox = document.getElementById("simplNotification");
  if (notificationBox) {
    // If notification already exists, just show it again
    notificationBox.style.display = "block";
  } else {
    // Create notification bubble, attach to body
    let notificationEl = document.createElement("div");
    notificationEl.id = "simplNotification";
    document.body.appendChild(notificationEl);
    notificationBox = document.getElementById("simplNotification");
  }

  // Add content to notification div
  notificationBox.textContent = msg;

  // Add primary action to notification div
  if (actions == "settingsLink") {
    notificationBox.innerHTML +=
      '<br><button id="openSettings">Open Simplify settings</button>';
    // TODO: Why do I have to delay this so the button is in the DOM and I can add the function?
    setTimeout(function () {
      document
        .querySelector("#simplNotification #openSettings")
        .addEventListener(
          "click",
          function () {
            console.log(optionsUrl);
            window.open(optionsUrl, "_blank");
            notificationBox.style.display = "none";
            clearTimeout(autoCloseNotification);
          },
          false
        );
    }, 100);
  } else if (actions == "inboxGmailSettings") {
    notificationBox.innerHTML +=
      '<br><button id="gmailSettings">Open Gmail settings</button>';
    // TODO: Why do I have to delay this so the button is in the DOM and I can add the function?
    setTimeout(function () {
      document
        .querySelector("#simplNotification #gmailSettings")
        .addEventListener(
          "click",
          function () {
            location.hash = "settings/inbox";
            notificationBox.style.display = "none";
            clearTimeout(autoCloseNotification);
          },
          false
        );
    }, 100);
  }

  // Add close notification action to notification div
  notificationBox.innerHTML +=
    '<button class="secondary" id="closeNotification">Close</button>';
  document
    .querySelector("#simplNotification #closeNotification")
    .addEventListener(
      "click",
      function () {
        notificationBox.style.display = "none";
        clearTimeout(autoCloseNotification);
        simplSettings.kbsNotified = true;
      },
      false
    );

  // Auto hide this notification in 30 seconds
  let autoCloseNotification = setTimeout(function () {
    notificationBox.style.display = "none";
  }, hideAfter * 1000);
}

/* == INIT SAVED STATES =================================================
 * If someone is signed into multiple accounts, the localStorage
 * variables will overwrite one another unless we associate them
 * with an account. The user number in the URL is the only
 * identifying thing we have access to at the start of page load.
 *
 * This will continue to match the username so long as you don't
 * sign out and then back into a different account first. After
 * the page is totally loaded, we will check for this case and
 * reset the local variables if the username associated with
 * the userId in the URL doesn't match the username associated
 * with the userId in localStorage.
 */
const isDelegate = location.pathname.indexOf("/mail/b/") >= 0;
const isPopout = location.href.indexOf("view=btop") >= 0;
const userPos = location.pathname.indexOf("/u/");
const u = isDelegate
  ? "b" + location.pathname.substring(userPos + 3, userPos + 4)
  : location.pathname.substring(userPos + 3, userPos + 4);

let simplify = {};

const defaultParam = {
  username: "",
  previewPane: null,
  noSplitPane: null,
  readingPaneWidth: "var(--content-width)",
  multipleInboxes: "",
  theme: "",
  navOpen: null,
  density: "",
  textButtons: null,
  rhsChat: null,
  minimizeSearch: null,
  addOns: null,
  addOnsCount: 3,
  otherExtensions: null,
  chatClosed: null,
  quickSettings: false,
  elements: {
    searchParent: ".gb_pe",
    menuButton: ".gb_Dc.gb_Kc.gb_Lc > div:first-child",
    menuContainer: ".gb_Dc.gb_Kc.gb_Lc",
    backButton: ".gb_cc.gb_fc.gb_va",
    supportButton: ".gb_Le.gb_Je",
    accountButton: ".gb_x.gb_Ea.gb_f",
    accountWrapper: false,
    gsuiteLogo: false,
    oneGoogleRing: false,
  },
};

// Helper function to init or reset the localStorage variable
function resetLocalStorage(userNum) {
  window.localStorage.clear();
  if (userNum) {
    simplify[u] = defaultParam;
    window.localStorage.simplify = JSON.stringify(simplify);
  } else {
    window.localStorage.simplify = JSON.stringify({ 0: defaultParam });
  }
}

// Initialize local storage if undefined
if (typeof window.localStorage.simplify === "undefined") {
  resetLocalStorage();
}

// Local copy of Simplify cached state parameters
simplify = JSON.parse(window.localStorage.simplify);

// Make sure Simplify cached state parameters are initialized for this account
if (typeof simplify[u] === "undefined") {
  resetLocalStorage(u);
}

// Write to local and localStorage object
function updateParam(param, value) {
  // Sometimes the value has already been written and we just need to update localStorage
  if (typeof value !== "undefined") {
    simplify[u][param] = value;
  }
  window.localStorage.simplify = JSON.stringify(simplify);
}

// Hash string
function hashCode(s) {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}

/* Make sure local variables are for the right account
 * TODO: for now, when it doesn't match, I just localStorage.clear()
 * but there might be a better way, maybe try and match the correct account?
 */
let username = "";
function checkLocalVar() {
  const usernameStart = document.title.search(/([\w\.]+\@[\w\.\-]+)/);
  if (usernameStart > 0) {
    username = document.title.substring(
      usernameStart,
      document.title.lastIndexOf(" - ")
    );
    const userhash = hashCode(username);
    if (simplifyDebug) console.log("Userhash: " + userhash);
    if (simplify[u].username != userhash) {
      if (simplifyDebug) console.log("Usernames do NOT match");
      resetLocalStorage();
    }
    updateParam("username", userhash);
  }
}

// Init Preview Pane or Multiple Inboxes
if (simplify[u].previewPane) {
  if (simplifyDebug) console.log("Loading with reading pane");
  htmlEl.classList.add("readingPane");

  if (simplify[u].noSplitPane) {
    htmlEl.classList.add("noSplitPane");
  }

  // Multiple Inboxes doesn't work if you have Preview Pane enabled
  updateParam("multipleInboxes", "none");
} else {
  // Multiple Inboxes only works if Preview Pane is disabled
  if (simplify[u].multipleInboxes == "horizontal") {
    if (simplifyDebug)
      console.log("Loading with side-by-side multiple inboxes");
    htmlEl.classList.add("multiBoxHorz");
    htmlEl.classList.remove("multiBoxVert2", "noSplitPane", "readingPane");
  } else if (simplify[u].multipleInboxes == "vertical") {
    if (simplifyDebug)
      console.log("Loading with vertically stacked multiple inboxes");
    htmlEl.classList.add("multiBoxVert2", "noSplitPane", "readingPane");
    htmlEl.classList.remove("multiBoxHorz");
  }
}

// Init themes
if (simplify[u].theme == "light") {
  if (simplifyDebug) console.log("Loading with light theme");
  htmlEl.classList.add("lightTheme");
} else if (simplify[u].theme == "dark") {
  if (simplifyDebug) console.log("Loading with dark theme");
  htmlEl.classList.add("darkTheme");
} else if (simplify[u].theme == "medium") {
  if (simplifyDebug) console.log("Loading with medium theme");
  htmlEl.classList.add("mediumTheme");
}

// Init nav menu
if (simplify[u].navOpen) {
  if (simplifyDebug) console.log("Loading with nav menu open");
  htmlEl.classList.add("navOpen");
} else {
  if (simplifyDebug) console.log("Loading with nav menu closed");
  htmlEl.classList.remove("navOpen");
}

// Init quick settings
if (simplify[u].quickSettings) {
  if (simplifyDebug) console.log("Loading with new quick settings menu");
  htmlEl.classList.add("quickSettings");
} else {
  if (simplifyDebug) console.log("Loading with nav menu closed");
  htmlEl.classList.remove("quickSettings");
}

// Init density
if (simplify[u].density == "low") {
  if (simplifyDebug) console.log("Loading with low density inbox");
  htmlEl.classList.add("lowDensityInbox");
} else if (simplify[u].density == "high") {
  if (simplifyDebug) console.log("Loading with high density inbox");
  htmlEl.classList.add("highDensityInbox");
}

// Init text button labels
if (simplify[u].textButtons) {
  if (simplifyDebug) console.log("Loading with text buttons");
  htmlEl.classList.add("textButtons");
}

// Init right side chat
if (simplify[u].rhsChat) {
  if (simplifyDebug) console.log("Loading with right hand side chat");
  htmlEl.classList.add("rhsChat");
}

// Hide Search box by default
if (simplify[u].minimizeSearch == null) {
  // Only default to hiding search if the window is smaller than 1441px wide
  if (window.innerWidth < 1441) {
    updateParam("minimizeSearch", true);
  } else {
    updateParam("minimizeSearch", false);
  }
}
if (simplify[u].minimizeSearch || simplSettings.minimizeSearch) {
  if (simplifyDebug) console.log("Loading with search hidden");
  htmlEl.classList.add("hideSearch");
}

// Make space for add-ons pane if the add-ons pane was open last time
if (simplify[u].addOns) {
  if (simplifyDebug) console.log("Loading with add-ons pane");
  htmlEl.classList.add("addOnsOpen");
}

// Init 3rd party extensions
if (simplify[u].otherExtensions) {
  if (simplifyDebug) console.log("Loading with 3rd party extensions");
  htmlEl.classList.add("otherExtensions");
}

// Hide chat if it was last seen closed
if (simplify[u].chatClosed === undefined) {
  simplify[u].chatClosed = false;
  htmlEl.classList.remove("chatClosed");
  updateParam("chatClosed", false);
  if (simplifyDebug) console.log("Initialized simplify.chatClosed");
} else if (simplify[u].chatClosed) {
  if (simplifyDebug) console.log("Loading with chat minimized");

  // Hide it while Gmail finishes loading
  htmlEl.classList.add("chatClosed");
}

// Add .popout if this is a popped out email
if (isPopout) {
  htmlEl.classList.add("popout");
  htmlEl.classList.remove("readingPane");
}

// == KEYBOARD SHORTCUTS =====================================================

// Handle Simplify keyboard shortcuts
function handleKeyboardShortcut(event) {
  // If Escape was pressed, close conversation or search
  if (event.key === "Escape" && simplSettings.kbsEscape) {
    // Only close if focus wasn't in an input or content editable div
    if (!event.target.isContentEditable && event.target.tagName != "INPUT") {
      if (simplifyDebug)
        console.log("Pressed esc: check to see if in a conversation");

      if (inMsg) {
        if (simplifyDebug)
          console.log(
            "Pressed esc: In a conversation, return to list view: " +
              closeMsgUrl
          );
        location.hash = closeMsgUrl;
      } else if (inSearch) {
        if (simplifyDebug)
          console.log(
            "Pressed esc: In search, return to previous list view: " +
              closeSearchUrl
          );
        location.hash = closeSearchUrl;
      } else if (inSettings) {
        if (simplifyDebug)
          console.log(
            "Pressed esc: In settings, return to previous list view: " +
              closeSettingsUrl
          );
        location.hash = closeSettingsUrl;
      }
      // Return to Inbox if anywhere else (this might have unintended consequences)
      else {
        location.hash = "#inbox";
        if (simplifyDebug)
          console.log(
            "Pressed esc: Not in a conversation or search, go to Inbox"
          );
      }
    }
  }

  // If Ctrl+M or Command+M was pressed, toggle nav menu open/closed
  if (
    (event.ctrlKey && (event.key === "M" || event.key === "m")) ||
    (event.metaKey && event.key === "m")
  ) {
    if (simplSettings.kbsMenu) {
      document.querySelector(".aeN").classList.toggle("bhZ");
      toggleMenu();
      event.preventDefault();

      // If opening, focus the first element
      if (!document.querySelector(".aeN").classList.contains("bhZ")) {
        document.querySelector('div[role="navigation"] a:first-child').focus();
      }
    } else if (!simplSettings.kbsNotified) {
      if (htmlEl.classList.contains("navOpen")) {
        showNotification(
          "Trying to hide the main menu? Enable the keyboard shortcut in Simplify Settings.",
          "settingsLink",
          30
        );
      } else {
        showNotification(
          "Trying to show the main menu? Enable the keyboard shortcut in Simplify Settings.",
          "settingsLink",
          30
        );
      }
    }
  }

  // If Ctrl+S or Command+S was pressed, toggle Simplify on/off
  if (
    (event.ctrlKey && (event.key === "S" || event.key === "s")) ||
    (event.metaKey && event.key === "s")
  ) {
    if (simplSettings.kbsToggle) {
      toggleSimpl();
      event.preventDefault();
    } else if (!simplSettings.kbsNotified) {
      if (htmlEl.classList.contains("simpl")) {
        showNotification(
          "Trying to disable Simplify? Enable the keyboard shortcut in Simplify Settings.",
          "settingsLink",
          30
        );
      } else {
        showNotification(
          "Trying to enable Simplify? Enable the keyboard shortcut in Simplify Settings.",
          "settingsLink",
          30
        );
      }
    }
  }
}
window.addEventListener("keydown", handleKeyboardShortcut, false);

// == URL HISTORY =====================================================

/*
  All known URL Hashes:

  INBOX
  #inbox

  SYSTEM & USER FOLDERS
  #starred
  #snoozed
  #sent
  #outbox
  #drafts
  #imp
  #chats
  #scheduled
  #all
  #spam
  #trash
  #label
  #category /social /updates /forums /promotions

  SETTINGS
  #settings

  SEARCH
  #search
    category:primary
    category:social
    category:promotions
    category:updates
    category:forums
    category:reservations
    category:purchases
    label:trips ?
  #advanced-search
  #create-filter
 */

// Set up urlHashes to track and update for closing Search and leaving Settings
const regexMsg = /[A-Za-z]{28,}$/;
const regexSearch = /#search|#advanced-search|#create-filter/;
let inMsg = false,
  inSearch = false,
  inList = false,
  inSettings = false,
  inInbox = false;
let closeMsgUrl = "#inbox",
  closeSearchUrl = "#inbox",
  closeSettingsUrl = "#inbox";

function checkView() {
  // Update view state variables
  inMsg = location.hash.search(regexMsg) > -1;
  inList = location.hash.search(regexMsg) == -1;
  inSearch = location.hash.search(regexSearch) == 0;
  inSettings = location.hash.search(/#settings/) == 0;
  inInbox = location.hash.search(/#inbox/) == 0;

  // In search, settings, or inbox?
  if (inSearch) htmlEl.classList.add("inSearch");
  else {
    htmlEl.classList.remove("inSearch");
    closeSearchUrl = location.hash;
  }

  if (inSettings) htmlEl.classList.add("inSettings");
  else {
    htmlEl.classList.remove("inSettings");
    closeSettingsUrl = location.hash;
  }

  if (inInbox) htmlEl.classList.add("inInbox");
  else htmlEl.classList.remove("inInbox");

  // In a list or message?
  if (inList && !inSettings) {
    // Record the last URL Hash seen before going into a message
    closeMsgUrl = location.hash;

    htmlEl.classList.add("inList");
    htmlEl.classList.remove("inMsg");
  } else if (inMsg) {
    htmlEl.classList.add("inMsg");
    htmlEl.classList.remove("inList", "inInbox", "inSearch");
  }
}

// Initialize URL Hash variables on load
checkView();

window.onhashchange = function () {
  checkView();

  // if we were supposed to check the theme later, do it now
  if (checkThemeLater) {
    detectTheme();
  }

  // Used to only run on detectReadingPaneLater == true
  // Seems silly to check for this every time. Will do something smarter in v2
  if (inList) {
    detectReadingPane();
  }

  if (inInbox && detectMultipleInboxesLater) {
    detectMultipleInboxes();
  }

  // See if we need to date group the view
  // todo maybe stop the observer and start a new one?
  if (simplSettings.dateGrouping) {
    threadlistObserver.disconnect();
    observeThreadlist();
  }
};

/* == INIT STYLESHEET =================================================
 * Certain classnames seem to change often in Gmail. Where possible, use
 * stable IDs, tags, and attribute selectors (e.g. #gb input[name="q"]).
 * Other times, classnames don't change often. But for when we have to use
 * a classname and it changes often, detect the classname (usually based on
 * more stable children elements) and inject the style on load.
 */

// Detect and cache classNames that often change so we can inject CSS
let detectClassNamesLoops = 0;
function detectClassNames() {
  const searchForm = document.querySelector("header form"); // [role="search"]

  if (searchForm) {
    if (simplifyDebug) console.log("Detecting class names...");

    if (!simplify[u].elements) {
      simplify[u].elements = {};
    }

    // Search parent
    const searchParent = searchForm.parentElement.classList.value.trim();
    if (searchParent) {
      simplify[u].elements["searchParent"] =
        "." + searchParent.replace(/ /g, ".");
    }

    // Main menu
    const menuButton = document
      .querySelector('#gb div path[d*="18h18v-2H3v2zm0"]')
      .parentElement.parentElement.parentElement.classList.value.trim();
    simplify[u].elements["menuButton"] =
      "." + menuButton.replace(/ /g, ".") + " > div:first-child";
    simplify[u].elements["menuContainer"] = "." + menuButton.replace(/ /g, ".");

    // Back button
    const backButton = document
      .querySelector('#gb div[role="button"] path[d*="11H7.83l5.59-5.59L12"]')
      .parentElement.parentElement.classList.value.trim();
    simplify[u].elements["backButton"] = "." + backButton.replace(/ /g, ".");

    /*
    // Support button (usually added about 2 seconds after page is loaded)
    const supportButton = document.querySelector(
      '#gb path[d*="18h2v-2h-2v2zm1-16C6.48"]'
    );
    if (simplifyDebug) {
      console.log("Detecting class name for support path element:");
      // console.log(supportButton);
    }
    simplify[u].elements["supportButton"] = supportButton
      ? "." +
        supportButton.parentElement.parentElement.parentElement.classList.value
          .trim()
          .replace(/ /g, ".")
      : simplify[u].elements["supportButton"];
    */

    // New Quick Settings
    const quickSettings = document.querySelector(
      "path[d*='M13.85 22.25h-3.7c-.74 0-1.36-']"
    );
    updateParam("quickSettings", quickSettings !== null);

    // Only calling this here so you don't have to refresh Gmail twice the first time it is detected
    if (simplify[u].quickSettings) {
      htmlEl.classList.add("quickSettings");
    }

    // Account switcher (profile pic/name)
    const accountButton = document.querySelector(
      `#gb a[aria-label*="${username}"], #gb a[href^="https://accounts.google.com/SignOutOptions"]`
    );
    simplify[u].elements["accountButton"] = accountButton
      ? "." + accountButton.classList.value.trim().replace(/ /g, ".")
      : false;

    // Account wrapper (for Gsuite accounts)
    const accountWrapper = document.querySelector(
      '#gb div[href^="https://accounts.google.com/SignOutOptions"]'
    );
    simplify[u].elements["accountWrapper"] = accountWrapper
      ? "." + accountWrapper.classList.value.trim().replace(/ /g, ".")
      : false;

    // Gsuite company logo
    const gsuiteLogo = document.querySelector(
      '#gb img[src^="https://admin.google.com"], #gb img[src*="/a/cpanel"]'
    );
    simplify[u].elements["gsuiteLogo"] = gsuiteLogo
      ? "." + gsuiteLogo.parentElement.classList.value.trim().replace(/ /g, ".")
      : false;

    // oneGoogle Ring around profile photo
    const oneGoogleRing = document.querySelector(
      '#gb div path[fill="#F6AD01"]'
    );
    simplify[u].elements["oneGoogleRing"] = oneGoogleRing
      ? "." +
        oneGoogleRing.parentElement.parentElement.classList.value
          .trim()
          .replace(/ /g, ".")
      : false;

    // Update the cached classnames in case any changed
    updateParam();

    // Add styles again in case the classNames changed
    addStyles();
  } else {
    detectClassNamesLoops++;
    if (simplifyDebug)
      console.log("detectClassNames loop #" + detectClassNamesLoops);

    // only try 10 times and then asume something is wrong
    if (detectClassNamesLoops < 10) {
      // Call init function again if the gear button field wasn't loaded yet
      setTimeout(detectClassNames, 500);
    } else {
      if (simplifyDebug) console.log("Giving up on detecting class names");
    }
  }
}

// Helper function to add CSS to Simplify Style Sheet
function addCSS(css, pos) {
  let position = pos ? pos : simplifyStyles.cssRules.length;
  simplifyStyles.insertRule(css, position);
  if (simplifyDebug)
    console.log("CSS added: " + simplifyStyles.cssRules[position].cssText);
}

// This is all CSS that I need to add dynamically as the classNames often change for these elements
// and I couldn't find a stable way to select the elements other than their classnames
function addStyles() {
  if (simplify[u].elements) {
    // Remove right padding from action bar so search is always correctly placed
    addCSS(
      `html.simpl #gb ${simplify[u].elements.searchParent} { padding-right: 0px !important; }`
    );

    // Switch menu button for back button when in Settings
    addCSS(
      `html.simpl.inSettings #gb ${simplify[u].elements.menuButton} { display: none !important; }`
    );
    addCSS(
      `html.simpl.inSettings #gb ${simplify[u].elements.backButton} { display: block !important; }`
    );

    // Hide the oneGoogle Ring if it is there
    if (simplify[u].elements["oneGoogleRing"]) {
      addCSS(
        `html.simpl #gb ${simplify[u].elements.oneGoogleRing} { display: none !important; }`
      );
    }

    /*
  // Hide the support button if it is there
  if (simplify[u].elements["supportButton"]) {
    addCSS(
      `html.simpl #gb ${simplify[u].elements.supportButton} { display: none !important; }`
    );
  }
  */

    // Move quick settings
    /*
  if (simplify[u].elements["quickSettings"]) {
    addCSS(
      `html.simpl #gb ${simplify[u].elements.quickSettings} { display: none !important; }`
    );
  }
  */

    // Restyle the profile name into an icon for delegated accounts
    if (simplify[u].elements["accountButton"]) {
      let delegatedAccountButtonCss =
        "font-size:0px; width:32px; height:32px; margin:4px 6px 0 6px; line-height:26px; ";
      delegatedAccountButtonCss +=
        "border-radius:18px; background-color:rgba(0,0,0,0.85); font-weight:bold; ";
      delegatedAccountButtonCss +=
        "text-align:center; text-transform:uppercase; overflow:hidden;";
      addCSS(
        `html.simpl.delegate #gb ${simplify[u].elements.accountButton} { ${delegatedAccountButtonCss} }`
      );
      addCSS(
        `html.simpl.delegate #gb ${simplify[u].elements.accountButton}::first-letter { font-size: initial; color: white; }`
      );
      addCSS(
        `html.simpl.delegate #gb ${simplify[u].elements.accountButton} span { display:none; }`
      );
    }

    // Restyle profile pic itself
    if (simplify[u].elements["accountWrapper"]) {
      const accountWrapperCss =
        "width:48px !important; margin-left:0px; border:none !important; background-color:transparent; box-shadow:none !important;";
      addCSS(
        `html.simpl #gb ${simplify[u].elements.accountWrapper} { ${accountWrapperCss} }`
      );
    }

    // Hide Gsuite company logo if it exists
    if (simplify[u].elements["gsuiteLogo"]) {
      addCSS(
        `html.simpl #gb ${simplify[u].elements.gsuiteLogo} { display:none; }`
      );
    }

    // Adjust size of menu button container
    addCSS(
      `html.simpl #gb ${simplify[u].elements.menuContainer} { min-width: 58px !important; padding-right: 0px; }`
    );
  }
  // Add correct label for date cluster in inbox for two months ago
  let now = new Date();
  let month2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  let monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  addCSS(
    `html.simpl tr[date="month2"]::before { content: '${
      monthNames[month2.getMonth()]
    }'; }`
  );
}

// Add CSS based on cached selectors detected in previous loads
let simplifyStyles;
function initStyle() {
  if (document.head) {
    initStyleObserver.disconnect();

    // Create style sheet element and append to <HEAD>
    let simplifyStyleEl = document.createElement("style");
    simplifyStyleEl.id = "simplifyStyle";
    document.head.appendChild(simplifyStyleEl);

    // Setup global variable for style sheet
    if (simplifyDebug) console.log("Style sheet added");
    simplifyStyles = simplifyStyleEl.sheet;

    // Initialize readingPane width now that Style Sheet is setup
    addCSS(`:root { --readingPane-width: ${simplify[u].readingPaneWidth}; }`);
    if (simplifyDebug)
      console.log("Just made room for search chips in Reading Pane");

    // Initialize addOns height now that Style Sheet is setup
    addCSS(
      `:root { --add-on-height: ${simplify[u].addOnsCount * 56}px !important; }`
    );
    if (simplifyDebug)
      console.log("Just made room for " + simplify[u].addOnsCount + " add ons");

    // Add cached styles
    addStyles();
  }
}

/*
// Figure out when an element is added to the DOM
let howLong = 0;
console.log('Looking for the Support button');
function findSupport() {
	let supportButton = document.querySelector('#gb path[d*="18h2v-2h-2v2zm1-16C6.48"]');
	if (supportButton) {
		console.log(`Found support button in ${howLong}ms`);
	} else {
		if (howLong > 10000) {
			console.log(`Giving up on finding Support button. Looked for ${howLong}ms`);
		} else {
			howLong += 50;
			setTimeout(findSupport, 50);
		}
	}
}
findSupport();
*/

// == SEARCH FUNCTIONS =====================================================

/* Focus search input */
function toggleSearchFocus(onOff) {
  // We are about to show Search if hideSearch is still on the html tag
  if (onOff == "off" || htmlEl.classList.contains("hideSearch")) {
    // Remove focus from search input or button
    document.activeElement.blur();
  } else {
    // Focus the search input
    document.querySelector('header input[name="q"]').focus();
  }
}

// Setup search event listeners
let initSearchLoops = 0;
function initSearch() {
  // See if Search form has be added to the dom yet
  const searchForm = document.querySelector("#gb form");

  // Setup Search functions to show/hide Search at the
  // right times if we have access to the search field
  if (searchForm) {
    // Focus search when you click anywhere on it
    searchForm.addEventListener(
      "click",
      function (event) {
        toggleSearchFocus();
      },
      false
    );

    // Add function to search button to toggle search open/closed
    const searchIcon = document.querySelector(
      '#gb form path[d^="M20.49,19l-5.73"]'
    ).parentElement;
    searchIcon.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        htmlEl.classList.toggle("hideSearch");
        updateParam("minimizeSearch", htmlEl.classList.contains("hideSearch"));
        toggleSearchFocus();
      },
      false
    );

    // Add functionality to search close button to close search and go back
    const searchCloseIcon = document.querySelector(
      '#gb form path[d~="6.41L17.59"]'
    ).parentElement;

    // Hide search when you clear the search if it was previously hidden
    searchCloseIcon.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleSearchFocus("off");
        document.querySelector('header input[name="q"]').value = "";
        if (location.hash == closeSearchUrl) {
          // Hide close button
          const searchCloseButton = searchCloseIcon.parentElement;
          const showCloesButtonClass = searchCloseButton.classList.value.split(
            " "
          )[1];
          searchCloseButton.classList.remove(showCloesButtonClass);

          // Remove focus style from search input (always the 3rd classname)
          const searchFormClass = searchForm.classList.value.split(" ")[2];
          searchForm.classList.remove(searchFormClass);
        } else {
          location.hash = closeSearchUrl;
        }
        if (simplify[u].minimizeSearch || simplSettings.minimizeSearch) {
          htmlEl.classList.add("hideSearch");
        }
      },
      false
    );
  } else {
    initSearchLoops++;
    if (simplifyDebug) console.log("initSearch loop #" + initSearchLoops);

    // only try 4 times and then asume something is wrong
    if (initSearchLoops < 5) {
      // Call init function again if the gear button field wasn't loaded yet
      setTimeout(initSearch, 500);
    }
  }
}

// Detect if search is focused and needs to be expanded
let initSearchFocusLoops = 0;
function initSearchFocus() {
  // If the search field gets focus and hideSearch hasn't been applied, add it
  const searchInput = document.querySelector('header input[name="q"]');

  if (searchInput) {
    // Show search if the page is loaded is a search view
    if (inSearch) {
      htmlEl.classList.remove("hideSearch");
    }

    // Show search if it is focused and hidden
    searchInput.addEventListener(
      "focus",
      function () {
        htmlEl.classList.remove("hideSearch");
      },
      false
    );

    // Remove the placeholder text in the search box
    searchInput.placeholder = "";

    // Setup eventListeners for search input
    searchInput.addEventListener("focus", () => {
      // Add searchFocus from html element
      htmlEl.classList.add("searchFocused");
      setTimeout(function () {
        if (searchInput.value == "label:") {
          searchInput.selectionStart = searchInput.selectionEnd = 10000;
        } else {
          searchInput.selectionStart = 0;
          searchInput.selectionEnd = 10000;
        }
      }, 100);
    });
    searchInput.addEventListener("blur", (e) => {
      // Remove searchFocus from html element
      htmlEl.classList.remove("searchFocused");

      // Hide search box if it loses focus, is empty, and was previously hidden
      if (simplifyDebug)
        console.log(
          "Search for '%s' with [u]minimizeSearch set to %s and simplifySettings.minimizeSearch set to %s",
          searchInput.value,
          simplify[u].minimizeSearch,
          simplSettings.minimizeSearch
        );
      if (
        (searchInput.value == "" || searchInput.value == null) &&
        (simplify[u].minimizeSearch || simplSettings.minimizeSearch) &&
        e.target.name != "q" &&
        e.target.gh != "sda"
      ) {
        if (simplifyDebug) console.log("Hide search. Clicked on", e.target);
        htmlEl.classList.add("hideSearch");
      } else {
        if (simplifyDebug)
          console.log("Don't close search. Clicked on", e.target);
      }
    });
  } else {
    // If the search field can't be found, wait and try again
    initSearchFocusLoops++;
    if (simplifyDebug)
      console.log("initSearchFocus loop #" + initSearchFocusLoops);

    // Only try 10 times and then asume something is wrong
    if (initSearchFocusLoops < 5) {
      // Call init function again if the search input wasn't loaded yet
      setTimeout(initSearchFocus, 500);
    }
  }
}

// == SETTINGS FUNCTIONS =====================================================

// Setup settings event listeners
let initSettingsLoops = 0;
function initSettings() {
  // See if settings gear has be added to the dom yet
  let backButton = document.querySelector('#gb div[aria-label="Go back"] svg');
  if (!backButton) {
    // aria-label doesn't work with non-english interfaces but .gb_1b changes often
    backButton = document.querySelector(
      '#gb div[role="button"] path[d*="11H7.83l5.59-5.59L12"]'
    );
    if (backButton) backButton = backButton.parentElement;
  }

  if (backButton) {
    backButton.addEventListener(
      "click",
      function () {
        if (inSettings) {
          location.hash = closeSettingsUrl;
        }
      },
      false
    );
  } else {
    initSettingsLoops++;
    if (simplifyDebug) console.log("initSettings loop #" + initSettingsLoops);

    // only try 5 times and then asume something is wrong
    if (initSettingsLoops < 5) {
      // Call init function again if the gear button field wasn't loaded yet
      setTimeout(initSettings, 500);
    }
  }
}

// == DETECTION FUNCTIONS =====================================================

// Detect if a dark theme is being used and change styles accordingly
let detectThemeLoops = 0;
let checkThemeLater = false;
let observingThemes = false;
function detectTheme() {
  const msgCheckbox = document.querySelectorAll('div[gh="tl"] .xY > .T-Jo')[0];
  const conversation = document.querySelectorAll('table[role="presentation"]');
  if (simplifyDebug) console.log("Detecting theme...");
  if (msgCheckbox) {
    const checkboxBg = window
      .getComputedStyle(msgCheckbox, null)
      .getPropertyValue("background-image");
    const menuButton = document.querySelector(
      '#gb div path[d*="18h18v-2H3v2zm0"]'
    );
    const menuButtonBg = window
      .getComputedStyle(menuButton, null)
      .getPropertyValue("color");
    if (checkboxBg.indexOf("black") > -1) {
      if (menuButtonBg.indexOf("255, 255, 255") > -1) {
        // The checkbox is black which means the threadlist
        // bg is light, BUT the app bar icons are light
        htmlEl.classList.add("mediumTheme");
        htmlEl.classList.remove("lightTheme");
        htmlEl.classList.remove("darkTheme");
        updateParam("theme", "medium");
      } else {
        htmlEl.classList.add("lightTheme");
        htmlEl.classList.remove("mediumTheme");
        htmlEl.classList.remove("darkTheme");
        updateParam("theme", "light");
      }
    } else {
      htmlEl.classList.add("darkTheme");
      htmlEl.classList.remove("lightTheme");
      htmlEl.classList.remove("mediumTheme");
      updateParam("theme", "dark");
    }
    checkThemeLater = false;
    if (!observingThemes) observeThemes();
  } else if (conversation.length == 0) {
    // if we're not looking at a conversation, maybe the threadlist just hasn't loaded yet
    detectThemeLoops++;
    if (simplifyDebug) console.log("detectTheme loop #" + detectThemeLoops);

    // only try 4 times and then asume you're in a thread
    if (detectThemeLoops < 5) {
      setTimeout(detectTheme, 500);
    }
  } else {
    // We are looking at a conversation, check the theme when the view changes
    checkThemeLater = true;
  }
}
function observeThemes() {
  /* BUG (sort of)... this only works when changing to/from/between themes
   * with background images. It does NOT work when changing between flat color
   * themes. This is b/c this only detects when attributes are changed inline or
   * children nodes are added/removed. The switch from white to black themes
   * changes the css in the head (inside one of many style tags) which then
   * changes the styles. I don't see an inline change I can observe to trigger
   * this observer. At least not yet.
   */
  const themeBg = document.querySelector(".yL .wl");

  if (themeBg) {
    const themesObserverConfig = {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    };

    // Create an observer instance that calls the detectTheme function
    // Annoying that I have to delay by 200ms... if I don't then
    // it checks to see if anything changed before it had a chance to change
    const themesObserver = new MutationObserver(function () {
      setTimeout(detectTheme, 200);
    });

    // Start observing the target node for configured mutations
    themesObserver.observe(themeBg, themesObserverConfig);
    observingThemes = true;
    if (simplifyDebug) console.log("Adding mutation observer for themes");
  } else {
    if (simplifyDebug)
      console.log("Failed to add mutation observer for themes");
  }
}

// Detect the interface density so we can adjust the line height on items
let detectDensityLoops = 0;
function detectDensity() {
  const navItem = document.querySelector('div[role="navigation"] .TN');
  if (navItem) {
    const navItemHeight = parseInt(
      window.getComputedStyle(navItem, null).getPropertyValue("height")
    );
    if (simplifyDebug)
      console.log(
        "Detecting inbox density via nav item. Height is " +
          navItemHeight +
          "px"
      );
    if (navItemHeight <= 26) {
      if (simplifyDebug) console.log("Detected high density");
      htmlEl.classList.remove("lowDensityInbox");
      htmlEl.classList.add("highDensityInbox");
      updateParam("density", "high");
    } else {
      if (simplifyDebug) console.log("Detected low density");
      htmlEl.classList.add("lowDensityInbox");
      htmlEl.classList.remove("highDensityInbox");
      updateParam("density", "low");
    }
  } else {
    detectDensityLoops++;
    if (simplifyDebug) console.log("detectDensity loop #" + detectDensityLoops);

    // only try 4 times and then assume no reading pane
    if (detectDensityLoops < 5) {
      // Call init function again if nav item wasn't loaded yet
      setTimeout(detectDensity, 500);
    } else {
      if (simplifyDebug)
        console.log("Giving up on detecting interface density");
    }
  }
}

// Detect if preview panes are enabled and being used
let detectReadingPaneLoops = 0;
let detectReadingPaneLater = false;
let readingPaneObserver;
function detectReadingPane() {
  // Did Gmail load in a conversation in No Split Pane? If so, we can't
  // detect if this is Reading Pane or not. Do it later when back in a list view.
  if (inMsg) {
    detectReadingPaneLater = true;
    if (simplifyDebug)
      console.log("Simplify: in conversation view: detect Reading Pane later");
    return;
  } else {
    detectReadingPaneLater = false;
    if (simplifyDebug)
      console.log("Simplify: in an inbox now, detecting Reading Pane");
  }

  // Short term patch: Offline seems to mess with detecting Reading pane
  const offlineActive = document.getElementsByClassName("bvE");
  if (offlineActive && detectReadingPaneLoops == 0) {
    detectReadingPaneLoops++;
    setTimeout(detectReadingPane, 2000);
  } else {
    // Detect reading pane when conversation view was loaded
    const readingPaneMenu = document.querySelector('div[selector="nosplit"]');
    if (readingPaneMenu) {
      // Detected Reading Pane
      htmlEl.classList.add("readingPane");
      updateParam("previewPane", true);

      // See if the Reading pane toggle is for toggling back on reading pane
      // (vertical or horizontal) which means it is set to "No Split"
      const noSplitToggle = document.querySelectorAll("div.apI, div.apK");
      if (noSplitToggle) {
        if (noSplitToggle.length == 0) {
          if (simplifyDebug) console.log("Reading pane detected and active");
          htmlEl.classList.remove("noSplitPane");
          updateParam("noSplitPane", false);

          // Detect and set reading pane width
          detectReadingPaneWidth();
        } else {
          if (simplifyDebug)
            console.log("Reading pane enabled but set to No Split");
          htmlEl.classList.add("noSplitPane");
          updateParam("noSplitPane", true);
        }
      }

      /* Listen for readingPane mode toggle via mutation observer */
      // Options for the observer (which mutations to observe)
      // TODO: when loading in a search, there are two split pane toggles and I'm only observing one
      const readingPaneToggle = document.querySelector(
        'div[gh="tm"] .apI, div[gh="tm"] .apK, div[gh="tm"] .apJ'
      );
      const readingPaneObserverConfig = {
        attributes: true,
        childList: false,
        subtree: false,
      };

      // Callback function to execute when mutations are observed
      const readingPaneObserverCallback = function (mutationsList, observer) {
        // Can I just do this for the first mutation?
        let keepLooking = true;
        for (let mutation of mutationsList) {
          if (
            mutation.type == "attributes" &&
            mutation.attributeName == "class" &&
            keepLooking
          ) {
            keepLooking = false;
            if (simplifyDebug)
              console.log("Reading pane mode toggled. Detecting new state...");
            if (mutation.target.attributes.class.value.indexOf("apJ") > -1) {
              htmlEl.classList.remove("noSplitPane");
              updateParam("noSplitPane", false);
            } else {
              htmlEl.classList.add("noSplitPane");
              updateParam("noSplitPane", true);
            }
            setTimeout(detectReadingPaneWidth, 500);
          }
        }
      };

      // Create an observer instance linked to the callback function
      if (readingPaneObserver !== undefined) {
        if (simplifyDebug) console.log(readingPaneObserver);
        readingPaneObserver.disconnect();
      }
      readingPaneObserver = new MutationObserver(readingPaneObserverCallback);
      if (simplifyDebug) console.log(readingPaneObserver);

      // Start observing the target node for configured mutations
      if (simplifyDebug)
        console.log(
          "Adding mutation observer for Reading Pane",
          readingPaneToggle
        );
      if (readingPaneToggle) {
        readingPaneObserver.observe(
          readingPaneToggle,
          readingPaneObserverConfig
        );
      }

      // Multiple Inboxes only works when Reading pane is disabled
      updateParam("multipleInboxes", "none");
      htmlEl.classList.remove("multiBoxVert2");
      htmlEl.classList.remove("multiBoxHorz");
    } else {
      detectReadingPaneLoops++;
      if (simplifyDebug)
        console.log("Detect preview pane loop #" + detectReadingPaneLoops);

      // only try 10 times and then assume no reading pane
      if (detectReadingPaneLoops < 10) {
        // Call init function again if the gear button field wasn't loaded yet
        setTimeout(detectReadingPane, 500);
      } else {
        if (simplifyDebug) console.log("Giving up on detecting reading pane");
        if (simplify[u].multipleInboxes != "vertical") {
          htmlEl.classList.remove("readingPane");
          htmlEl.classList.remove("noSplitPane");
        }
        updateParam("previewPane", false);
        updateParam("noSplitPane", false);
      }
    }
  }
}
// Helper to detect the reading pane width
let detectReadingPaneWidthLoops = 0;
function detectReadingPaneWidth() {
  console.log("Detecting reading pane width for search refinements...");
  if (simplify[u].noSplitPane) {
    if (simplifyDebug) console.log("No Split Pane: revert to full width");
    let readingPaneWidth = "--var(content-width)";
    addCSS(`:root { --readingPane-width: ${readingPaneWidth} !important; }`);
    updateParam("readingPaneWidth", readingPaneWidth);
  } else {
    let leftPane = document.querySelector('div[gh="tl"] > .Nu:first-child');
    if (leftPane) {
      let leftPaneWidth = window.getComputedStyle(leftPane).width;
      if (leftPaneWidth == "auto") {
        // Can't detect width yet: call this function again with a delay
        detectReadingPaneWidthLoops++;
        if (simplifyDebug)
          console.log(
            "Detect preview pane width loop #" + detectReadingPaneWidthLoops
          );
        if (detectReadingPaneWidthLoops < 10) {
          // Call init function again if the gear button field wasn't loaded yet
          setTimeout(detectReadingPaneWidth, 500);
        } else {
          if (simplifyDebug)
            console.log("Giving up on detecting reading pane width");
        }
      } else {
        let leftPaneWidthInt = parseInt(leftPaneWidth);
        let windowWidth = 0.9 * window.innerWidth;
        // See if this is horizontal width
        if (leftPaneWidthInt > windowWidth) {
          console.log("Horizontal split", leftPaneWidthInt, windowWidth);
          let readingPaneWidth = "calc(100vw - var(--left-offset))";
          addCSS(
            `:root { --readingPane-width: ${readingPaneWidth} !important; }`
          );
          updateParam("readingPaneWidth", readingPaneWidth);
          // TODO: I should probably detect vertical reading pane
          // vs horizonal somewhere else and add a className
        } else {
          console.log("Vertical split");
          let readingPaneWidth = leftPaneWidthInt - 20 + "px";
          addCSS(
            `:root { --readingPane-width: ${readingPaneWidth} !important; }`
          );
          updateParam("readingPaneWidth", readingPaneWidth);
        }
      }
    }
  }
}

// Determine number of add-ons and set the height of the add-ons pane accordingly
let detectNumberOfAddOnsLoops = 0;
function detectNumberOfAddOns() {
  // Detect how many add-ons there are
  const numberOfAddOns =
    parseInt(
      document.querySelectorAll(
        '.bAw div.bse-bvF-I, .bAw div[role="tablist"] > div[role="tab"]'
      ).length
    ) - 2;
  if (numberOfAddOns > 0) {
    if (simplifyDebug)
      console.log("There are " + numberOfAddOns + " add-ons now");
    if (numberOfAddOns > 3) {
      addCSS(`:root { --add-on-height: ${numberOfAddOns * 56}px !important; }`);
      updateParam("addOnsCount", numberOfAddOns);
    } else {
      updateParam("addOnsCount", 3);
    }
  } else {
    detectNumberOfAddOnsLoops++;
    if (simplifyDebug)
      console.log("detectNumberOfAddOns loop #" + detectNumberOfAddOnsLoops);

    // only try 4 times and then assume no add-on pane
    if (detectNumberOfAddOnsLoops < 5) {
      // Call init function again if the add-on pane wasn't loaded yet
      setTimeout(detectNumberOfAddOns, 500);
    } else {
      if (simplifyDebug)
        console.log("Giving up on detecting number of add-ons pane");
    }
  }
}

// Detect Add-ons Pane
let detectAddOnsPaneLoops = 0;
function detectAddOns() {
  const addOnsPane = document.querySelector(".bq9");
  if (addOnsPane) {
    // .br3 is the className for hiding the add-ons pane
    let addOnsHidden = addOnsPane.className.indexOf("br3") >= 0;
    if (addOnsHidden) {
      if (simplifyDebug) console.log("Add-on pane hidden on load");
      htmlEl.classList.remove("addOnsOpen");
      updateParam("addOns", false);
    } else {
      if (simplifyDebug) console.log("Add-on pane visible on load");
      htmlEl.classList.add("addOnsOpen");
      updateParam("addOns", true);
    }

    // Set the height of the add-ons tray based on number of add-ons
    setTimeout(detectNumberOfAddOns, 5000);

    // Options for the observer (which mutations to observe)
    const addOnsObserverConfig = {
      attributes: true,
      childList: false,
      subtree: false,
    };

    // Callback function to execute when mutations are observed
    // TODO: Can I do this without looping through all the mutations?
    const addOnsObserverCallback = function (mutationsList, observer) {
      for (let mutation of mutationsList) {
        if (
          mutation.type == "attributes" &&
          mutation.attributeName == "class"
        ) {
          if (simplifyDebug)
            console.log(
              "Add-on pane className set to: " +
                mutation.target.attributes.class.value
            );
          if (mutation.target.attributes.class.value.indexOf("br3") > -1) {
            htmlEl.classList.remove("addOnsOpen");
            updateParam("addOns", false);
          } else {
            htmlEl.classList.add("addOnsOpen");
            updateParam("addOns", true);
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    const addOnsObserver = new MutationObserver(addOnsObserverCallback);

    // Start observing the target node for configured mutations
    if (simplifyDebug) console.log("Adding mutation observer for Add-ons Pane");
    addOnsObserver.observe(addOnsPane, addOnsObserverConfig);
  } else {
    detectAddOnsPaneLoops++;
    if (simplifyDebug)
      console.log("detectAddOns loop #" + detectAddOnsPaneLoops);

    // only try 4 times and then assume no add-on pane
    if (detectAddOnsPaneLoops < 10) {
      // Call init function again if the add-on pane wasn't loaded yet
      setTimeout(detectAddOns, 500);
    } else {
      if (simplifyDebug) console.log("Giving up on detecting add-ons pane");
    }
  }
}

// Helper function to simulate clicking on an element
function simulateClick(el) {
  const dispatchMouseEvent = function (targetEl, type) {
    const event = new MouseEvent(type, {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    targetEl.dispatchEvent(event);
  };
  dispatchMouseEvent(el, "mouseover");
  dispatchMouseEvent(el, "mousedown");
  dispatchMouseEvent(el, "click");
  dispatchMouseEvent(el, "mouseup");
  dispatchMouseEvent(el, "mouseout");
  if (simplifyDebug) console.log("Just clicked on", el);
}

// Detect Right Side Chat (why hasn't Gmail killed this already?)
let detectRightSideChatLoops = 0;
function detectRightSideChat() {
  const talkRoster = document.getElementById("talk_roster");
  if (talkRoster) {
    const rosterSide = talkRoster.getAttribute("guidedhelpid");

    if (rosterSide == "right_roster") {
      if (simplifyDebug) console.log("Right side chat found");
      htmlEl.classList.add("rhsChat");
      updateParam("rhsChat", true);
    } else {
      htmlEl.classList.remove("rhsChat");
      updateParam("rhsChat", false);

      // Close chat roster if it was closed last time
      if (simplify[u].chatClosed) {
        // Remove the temporary band-aid
        htmlEl.classList.remove("chatClosed");

        // Simulate clicking on the talk tab if it was supposed to be closed
        const activeChatTab = document.querySelector(
          '.aeN div[role="complementary"] div[gh="gt"] .J-KU-KO'
        );
        if (activeChatTab) simulateClick(activeChatTab);
      }
      /* Add event listener to save the minimized state of the chat roster */
      const rosterParent = document.querySelector(
        '.aeN div[role="complementary"]'
      );
      if (simplifyDebug && rosterParent) console.log("Chat roster found");
      const rosterObserver = new MutationObserver((mutationsList, observer) => {
        mutationsList.forEach((mutation) => {
          if (
            mutation.target.attributes.style.value.search("height: 0px") === -1
          ) {
            // Roster open
            updateParam("chatClosed", false);
            if (simplifyDebug) console.log("Chat roster opened");
          } else {
            // Roster minimized
            updateParam("chatClosed", true);
            if (simplifyDebug) console.log("Chat roster closed");
          }
        });
      });
      if (rosterParent) {
        rosterObserver.observe(rosterParent, {
          attributes: true,
          attributeFilter: ["style"],
          childList: false,
          subtree: false,
        });
      }
    }
  } else {
    detectRightSideChatLoops++;
    if (simplifyDebug)
      console.log("detectRhsChat loop #" + detectRightSideChatLoops);

    // only try 10 times and then assume no add-on pane
    if (detectRightSideChatLoops < 10) {
      // Call init function again if the add-on pane wasn't loaded yet
      setTimeout(detectRightSideChat, 500);
    } else {
      if (simplifyDebug) console.log("Giving up on detecting Talk roster");
    }
  }
}

// Detect if using text or icon buttons
let detectButtonLabelLoops = 0;
function detectButtonLabel() {
  const secondButton = document.querySelectorAll(
    'div[gh="tm"] div[role="button"] > div'
  )[2];
  if (secondButton) {
    const textButtonLabel = secondButton.innerText;
    if (textButtonLabel == "") {
      // Using icon buttons
      if (simplifyDebug) console.log("Icon button labels detected");
      updateParam("textButtons", false);
      htmlEl.classList.remove("textButtons");
    } else {
      // Using icon buttons
      if (simplifyDebug) console.log("Text button labels detected");
      updateParam("textButtons", true);
      htmlEl.classList.add("textButtons");
    }
  } else {
    detectButtonLabelLoops++;
    if (detectButtonLabelLoops < 5) {
      setTimeout(detectButtonLabel, 500);
      if (simplifyDebug)
        console.log("Detect button labels loop #" + detectButtonLabelLoops);
    }
  }
}

// Detect nav state
let detectMenuStateLoops = 0;
function detectMenuState() {
  const menuButtonIcon = document.querySelector(
    '#gb div path[d*="18h18v-2H3v2zm0"]'
  );
  if (menuButtonIcon) {
    const menuButton = menuButtonIcon.parentElement.parentElement;
    const navOpen = menuButton.getAttribute("aria-expanded");
    menuButton.addEventListener("click", toggleMenu, false);
    if (navOpen == "true") {
      if (simplifyDebug) console.log("Nav is open");
      updateParam("navOpen", true);
      htmlEl.classList.add("navOpen");
    } else {
      if (simplifyDebug) console.log("Nav is closed");
      updateParam("navOpen", false);
      htmlEl.classList.remove("navOpen");
    }
  } else {
    detectMenuStateLoops++;
    if (detectMenuStateLoops < 5) {
      setTimeout(detectMenuState, 500);
      if (simplifyDebug)
        console.log("Detect nav state loop #" + detectMenuStateLoops);
    }
  }
}

// Helper function to toggle nav open/closed
function toggleMenu() {
  const menuButton = document.querySelector(
    `#gb ${simplify[u].elements.menuButton}`
  );

  if (simplify[u].navOpen) {
    htmlEl.classList.remove("navOpen");
    menuButton.setAttribute("aria-expanded", "false");
    updateParam("navOpen", false);
    if (simplifyDebug)
      console.log(
        "Toggle nav to hidden; simplify.navOpen = " + simplify[u].navOpen
      );
  } else {
    htmlEl.classList.add("navOpen");
    menuButton.setAttribute("aria-expanded", "true");
    updateParam("navOpen", true);
    if (simplifyDebug)
      console.log(
        "Toggle nav to shown;  simplify.navOpen = " + simplify[u].navOpen
      );
  }
}

// Detect Multiple Inboxes
let detectMultipleInboxesLoops = 0;
let detectMultipleInboxesLater = false;
function detectMultipleInboxes() {
  if (!inInbox) {
    // If not in the inbox, detect later
    detectMultipleInboxesLater = true;
    return;
  } else {
    detectMultipleInboxesLater = false;
    const inboxLoaded = document.querySelectorAll(".ae4").length > 0;
    const threadList = document.querySelector('div[gh="tl"]');

    if (inboxLoaded && threadList) {
      const multiBoxes = document.querySelectorAll(
        '.ae4:not([role="tabpanel"])'
      );

      if (multiBoxes.length > 1) {
        // Vertical or Horizontal setup?
        let sectionWidth = parseInt(
          window.getComputedStyle(multiBoxes[0]).width
        );
        let inboxWidth = parseInt(window.getComputedStyle(threadList).width);
        if (simplifyDebug)
          console.log(
            "Multiple inboxes found",
            inboxWidth,
            sectionWidth,
            multiBoxes.length,
            multiBoxes
          );

        if (inboxWidth <= sectionWidth * 2) {
          if (simplifyDebug) console.log("Multiple inboxes are vertical");
          // TODO: The vertically stacked multiple inboxes is the same as noSplitPane
          htmlEl.classList.add("multiBoxVert2", "readingPane", "noSplitPane");
          htmlEl.classList.remove("multiBoxHorz");
          updateParam("multipleInboxes", "vertical");
        } else {
          if (simplifyDebug) console.log("Multiple inboxes are side by side");
          htmlEl.classList.add("multiBoxHorz");
          htmlEl.classList.remove(
            "multiBoxVert2",
            "readingPane",
            "noSplitPane"
          );
          updateParam("multipleInboxes", "horizontal");
        }

        // Multiple Inboxes only works when Reading pane is disabled
        // htmlEl.classList.remove('readingPane', 'noSplitPane');
        updateParam("previewPane", false);
        updateParam("noSplitPane", false);
      } else {
        if (simplifyDebug) console.log("Multiple inboxes not found");
        updateParam("multipleInboxes", "none");
        htmlEl.classList.remove("multiBoxVert2");
        htmlEl.classList.remove("multiBoxHorz");
      }
    } else {
      detectMultipleInboxesLoops++;
      if (detectMultipleInboxesLoops < 10) {
        setTimeout(detectMultipleInboxes, 500);
        if (simplifyDebug)
          console.log(
            "Detect multiple inboxes loop #" + detectMultipleInboxesLoops
          );
      }
    }
  }
}

/* Observer to toggle pagination controls
 * Hide pagination controls if buttons are disabled in the default inbox:
 * Default inbox 	.aeH > div[gh=tm] > .ar5
 *
 * Ignore these cases:
 * Priority Inbox 	.aeF > .Wm
 * Split pane 		.aeF > div[gh=tm] > .ar5
 * MultiboxHorz		.aeF > div[gh=tm] > .ar5
 * MultiboxVert		.aeF > div[gh=tm] > .ar5
 */
function testPagination() {
  const actionBar = document.querySelector("div.aeH");

  if (actionBar) {
    const paginationDivs = document.querySelectorAll(".aeH div.ar5");
    paginationDivs.forEach(function (pagination) {
      // How many messages in the list?
      let msgCountDivs = pagination.querySelectorAll("span.ts");
      if (msgCountDivs.length == 3) {
        let msgFirst = parseInt(msgCountDivs[0].innerText);
        let msgLast = parseInt(msgCountDivs[1].innerText);
        let msgCount = parseInt(msgCountDivs[2].innerText);

        // Hide pagination control if the total count is less than 100
        if (msgFirst == 1 && msgLast == msgCount) {
          pagination.style.display = "none";
          if (simplifyDebug) console.log("Hide pagination controls");
        } else {
          pagination.style.display = "inline-block";
          if (simplifyDebug) console.log("Show pagination controls");
        }
      } else {
        if (simplifyDebug) console.log("Didn't find pagination controls");
      }

      /*
      const pageButtons = pagination.querySelectorAll(
        'div[role="button"][aria-disabled="true"]'
      );
      if (pageButtons.length >= 2) {
        pagination.style.display = 'none';
      } else {
        pagination.style.display = 'inline-block';
      }
      */
    });
  }
}
function observePagination() {
  const actionBar = document.querySelector("div.aeH");

  if (actionBar) {
    // Options for the observer (which mutations to observe)
    const paginationObserverConfig = {
      attributes: true,
      childList: true,
      subtree: true,
    };

    // Create an observer instance linked to the callback function
    const paginationObserver = new MutationObserver(testPagination);

    // Start observing the target node for configured mutations
    if (simplifyDebug)
      console.log("Adding mutation observer for Pagination controls");
    paginationObserver.observe(actionBar, paginationObserverConfig);
  }
}

// Detect if this is a delegated account
function detectDelegate() {
  if (location.pathname.substring(6, 7) == "b") {
    htmlEl.classList.add("delegate");
  }
}

// Init App switcher event listeners
let initAppSwitcherLoops = 0;
function initAppSwitcher() {
  const profileButton = document.querySelectorAll(
    '#gb a[href^="https://accounts.google.com/SignOutOptions"], #gb a[aria-label^="Google Account: "]'
  )[0];
  const appSwitcherWrapper = document.querySelector("#gbwa");
  const appBar = document.querySelector("#gb");
  if (profileButton && appSwitcherWrapper) {
    profileButton.addEventListener(
      "mouseenter",
      function () {
        htmlEl.classList.add("appSwitcher");
      },
      false
    );

    appBar.addEventListener(
      "mouseleave",
      function () {
        htmlEl.classList.remove("appSwitcher");
      },
      false
    );
  } else {
    initAppSwitcherLoops++;
    if (initAppSwitcherLoops < 10) {
      setTimeout(initAppSwitcher, 500);
      if (simplifyDebug)
        console.log("initAppSwitcher loop #" + initAppSwitcherLoops);
    }
  }
}

// Detect if there are other 3rd party extensions installed
// TODO: Figure out how to auto-dismiss the tray once open – as is, it breaks the app switcher
function detectOtherExtensions() {
  const otherExtensionsList = {
    "#gb .manage_menu": { width: 70, initial: 100 } /* Boomerang */,
    "#gb .inboxsdk__appButton": { width: 56, initial: 114 } /* Streak */,
    "#gb #mailtrack-menu-opener": { width: 44, initial: 120 } /* Mail track */,
    "#gb .mixmax-appbar": { width: 56, initial: 100 } /* Mixmax */,
  };
  const otherExtensions = document.querySelectorAll(
    Object.keys(otherExtensionsList).toString()
  );

  // window.getComputedStyle(document.querySelector('#gb .inboxsdk__appButton'), null).getPropertyValue('width')
  if (otherExtensions.length > 0) {
    htmlEl.classList.add("otherExtensions");
    updateParam("otherExtensions", true);
    if (simplifyDebug) console.log("Other extensions detected");

    // See if extension exists and if it does, set its right pos by width + padding
    let extensionsWidth = 0;
    Object.entries(otherExtensionsList).forEach(function (extension) {
      if (simplifyDebug)
        console.log(`Extensions - Looking for ${extension[0]}...`);
      const extensionEl = document.querySelector(extension[0]);
      if (extensionEl) {
        if (extensionsWidth == 0) {
          extensionsWidth = extension[1].initial;
        }
        extensionEl.style.setProperty("right", `${extensionsWidth}px`);
        extensionsWidth += extension[1].width;
        if (extension[0].search("mixmax") !== -1) {
          htmlEl.classList.add("mixmax");
        }
        if (simplifyDebug)
          console.log(`Extensions - right position now: ${extensionsWidth}px`);
      } else {
        if (simplifyDebug)
          console.log(`Extensions - Couldn't find ${extension}`);
      }
    });
  } else {
    htmlEl.classList.remove("otherExtensions");
    updateParam("otherExtensions", false);
    if (simplifyDebug) console.log("No extensions detected");
  }

  // Detect Gmelius
  // TODO: Make Gmelius better
  /*
	let Gmelius = document.querySelector('div[data-app-name="Gmelius"]');
	if (Gmelius) {
		let nav = document.querySelector('div[role="navigation"]');
		nav.addEventListener('click', function(){
			alert("Clicked on nav");
		});

		let gmeliusNav = document.querySelector('div[role="navigation"] .inboxsdk__navMenu');
		gmeliusNav.addEventListener('click', function(){ alert("Clicked on Gmelius nav"); });

		let gmeliusNavItems = document.querySelectorAll('div[role="navigation"] .inboxsdk__navItem');
		for (let i = 0; i < gmeliusNavItems.length; i++) {
			// console.log(i + '. ' + gmeliusNavItems[i].querySelector('.inboxsdk__navItem_name').innerText);
			let itemName = gmeliusNavItems[i].querySelector('.inboxsdk__navItem_name').innerText;
			gmeliusNavItems[i].addEventListener('click', function(){
				alert("Clicked on " + itemName);
				document.querySelector('.ain').classList.remove('ain');
				this.classList.add('ain');
			});
		}
	}
		*/
}

/* TODO: dynamic padding between pagination and actions
 * Problem: Different settings like the inputs menu add extra buttons to the
 *   action bar and mis-align the pagination controls above 1441px screen resolution.
 *
 * Solution: Detect how many buttons are in the action bar and figure out how much
 *   padding there should be. Set a global css var
 *
 * A = Get width of wrapper around right side of action bar
	window.getComputedStyle(document.querySelector('.aqJ')).getPropertyValue('width')
 * B = Get width of pagination controls
	window.getComputedStyle(document.querySelector('.ar5')).getPropertyValue('width')
 * C = Get current right padding of pagination control
 	window.getComputedStyle(document.querySelector('.ar5')).getPropertyValue('padding-right')
 * A - (B + C) is the width of just the right actions
 * ---
 * I could also possibly do a querySelectorAll on divs after the pagination control and loop
 * through and count up their computed width to determine the --right-offset
*/

/*
 * TODO: package images
 * You have to use chrome.runtime.getURL(string path)
 * More info: https://developer.chrome.com/extensions/runtime#method-getURL
 */

/* ==========================================================================================
	Adding date gaps in the inbox between the following sections
	Today
	Yesterday
	This month
	<Month name>
	<Month name year>
	Earlier
	----
	TODO:
	- Make it more efficient (I'm calling insertDateGaps more often than I should)
 */

// Date constants
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 1
);
const month0 = new Date(now.getFullYear(), now.getMonth(), 1);
const month1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const month2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
const month3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
let justRan = false;

// Insert date gaps
function insertDateGaps(mutationList, observer) {
  // Check to see if we're in the inbox and it is empty
  let threads = document.querySelectorAll('div[gh="tl"] div.Cp tbody tr')
    .length;
  let inInbox = location.hash.substring(1, 7) == "inbox" ? true : false;
  if (threads == 0 && inInbox) {
    // Show inbox zero
    htmlEl.classList.add("inboxZero");
  } else {
    htmlEl.classList.remove("inboxZero");
    /*
		if (simplifyDebug) {
			if (mutationList) {
				console.log(mutationList);
			} else {
				console.log('No mutation list')
			}
		}
		*/

    let lists = document.querySelectorAll('.UI table[role="grid"]');
    if (lists.length > 0) {
      if (simplifyDebug) console.log("Inserting date gaps");
      let lastDate = "today";
      lists.forEach(function (list) {
        let items = list.querySelectorAll(".zA");
        if (items.length > 0) {
          items.forEach(function (item) {
            // BUNDLE ITEMS BY LABEL (NOT DONE)
            /* TODO:
             *	this breaks grouping by date, skip if item is display:none
             * 	the remaining item should link to a search, not an email
             */

            // Only bundle items if we're in the Inbox
            if (inInbox && simplSettings.bundleCategories) {
              // Get the labels on the item
              let labels = item.querySelectorAll(".av");
              if (labels.length > 0) {
                let labelList = [];
                labels.forEach(function (label) {
                  labelList.push(label.innerText);
                });
                item.setAttribute("labels", labelList.toString());
              }
            }

            // Group by date
            if (!item.querySelector(".byZ > div")) {
              // Skip item if it was snoozed
              let dateSpan = item.querySelector(".xW > span");
              if (dateSpan) {
                let itemDate = new Date(dateSpan.title);
                if (itemDate > today) {
                  item.setAttribute("date", "today");
                  lastDate = "today";
                } else if (itemDate >= yesterday) {
                  item.setAttribute("date", "yesterday");
                  lastDate = "yesterday";
                } else if (itemDate >= month0) {
                  item.setAttribute("date", "month0");
                  lastDate = "month0";
                } else if (itemDate >= month1) {
                  item.setAttribute("date", "month1");
                  lastDate = "month1";
                } else if (itemDate >= month2) {
                  item.setAttribute("date", "month2");
                  lastDate = "month2";
                } else if (itemDate >= month3) {
                  item.setAttribute("date", "earlier");
                  lastDate = "earlier";
                }
              }
            } else {
              item.setAttribute("date", lastDate);
            }
          });
        }
      });
    }
  }
}

const threadlistObserver = new MutationObserver(insertDateGaps);
let observeThreadlistLoops = 1;
function observeThreadlist() {
  // Start observing the target node for configured mutations
  let threadlist = document.querySelector('div[gh="tl"]');
  if (threadlist) {
    if (simplSettings.dateGrouping) {
      insertDateGaps();
      threadlistObserver.observe(threadlist, {
        attributes: false,
        childList: true,
        subtree: true,
      });
      if (simplifyDebug) console.log("Adding mutation observer for threadlist");
    }
  } else {
    if (observeThreadlistLoops < 10) {
      setTimeout(observeThreadlist, 500);
      observeThreadlistLoops++;
      if (simplifyDebug)
        console.log("observeThreadlist attempt #" + observeThreadlistLoops);
    }
  }
}
observeThreadlist();

/*
mutation observers:
https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/MutationObserver

childlist: One or more children have been added to and/or removed from the tree; see mutation.addedNodes and mutation.removedNodes

attributes: An attribute value changed on the element in mutation.target; the attribute name is in mutation.attributeName and its previous value is in mutation.oldValue

subtree: Omit or set to false to observe only changes to the parent node.
 */

/** ============================================================================
 * QUICK SETTINGS
 */

const quickSettingsObserver = {
  obs: null,
  element: null,
  tries: 0,
  config: {
    attributes: true,
    attributeFilter: ["style"],
    childList: false,
    subtree: false,
  },

  start() {
    if (!simplify[u].quickSettings) {
      if (simplifyDebug)
        console.log(
          "Quick Settings isn't enabled for this account. Not observing."
        );
      return;
    }

    // Only try so many times
    if (this.tries > 30) {
      if (simplifyDebug) console.log("Cound't find Quick Settings.");
      this.tries = 0;
      this.disconnect();
      return;
    }

    // Find element to observe (style tag with theme css in it)
    this.element = document.querySelector('.bkK ~ .nH.nn[style*="min-width"]');
    if (!this.element) {
      this.tries += 1;
      setTimeout(this.start.bind(this), 100);
    } else {
      this.obs = new MutationObserver((mutations) => {
        if (mutations.some((m) => parseInt(m.target.style.width) < 60)) {
          if (simplifyDebug) console.log("Quick Settings closed");
          document.documentElement.classList.remove("quickSettingsOpen");
        }
        if (mutations.some((m) => parseInt(m.target.style.width) > 290)) {
          if (simplifyDebug) console.log("Quick Settings open");
          document.documentElement.classList.add("quickSettingsOpen");
        }
      });
      this.observe();
    }
  },

  observe() {
    if (simplifyDebug) console.log("Starting quick settings observer");
    this.obs.observe(this.element, this.config);
  },

  disconnect() {
    if (this.obs !== null) {
      this.obs.disconnect();
      this.obs = null;
      this.tries = 0;
    }
  },
};

/* ========================================================================================== */

function announceSimplifyV2() {
  showNotification("Simplify Gmail v2 is coming!", "settingsLink", 30);
}

/* ========================================================================================== */

// Initialize styles as soon as head is ready
const initStyleObserver = new MutationObserver(initStyle);
function observeHead() {
  // Start observing the target node for configured mutations
  initStyleObserver.observe(htmlEl, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  if (simplifyDebug)
    console.log(
      "Adding mutation observer for head to initialize cached styles"
    );
}
observeHead();

// Initialize search as soon as DOM is ready
function initOnDomReady() {
  initSearch();
  initSearchFocus();
  detectDelegate();
}

// Initialize everything else when the page is ready
function initOnPageLoad() {
  initSettings();
  // addSettingsGearListener();
  detectTheme();
  detectReadingPane();
  detectDensity();
  detectRightSideChat();
  detectMenuState();
  detectButtonLabel();
  detectMultipleInboxes();
  detectAddOns();
  initAppSwitcher();
  testPagination();
  observePagination();
  quickSettingsObserver.start();
  checkLocalVar();

  // Announce Simplify v2!
  announceSimplifyV2();

  // 3rd party extensions take a few seconds to load
  setTimeout(detectOtherExtensions, 5000);

  // Some elements get loaded in after the page is done loading
  setTimeout(detectClassNames, 7000);
}

// Only initialize everything if this isn't a popout
if (!isPopout) {
  window.addEventListener("DOMContentLoaded", initOnDomReady, false);
  window.addEventListener("load", initOnPageLoad, false);
}
