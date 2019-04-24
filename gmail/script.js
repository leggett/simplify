
/* ==================================================
 * SIMPLIFY GMAIL
 * By Michael Leggett: leggett.org
 * Copyright (c) 2019 Michael Hart Leggett
 * More info: simpl.fyi/gmail
 * Code base: github.com/leggett/simplify/blob/master/gmail/
 * License: github.com/leggett/simplify/blob/master/gmail/LICENSE
 */


// == SIMPL =====================================================
// Turn debug loggings on/off
var simplifyDebug = false;

// Add simpl style to html tag
var htmlEl = document.documentElement;
htmlEl.classList.add('simpl');

// Add keyboard shortcut for toggling on/off custom style
function toggleSimpl(event) {
	// If Cmd+J was pressed, toggle simpl
	if (event.metaKey && event.which == 74) {
		htmlEl.classList.toggle('simpl');
		event.preventDefault();
	}
}
window.addEventListener('keydown', toggleSimpl, false);

/* Add simpl Toggle button
window.addEventListener('load', function() {
	var elem = document.createElement("div");
	elem.id = 'simplToggle';
	elem.addEventListener('click', toggleSimpl, false);
	document.body.insertBefore(elem, document.body.childNodes[0]);
}, false);
*/

// Initialize saved states
if (window.localStorage.simplifyPreviewPane == "true") {
	if (simplifyDebug) console.log('Loading with split view');
	htmlEl.classList.add('splitView');
}
if (window.localStorage.simplifyLightTheme == "true") {
	if (simplifyDebug) console.log('Loading with light theme');
	htmlEl.classList.add('lightTheme');	
} else if (window.localStorage.simplifyDarkTheme == "true") {
	if (simplifyDebug) console.log('Loading with dark theme: ' + window.localStorage.simplifyDarkTheme)
	htmlEl.classList.add('darkTheme');
}
if (window.localStorage.simplifyDensity == "low") {
	if (simplifyDebug) console.log('Loading with low density inbox');
	htmlEl.classList.add('lowDensityInbox');
} else if (window.localStorage.simplifyDensity == "high") {
	if (simplifyDebug) console.log('Loading with high density inbox');
	htmlEl.classList.add('highDensityInbox');
}
if (window.localStorage.simplifyMultipleInboxes == "horizontal") {
	if (simplifyDebug) console.log('Loading with side-by-side multiple inboxes');
	htmlEl.classList.add('multiBoxHorz');
} else if (window.localStorage.simplifyMultipleInboxes == "vertical") {
	if (simplifyDebug) console.log('Loading with vertically stacked multiple inboxes');
	htmlEl.classList.add('multiBoxVert');
}
if (window.localStorage.simplifyRightSideChat == "true") {
	if (simplifyDebug) console.log('Loading with right hand side chat');
	htmlEl.classList.add('rhsChat');
}


// Hide Search box by default
if (typeof window.localStorage.simplifyHideSearch === 'undefined') {
	// Only default to hiding search if the window is smaller than 1441px wide
	if (window.innerWidth < 1441) {
		window.localStorage.simplifyHideSearch = true;
	} else {
		window.localStorage.simplifyHideSearch = false;
	}
}
if (window.localStorage.simplifyHideSearch == "true") {
	if (simplifyDebug) console.log('Loading with search hidden');
	htmlEl.classList.add('hideSearch');
}

// Make space for add-ons pane if the add-ons pane was open last time
if (typeof window.localStorage.simplifyAddOnPane === 'undefined') {
	window.localStorage.simplifyAddOnPane = false;
}
if (window.localStorage.simplifyAddOnPane == "true") {
	if (simplifyDebug) console.log('Loading with add-ons pane');
	htmlEl.classList.add('addOnsPane');
}

// Set default size of add-ons tray
if (typeof window.localStorage.simplifyNumberOfAddOns === 'undefined') {
	window.localStorage.simplifyNumberOfAddOns = 3;
}
htmlEl.style.setProperty('--add-on-height', parseInt(window.localStorage.simplifyNumberOfAddOns)*56 + 'px');




// == URL HISTORY =====================================================

// Set up urlHashes to track and update for closing Search and leaving Settings
var closeSearchUrlHash = location.hash.substring(1, 7) == "search" || "label/" || "advanc" ? "#inbox" : location.hash;
var closeSettingsUrlHash = location.hash.substring(1, 9) == "settings" ? "#inbox" : location.hash;

window.onhashchange = function() {
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




// == SEARCH FUNCTIONS =====================================================

/* Focus search input */
function toggleSearchFocus(onOff) {	
	// We are about to show Search if hideSearch is still on the html tag
	if (onOff == 'off' || htmlEl.classList.contains('hideSearch')) {
		document.querySelector('div.gb_td form').classList.remove('gb_oe');

		// Remove focus from search input or button 
		document.activeElement.blur();
	} else {
		document.querySelector('div.gb_td form').classList.add('gb_oe');
		document.querySelector('div.gb_td form input').focus();
	}
}

// Setup search event listeners
var initSearchLoops = 0;
function initSearch() {
	// See if Search form has be added to the dom yet
	var headerBar = document.getElementById('gb');
	var searchForm = (headerBar) ? headerBar.getElementsByTagName('form')[0] : false;

	// Setup Search functions to show/hide Search at the 
	// right times if we have access to the search field
	if (searchForm) {
		// Add .gb_vd, Gmail's own class to minimize search
		searchForm.classList.toggle('gb_vd');
		
		// Add function to search button to toggle search open/closed
		var searchButton = document.getElementsByClassName('gb_Ue')[0];
		var searchIcon = searchButton.getElementsByTagName('svg')[0];
		searchIcon.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			htmlEl.classList.toggle('hideSearch');
			searchForm.classList.toggle('gb_vd');
			window.localStorage.simplifyHideSearch = htmlEl.classList.contains('hideSearch') ? true : false;
			toggleSearchFocus();
		}, false);

		// Add functionality to search close button to close search and go back
		var searchCloseButton = document.getElementsByClassName('gb_Xe')[0];
		var searchCloseIcon = searchCloseButton.getElementsByTagName('svg')[0];
		
		// Hide search when you clear the search if it was previously hidden		
		searchCloseIcon.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			toggleSearchFocus('off');
			document.querySelector('header input[name="q"]').value = "";
			searchForm.classList.add('gb_vd');
			location.hash = closeSearchUrlHash;
			htmlEl.classList.toggle('hideSearch');
			window.localStorage.simplifyHideSearch = true;
		}, false);
	} else {
		initSearchLoops++;
		if (simplifyDebug) console.log('initSearch loop #' + initSearchLoops);
		
		// only try 20 times and then asume something is wrong
		if (initSearchLoops < 21) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(initSearch, 500);
		}
	}
}

// Detect if search is focused and needs to be expanded
var initSearchFocusLoops = 0;
function initSearchFocus() {
	// If the search field gets focus and hideSearch hasn't been applied, add it
	var searchInput = document.querySelectorAll('header input[name="q"]')[0];

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
		searchInput.addEventListener('blur', function() { 
			if (this.value == "" && window.localStorage.simplifyHideSearch == "true") {
				htmlEl.classList.add('hideSearch');
			}
		}, false );
	} else {
		// If the search field can't be found, wait and try again
		initSearchFocusLoops++;
		if (simplifyDebug) console.log('initSearchFocus loop #' + initSearchFocusLoops); 

		// Only try 10 times and then asume something is wrong
		if (initSearchFocusLoops < 11) {
			// Call init function again if the search input wasn't loaded yet
			setTimeout(initSearchFocus, 500);
		}
	}
}




// == SETTINGS FUNCTIONS =====================================================

// Setup settings event listeners
var initSettingsLoops = 0;
function initSettings() {
	// See if settings gear has be added to the dom yet
	var backButton = document.querySelector('header#gb div[aria-label="Go back"] svg');
	if (!backButton) {
		// aria-label doesn't work with non-english interfaces but .gb_1b changes often
		backButton = document.querySelector('header#gb div.gb_1b svg');
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

		// only try 20 times and then asume something is wrong
		if (detectThemeLoops < 21) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(initSettings, 500);
		}
	}
}




// == DETECTION FUNCTIONS =====================================================

// Detect if a dark theme is being used and change styles accordingly
// TODO: detect when they change themes
var detectThemeLoops = 0;
var checkThemeLater = false;
function detectTheme() {
	var msgCheckbox = document.querySelectorAll('div[gh="tl"] .xY > .T-Jo')[0];
	var conversation = document.querySelectorAll('table[role="presentation"]');
	if (msgCheckbox) {
		var checkboxBg = window.getComputedStyle(msgCheckbox, null).getPropertyValue("background-image");
		if (checkboxBg.indexOf('black') > -1) {
			htmlEl.classList.add('lightTheme');
			htmlEl.classList.remove('darkTheme');
			window.localStorage.simplifyLightTheme = true;
			window.localStorage.simplifyDarkTheme = false;
		} else {
			htmlEl.classList.add('darkTheme');
			htmlEl.classList.remove('lightTheme');
			window.localStorage.simplifyDarkTheme = true;
			window.localStorage.simplifyLightTheme = false;
		}
		checkThemeLater = false;
	} else if (conversation.length == 0) {
		// if we're not looking at a conversation, maybe the threadlist just hasn't loaded yet
		detectThemeLoops++;
		if (simplifyDebug) console.log('detectTheme loop #' + detectThemeLoops);

		// only try 10 times and then asume you're in a thread
		if (detectThemeLoops < 11) {
			setTimeout(detectTheme, 500);		
		}
	} else {
		// We are looking at a conversation, check the theme when the view changes
		checkThemeLater = true;
	}
}


// Detect the interface density so we can adjust the line height on items
var detectDensityLoops = 0;
function detectDensity() {
	var navItem = document.querySelector('div[role="navigation"] .TN');
	if (navItem) {
		var navItemHeight = parseInt(window.getComputedStyle(navItem, null).getPropertyValue("height"));
		if (simplifyDebug) console.log('Detecting inbox density via nav item. Height is ' + navItemHeight + 'px');
		if (navItemHeight <= 26) {
			if (simplifyDebug) console.log('Detected high density');
			htmlEl.classList.remove('lowDensityInbox');
			htmlEl.classList.add('highDensityInbox');
			window.localStorage.simplifyDensity = "high";
		} else {
			if (simplifyDebug) console.log('Detected low density');
			htmlEl.classList.add('lowDensityInbox');
			htmlEl.classList.remove('highDensityInbox');
			window.localStorage.simplifyDensity = "low";
		}
	} else {
		detectDensityLoops++;
		if (simplifyDebug) console.log('detectDensity loop #' + detectDensityLoops);

		// only try 10 times and then assume no split view
		if (detectDensityLoops < 11) {
			// Call init function again if nav item wasn't loaded yet
			setTimeout(detectDensity, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting interface density');
		}
	}
}

// Detect if preview panes are enabled and being used
var detectSplitViewLoops = 0;
function detectSplitView() {
	var splitViewMenuLoaded = document.querySelectorAll('div[selector="nosplit"]');
	if (splitViewMenuLoaded) {
		var splitViewActive = document.querySelectorAll('div[role="main"] div[selector="nosplit"]').length
		if (splitViewActive > 0) {
			if (simplifyDebug) console.log('Split view detected and active');
			htmlEl.classList.add('splitView');
			window.localStorage.simplifyPreviewPane = true;

			/* TODO: Listen for splitview mode toggle via mutation observer
			document.querySelectorAll('div[selector="nosplit"] > div')[0].addEventListener('click', function() {
				console.log('No split clicked');
				htmlEl.classList.remove('splitView');
			}, false);
			document.querySelectorAll('div[selector="horizontal"] > div')[0].addEventListener('click', function() {
				htmlEl.classList.add('splitView');
			}, false);
			document.querySelectorAll('div[selector="vertical"] > div')[0].addEventListener('click', function() {
				htmlEl.classList.add('splitView');
			}, false);
			// on .asa (quick toggle) -- common class name, not going to work
			// ...
			*/
		} else {
			if (simplifyDebug) console.log('No split view');
			htmlEl.classList.remove('splitView');
			window.localStorage.simplifyPreviewPane = false;
		}
	} else {
		detectSplitViewLoops++;
		if (simplifyDebug) console.log('initSettings loop #' + detectSplitViewLoops);

		// only try 10 times and then assume no split view
		if (detectSplitViewLoops < 11) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(detectSplitView, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting split view');
		}
	}
}



// Determine number of add-ons and set the height of the add-ons pane accordingly
var detectNumberOfAddOnsLoops = 0;
function detectNumberOfAddOns() {
	// Detect how many add-ons there are
	var numberOfAddOns = parseInt(document.querySelectorAll('.bAw div[role="tablist"] > div[role="tab"]').length) - 2;
	if (numberOfAddOns > 0) {
		if (simplifyDebug) console.log('There are ' + numberOfAddOns + ' add-ons');
		if (numberOfAddOns > 3) {
			document.documentElement.style.setProperty('--add-on-height', numberOfAddOns*56 + 'px');
			window.localStorage.simplifyNumberOfAddOns = numberOfAddOns;
		} else {
			window.localStorage.simplifyNumberOfAddOns = 3;
		}
	} else {
		detectNumberOfAddOnsLoops++;
		if (simplifyDebug) console.log('detectNumberOfAddOns loop #' + detectNumberOfAddOnsLoops);

		// only try 10 times and then assume no add-on pane
		if (detectNumberOfAddOnsLoops < 11) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectNumberOfAddOns, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting number of add-ons pane');
		}
	}
}



// Detect Add-ons Pane
var detectAddOnsPaneLoops = 0;
function detectAddOns() {
	var addOnsPane = document.getElementsByClassName('brC-brG')[0];
	if (addOnsPane) {
		var paneVisible = window.getComputedStyle( document.getElementsByClassName('bq9')[0], null).getPropertyValue('width');
		if (simplifyDebug) console.log('Add-on pane width loaded as ' + paneVisible);
		if (paneVisible == "auto") {
			if (simplifyDebug) console.log('No add-on pane detected on load');
			htmlEl.classList.remove('addOnsPane');
			window.localStorage.simplifyAddOnPane = false;
		} else {
			if (simplifyDebug) console.log('Add-on pane detected on load');
			htmlEl.classList.add('addOnsPane');
			window.localStorage.simplifyAddOnPane = true;
		}

		// Set the height of the add-ons tray based on number of add-ons
		detectNumberOfAddOns();

		// Options for the observer (which mutations to observe)
		var addOnsObserverConfig = { attributes: true, childList: false, subtree: false };

		// Callback function to execute when mutations are observed
		// TODO: detect changes to width of bq9 instead of style attribute
		var addOnsObserverCallback = function(mutationsList, observer) {
		    for (var mutation of mutationsList) {
		        if (mutation.type == 'attributes' && mutation.attributeName == 'style') {
		        	if (simplifyDebug) console.log('Add-on pane style set to: ' + mutation.target.attributes.style.value);
		        	if (mutation.target.attributes.style.value.indexOf("display: none") > -1) {
		        		htmlEl.classList.remove('addOnsPane');
		        		window.localStorage.simplifyAddOnPane = false;
		        	} else {
		        		htmlEl.classList.add('addOnsPane');
		        		window.localStorage.simplifyAddOnPane = true;
		        	}
		        }
		    }
		};

		// Create an observer instance linked to the callback function
		var addOnsObserver = new MutationObserver(addOnsObserverCallback);

		// Start observing the target node for configured mutations
		if (simplifyDebug) console.log('Adding mutation observer for Add-ons Pane');
		addOnsObserver.observe(addOnsPane, addOnsObserverConfig);
	} else {
		detectAddOnsPaneLoops++;
		if (simplifyDebug) console.log('detectAddOns loop #' + detectAddOnsPaneLoops);

		// only try 10 times and then assume no add-on pane
		if (detectAddOnsPaneLoops < 11) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectAddOns, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting add-ons pane');
		}
	}
}



// Detect Right Side Chat (why hasn't Gmail killed this already?)
function detectRightSideChat() {
	var rightSideChat = document.getElementsByClassName('aCl')[0]
	if (rightSideChat) {
		if (simplifyDebug) console.log('Right side chat found');
		htmlEl.classList.add('rhsChat');
		window.localStorage.simplifyRightSideChat = true;
	} else {
		window.localStorage.simplifyRightSideChat = false;
	}
}



// Detect Multiple Inboxes
function detectMultipleInboxes() {
	var inboxesPanes = document.querySelectorAll('div[role="main"]').length;
	if (inboxesPanes > 1) {
		if (simplifyDebug) console.log('Multiple inboxes found');
		var actionBars = document.querySelectorAll('.G-atb[gh="tm"]').length
		if (actionBars > 1) {
			htmlEl.classList.add('multiBoxVert');
			htmlEl.classList.remove('multiBoxHorz');
			window.localStorage.simplifyMultipleInboxes = "vertical";
		} else {
			htmlEl.classList.add('multiBoxHorz');
			htmlEl.classList.remove('multiBoxVert');
			window.localStorage.simplifyMultipleInboxes = "horizontal";
		}
	} else {
		window.localStorage.simplifyMultipleInboxes = "none";
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
	var actionBar = document.querySelector('div.aeH');

	if (actionBar) {
		var paginationDivs = document.querySelectorAll('.aeH div.ar5');
		paginationDivs.forEach(function(pagination) {
			// How many messages in the list?
			var pageButtons = pagination.querySelectorAll('div[role="button"][aria-disabled="true"]');

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
	var actionBar = document.querySelector('div.aeH');

	if (actionBar) {
		// Options for the observer (which mutations to observe)
		var paginationObserverConfig = { attributes: true, childList: true, subtree: true };

		// Create an observer instance linked to the callback function
		var paginationObserver = new MutationObserver(testPagination);

		// Start observing the target node for configured mutations
		if (simplifyDebug) console.log('Adding mutation observer for Pagination controls');
		paginationObserver.observe(actionBar, paginationObserverConfig);
	}
}




// Initialize everything
function initEarly() {
	initSearch();
	initSearchFocus();
	initSettings();
}
window.addEventListener('DOMContentLoaded', initEarly, false);

function initLate() {
	detectTheme();
	detectDensity();
	detectSplitView();
	detectRightSideChat();
	detectMultipleInboxes();
	detectAddOns();
	testPagination();
	observePagination(); 
}
window.addEventListener('load', initLate, false);