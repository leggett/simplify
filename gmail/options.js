window.addEventListener('load', function(){
	if (window.navigator.platform.indexOf('Mac') >= 0) {
		document.getElementById('systemKey1').innerText = 'Cmd';
		document.getElementById('systemKey2').innerText = 'Cmd';
	}	
}, false)