let simplify = JSON.parse(window.localStorage.simplify);

const defaultSettings = {
	minSearch: false,
	hideAddOns: false,
	kbsMenu: false,
	kbsSimplify: false
}

// Make sure Simplify cached state parameters are initialized for this account
if (typeof simplify["settings"] === 'undefined') {
	simplify["settings"] = defaultSettings;
	updateSetting();
}

function updateSetting(option, value) {
	// Sometimes the value has already been written and we just need to update localStorage
	if (typeof value !== "undefined") {
		simplify["settings"][option] = value;
	}
	window.localStorage.simplify = JSON.stringify(simplify);
}


window.addEventListener('load', function(){
	if (window.navigator.platform.indexOf('Mac') >= 0) {
		document.getElementById('systemKey1').innerText = 'Cmd';
		document.getElementById('systemKey2').innerText = 'Cmd';
	}	
}, false)