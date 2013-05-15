/*!
 * ncc-web magic handling code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */


function get_schools() {
	return ["Earth", "Celestial"];
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

