/* ==================================================
 * SIMPLIFY GMAIL v1.6.1
 * By Michael Leggett: leggett.org
 * Copyright (c) 2019 Michael Hart Leggett
 * Repo: github.com/leggett/simplify/blob/master/gmail/
 * License: github.com/leggett/simplify/blob/master/gmail/LICENSE.md
 * More info: simpl.fyi
 */


// == SIMPL =====================================================
// Turn debug loggings on/off
const simplifyDebug = true;

// Print Simplify version number if debug is running
if (simplifyDebug) console.log('Simplify version ' + chrome.runtime.getManifest().version);

// Add simpl style to html tag
const htmlEl = document.documentElement;
htmlEl.classList.add('simpl');

// Toggles custom style and returns latest state
function toggleSimpl() {
	return htmlEl.classList.toggle('simpl');
}

// Helper function for keyboard shortcuts to determine if an element is not editable
function notEditable(el) {
	el = el ? el : document.activeElement;

	// BUG: Still firing when inputs are in focus
	// I think Gmail is removing focus before this function runs
	if (el.isContentEditable || el.tagName == "INPUT") {
		if (simplifyDebug) {
			console.log('IS or WAS editable');
			console.log(el);
		}
		return false;
	}
	else {
		if (simplifyDebug) {
			console.log('NOT editable');
			console.log(el);			
		}
		return true;
	}
}

// Handle Simplify keyboard shortcuts
function handleKeyboardShortcut(event) {	
	// WIP: If Escape was pressed, close conversation or search
	if (event.key === "Escape") {
		// Only close if focus wasn't in an input or content editable div
		if (notEditable()) {
			if (simplifyDebug) console.log('Close search or conversation');

			// TODO: IF conversation is open

			// TODO: ELSE If in search results (check url)

			// TODO: ELSE, we could either return to the inbox or do nothing

			// event.preventDefault();
		}
	}

	/* If Ctrl+M or Command+M was pressed, toggle nav menu open/closed
	BUG: THIS CONFLICTS WITH CHANGING THE PROFILE IN CHROME */
	if ((event.ctrlKey && event.key === "M") || 
		(event.metaKey && event.key === "m")) {
		document.querySelector('.aeN').classList.toggle('bhZ');
		toggleMenu();
		event.preventDefault();

		// If opening, focus the first element
		if (!document.querySelector('.aeN').classList.contains('bhZ')) {
			document.querySelector('div[role="navigation"] a:first-child').focus();
		}
	}

	/* If Ctrl+S or Command+S was pressed, toggle Simplify on/off */
	if ((event.ctrlKey && event.key === "S") || 
		(event.metaKey && event.key === "s")) {
		toggleSimpl();
		event.preventDefault();
	}

	/* If Ctrl+Shift+M or Command+Shift+M was pressed, toggle nav menu open/closed
	BUG: THIS CONFLICTS WITH CHANGING THE PROFILE IN CHROME
	if ((event.ctrlKey && event.shiftKey && event.key === "M") || 
		(event.metaKey && event.shiftKey && event.key === "m")) {
		document.querySelector('.aeN').classList.toggle('bhZ');
		toggleMenu();
		event.preventDefault();

		// If opening, focus the first element
		if (!document.querySelector('.aeN').classList.contains('bhZ')) {
			document.querySelector('div[role="navigation"] a:first-child').focus();
		}
	}
	*/
}
window.addEventListener('keydown', handleKeyboardShortcut, false);

// Handle messages from background script that 
// supports page action to toggle Simplify on/off
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'toggle_simpl') {
		const isNowToggled = toggleSimpl();
		sendResponse({toggled: isNowToggled});
	}
});

// Activate page action button
chrome.runtime.sendMessage({action: 'activate_page_action'});



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
const isDelegate = location.pathname.indexOf('/mail/b/') >= 0;
const isPopout = location.href.indexOf("view=btop") >= 0;
const userPos = location.pathname.indexOf('/u/');
const u = isDelegate ? 'b' + location.pathname.substring(userPos+3, userPos+4) : location.pathname.substring(userPos+3, userPos+4);

let simplify = {};

const defaultParam = {
	username: "",
	previewPane: null,
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
	elements: {
		"searchParent": ".gb_pe",
		"menuButton": ".gb_Dc.gb_Kc.gb_Lc > div:first-child",
		"menuContainer": ".gb_Dc.gb_Kc.gb_Lc",
		"backButton": ".gb_cc.gb_fc.gb_va",
		"supportButton": ".gb_fe.gb_de",
		"accountButton":".gb_x.gb_Ea.gb_f",
		"accountWrapper": false,
		"gsuiteLogo": false,
		"oneGoogleRing": false
	}
}

// Helper function to init or reset the localStorage variable
function resetLocalStorage(userNum) {
	window.localStorage.clear();
	if (userNum) {
		simplify[u] = defaultParam;
		window.localStorage.simplify = JSON.stringify(simplify);
	} else {
		window.localStorage.simplify = JSON.stringify({ "0": defaultParam });
	}
}

// Initialize local storage if undefined
if (typeof window.localStorage.simplify === 'undefined') {
	resetLocalStorage();
}

// Local copy of Simplify cached state parameters
simplify = JSON.parse(window.localStorage.simplify);

// Make sure Simplify cached state parameters are initialized for this account
if (typeof simplify[u] === 'undefined') {
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
	return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

/* Make sure local variables are for the right account 
 * TODO: for now, when it doesn't match, I just localStorage.clear()
 * but there might be a better way, maybe try and match the correct account?
 */
let username = "";
function checkLocalVar() {
	const usernameStart = document.title.search(/([\w\.]+\@[\w\.\-]+)/);
	if (usernameStart > 0) {
		username = document.title.substring(usernameStart, document.title.lastIndexOf(" - "));
		const userhash = hashCode(username);
		if (simplifyDebug) console.log('Username: ' + username);
		if (simplifyDebug) console.log('Userhash: ' + userhash);
		if (simplify[u].username != userhash) {
			if (simplifyDebug) console.log('Usernames do NOT match');
			resetLocalStorage();
		}
		updateParam("username", userhash);
	}
}

// Init Preview Pane or Multiple Inboxes
if (simplify[u].previewPane) {
	if (simplifyDebug) console.log('Loading with split view');
	htmlEl.classList.add('splitView');

	// Multiple Inboxes doesn't work if you have Preview Pane enabled
	updateParam("multipleInboxes", "none");
} else {
	// Multiple Inboxes only works if Preview Pane is disabled
	if (simplify[u].multipleInboxes == "horizontal") {
		if (simplifyDebug) console.log('Loading with side-by-side multiple inboxes');
		htmlEl.classList.add('multiBoxHorz');
	} else if (simplify[u].multipleInboxes == "vertical") {
		if (simplifyDebug) console.log('Loading with vertically stacked multiple inboxes');
		htmlEl.classList.add('multiBoxVert');
	}
}

// Init themes
if (simplify[u].theme == "light") {
	if (simplifyDebug) console.log('Loading with light theme');
	htmlEl.classList.add('lightTheme');
} else if (simplify[u].theme == "dark") {
	if (simplifyDebug) console.log('Loading with dark theme');
	htmlEl.classList.add('darkTheme');
} else if (simplify[u].theme == "medium") {
	if (simplifyDebug) console.log('Loading with medium theme');
	htmlEl.classList.add('mediumTheme');
}

// Init nav menu
if (simplify[u].navOpen) {
	if (simplifyDebug) console.log('Loading with nav menu open');
	htmlEl.classList.add('navOpen');
} else {
	if (simplifyDebug) console.log('Loading with nav menu closed');
}

// Init density
if (simplify[u].density == "low") {
	if (simplifyDebug) console.log('Loading with low density inbox');
	htmlEl.classList.add('lowDensityInbox');
} else if (simplify[u].density == "high") {
	if (simplifyDebug) console.log('Loading with high density inbox');
	htmlEl.classList.add('highDensityInbox');
}

// Init text button labels
if (simplify[u].textButtons) {
	if (simplifyDebug) console.log('Loading with text buttons');
	htmlEl.classList.add('textButtons');
}

// Init right side chat
if (simplify[u].rhsChat) {
	if (simplifyDebug) console.log('Loading with right hand side chat');
	htmlEl.classList.add('rhsChat');
}

// Hide Search box by default
if (simplify[u].minimizeSearch == null) {
	// Only default to hiding search if the window is smaller than 1441px wide
	if (window.innerWidth < 1441) {
		updateParam('minimizeSearch', true);
	} else {
		updateParam('minimizeSearch', false);
	}
}
if (simplify[u].minimizeSearch) {
	if (simplifyDebug) console.log('Loading with search hidden');
	htmlEl.classList.add('hideSearch');
}

// Make space for add-ons pane if the add-ons pane was open last time
if (simplify[u].addOns) {
	if (simplifyDebug) console.log('Loading with add-ons pane');
	htmlEl.classList.add('addOnsOpen');
}

// Init 3rd party extensions
if (simplify[u].otherExtensions) {
	if (simplifyDebug) console.log('Loading with 3rd party extensions');
	htmlEl.classList.add('otherExtensions');
}

// Add .popout if this is a popped out email
if (isPopout) {
	htmlEl.classList.add('popout');
	htmlEl.classList.remove('splitView');
}



// == URL HISTORY =====================================================

// Set up urlHashes to track and update for closing Search and leaving Settings
let closeSearchUrlHash = (location.hash.substring(1, 7) == "search"
	|| location.hash.substring(1, 6) == "label"
	|| location.hash.substring(1, 16) == "advanced-search") ? "#inbox" : location.hash;
let closeSettingsUrlHash = location.hash.substring(1, 9) == "settings" ? "#inbox" : location.hash;

window.onhashchange = function() {
	// TODO: Should I also consider "#create-filter"?
	if (location.hash.substring(1, 7) != "search"
		&& location.hash.substring(1, 6) != "label"
		&& location.hash.substring(1, 16) != "advanced-search") {
			closeSearchUrlHash = location.hash;
	}
	if (location.hash.substring(1, 9) != "settings")  {
		closeSettingsUrlHash = location.hash;
		htmlEl.classList.remove('inSettings');
	}
	if (location.hash.substring(1, 9) == "settings")  {
		htmlEl.classList.add('inSettings');
	}

	// if we were supposed to check the theme later, do it now
	if (checkThemeLater) {
		detectTheme();
	}
}

// Show back button if page loaded on Settings
if (location.hash.substring(1, 9) == "settings") {
	htmlEl.classList.add('inSettings');
}






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
	const searchForm = document.querySelector('form[role="search"]');

	if (searchForm) {
		if (simplifyDebug) console.log('Detecting class names...');

		// Search parent
		const searchParent = searchForm.parentElement.classList.value.trim();
		simplify[u].elements["searchParent"] = "." + searchParent.replace(/ /g,".");

		// Main menu
		const menuButton = document.querySelector('#gb div path[d*="18h18v-2H3v2zm0"]').parentElement.parentElement.parentElement.classList.value.trim();
		simplify[u].elements["menuButton"] = "." + menuButton.replace(/ /g,".") + ' > div:first-child';
		simplify[u].elements["menuContainer"] = "." + menuButton.replace(/ /g,".");

		// Back button
		const backButton = document.querySelector('#gb div[role="button"] path[d*="11H7.83l5.59-5.59L12"]').parentElement.parentElement.classList.value.trim();
		simplify[u].elements["backButton"] = "." + backButton.replace(/ /g,".");

		// Support button (usually added about 2 seconds after page is loaded)
		const supportButton = document.querySelector('#gb path[d*="18h2v-2h-2v2zm1-16C6.48"]');
		if (simplifyDebug) {
			console.log('Detecting class name for support path element:');
			console.log(supportButton);
		}
		simplify[u].elements["supportButton"] = supportButton ? "." + supportButton.parentElement.parentElement.parentElement.parentElement.classList.value.trim().replace(/ /g,".") : simplify[u].elements["supportButton"];

		// Account switcher (profile pic/name)
		const accountButton = document.querySelector(`#gb a[aria-label*="${username}"], #gb a[href^="https://accounts.google.com/SignOutOptions"]`);
		simplify[u].elements["accountButton"] = accountButton ? "." + accountButton.classList.value.trim().replace(/ /g,".") : false;

		// Account wrapper (for Gsuite accounts)
		const accountWrapper = document.querySelector('#gb div[href^="https://accounts.google.com/SignOutOptions"]');
		simplify[u].elements["accountWrapper"] = accountWrapper ? "." + accountWrapper.classList.value.trim().replace(/ /g,".") : false;

		// Gsuite company logo
		const gsuiteLogo = document.querySelector('#gb img[src^="https://www.google.com/a/"]');
		simplify[u].elements["gsuiteLogo"] = gsuiteLogo ? "." + gsuiteLogo.parentElement.classList.value.trim().replace(/ /g,".") : false;

		// oneGoogle Ring around profile photo
		const oneGoogleRing = document.querySelector('#gb div path[fill="#F6AD01"]');
		simplify[u].elements["oneGoogleRing"] = oneGoogleRing ? "." + oneGoogleRing.parentElement.parentElement.classList.value.trim().replace(/ /g,".") : false;
		
		// Update the cached classnames in case any changed
		updateParam();

		// Add styles again in case the classNames changed
		addStyles();
	} else {
		detectClassNamesLoops++;
		if (simplifyDebug) console.log('detectClassNames loop #' + detectClassNamesLoops);

		// only try 10 times and then asume something is wrong
		if (detectClassNamesLoops < 10) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(detectClassNames, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting class names');
		}
	}
}

// Helper function to add CSS to Simplify Style Sheet
function addCSS(css, pos) {
	const position = pos ? pos : simplifyStyles.cssRules.length;
	simplifyStyles.insertRule(css, position);
	if (simplifyDebug) console.log('CSS added: ' + simplifyStyles.cssRules[position].cssText);
}

// This is all CSS that I need to add dynamically as the classNames often change for these elements 
// and I couldn't find a stable way to select the elements other than their classnames 
function addStyles() {
	// Remove right padding from action bar so search is always correctly placed
	addCSS(`html.simpl #gb ${simplify[u].elements.searchParent} { padding-right: 0px !important; }`);

	// Switch menu button for back button when in Settings
	addCSS(`html.simpl.inSettings #gb ${simplify[u].elements.menuButton} { display: none !important; }`);
	addCSS(`html.simpl.inSettings #gb ${simplify[u].elements.backButton} { display: block !important; }`);

	// Hide the oneGoogle Ring if it is there
	if (simplify[u].elements["oneGoogleRing"]) {
		addCSS(`html.simpl #gb ${simplify[u].elements.oneGoogleRing} { display: none !important; }`);
	}

	// Hide the support button if it is there
	if (simplify[u].elements["supportButton"]) {
		addCSS(`html.simpl #gb ${simplify[u].elements.supportButton} { display: none !important; }`);
	}

	// Restyle the profile name into an icon for delegated accounts
	if (simplify[u].elements["accountButton"]) {
		let delegatedAccountButtonCss = 'font-size:0px; width:32px; height:32px; margin:4px 6px 0 6px; line-height:26px; ';
		delegatedAccountButtonCss += 'border-radius:18px; background-color:rgba(0,0,0,0.85); font-weight:bold; ';
		delegatedAccountButtonCss += 'text-align:center; text-transform:uppercase; overflow:hidden;'
		addCSS(`html.simpl.delegate #gb ${simplify[u].elements.accountButton} { ${delegatedAccountButtonCss} }`);
		addCSS(`html.simpl.delegate #gb ${simplify[u].elements.accountButton}::first-letter { font-size: initial; color: white; }`);
		addCSS(`html.simpl.delegate #gb ${simplify[u].elements.accountButton} span { display:none; }`);
	}

	// Restyle profile pic itself
	if (simplify[u].elements["accountWrapper"]) {
		const accountWrapperCss = 'width:48px !important; margin-left:0px; border:none !important; background-color:transparent; box-shadow:none !important;'
		addCSS(`html.simpl #gb ${simplify[u].elements.accountWrapper} { ${accountWrapperCss} }`);
	}

	// Hide Gsuite company logo if it exists
	if (simplify[u].elements["gsuiteLogo"]) {
		addCSS(`html.simpl #gb ${simplify[u].elements.gsuiteLogo} { display:none; }`);
	}

	// Adjust size of menu button container
	addCSS(`html.simpl #gb ${simplify[u].elements.menuContainer} { min-width: 58px !important; padding-right: 0px; }`);	
}

// Add CSS based on cached selectors detected in previous loads
let simplifyStyles;
function initStyle() {
	if (document.head) {
		initStyleObserver.disconnect();

		// Create style sheet element and append to <HEAD>
		let simplifyStyleEl = document.createElement('style');
		simplifyStyleEl.id = "simplifyStyle";
		document.head.appendChild(simplifyStyleEl);

		// Setup global variable for style sheet
		if (simplifyDebug) console.log('Style sheet added');
		simplifyStyles = simplifyStyleEl.sheet;

		// Initialize addOns height now that Style Sheet is setup
		addCSS(`:root { --add-on-height: ${simplify[u].addOnsCount * 56}px; }`);

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
	if (onOff == 'off' || htmlEl.classList.contains('hideSearch')) {
		// Remove focus from search input or button
		document.activeElement.blur();
	} else {
		// Focus the search input
		document.querySelector('header#gb form input').focus();
	}
}

// Setup search event listeners
let initSearchLoops = 0;
function initSearch() {
	// See if Search form has be added to the dom yet
	const searchForm = document.querySelector('#gb form');

	// Setup Search functions to show/hide Search at the
	// right times if we have access to the search field
	if (searchForm) {
		// Focus search when you click anywhere on it
		searchForm.addEventListener('click', function(event) {
			toggleSearchFocus();
			console.log(event.target);
		}, false);

		// Add function to search button to toggle search open/closed
		const searchIcon = document.querySelector('#gb form path[d^="M20.49,19l-5.73"]').parentElement;
		searchIcon.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			htmlEl.classList.toggle('hideSearch');
			updateParam('minimizeSearch', htmlEl.classList.contains('hideSearch'));
			toggleSearchFocus();
		}, false);

		// Add functionality to search close button to close search and go back
		const searchCloseIcon = document.querySelector('#gb form path[d~="6.41L17.59"]').parentElement;

		// Hide search when you clear the search if it was previously hidden
		searchCloseIcon.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			toggleSearchFocus('off');
			document.querySelector('header input[name="q"]').value = "";
			if (location.hash == closeSearchUrlHash) {
				// Hide close button
				const searchCloseButton = searchCloseIcon.parentElement;
				const showCloesButtonClass = searchCloseButton.classList.value.split(' ')[1];
				searchCloseButton.classList.remove(showCloesButtonClass);

				// Remove focus style from search input (always the 3rd classname)
				const searchFormClass = searchForm.classList.value.split(' ')[2];
				searchForm.classList.remove(searchFormClass);
			} else {
				location.hash = closeSearchUrlHash;
			}
			if (simplify[u].minimizeSearch) {
				htmlEl.classList.add('hideSearch');
			}
		}, false);
	} else {
		initSearchLoops++;
		if (simplifyDebug) console.log('initSearch loop #' + initSearchLoops);

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
		if (location.hash.substring(1, 7) == "search") {
			htmlEl.classList.remove('hideSearch');
		}

		// Show search if it is focused and hidden
		searchInput.addEventListener('focus', function() {
			htmlEl.classList.remove('hideSearch');
		}, false );

		// Hide search box if it loses focus, is empty, and was previously hidden
		searchInput.addEventListener('blur', function(event) {
			// if (this.value == "" && (simplify[u].minimizeSearch || event.target.name == "q")) {
			if (this.value == "" && simplify[u].minimizeSearch) {
				htmlEl.classList.add('hideSearch');
			}
		}, false );

		// Remove the placeholder text in the search box
		searchInput.placeholder = "";

		// Setup eventListeners for search input
		searchInput.addEventListener('focus', () => {
			// Add searchFocus from html element
			htmlEl.classList.add('searchFocused');
			const searchLength = searchInput.value.length;
			setTimeout(function() {
				searchInput.setSelectionRange(searchLength, searchLength);
			}, 200);
		});
		searchInput.addEventListener('blur', () => {
			// Remove searchFocus from html element
			htmlEl.classList.remove('searchFocused');
		});
	} else {
		// If the search field can't be found, wait and try again
		initSearchFocusLoops++;
		if (simplifyDebug) console.log('initSearchFocus loop #' + initSearchFocusLoops);

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
		backButton = document.querySelector('#gb div[role="button"] path[d*="11H7.83l5.59-5.59L12"]');
		if (backButton) backButton = backButton.parentElement;
	}

	if (backButton) {
		backButton.addEventListener('click', function() {
			if (location.hash.substring(1, 9) == "settings") {
				location.hash = closeSettingsUrlHash;
				htmlEl.classList.remove('inSettings');
			}
		}, false);
	} else {
		initSettingsLoops++;
		if (simplifyDebug) console.log('initSettings loop #' + initSettingsLoops);

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
	if (simplifyDebug) console.log('Detecting theme...');
	if (msgCheckbox) {
		const checkboxBg = window.getComputedStyle(msgCheckbox, null).getPropertyValue("background-image");
		const menuButton = document.querySelector('#gb div path[d*="18h18v-2H3v2zm0"]');
		const menuButtonBg = window.getComputedStyle(menuButton, null).getPropertyValue("color");
		if (checkboxBg.indexOf('black') > -1) {
			if (menuButtonBg.indexOf('255, 255, 255') > -1) {
				// The checkbox is black which means the threadlist 
				// bg is light, BUT the app bar icons are light
				htmlEl.classList.add('mediumTheme');
				htmlEl.classList.remove('lightTheme');
				htmlEl.classList.remove('darkTheme');
				updateParam('theme', 'medium');
			} else {			
				htmlEl.classList.add('lightTheme');
				htmlEl.classList.remove('mediumTheme');
				htmlEl.classList.remove('darkTheme');
				updateParam('theme', 'light');
			}
		} else {
			htmlEl.classList.add('darkTheme');
			htmlEl.classList.remove('lightTheme');
			htmlEl.classList.remove('mediumTheme');
			updateParam('theme', 'dark');
		}
		checkThemeLater = false;
		if (!observingThemes) observeThemes();
	} else if (conversation.length == 0) {
		// if we're not looking at a conversation, maybe the threadlist just hasn't loaded yet
		detectThemeLoops++;
		if (simplifyDebug) console.log('detectTheme loop #' + detectThemeLoops);

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
	const themeBg = document.querySelector('.yL .wl');

	if (themeBg) {	
		const themesObserverConfig = { attributes: true, attributeFilter: ["style"], childList: true, subtree: true };

		// Create an observer instance that calls the detectTheme function
		// Annoying that I have to delay by 200ms... if I don't then 
		// it checks to see if anything changed before it had a chance to change
		const themesObserver = new MutationObserver(function() { setTimeout(detectTheme, 200) });

		// Start observing the target node for configured mutations
		themesObserver.observe(themeBg, themesObserverConfig);
		observingThemes = true;
		if (simplifyDebug) console.log('Adding mutation observer for themes');
	} else {
		if (simplifyDebug) console.log('Failed to add mutation observer for themes');
	}
}

// Detect the interface density so we can adjust the line height on items
let detectDensityLoops = 0;
function detectDensity() {
	const navItem = document.querySelector('div[role="navigation"] .TN');
	if (navItem) {
		const navItemHeight = parseInt(window.getComputedStyle(navItem, null).getPropertyValue("height"));
		if (simplifyDebug) console.log('Detecting inbox density via nav item. Height is ' + navItemHeight + 'px');
		if (navItemHeight <= 26) {
			if (simplifyDebug) console.log('Detected high density');
			htmlEl.classList.remove('lowDensityInbox');
			htmlEl.classList.add('highDensityInbox');
			updateParam('density', 'high');
		} else {
			if (simplifyDebug) console.log('Detected low density');
			htmlEl.classList.add('lowDensityInbox');
			htmlEl.classList.remove('highDensityInbox');
			updateParam('density', 'low');
		}
	} else {
		detectDensityLoops++;
		if (simplifyDebug) console.log('detectDensity loop #' + detectDensityLoops);

		// only try 4 times and then assume no split view
		if (detectDensityLoops < 5) {
			// Call init function again if nav item wasn't loaded yet
			setTimeout(detectDensity, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting interface density');
		}
	}
}

// Detect if preview panes are enabled and being used
// TODO: I should rename SplitView PreviewPane as that is what Gmail calls the feature
let detectSplitViewLoops = 0;
function detectSplitView() {
	// Short term patch: Offline seems to mess with detecting splitPanes
	const offlineActive = document.getElementsByClassName('bvE');
	if (offlineActive && detectSplitViewLoops == 0) {
		detectSplitViewLoops++;
		setTimeout(detectSplitView, 2000);
	} else {
		const splitViewToggle = document.querySelector('div[selector="nosplit"]');
		if (splitViewToggle) {
			// Only the Preview Pane vertical or horizontal has the action bar
			const splitViewActionBar = document.querySelectorAll('div[role="main"] > .G-atb');
			if (splitViewActionBar) {
				if (splitViewActionBar.length > 0) {
					if (simplifyDebug) console.log('Split view detected and active');
					htmlEl.classList.add('splitView');
					updateParam('previewPane', true);
					/* TODO: Listen for splitview mode toggle via mutation observer */
				} else {
					if (simplifyDebug) console.log('Split view enabled but set to No Split');
					if (simplifyDebug) console.log(splitViewActionBar);
					htmlEl.classList.remove('splitView');
					updateParam('previewPane', false);
				}
				// Multiple Inboxes only works when Split view is disabled
				updateParam("multipleInboxes", "none");
				htmlEl.classList.remove('multiBoxVert');
				htmlEl.classList.remove('multiBoxHorz');
			}
		} else {
			detectSplitViewLoops++;
			if (simplifyDebug) console.log('Detect preview pane loop #' + detectSplitViewLoops);

			// only try 10 times and then assume no split view
			if (detectSplitViewLoops < 10) {
				// Call init function again if the gear button field wasn't loaded yet
				setTimeout(detectSplitView, 500);
			} else {
				if (simplifyDebug) console.log('Giving up on detecting split view');
				htmlEl.classList.remove('splitView');
				updateParam('previewPane', false);
			}
		}
	}
}



// Determine number of add-ons and set the height of the add-ons pane accordingly
let detectNumberOfAddOnsLoops = 0;
function detectNumberOfAddOns() {
	// Detect how many add-ons there are
	const numberOfAddOns = parseInt(document.querySelectorAll('.bAw div[role="tablist"] > div[role="tab"]').length) - 2;
	if (numberOfAddOns > 0) {
		if (simplifyDebug) console.log('There are ' + numberOfAddOns + ' add-ons');
		if (numberOfAddOns != simplify[u].addOnsCount && numberOfAddOns > 3) {
			addCSS(`:root { --add-on-height: ${numberOfAddOns * 56}px !important; }`);
			updateParam('addOnsCount', numberOfAddOns);
		} else {
			updateParam('addOnsCount', 3);
		}
	} else {
		detectNumberOfAddOnsLoops++;
		if (simplifyDebug) console.log('detectNumberOfAddOns loop #' + detectNumberOfAddOnsLoops);

		// only try 4 times and then assume no add-on pane
		if (detectNumberOfAddOnsLoops < 5) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectNumberOfAddOns, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting number of add-ons pane');
		}
	}
}



// Detect Add-ons Pane
let detectAddOnsPaneLoops = 0;
function detectAddOns() {
	const addOnsPane = document.getElementsByClassName('brC-brG')[0];
	if (addOnsPane) {
		const paneVisible = window.getComputedStyle(document.getElementsByClassName('bq9')[0], null).getPropertyValue('width');
		if (simplifyDebug) console.log('Add-on pane width loaded as ' + paneVisible);
		if (paneVisible == "auto") {
			if (simplifyDebug) console.log('No add-on pane detected on load');
			htmlEl.classList.remove('addOnsOpen');
			updateParam('addOns', false);
		} else {
			if (simplifyDebug) console.log('Add-on pane detected on load');
			htmlEl.classList.add('addOnsOpen');
			updateParam('addOns', true);
		}

		// Set the height of the add-ons tray based on number of add-ons
		detectNumberOfAddOns();

		// Options for the observer (which mutations to observe)
		const addOnsObserverConfig = { attributes: true, childList: false, subtree: false };

		// Callback function to execute when mutations are observed
		// TODO: Detect changes to width of bq9 instead of style attribute
		// TODO: Can I do this without looping through all the mutations?
		const addOnsObserverCallback = function(mutationsList, observer) {
		    for (let mutation of mutationsList) {
		        if (mutation.type == 'attributes' && mutation.attributeName == 'style') {
		        	if (simplifyDebug) console.log('Add-on pane style set to: ' + mutation.target.attributes.style.value);
		        	if (mutation.target.attributes.style.value.indexOf("display: none") > -1) {
		        		htmlEl.classList.remove('addOnsOpen');
		        		updateParam('addOns', false);
		        	} else {
		        		htmlEl.classList.add('addOnsOpen');
		        		updateParam('addOns', true);
		        	}
		        }
		    }
		};

		// Create an observer instance linked to the callback function
		const addOnsObserver = new MutationObserver(addOnsObserverCallback);

		// Start observing the target node for configured mutations
		if (simplifyDebug) console.log('Adding mutation observer for Add-ons Pane');
		addOnsObserver.observe(addOnsPane, addOnsObserverConfig);
	} else {
		detectAddOnsPaneLoops++;
		if (simplifyDebug) console.log('detectAddOns loop #' + detectAddOnsPaneLoops);

		// only try 4 times and then assume no add-on pane
		if (detectAddOnsPaneLoops < 10) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectAddOns, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting add-ons pane');
		}
	}
}



// Detect Right Side Chat (why hasn't Gmail killed this already?)
let detectRightSideChatLoops = 0;
function detectRightSideChat() {
	const talkRoster = document.getElementById('talk_roster');
	if (talkRoster) {
		const rosterSide = talkRoster.getAttribute('guidedhelpid');

		if (rosterSide == "right_roster") {
			if (simplifyDebug) console.log('Right side chat found');
			htmlEl.classList.add('rhsChat');
			updateParam('rhsChat', true);
		} else {
			updateParam('rhsChat', false);
		}
	} else {
		detectRightSideChatLoops++;
		if (simplifyDebug) console.log('detectRhsChat loop #' + detectRightSideChatLoops);

		// only try 4 times and then assume no add-on pane
		if (detectRightSideChatLoops < 5) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectRightSideChat, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting Talk roster');
		}
	}
}



// Detect if using text or icon buttons
let detectButtonLabelLoops = 0;
function detectButtonLabel() {
	const secondButton = document.querySelectorAll('div[gh="tm"] div[role="button"] > div')[2];
	if (secondButton) {
		const textButtonLabel = secondButton.innerText;
		if (textButtonLabel == "") {
			// Using icon buttons
			if (simplifyDebug) console.log('Icon button labels detected');
			updateParam('textButtons', false);
			htmlEl.classList.remove('textButtons');
		} else {
			// Using icon buttons
			if (simplifyDebug) console.log('Text button labels detected');
			updateParam('textButtons', true);
			htmlEl.classList.add('textButtons');
		}
	} else {
		detectButtonLabelLoops++;
		if (detectButtonLabelLoops < 5) {
			setTimeout(detectButtonLabel, 500);
			if (simplifyDebug) console.log('Detect button labels loop #' + detectButtonLabelLoops);
		}
	}
}



// Detect nav state
let detectMenuStateLoops = 0;
function detectMenuState() {
	const menuButtonIcon = document.querySelector('#gb div path[d*="18h18v-2H3v2zm0"]');
	if (menuButtonIcon) {
		const menuButton = menuButtonIcon.parentElement.parentElement;
		const navOpen = menuButton.getAttribute('aria-expanded');
		menuButton.addEventListener('click', toggleMenu, false);
		if (navOpen == "true") {
			if (simplifyDebug) console.log('Nav is open');
			updateParam('navOpen', true);
			htmlEl.classList.add('navOpen');
		} else {
			if (simplifyDebug) console.log('Nav is closed');
			updateParam('navOpen', false);
			htmlEl.classList.remove('navOpen');
		}
	} else {
		detectMenuStateLoops++;
		if (detectMenuStateLoops < 5) {
			setTimeout(detectMenuState, 500);
			if (simplifyDebug) console.log('Detect nav state loop #' + detectMenuStateLoops);
		}
	}
}

// Helper function to toggle nav open/closed
function toggleMenu() {
	if (simplifyDebug) console.log('Toggle nav');
	const menuButton = document.querySelector(`#gb ${simplify[u].elements.menuButton}`);

	if (simplify[u].navOpen) {
		htmlEl.classList.remove('navOpen');
		menuButton.setAttribute('aria-expanded', 'false');
		updateParam('navOpen', false);
	}
	else {
		htmlEl.classList.add('navOpen');
		menuButton.setAttribute('aria-expanded', 'true');
		updateParam('navOpen', true);
	}
}



// Detect Multiple Inboxes
function detectMultipleInboxes() {
	const viewAllButton = document.querySelectorAll('div[role="main"] span[action="viewAll"]').length;
	if (viewAllButton > 0) {
		if (simplifyDebug) console.log('Multiple inboxes found');

		// Multiple Inboxes only works when Split view is disabled
		if (simplify[u].previewPane) {
			// TODO: If both multiple inboxes and preview pane are enabled, throw an error

			// TODO: what do we do with the multiple inboxes class names & localStorage var?
		} else {
			const actionBars = document.querySelectorAll('.G-atb[gh="tm"]').length
			if (actionBars > 1) {
				htmlEl.classList.add('multiBoxVert');
				htmlEl.classList.remove('multiBoxHorz');
				updateParam("multipleInboxes", "vertical");
			} else {
				htmlEl.classList.add('multiBoxHorz');
				htmlEl.classList.remove('multiBoxVert');
				updateParam("multipleInboxes", "horizontal");
			}
		}
	} else {
		updateParam("multipleInboxes", "none");
		htmlEl.classList.remove('multiBoxVert');
		htmlEl.classList.remove('multiBoxHorz');
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
	const actionBar = document.querySelector('div.aeH');

	if (actionBar) {
		const paginationDivs = document.querySelectorAll('.aeH div.ar5');
		paginationDivs.forEach(function(pagination) {
			// How many messages in the list?
			const pageButtons = pagination.querySelectorAll('div[role="button"][aria-disabled="true"]');

			// Hide pagination control if the total count is less than 100
			if (pageButtons.length >= 2) {
				pagination.style.display = "none";
			} else {
				pagination.style.display = "inline-block";
			}
		});
	}
}
function observePagination() {
	const actionBar = document.querySelector('div.aeH');

	if (actionBar) {
		// Options for the observer (which mutations to observe)
		const paginationObserverConfig = { attributes: true, childList: true, subtree: true };

		// Create an observer instance linked to the callback function
		const paginationObserver = new MutationObserver(testPagination);

		// Start observing the target node for configured mutations
		if (simplifyDebug) console.log('Adding mutation observer for Pagination controls');
		paginationObserver.observe(actionBar, paginationObserverConfig);
	}
}



// Detect if this is a delegated account
function detectDelegate() {
	if (location.pathname.substring(6,7) == "b" ) {
		htmlEl.classList.add('delegate');
	}
}



// Init App switcher event listeners
let initAppSwitcherLoops = 0;
function initAppSwitcher() {
	const profileButton = document.querySelectorAll('#gb a[href^="https://accounts.google.com/SignOutOptions"], #gb a[aria-label^="Google Account: "]')[0];
	const appSwitcherWrapper = document.querySelector('#gbwa');
	const appBar = document.querySelector('#gb');
	if (profileButton && appSwitcherWrapper) {
		profileButton.addEventListener('mouseenter', function() {
			htmlEl.classList.add('appSwitcher');
		}, false);

		appBar.addEventListener('mouseleave', function() {
			htmlEl.classList.remove('appSwitcher');
		}, false);
	} else {
		initAppSwitcherLoops++;
		if (initAppSwitcherLoops < 10) {
			setTimeout(initAppSwitcher, 500);
			if (simplifyDebug) console.log('initAppSwitcher loop #' + initAppSwitcherLoops);
		}
	}
}




// Detect if there are other 3rd party extensions installed
// TODO: Figure out how to auto-dismiss the tray once open – as is, it breaks the app switcher
function detectOtherExtensions() {
	const otherExtensionsList = {
		'#gb .manage_menu':{'width':70, 'initial':100}, /* Boomerang */
		'#gb .inboxsdk__appButton':{'width':56, 'initial':114}, /* Streak */
		'#gb #mailtrack-menu-opener':{'width':44, 'initial':120}, /* Mail track */
		'#gb .mixmax-appbar':{'width':56, 'initial':100} /* Mixmax */
	};
	const otherExtensions = document.querySelectorAll( Object.keys(otherExtensionsList).toString() );
	
	// window.getComputedStyle(document.querySelector('#gb .inboxsdk__appButton'), null).getPropertyValue('width')
	if (otherExtensions.length > 0) {
		htmlEl.classList.add('otherExtensions');
		updateParam('otherExtensions', true);
		if (simplifyDebug) console.log('Other extensions detected');

		// See if extension exists and if it does, set its right pos by width + padding
		let extensionsWidth = 0;
		Object.entries(otherExtensionsList).forEach(function(extension) {
			if (simplifyDebug) console.log(`Extensions - Looking for ${extension[0]}...`);
			const extensionEl = document.querySelector(extension[0]);
			if (extensionEl) {
				if (extensionsWidth == 0) {
					extensionsWidth = extension[1].initial;
				}
				extensionEl.style.setProperty('right', `${extensionsWidth}px`);
				extensionsWidth += extension[1].width;
				if (simplifyDebug) console.log(`Extensions - right position now: ${extensionsWidth}px`);
			} else {
				if (simplifyDebug) console.log(`Extensions - Couldn't find ${extension}`);
			}
		});
	} else {
		htmlEl.classList.remove('otherExtensions');
		updateParam('otherExtensions', false);
		if (simplifyDebug) console.log('No extensions detected');
	}
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


// Initialize styles as soon as head is ready
const initStyleObserver = new MutationObserver(initStyle);
function observeHead() {
	// Start observing the target node for configured mutations
	initStyleObserver.observe(htmlEl, { attributes: true, childList: true, subtree: true });
	if (simplifyDebug) console.log('Adding mutation observer for head to initialize cached styles');
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
	detectTheme();
	detectSplitView();
	detectDensity();
	detectRightSideChat();
	detectAddOns();
	detectMenuState();
	detectButtonLabel();
	detectMultipleInboxes();
	initAppSwitcher();
	testPagination();
	observePagination();
	checkLocalVar();

	// 3rd party extensions take a few seconds to load
	setTimeout(detectOtherExtensions, 5000);
	
	// Some elements get loaded in after the page is done loading
	setTimeout(detectClassNames, 7000);
}

// Only initialize everything if this isn't a popout
if (!isPopout) {
	window.addEventListener('DOMContentLoaded', initOnDomReady, false);
	window.addEventListener('load', initOnPageLoad, false);
}