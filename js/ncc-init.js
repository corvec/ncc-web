/*!
 * ncc-web initialization code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

$(function() {
	window.current_school = "primary";
	document.getElementById("spent_build").value = 0;
	window.spell_add_mode = true;
	window.grab_keys = true;
	if(!navigator.userAgent.match(/iPhone/i) &&
		!navigator.userAgent.match(/iPad/i))
	{
		$(document).keypress(function(e){ interpret_keycode(e); } );
	} else if (navigator.userAgent.match(/iPhone/i)) {
		$('h2').hide();
	}
});


// Initialize Noty library
var Notification = window.Notification = {};
Notification.info = function(message, title) {
	if (title != null) {
		message = "<strong>" + title + "</strong><br />" + message;
	}
	var n = noty({
		text: message,
		timeout: 1500,
		type: 'information',
		layout: 'topRight'
	});
}
Notification.error = function(message, title) {
	if (title != null) {
		message = title + "<br />" + message;
	}
	var n = noty({
		text: message,
		timeout: 5000,
		type: 'error',
		layout: 'topRight'
	});
}
Notification.success = function(message, title) {
	if (title != null) {
		message = "<strong>" + title + "</strong><br />" + message;
	}
	var n = noty({
		text: message,
		timeout: 3000,
		type: 'success',
		layout: 'topRight'
	});
}

// After the page has finished loading, ensure everything is valid
$(window).bind("load", function() {
	$('#notes').autoResize();
	set_params(parse_URL_params(window.location.toString()));
	update_abilities();
	update_skill_costs(); // calls update_skill_cost();
	update_spelltree_cost(); // calls update_build_spent();
});

