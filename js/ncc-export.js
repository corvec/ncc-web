/*!
 * ncc-web export code
 * 
 * github.com/corvec/ncc-web
 * coreykump.com/ncc
 *
 * Copyright 2012-2013 Corey T Kump
 */

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

