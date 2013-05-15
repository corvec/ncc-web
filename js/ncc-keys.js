/*!
 * ncc-web key handling code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

// Key handling for the desktop version:
function interpret_keycode(event) {
	var key_code
	if (event.which == null)
		key_code = String.fromCharCode(event.keyCode);    // old IE
	else if (event.which != 0 && event.charCode != 0)
		key_code = String.fromCharCode(event.which);     // All others
	else
		return true;

	if (window.grab_keys) {
		run_action(key_code);
	}
}

function run_action(key_code) {
	switch(key_code) {
		case '+': // +
			Notification.info("Set Spell Add Mode on");
			spell_add_mode = true;
			break;
		case '-': // - 
			Notification.info("Set Spell Add Mode off");
			spell_add_mode = false;
			break;
		case '=': // =
			spell_add_mode = !spell_add_mode;
			Notification.info("Toggled Spell Add Mode to " + (spell_add_mode ? "on" : "off"));
			break;
		case '1': // 1
			numberkeypress(1);
			break;
		case '2': // 2
			numberkeypress(2);
			break;
		case '3': // 3
			numberkeypress(3);
			break;
		case '4': // 4 
			numberkeypress(4);
			break;
		case '5': // 5
			numberkeypress(5);
			break;
		case '6': // 6
			numberkeypress(6);
			break;
		case '7': // 7
			numberkeypress(7);
			break;
		case '8': // 8
			numberkeypress(8);
			break;
		case '9': // 9
			numberkeypress(9);
			break;
		case 'A':
		case 'a':
			//$('#skill_to_add').attr('size',15);
			document.getElementById("skill_to_add").focus();
			break;
		//case 'c': //'C'
		//case 'C': //'C'
			//$("#class_list").dialog("open");
			//break;
		case 'p': //'P'
		case 'P': //'P'
			Notification.info("Toggled primary school");
			switch_schools();
			break;
		//case 'r': //'R'
		//case 'R': //'R'
			//$("#race_list").dialog("open");
			//break;
		case 's': //'S'
		case 'S': //'S'
			Notification.info("Toggled selected school to " + current_school);
			if (current_school == "primary") {
				current_school = "secondary";
			} else {
				current_school = "primary";
			}
			break;
		default:
			console.log("Unhandled keypress: " + key_code);
	}
	return true;
}

function numberkeypress(level){
	if (spell_add_mode) {
		add_spell( (current_school == "primary" ? "p_" : "s_") + level);
	} else {
		del_spell( (current_school == "primary" ? "p_" : "s_") + level);
	}
}
