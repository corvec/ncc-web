/*!
 * ncc-web character info code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

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
	return Math.floor(body_data["Base Body"] + get_character_level() * body_data["Body Per Level"]);
}

function get_max_armor() {
	var max_armor = { 'Fighter': 25, 'Templar': 20, 'Rogue': 20, 'Scholar': 15 }[get_character_class()];
	max_armor += 5 * get_skill_count('Wear Extra Armor');
	
	return max_armor;
}

function get_character_level() {
	return Math.floor((get_character_total_build() - 5) / 10);
}

