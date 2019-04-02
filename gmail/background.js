/* Add event listener to toggle the extension */
chrome.pageAction.onClicked.addListener(function (tabs) {
	chrome.tabs.executeScript({
		code: "console.log('Page action button clicked')"
		// code: "document.getElementsByTagName('html')[0].classList.toggle('simpl')"
	});
});