/*!
 * NERO Character Creator Library
 * http://www.neroindy.com/ncc
 *
 * This script is not a library; it is a collection of functions used by
 * the web-based NERO Character Creator.
 *
 * Copyright 2012 Corey T Kump
 * August 30, 2012
 */

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

$(window).bind("load", function() {
	$('#notes').autoResize();
	set_params(parse_URL_params(window.location.toString()));
	update_abilities();
	update_skill_costs(); // calls update_skill_cost();
	update_spelltree_cost(); // calls update_build_spent();
});


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

// Adds the skill currently selected in the GUI
function add_selected_skill() {
	var skill_name = document.getElementById('skill_to_add').value;
	var skill_count = parseInt(document.getElementById('skill_number').value);

	window.current_skill = skill_name;
	window.current_action = "Adding " + skill_name;

	if (add_skill(skill_name, skill_count)) {
		update_build_spent();
	}
	//$("#skill_to_add").attr("size",1);
	return false; // so that the submit button doesn't reload the page
}

function add_skill_action(skill_name, skill_count) {
	if (skill_count == -1) {
		window.current_action = "Selling Back 1x " + skill_name;
	} else if (skill_count == 1) {
		window.current_action = "Buying 1x " + skill_name;
	} else {
		window.current_action = "Buying " + skill_name;
	}
	add_skill(skill_name, skill_count);
	if (skill_count == -1) {
		recursively_decrement_skills(skill_name);
	}
	update_build_spent();
}

// Adds the passed skill. Called by add_prereq() and by add_selected_skill()
function add_skill(skill_name, skill_count) {
	//console.log("add_skill " + skill_name + ", " + skill_count);

	var skill_data = hash["Skills"][skill_name];
	if (skill_data == null) {
		// Spells:
		for (var i = 0; i < get_schools().length; i++) {
			var school = get_schools()[i];
			if (skill_name.substring(0,school.length) == school) {
				set_slots(school, parseInt(skill_name.substring(school.length + 1)), skill_count);
				update_spelltree_cost();
				Notification.info("Added required " + school + " spells.",
								window.current_action);
				return true;
			}
		}
		if (skill_name == "Level") {
			Notification.info("This skill is limited to one per " +
					skill_count + 
					" levels",
					window.current_skill + 
					" Prereq");
			return true;
		}
		return false;
	}
	var skill_cost = get_skill_cost( skill_name, get_character_class(), get_character_race() );
	if (skill_cost == null) {
		if (hash["Skills"][skill_name]["Racial"]) {
			Notification.error("This skill is a racial skill",
								"Error Adding Skill");
		}
		return false;
	}

	var row = skill_row(skill_name);
	var cur_count = 0;
	if (row != null) {
		cur_count = parseInt(row.cells[1].textContent);
	}

	if (skill_data["Requires"] != null) {
		add_prereqs(skill_data["Requires"], skill_count + cur_count);
	}
	if (add_skill_row(skill_name, skill_data, skill_count, cur_count, row, skill_cost)) {
		if (skill_name == window.current_skill) {
			Notification.success("Added skill " + skill_name,
							window.current_action);
		} else { // Could also mean that they attempted to add or remove a skill. Check window.current_action also
			if (window.current_action == null) {
			} else if (window.current_action.indexOf("Adding") == 0 ) {
				Notification.info("Added prereq " + skill_name,
					window.current_action);
			} else if (window.current_action.indexOf("Selling Back") == 0 ) {
				// Need to say "sold back blah" 
				if (cur_count > parseInt(row.cells[1].textContent)) {
					Notification.info("Sold back a " + skill_name, window.current_action);
				} else {// Need to throw an error if they try to decrement below 1
					Notification.error("Cannot decrement a skill to below 1 - delete it instead.",
						window.current_action);
				}
			} else if (window.current_action.indexOf("Buying ") == 0) {
				Notification.info("Bought another " + skill_name, window.current_action);
			
			}

		}
		return true;
	} else {
		return false;
	}
}

function update_skill_cost()  {

	var skill_cost = get_skill_cost(
			document.getElementById("skill_to_add").value,
			get_character_class(),
			get_character_race());

	if (skill_cost == null) {
		document.getElementById("skill_cost").value = "N/A";
	} else {
		document.getElementById("skill_cost").value = skill_cost;
	}


}


function add_skill_row(skill_name, skill_data, skill_count, cur_count, row, skill_cost) {
	var table = document.getElementById('skill_table');

	if (row == null) {
		row = table.insertRow(table.rows.length);
		row.className = "skill";
		var c0 = row.insertCell(0);
		c0.className = "skill_delete";
		var c1 = row.insertCell(1);
		c1.className = "skill_count";
		var c2 = row.insertCell(2);
		c2.className = "skill_name";
		var c3 = row.insertCell(3);
		c3.className = "skill_cost";
		var id = "skill_" + skill_name;
		row.id = id;
		c0.innerHTML = "<a href='#' onclick='return delete_skill(\"" + id + "\")'>X</a>"
		c2.innerHTML = skill_name;
		c1.innerHTML = 0;

		c1.setAttribute("onclick","add_skill_action(\"" + skill_name + "\", -1); ");
		c2.setAttribute("onclick","add_skill_action(\"" + skill_name + "\", 1); ");
	}

	new_count = cur_count + skill_count;
	var max = skill_data["Max"];
	if (max instanceof Object) {
		max = max[get_character_class()];
	}
	if (max == null) {
		if (new_count > 1) {
			Notification.error(skill_name + " cannot be purchased multiple times.",
							window.current_action);
			if (cur_count == 1) {
				return false;
			}
		}
		new_count = 1;
	} else if (max > 0 && max < new_count) {
		new_count = max;
		Notification.error(skill_name + " cannot be purchased more than " + max + " times.",
							window.current_action);
	}
	if (new_count < 1) {
		new_count = 1;
	}
	row.cells[1].innerHTML = new_count;
	//console.log("Skill: " + skill_name + " Cost: " + skill_cost);
	row.cells[3].innerHTML = skill_cost * new_count;

	return true;
}

function get_primary_school() {
	//if (document.getElementById("primary").textContent == "Earth") {
	if (document.getElementById("primary").textContent.search("Earth") > -1) {
		return "Earth";
	}
	return "Celestial";
}

function get_secondary_school() {
	if (document.getElementById("secondary").textContent.search("Earth") > -1) {
		return "Earth";
	}
	return "Celestial";
}

function switch_schools() {
	if (get_primary_school() == "Earth") {
		document.getElementById("primary").innerHTML = "Celestial";
		document.getElementById("secondary").innerHTML = "Earth";
	} else {
		document.getElementById("primary").innerHTML = "Earth";
		document.getElementById("secondary").innerHTML = "Celestial";
	}
	for (var i = 1; i < 10; i++) {
		var temp_s = document.getElementById("s_" + i).textContent;
		document.getElementById("s_" + i).innerHTML = document.getElementById("p_" + i).textContent;
		document.getElementById("p_" + i).innerHTML = temp_s;
	}
	update_spelltree_cost();
	update_skill_costs();
}

// Adds prereqs for a given skill with the passed number of purchases.
function add_prereqs(prereqs, count) {
	var status = true;
	if (prereqs instanceof Array) {
		for (var i = 0; i < prereqs.length; i++) {
			status = add_prereq(prereqs[i], 1) && status;
		}
	} else if (prereqs instanceof Object) {
		for (var prereq in prereqs) {
			if (prereqs[prereq] == 0) {
				status = add_prereq(prereq, 1) && status;
			} else {
				status = add_prereq(prereq, count * prereqs[prereq]) && status;
			}
		}
	} else {
		console.log("add_prereqs - skipping");
	}
	return status;
}

// Adds a skill (that is a prereq for another skill) such that the
// character has at least the passed number purchased.
// Does nothing if the character already has that many of the skill.
function add_prereq(skill_name, count) {
	//console.log("add_prereq " + skill_name + ", " + count);
	var cur_count = get_skill_count(skill_name);
	//console.log("add prereq " + skill_name +  "; cur_count = " + cur_count);
	if (cur_count < count) {
		if (!add_skill(skill_name, count - cur_count)) {
			Notification.error("Could not add " + skill_name + " (prereq)",
					window.current_action);
			return false;
		}
	}
	return true;
}

// Returns the row associated with a given skill
function skill_row(skill_name) {
	var skills = document.getElementById("skill_table").rows;
	for (var r = 0; r < skills.length; r++) {
		if (skills[r].cells[2].textContent == skill_name) {
			return skills[r];
		}
	}
	return null;
}

// Returns the number of skills of a given type that the character has.
function get_type_count(skill_type) {
	var skills = document.getElementById("skill_table").rows;
	var count = 0;
	for (var r = 0; r < skills.length; r++) {
		if (skill_includes_type(skills[r].cells[2].textContent, skill_type)) {
			count += parseInt(skills[r].cells[1].textContent);
		}
	}
	return count;
}

// Returns true if a particular skill includes a given type.
// Recurses through the includes if necessary.
function skill_includes_type(skill_name, skill_type) {
	//console.log("skill_includes_type " + skill_name + ", " + skill_type);
	if (hash["Skills"][skill_name] == null) {
		return false;
	}
	var include_list = hash["Skills"][skill_name]["Includes"];
	if (include_list == null) {
		return false;
	}
	for (var i = 0; i < include_list.length; i++) {
		if (include_list[i] == skill_type ||
			skill_includes_type(include_list[i], skill_type)) {
			return true;
		}
	}
	return false;
}

function race_includes(skill_type) {
	if (hash["Skills"][skill_type] == null) {
		return false;
	}
	var include_list = hash["Races"][get_character_race()]["Include"];
	if (include_list == null) {
		return false;
	}
	for (var i = 0; i < include_list.length; i++) {
		if (include_list[i] == skill_type ||
			skill_includes_type(include_list[i], skill_type)) {
			return true;
		}
	}
	return false;

}

// Returns the number of a given skill or skill type purchased
function get_skill_count(skill_name) {
	if (skill_name.substring(0,5) == "Earth") {
		return get_slots("Earth", parseInt(skill_name.substring(6)));
	} else if (skill_name.substring(0,9) == "Celestial") {
		return get_slots("Celestial", parseInt(skill_name.substring(10)));
	} else if (skill_name.substring(3,17) == " Handed Weapon") {
		if (race_includes(skill_name)) {
			return get_skill_count('Weapon');
		}
	}
	var row = skill_row(skill_name);
	if (row == null) {
		return get_type_count(skill_name);
	}
	return parseInt(row.cells[1].textContent);
}

// Deletes a skill row and updates the table
function delete_skill(id) {
	var skill_name = document.getElementById(id).cells[2].textContent;
	window.current_skill = skill_name;
	window.current_action = "Removing " + skill_name;

	console.log("delete_skill " + id);
	document.getElementById("skill_table").deleteRow(document.getElementById(id).rowIndex - 1);
	recursively_delete_skills(skill_name);

	Notification.success("Removed skill " + skill_name, window.current_action);

	update_build_spent();
	return false;
}

// Adds a slot to the given level
function add_spell(id) {
	window.current_skill = "Level " + 
			id.substring(2) + 
			" " + 
			(id.substring(0,1) == "p" ? 
				get_primary_school() :
				get_secondary_school()
			) +
			" Spell";
	window.current_action = "Adding " + window.current_skill;

	var cur_count = document.getElementById(id).textContent;
	if (!add_magic_requirements_unconditionally(id)) {
		return false;
	}

	document.getElementById(id).innerHTML = 1 + parseInt(cur_count);
	ensure_pyramid_left(id);
	ensure_pyramid_right(id);

	update_spelltree_cost(); // calls update_build_spent();

	Notification.success("Added " + window.current_skill,
					window.current_action);

	return false;
}

function add_magic_requirements(id) {
	if (parseInt(document.getElementById(id.substring(0,2) + 1).textContent) > 0) {
		return add_magic_requirements_unconditionally(id);
	} else {
		return true;
	}
}

function add_magic_requirements_unconditionally(id) {
	var school = "Earth";
	if (id.substring(0,2) == "p_") {
		if (get_primary_school() != "Earth") {
			school = "Celestial";
		}
	} else {
		if (get_primary_school() == "Earth") {
			school = "Celestial";
		}
	}

	return add_prereqs(hash["Schools of Magic"][school]["Requires"], 1);
}

// Ensures that the pyramid is legal to the left of the given slot
function ensure_pyramid_left( id ) {
	var tree = id.substring(0,2);
	var lvl  = parseInt(id.substring(2));

	for (var l = lvl; l > 1; l--) {
		var entry = document.getElementById(tree + (l-1));
		var min_val = get_left_min_val(tree + l);
		var max_val = get_left_max_val(tree + l);
		var l_count = parseInt(entry.textContent);
		if (l_count < min_val) {
			entry.innerHTML = min_val;
		//	Notification.info("Added Level " + l + " Spell(s)",
		//					window.current_action);
		}
		if (l_count > max_val) {
			entry.innerHTML = max_val;
		//	Notification.info("Removed Level " + l + " Spell(s)",
		//					window.current_action);
		}
	}
}

// Returns the minimum value of slots purchased for the spell level
// immediately below the one referenced
function get_left_min_val( id ) {
	var base_val = parseInt(document.getElementById(id).textContent);
	if (base_val > 3) {
		return base_val;
	} else if (base_val > 0) {
		return base_val + 1;
	} else {
		return 0;
	}
}

// Returns the maximum value of slots purchased for the spell level
// immediately below the one referenced
function get_left_max_val( id ) {
	var base_val = parseInt(document.getElementById(id).textContent);
	if (base_val >= 3) {
		return base_val + 1;
	} else if (base_val >= 0) {
		return base_val + 2;
	}
}

// Ensures that the pyramid is legal above the given level
function ensure_pyramid_right( id ) {
	var tree = id.substring(0,2);
	var lvl = parseInt(id.substring(2));
	for (var l = lvl; l < 9; l++) {
		var entry = document.getElementById(tree + (l+1));
		var min_val = get_right_min_val(tree + l);
		var max_val = get_right_max_val(tree + l);
		var l_count = parseInt(entry.textContent);
		if (l_count < min_val) {
			entry.innerHTML = min_val;
		//	Notification.info("Added Level " + l + " Spell(s)",
		//					window.current_action);
		}
		if (l_count > max_val) {
			entry.innerHTML = max_val;
		//	Notification.info("Removed Level " + l + " Spell(s)",
		//					window.current_action);
		}
	}
}

// Returns the minimum value of slots purchased for the spell level
// immediately above the one referenced
function get_right_min_val( id ) {
	var base_val = parseInt(document.getElementById(id).textContent);
	if (base_val > 4) {
		return base_val - 1;
	} else if (base_val > 1) {
		return base_val - 2;
	} else {
		return 0;
	}
}

// Returns the maximum value of slots purchased for the spell level
// immediately above the one referenced
function get_right_max_val( id ) {
	var base_val = parseInt(document.getElementById(id).textContent);
	if (base_val > 3) {
		return base_val;
	} else if (base_val > 0) {
		return base_val - 1;
	} else {
		return 0;
	}
}

// Removes a slot at the given level
function del_spell(id) {
	window.current_skill = "Level " + 
			id.substring(2) + 
			" " + 
			(id.substring(0,1) == "p" ? 
				get_primary_school() :
				get_secondary_school()
			) +
			" Spell";
	window.current_action = "Removing " + window.current_skill;

	if (delete_spell(id)) {
		Notification.success("Removed " + current_skill,
			window.current_action);
	} else {
		Notification.error("Could not remove " + current_skill,
			window.current_action);
	}

	recursively_delete_skills(id);
	update_spelltree_cost(); // calls update_build_spent();


}

function delete_spell(id) {
	var cur_count = document.getElementById(id).textContent;
	if (parseInt(cur_count) > 0) {
		document.getElementById(id).innerHTML = parseInt(cur_count) - 1;
	} else {
		return false;
	}

	ensure_pyramid_left(id);
	ensure_pyramid_right(id);
	return true;
}

function change_class() {
	window.current_action = "Changing Class";
	update_skill_costs();
	update_spelltree_cost(); // calls update_build_spent();
	if (ary_contains(
				hash["Races"][get_character_race()]["Prohibited Classes"],
				get_character_class()))
	{
		Notification.error("Your class / race combo is invalid",
				window.current_action);
	} else {
		Notification.success("Changed class to " + get_character_class(),
			window.current_action);
	}
}

function set_class(character_class) {
	document.getElementById("character_class").value = character_class;
	change_class();
	$('#class_list').dialog('close');
}

function update_abilities() {
	if (hash["Races"][document.getElementById("race").value]["Super Race"]) {
		$('#trait_p').show();
	} else {
		$('#trait_p').hide();
	}

	var abilities = hash["Races"][get_character_race()]["Abilities"];
	if (!abilities) {
		$('#abilities').hide();
		return false;
	}

	$('#abilities').show();
	for (var i = 0; i < abilities.length; i++) {
		$('#ability_' + i).html(abilities[i]);
	}
}

// Run after a race change
function change_race() {
	window.current_action = "Changing Race";
	update_skill_costs();
	update_spelltree_cost(); // calls update_build_spent()

	update_abilities();

	if (ary_contains(
				hash["Races"][get_character_race()]["Prohibited Classes"],
				get_character_class()))
	{
		Notification.error("Your class / race combo is invalid",
				window.current_action);
	} else {
		Notification.success("Changed race to " + get_character_race(),
			window.current_action);
	}
}

// Run after a trait change
function change_trait() {
	window.current_action = "Changing Trait";
	if (document.getElementById("race").value == "Human") {
		update_skill_costs();
	}
	Notification.success("Changed race to " + get_character_race(), window.current_action);
}


function set_race(race) {
	document.getElementById("race").value = race;
	change_race();
	$('#race_list').dialog('close');
}

// Iterates over the skills and recalculates their costs
// Should be run after class and race changes
function update_skill_costs() {
	update_skill_cost();
	var skills = document.getElementById("skill_table").rows;
	for (var r = 0; r < skills.length; r++) {
		var cost = get_skill_cost(
			skills[r].cells[2].textContent,
			get_character_class(),
			get_character_race()
		);
		//console.log("skill_cost " + skills[r].cells[2].textContent + " == " + cost);
		if (cost == null) {
			if (skills[r].cells[2].textContent == "Read Magic") { // Biata
				document.getElementById("skill_table").deleteRow(
						document.getElementById("skill_Read Magic").rowIndex - 1);
				recursively_delete_skills("Read Magic");
				add_skill_row("Read Magic", {}, 1, 0, null, 1);
			}
			skills[r].className = "unavailable";
			skills[r].cells[3].innerHTML = "N/A";
		} else {
			skills[r].removeAttribute("class");
			var count = parseInt(skills[r].cells[1].textContent);
			skills[r].cells[3].innerHTML = cost * count;
		}
	}
}

// Iterates over the skills and deletes them if they have requirements
// that are not met.
// Skills with auto-purchased requirements are only deleted if the
// deleted skill satisfies them.
function recursively_delete_skills(deleted_skill_name) {
	var skill_deleted_last_round = true;
	while (skill_deleted_last_round) {
		skill_deleted_last_round = false;
		var skills = document.getElementById("skill_table").rows;
		for (var r = 0; r < skills.length; r++) {
			var skill_name = skills[r].cells[2].textContent;
			if (is_at_least_one_prereq_not_met(
					hash["Skills"][skill_name]["Requires"],
					deleted_skill_name))
			{
				Notification.info("Removed skill " + skill_name,
								window.current_action);
				document.getElementById("skill_table").deleteRow(r);
				skill_deleted_last_round = true;
				break;
			}
		}
		for (var i = 0; i < get_schools().length; i++) {
			var school = get_schools()[i];
			if (get_slots(school, 1) > 0) {
				if (is_at_least_one_prereq_not_met(
						hash["Schools of Magic"][school]["Requires"],
						deleted_skill_name))
				{
					if (clear_spell_tree(school)) {
						skill_deleted_last_round = true;
						Notification.info("Cleared " + school + " spell tree",
									window.current_action);
					} else {
						Notification.error("Failed to clear " + school + " spell tree",
									window.current_action);
					}
				}
			}
		}
	}
}

// Certain skills require a certain number of a skill per level
// 1. Find skills that have their requirements set like that.
// 2. If they require this skill, decrement them.
// 3. Recurse
function recursively_decrement_skills(decremented_skill_name) {
	var skill_decremented_last_round = true;
	while (skill_decremented_last_round) {
		skill_decremented_last_round = false;
		var skills = document.getElementById('skill_table').rows;
		for (var r = 0; r < skills.length; r++) {
			var skill_name = skills[r].cells[2].textContent;
			if (is_this_numbered_prereq_not_met(
						hash['Skills'][skill_name]['Requires'],
						decremented_skill_name,
						get_skill_count(skill_name))) {
				skill_decremented_last_round = true;
				recursively_decrement_skills(skill_name)
				// Notification.info("Decremented skill " + skill_name,
				// 		window.current_action);
				add_skill(skill_name, -1);
			}
		}
	}
}

function get_schools() {
	return ["Earth", "Celestial"];
}

function clear_spell_tree(school) {
	var slot = "s_1"
	if (school == get_primary_school()) {
		slot = "p_1";
	}

	document.getElementById(slot).innerHTML = 0;
	ensure_pyramid_left(slot);
	ensure_pyramid_right(slot);

	update_spelltree_cost(); // calls update_build_spent();
	return true;
}

function is_at_least_one_prereq_not_met(prereqs, deleted_skill_name) {
	//console.log("is_at_least_one_prereq_not_met " + prereqs + ", " + deleted_skill_name);
	if (prereqs == null) {
		return false;
	}
	if (prereqs instanceof Array) {
		for (var i = 0; i < prereqs.length; i++) {
			if (is_prereq_not_met(prereqs[i], deleted_skill_name)) {
				return true;
			}
		}
	} else if (prereqs instanceof Object) {
		for (var prereq in prereqs) {
			if (is_prereq_not_met(prereq, deleted_skill_name)) {
				return true;
			}
		}
	}
	return false;
}

function is_this_numbered_prereq_not_met(prereqs, deleted_skill_name, my_count) {
	if (prereqs instanceof Object) {
		if (prereqs.hasOwnProperty(deleted_skill_name)) {
			return (prereqs[deleted_skill_name] * my_count > get_skill_count(deleted_skill_name) );
		}
	}
	return false;
}

// return true if the passed prereq is not met
function is_prereq_not_met(prereq, deleted_skill_name) {
	if (prereq == deleted_skill_name) {
		return true;
	}
	console.log("get_skill_count " + prereq + " = " + get_skill_count(prereq));
	if (get_skill_count(prereq) == 0) {
		if (hash["Skills"][prereq] != null &&
			hash["Skills"][prereq]["Cost"] != null)
		{
			return true;
		} else if (hash["Skills"][deleted_skill_name] != null && 
				   hash["Skills"][deleted_skill_name]["Includes"] != null) {
			if (skill_includes_type(deleted_skill_name, prereq)) {
				return true;
			}
		} else if (prereq.search("Earth") > -1 || prereq.search("Celestial") > -1) {
			return true;
		}
	}
	return false;
}

function get_slots(school, level) {
	var slot_prefix = "s_";
	if (get_primary_school() == school) {
		slot_prefix = "p_";
	}
	return parseInt(document.getElementById(slot_prefix + level).textContent);
}

function set_slots(school, level, num) {
	var slot_prefix = "s_";
	if (get_primary_school() == school) {
		slot_prefix = "p_";
	}
	if (!add_magic_requirements_unconditionally(slot_prefix + level)) {
		return false;
	}
	document.getElementById(slot_prefix + level).innerHTML = num;
	ensure_pyramid_left(slot_prefix + level);
	ensure_pyramid_right(slot_prefix + level);

}


function set_earth_slots(level, num) {
	var slot_prefix = "s_";
	if (get_primary_school() == "Earth") {
		slot_prefix = "p_";
	}
	if (!add_magic_requirements_unconditionally(slot_prefix + level)) {
		return false;
	}
	document.getElementById(slot_prefix + level).innerHTML = num;
	ensure_pyramid_left(slot_prefix + level);
	ensure_pyramid_right(slot_prefix + level);
}

function set_celestial_slots(level, num) {
	var slot_prefix = "s_";
	if (get_primary_school() == "Celestial") {
		slot_prefix = "p_"
	}
	if (!add_magic_requirements_unconditionally(slot_prefix + level)) {
		return false;
	}
	document.getElementById(slot_prefix + level).innerHTML = num;
	ensure_pyramid_left(slot_prefix + level);
	ensure_pyramid_right(slot_prefix + level);
}


function get_character_class() {
	return document.getElementById('character_class').value;
}

function get_character_race() {
	var race = document.getElementById('race').value;
	if (!hash["Races"][race]["Super Race"]) {
		return race;
	}
	return get_character_trait() + " " + race;
}

function get_character_feature() {
	var race = document.getElementById('race').value;
	if (hash["Races"][race]["Super Race"]) {
		return "None";
	}
	return document.getElementById('ability_2').innerHTML;
}

function get_character_trait() {
	return document.getElementById('trait').value;
}

function get_character_total_build() {
	var build = parseInt(document.getElementById('total_build').value);
	return (build >= 15) ? build : 30;
}

function get_character_body() {
	var body_data = hash["Classes"][get_character_class()];
	return body_data["Base Body"] + get_character_level() * body_data["Body Per Level"];
}

function get_max_armor() {
	var max_armor = { 'Fighter': 25, 'Templar': 20, 'Rogue': 20, 'Scholar': 15 }[get_character_class()];
	max_armor += 5 * get_skill_count('Wear Extra Armor');
	
	return max_armor;
}

function get_character_level() {
	return Math.floor((get_character_total_build() - 5) / 10);
}

function update_spelltree_cost() {
	var trees = ["p_", "s_"];
	var range = [1,2,3,4,5,6,7,8,9];
	var character_class = document.getElementById("character_class").value;
	for (var t_i = 0; t_i < trees.length; t_i++) {
		var tree_cost = 0;
		var tree = trees[t_i];
		for (l_i = 0; l_i < range.length; l_i++) {
			var lvl = range[l_i];
			var count = parseInt(document.getElementById(tree + lvl).textContent);
			if (count > 0) {
				tree_cost += count * hash["Spell Costs"][character_class][l_i];
			}
		}
		if (tree == "p_") {
			document.getElementById(tree + "cost").innerHTML = tree_cost;
		} else {
			document.getElementById(tree + "cost").innerHTML = 2 * tree_cost;
		}
	}

	update_build_spent();
}

// Calculates and updates the "spent_build" item
function update_build_spent() {
	var build_spent = 0;
	var skills = document.getElementById('skill_table').children;
	for (var i = 0; i < skills.length; i++) {
		var skill_cost = parseInt(skills.item(i).children.item(3).textContent);
		if (skill_cost.toString() != "NaN") {
			build_spent = build_spent + skill_cost;
		}
	}
	build_spent += parseInt(document.getElementById('p_cost').textContent);
	build_spent += parseInt(document.getElementById('s_cost').textContent);

	document.getElementById('spent_build').value = build_spent;
}

function ary_contains(a, obj) {
	//console.log("ary_contains " + a + ", " + obj);
	if (a == null) {
		return false;
	}
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function get_skill_cost(skill_name, character_class, character_race) {
	var skill_ary = hash["Skills"][skill_name]["Cost"];
	if (skill_ary == null) {
		racial_skills = hash["Races"][get_character_race()]["Racial Skills"]
		if (racial_skills == null || racial_skills[skill_name] == null) {
			return null;
		} else {
			return racial_skills[skill_name];
		}
	}
	var cost = null;
	if (typeof(skill_ary) == "number") {
		cost = skill_ary;
	} else if (skill_ary[character_class] != null) {
		cost = skill_ary[character_class];
	} else if (skill_ary["Primary"] != null) { // Magic skills (Formal)
	if (skill_name.search(get_primary_school()) > -1) {
			cost = skill_ary["Primary"][character_class];
		} else {
			cost = skill_ary["Secondary"][character_class];
		}
	}
	
	if (cost == null) {
		Notification.error("Cannot determine skill cost<br/>" +
							skill_name +
							" is limited by race.",
							window.current_action);
	}

	// Modify skills based on race
	var race_data = hash["Races"][get_character_race()];
	if (ary_contains(race_data["Prohibited Skills"], skill_name)) {
		cost = null;
		Notification.error("Cannot determine skill cost:<br/>" +
							skill_name +
							" is prohibited for your race.",
							window.current_action);
	} else if (ary_contains(race_data["Prohibited Classes"], get_character_class())) {
		cost = null;
		if (window.current_action != "Changing Race" && 
				window.current_action != "Changing Class")
		{
			Notification.error( "Cannot determine skill cost<br />Your class/race is invalid.",
							window.current_action);
		}
	} else if (ary_contains(race_data["Double Cost for Skills"], skill_name)) {
		cost *= 2;
	} else if (ary_contains(race_data["Half Cost for Skills"], skill_name)) {
		cost = Math.ceil(cost / 2);
	} else if (ary_contains(race_data["Reduced Cost for Skills"], skill_name)) {
		cost -= 1;
	}

	return cost;
}

function generate_pdf() {
	window.current_action = "Generating a PDF";
	var doc = new jsPDF();
	doc.setFontSize(40);
	doc.setFont('times');
	doc.text(58, 25, "NERO Rewrite");
	doc.setFontSize(12);
	doc.setTextColor(0,0,255);
	doc.text(88, 30, "coreykump.com/ncc");
	doc.setTextColor(0,0,0);
	doc.setFont('helvetica');
	doc.setFontStyle("bold");
	doc.text(10, 40, "Player:");
	doc.text(10, 45, "Character:");
	doc.text(10, 50, "Class:");
	doc.text(10, 55, "Race:");
	doc.text(10, 60, "Feature:");
	doc.text(10, 65, "Level:");
	doc.text(65, 70, "Body:");
	doc.text(65, 75, "Max Armor:");
	doc.text(10, 70, "Build:");
	doc.text(10, 75, "Spent:");

	doc.setFontStyle("normal");
	doc.text(40, 40, document.getElementById('player_name').value);
	doc.text(40, 45, document.getElementById('character_name').value);
	doc.text(40, 50, get_character_class());
	doc.text(40, 55, get_character_race());
	doc.text(40, 60, get_character_feature());
	doc.text(40, 65, get_character_level().toString());
	doc.text(95, 70, get_character_body().toString());
	doc.text(95, 75, get_max_armor().toString());
	doc.text(40, 70, get_character_total_build().toString());
	doc.text(40, 75, document.getElementById('spent_build').value);
	
	doc.setFontSize(16);
	doc.setFontStyle("bold");
	doc.text(10, 90, "Spells:");
	doc.text(10, 125, "Skills:");
	
	doc.setFontSize(12);

	doc.text(15,  95, "Primary");
	doc.text(15, 110, "Secondary");
	doc.setFontStyle("normal");
	doc.text(15,  100, get_primary_school());
	doc.text(15, 115, get_secondary_school());

	var rows = [95, 110];
	var trees = ["p_", "s_"];
	for(var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var tree = trees[i];
		// console.log(row + tree);
		var range = ["1","2","3","0","4","5","6","0","7","8","9"];

		for(var j = 0; j < range.length; j++) {
			if (parseInt(range[j]) == 0) {
				doc.text(40+5*j, row, "/");
			} else {
				doc.setFontStyle("bold");
				doc.text(40+5*j, row, range[j]);
				doc.setFontStyle("normal");
				doc.text(40+5*j, row+5, document.getElementById(tree + range[j]).textContent);
				// console.log(document.getElementById(tree + range[j]).textContent);
			}
		}
		doc.text(105, row, "Cost");
		doc.text(105, row+5, document.getElementById(tree+"cost").textContent);
	}

	doc.setFontStyle("bold");
	doc.text(40, 130, "Skill");
	doc.text(15, 130, "Cost");
	doc.setFontStyle("normal");

	var skills = document.getElementById('skill_table').children;
	for (var i = 0; i < skills.length; i++) {
		var skill_cost = skills.item(i).children.item(3).textContent;
		var skill_name = skills.item(i).children.item(2).textContent;
		var skill_count = skills.item(i).children.item(1).textContent;
		doc.text(15, 135 + (i * 5), skill_cost);
		if (skill_count > 1) {
			doc.text(40, 135 + (i * 5), skill_count + "x " + skill_name);
		} else {
			doc.text(40, 135 + (i * 5), skill_name);
		}
		// console.log(skill_cost + " - " + skill_count + "x " + skill_name);
	}

	var notes = $('#notes').val()
	if (notes.length > 0) {
		var x = 10;
		var y = 145 + (i*5);
		var max_chars_per_line = 100;
		var note_font_size = 11;
		if (skills.length > 20) {
			console.log("Character has more than 20 skills; displaying notes offset to the right.")
			x = 100;
			y = 125;
			max_chars_per_line = 50;
			note_font_size = 10;
		}
		var notes_ary = notes.split("\n");
		for (var i = 0; i < notes_ary.length; i++) {
			if (notes_ary[i].length - 1 > max_chars_per_line) {
				var new_line = '';
				for (var j = 0; j < notes_ary[i].length / max_chars_per_line; j++) {
					if (j > 0) {
					 	new_line += "-\n  ";
					}
					new_line += notes_ary[i].substring(j*max_chars_per_line, (j+1)*max_chars_per_line);
				}
				notes_ary[i] = new_line;
			}
			notes_ary[i] += "\n";
		}
		var parsed_notes = notes_ary.join("");

		doc.setFontSize(16);
		doc.setFontStyle('bold');
		doc.text(x, y, 'Notes:');
		doc.setFontSize(note_font_size);
		doc.setFontStyle('normal');
		doc.text(x+5, y+5, parsed_notes);
	}

	var subject = get_character_race() + " " + get_character_class();
	if (document.getElementById('character_name').value.length > 0) { 
		subject = document.getElementById('character_name').value + ' - ' + subject;
	}
	if (document.getElementById('player_name').value.length > 0) {
		subject = document.getElementById('player_name').value + ' - ' + subject;
	}

	doc.setProperties({
			title: 'NERO Rewrite',
			subject: subject,
			author: document.getElementById('player_name').value,
			keywords: 'NERO, LARP, Role-Playing',
			creator: 'coreykump.com'
	});

	var filename = 'NERO Character - ' + subject + '.pdf';

	if (!is_mobile_browser()) {
		doc.save(filename);
	} else {
		doc.output('datauri');
	}
		
	Notification.success("PDF Generated", window.current_action);
	return false;
}

function is_mobile_browser() {
  var a = navigator.userAgent||navigator.vendor||window.opera;

  return (/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || 
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)));
}

function mail_character() {
	var body = generate_email();
	var addresses = "";
	var subject = "My NERO Rewrite";
	var href = "mailto:" + addresses + "?" + 
		"subject=" + encodeURIComponent(subject) + "&" + 
		"body=" + encodeURIComponent(body);
	console.log(href);

	$('#a_email').attr('href', href);
	$('#a_email').show();

	return false;
}

function generate_email() {
	var body = "Player Name:\t" + document.getElementById('player_name').value + "\n";
	body += "Character Name:\t" + document.getElementById('character_name').value + "\n";
	body += "Class:\t" + get_character_class() + "\n";
	body += "Race:\t" + get_character_race() + "\n";
	body += "Feature:\t" + get_character_feature() + "\n";

	body += "Level:\t" + get_character_level().toString() + "\n";
	body += "Body:\t" + get_character_body().toString() + "\n";
	body += "Max Armor:\t" + get_max_armor().toString() + "\n";
	body += "Build:\t" + document.getElementById('total_build').value  + "\n";
	body += "Spent:\t" + document.getElementById('spent_build').value + "\n";
	body += "\n";

	var trees = ["p_", "s_"]
	var range = ["1","2","3","0","4","5","6","0","7","8","9"];
	for (var i = 0; i < trees.length; i++) {
		if (trees[i] == "p_") {
			body += "Primary Spell Tree (" + get_primary_school() + "):\n";
		} else {
			body += "Secondary Spell Tree (" + get_secondary_school() + "):\n";
		}
		for (var j = 0; j < range.length; j++) {
			if (parseInt(range[j]) == 0) {
				body += "/ ";
			} else {
				body += document.getElementById(trees[i] + range[j]).textContent + " ";
			}
		}
		body += "\n";
	}
	body += "\n";

	body += "Skills:\n";
	var skills = document.getElementById('skill_table').children;
	for (var i = 0; i < skills.length; i++) {
		var skill_cost = skills.item(i).children.item(3).textContent;
		var skill_name = skills.item(i).children.item(2).textContent;
		var skill_count = skills.item(i).children.item(1).textContent;
		body += skill_cost + " - ";
		if (skill_count > 1) {
			body += skill_count + "x " + skill_name;
		} else {
			body += skill_name;
		}
		body += "\n";
	}


	var notes = $('#notes').val()
	if (notes.length > 0) {
		body += "\n";
		body += "Notes:\n";
		body += notes;
	}

	return body;
}

// http://stackoverflow.com/questions/814613/how-to-read-get-data-from-a-url-using-javascript#
function parse_URL_params(url) {
	var queryStart = url.indexOf("?") + 1;
	var queryEnd   = url.indexOf("#") + 1 || url.length + 1;
	var query      = url.slice(queryStart, queryEnd - 1);

	if (query === url || query === "") return;

	var params  = {};
	var nvPairs = query.replace(/\+/g, " ").split("&");

	for (var i=0; i<nvPairs.length; i++) {
		var nv = nvPairs[i].split("=");
		var n  = decodeURIComponent(nv[0]);
		var v  = decodeURIComponent(nv[1]);
		if ( !(n in params) ) {
			params[n] = [];
		}
		params[n].push(nv.length === 2 ? v : null);
	}
	return params;
}

function save_link() {
	var save_url = generate_url();

	$('#a_save').attr('href', save_url);
	$('#a_save').show();

	return false;
}


function generate_url() {
	var url = window.location.toString();
	// strip params:
	if (url.indexOf('?') > -1)
		url = url.slice(0,url.indexOf('?'));

	url += "?class=" + $('#character_class').val();
	url += "&race=" + encodeURIComponent($('#race').val());
	if ($('#player_name').val().length > 0)
		url += "&player=" + encodeURIComponent($('#player_name').val());
	if ($('#character_name').val().length > 0)
		url += "&character=" + encodeURIComponent($('#character_name').val());
	if ($('#race').val() == 'Human')
		url += "&trait=" + encodeURIComponent($('#trait').val());
	if (get_character_total_build() != 30)
		url += "&build=" + encodeURIComponent($('#total_build').val());
	if (get_primary_school() != 'Earth')
		url += "&primary=" + encodeURIComponent(get_primary_school());
	url += "&skills=" + encodeURIComponent(get_skill_list());
	if (get_slots('Earth', 1) > 0)
		url += "&earth=" + encodeURIComponent(get_spell_tree('Earth'));
	if (get_slots('Celestial', 1) > 0)
		url += "&celestial=" + encodeURIComponent(get_spell_tree('Celestial'));
	var notes = $('#notes').val();
	if (notes.length > 0)
		url += "&notes=" + encodeURIComponent(notes);
	return url;
}

function get_skill_list() {
	var skill_list = "";
	var skills = document.getElementById("skill_table").rows;
	for (var r = 0; r < skills.length; r++) {
		var skill_name = skills[r].cells[2].textContent;
		var skill_count = skills[r].cells[1].textContent;
		skill_list += skill_count + "," + skill_name + ",";
	}

	return skill_list;

}

function get_spell_tree(school) {
	var tree = "";

	for (var i = 1; i < 9 && get_slots(school, i+1); i++) {
		tree += get_slots(school, i) + ',';
	}
	tree += get_slots(school, i);

	console.log(tree);

	return tree;
}

function set_params(params) {
	for (param in params) {
		switch (param) {
			case 'player': //player name
				$('#player_name').val(params[param]);
				break;
			case 'character': //character name
				$('#character_name').val(params[param]);
				break;
			case 'class': //character class
				$('#character_class').val(params[param]);
				break;
			case 'race': //race
				$('#race').val(params[param]);
				break;
			case 'trait': //trait, if human
				$('#trait').val(params[param]);
				break;
			case 'build': //build total
				$('#total_build').val(params[param]);
				break;
			case 'primary': //primary school of magic
				if (params[param] == 'Celestial') {
					switch_schools();
				}
				break;
			case 'skills': //skill list, like this - 1,One Handed Edged,1,Shield,5,Proficiency,2,Resist Sleep
				set_skill_list(params[param]);
				break;
			case 'earth':
				set_spell_tree('Earth',params[param]);
				break;
			case 'celestial':
				set_spell_tree('Celestial',params[param]);
				break;
			case 'notes':
				$('#notes').val(params[param]);
				break;
			default:
				console.log(param + " = " + params[param]);
				break;
		}
	}
}

function set_skill_list(skills) {
	// Received in the format ["1,One Handed Edged,1,Shield,5,Proficiency,2,Resist Sleep"]
	skill_ary = skills[0].split(',');
	for (var i = 0; i < skill_ary.length - 1; i += 2) {
		// console.log("Adding " + skill_ary[i] + "x " + skill_ary[i+1]);
		var skill_name = skill_ary[i+1];
		var skill_data = hash["Skills"][skill_name];
		var skill_count = parseInt(skill_ary[i]);
		var cur_count = 0;
		var row = null;
		var skill_cost = 0;
		if (skill_name in hash['Skills'])
			add_skill_row(skill_name, skill_data, skill_count, cur_count, row, skill_cost);
		else
			Notification.error('Cannot add skill ' + skill_name, 'Loading Error')
	}
}

function set_spell_tree(school, tree_s) {
	// Received in the format ["3,2,1"]
	var tree = tree_s[0].split(',');
	var pre = "#p_";

	if (school != get_primary_school()) {
		pre = "#s_";
	}

	for (var i = 0; i < tree.length; i++) {
		$(pre + (i+1)).text(tree[i]);
		// console.log("$(#" + pre + (i+1) + ").text(" + tree[i] + ");");
	}
}

