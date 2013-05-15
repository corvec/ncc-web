/*!
 * ncc-web prereq handling code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

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
			Notification.error("Could not automatically add prerequisite skill, " + skill_name,
					window.current_action);
			return false;
		}
	}
	return true;
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
	console.log("recursive_delete_skills(" + deleted_skill_name + ")");
	var skill_deleted_last_round = true;
	while (skill_deleted_last_round) {
		skill_deleted_last_round = false;
		var skills = document.getElementById("skill_table").rows;
		// for each row in the skill table
		for (var r = 0; r < skills.length; r++) {
			// look up the skill
			var skill_name = skills[r].cells[2].textContent;
			// and if at least one of its prereqs is no longer met
			var prereqs = hash.Skills[skill_name].Requires;
			var skill_count = get_skill_count(skill_name);
			if (is_at_least_one_prereq_not_met(
					prereqs, deleted_skill_name, skill_count))
			{
				console.log("is_at_least_one_prereq_not_met() returned true");
				if (prereqs instanceof Array) {
					console.log("prereqs instanceof Array == true -> deleting");
					// delete it
					Notification.info("Removed skill " + skill_name,
									window.current_action);
					document.getElementById("skill_table").deleteRow(r);
					skill_deleted_last_round = true;
					break;
				} else {
					console.log("prereqs instanceof Array == false -> decrementing");
					// decrement it
					recursively_decrement_skills(deleted_skill_name);
				}
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
	console.log("recursively_decrement_skills(" + decremented_skill_name + ")");
	var skill_decremented_last_round = true;
	while (skill_decremented_last_round) {
		skill_decremented_last_round = false;
		var skills = document.getElementById('skill_table').rows;
		for (var r = 0; r < skills.length; r++) {
			var skill_name = skills[r].cells[2].textContent;
			var skill_count = get_skill_count(skill_name);
			var not_met = is_this_numbered_prereq_not_met(
						hash['Skills'][skill_name]['Requires'],
						decremented_skill_name,
						skill_count);
			if (not_met) {
				skill_decremented_last_round = true;
				// Notification.info("Decremented skill " + skill_name,
				// 		window.current_action);
				while (not_met) {
					if (skill_count <= 1) {
						delete_skill_by_name(skill_name);
						not_met = false;
						break;
					} else {
						add_skill(skill_name, -1);
					}
					skill_count = get_skill_count(skill_name);
					not_met = is_this_numbered_prereq_not_met(
						hash['Skills'][skill_name]['Requires'],
						decremented_skill_name,
						skill_count);
				}
				recursively_decrement_skills(skill_name)
			}
		}
	}
}

// Determine if at least one prereq is no longer met
// Called when deleting skills
function is_at_least_one_prereq_not_met(prereqs, deleted_skill_name, skill_count) {
	console.log("is_at_least_one_prereq_not_met(" + prereqs + "," + deleted_skill_name + "," + skill_count + ")");
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
		// for (var prereq in prereqs) {
			// if (is_prereq_not_met(prereq, deleted_skill_name)) {
			if (is_this_numbered_prereq_not_met(prereqs, deleted_skill_name, skill_count)) {
				return true;
			}
		// }
	}
	return false;
}

function is_this_numbered_prereq_not_met(prereqs, deleted_skill_name, my_count) {
	console.log("is_this_numbered_prereq_not_met(" + prereqs + "," + deleted_skill_name + "," + my_count + ")");
	if (prereqs instanceof Object) {
		if (prereqs.hasOwnProperty(deleted_skill_name)) {
			return (prereqs[deleted_skill_name] * my_count > get_skill_count(deleted_skill_name) );
		}
	}
	return false;
}

// return true if the passed prereq is not met
function is_prereq_not_met(prereq, deleted_skill_name) {
	console.log("is_prereq_not_met(" + prereq + "," + deleted_skill_name + ")");
	// This is not necessarily true:
	// TODO
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

