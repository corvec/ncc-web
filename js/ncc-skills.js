/*!
 * ncc-web skill handling
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

// Adds the skill currently selected in the GUI
// Triggered by the 'Add Skill' button
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

// This function is triggered by the user
// Increment a skill that was already purchased
function increment_skill(skill_name) {
	window.current_action = "Incrementing " + skill_name;
	add_skill(skill_name, 1);
	update_build_spent();
}

// This function is triggered by the user
// Decrement a skill that was already purchased (min 1)
function decrement_skill(skill_name) {
	window.current_action = "Decrementing " + skill_name;
	if (get_skill_count(skill_name) == 1) {
		Notification.error("Cannot decrement a skill to below 1 - delete it instead.", window.current_action);
		return false;
	}
	add_skill(skill_name, -1);
	recursively_decrement_skills(skill_name);
	// This is specifically needed for master profs
	var includes = hash.Skills[skill_name].Includes;
	if (includes == null) includes = {};
	for (var i = 0; i < includes.length; i++) {
		recursively_decrement_skills(includes[i]);
	}
	update_build_spent();
}


// Adds the passed skill. Called by add_prereq(), by add_selected_skill(),
// by increment_skill(), and by decrement_skill()
function add_skill(skill_name, skill_count) {
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
		// Upon attempting to add a skill with "Level: 5" as a prereq
		if (skill_name == "Level") {
			Notification.info("This skill is limited to one per " +
					skill_count + 
					" levels",
					window.current_skill + 
					" Prereq");
			return true;
		}
		// Indicate that there was some issue adding this skill
		// (the skill data wasn't found).
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

	if (skill_count > 0 && skill_data["Requires"] != null) {
		var actual_count = cur_count;
		if (skill_count > 0)
			actual_count = get_skill_count(skill_name);
		add_prereqs(skill_data["Requires"], skill_count + actual_count);
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
				} else {
					delete_skill_by_name(skill_name);
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

		c1.setAttribute("onclick","decrement_skill(\"" + skill_name + "\"); ");
		c2.setAttribute("onclick","increment_skill(\"" + skill_name + "\"); ");
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
	var count = 0;

	count += get_type_count(skill_name);

	var row = skill_row(skill_name);
	if (row != null) {
		count += parseInt(row.cells[1].textContent);
	}
	return count;
}

// Deletes a skill row and updates the table
function delete_skill(id) {
	console.log("delete_skill(" + id + ")");
	var skill_name = document.getElementById(id).cells[2].textContent;
	window.current_skill = skill_name;
	window.current_action = "Removing " + skill_name;

	document.getElementById("skill_table").deleteRow(document.getElementById(id).rowIndex - 1);
	recursively_delete_skills(skill_name);

	var includes = hash.Skills[skill_name].Includes;
	if (includes != null) {
		for (var i = 0; i < includes.length; i++) {
			recursively_delete_skills(includes[i]);
		}
	}

	Notification.success("Removed skill " + skill_name, window.current_action);

	update_build_spent();
	return false;
}

function delete_skill_by_name(skill_name) {
	var id = "skill_" + skill_name;
	console.log("delete_skill_by_name " + skill_name);
	document.getElementById("skill_table").deleteRow(document.getElementById(id).rowIndex - 1);
	recursively_delete_skills(skill_name);

	Notification.success("Removed skill " + skill_name, window.current_action);

	update_build_spent();
	return true;
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
