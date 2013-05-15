require 'yaml'

# Generates index.html and debug.html based on the contents of the YAML input file (line 40)

def convert_to_js obj
	if obj.is_a? Hash
		return hash_to_js(obj)
	elsif obj.is_a? Array
		return array_to_js(obj)
	elsif obj.is_a? String
		return "\"#{obj}\""
	elsif obj.is_a? Integer
		return "#{obj}"
	elsif obj.is_a? Float
		return "#{obj}"
	elsif obj == true
		return "true"
	else
		puts "convert_to_js(#{obj}) - Type not recognized"
		return obj.to_s
	end
end

def array_to_js(array)
	val = "["
	array.each_with_index do |obj, i|
		val += convert_to_js(obj)
		val += ", " if i < array.size - 1
	end
	val += "]"

	return val
end

def hash_to_js(hash)
	output = "{"
	hash.keys.each_with_index do |key, i|
		output += "\"#{key}\" : "
		output += convert_to_js(hash[key])
		output += ", " if i < hash.size - 1
	end
	output += "}"
	return output
end


yaml_skills = {}
File.open('ncc_data_2013racials.yml') { |filedata| yaml_skills = YAML.load(filedata) }

# 1. import skill file into skills object
# 2. build javascript hash of skills object
# 3. same thing with races

page1 = <<-EORS
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<link rel="stylesheet" type="text/css" href="ncc.css" />
<link rel="stylesheet" type="text/css" href="lib/ui-lightness/jquery-ui-1.8.22.custom.css" />


<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<meta name="apple-mobile-web-app-capable" content="yes" /><!-- hide top bar in mobile safari-->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<title>NCC</title>
<!--
NERO Character Creator
Web Edition
Copyright 2012 by Corey T Kump

Contact me at: 
firstname dot lastname @ gmail dot com
-->

<script type="text/javascript" src="lib/jquery-1.9.1.min.js"></script>
<script type="text/javascript" src="lib/jquery-ui-1.8.22.custom.min.js"></script>
<script type="text/javascript" src="lib/autoresize.jquery.js"></script>
<script type="text/javascript" src="lib/noty/js/noty/jquery.noty.js"></script>
<script type="text/javascript" src="lib/noty/js/noty/layouts/top.js"></script>
<script type="text/javascript" src="lib/noty/js/noty/layouts/topRight.js"></script>
<script type="text/javascript" src="lib/noty/js/noty/themes/default.js"></script>
<script type="text/javascript" src="lib/jspdf/jspdf.js"></script>
<script type="text/javascript" src="lib/jspdf/libs/FileSaver.js/FileSaver.js"></script>
EORS

prod = <<-EORS
<script type="text/javascript" src="ncc.min.js"></script>
EORS

test = <<-EORS
<script type="text/javascript" src="ncc.js"></script>
EORS

git = <<-EORS
<script type="text/javascript" src="https://raw.github.com/corvec/ncc-web/master/ncc.min.js"></script>
EORS


page2 = <<-EORS
<script type="text/javascript">
	var hash = 
EORS

page2 += convert_to_js(yaml_skills)

page2 += <<-EORS
;


</script>

</head>

<body>
<div id="wrap">
<div id="main">

<div class="header">
	<h1 class="title">NERO Character Creator</h1>
</div>

<div class="content">
<h2 class="title">Character Info</h2>

<div id="character_info" class="box-white">
	<p>
		<label for="player_name">Player</label>
		<input type="text" id="player_name" value="" onfocus="window.grab_keys=false;" onblur="window.grab_keys = true;" />
	</p>
	<p>
		<label for="character_name">Character</label>
		<input type="text" id="character_name" value="" onfocus="window.grab_keys=false;" onblur="window.grab_keys = true;" />
	</p>
	<p>
		<label for="character_class">Class</label>
		<select id="character_class" onchange="change_class(); window.grab_keys = false;" onfocus="window.grab_keys = false;" onblur="window.grab_keys = true;">
			<option value="Fighter">Fighter</option>
			<option value="Rogue">Rogue</option>
			<option value="Scholar">Scholar</option>
			<option value="Templar">Templar</option>
		</select>
	</p>
	<p>
		<label for="race">Race</label>
		<select id="race" onchange="change_race(); window.grab_keys = false;" onfocus="window.grab_keys = false;" onblur="window.grab_keys = true;">
EORS

yaml_skills["Races"].keys.each do |race|
	if yaml_skills["Races"][race]["Default"]
		page2 += "<option selected='true'>#{race}</option>\n"
	elsif !yaml_skills["Races"][race]["Hidden"]
		page2 += "<option>#{race}</option>\n"
	end
end

page2 += <<-EORS

		</select>
	</p>
	<p id="trait_p">
		<label for="trait">Trait</label>
		<select id="trait" onchange="change_trait(); window.grab_keys = false;" onfocus="window.grab_keys = false;" onblur="window.grab_keys = true;">
			<option>Strong</option>
			<option>Fast</option>
			<option>Tradesman</option>
			<option>Tough</option>
			<option>Wild</option>
			<option>Willful</option>
			<option>Telepathic</option>
			<option>Survivor</option>
		</select>
	</p>
	<table id="abilities" onclick="$('#abilities_body').toggle();">
		<thead><tr>
			<th id="abilities_h">Racial Traits and Features</th>
		</tr></thead>
	
		<tbody id="abilities_body">
			<tr><td id="ability_0"></td></tr>
			<tr><td id="ability_1"></td></tr>
			<tr><td id="ability_2"></td></tr>
		</tbody>
		</table>
	<p>
		<label for="total_build">Build</label>
		<input type="text" id="total_build" value="30" onfocus="window.grab_keys=false;" onblur="window.grab_keys = true;" />
	</p>
	<p>
		<label for="spent_build">Spent</label>
		<input type="text" id="spent_build" value="0" readonly="readonly" />
	</p>
	<p id="print_btn_p">
		<input type="submit" value="PDF" id="print_btn" onclick="return generate_pdf()" />
		<input type="submit" value="Email" id="email_btn" onclick="return mail_character()" />
		<input type="submit" value="Save" id="save_btn" onclick="return save_link()" />
		<a href="#" style="display: none;" id="a_email" onclick="$('#a_email').hide()">Click to Send Email</a>
		<a href="#" style="display: none;" id="a_save" onclick="$('#a_save').hide()">Save This Link</a>
	</p>

</div><!-- character_info -->

<h2 class="title">Spells</h2>
<table class="spell_tree">
	<thead>
	<tr></tr>
	<tr>
		<th class="spell_school" rowspan="2" onclick="switch_schools()">
			Primary
		</th>
		<th class="spell_level" onclick='del_spell("p_1")'>1</th>
		<th class="spell_level" onclick='del_spell("p_2")'>2</th>
		<th class="spell_level" onclick='del_spell("p_3")'>3</th>
		<th class="spell_level" onclick='del_spell("p_4")'>4</th>
		<th class="spell_level" onclick='del_spell("p_5")'>5</th>
		<th class="spell_level" onclick='del_spell("p_6")'>6</th>
		<th class="spell_level" onclick='del_spell("p_7")'>7</th>
		<th class="spell_level" onclick='del_spell("p_8")'>8</th>
		<th class="spell_level" onclick='del_spell("p_9")'>9</th>
		<th class="spell_head">Cost</th>
	</tr></thead>
	<tbody>
	<tr>
		<td class="spell_school" onclick="switch_schools()" id="primary">Earth</td>
		<td class="spell_slot" onclick='add_spell("p_1")'><span id="p_1">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_2")'><span id="p_2">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_3")'><span id="p_3">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_4")'><span id="p_4">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_5")'><span id="p_5">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_6")'><span id="p_6">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_7")'><span id="p_7">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_8")'><span id="p_8">0</span></td>
		<td class="spell_slot" onclick='add_spell("p_9")'><span id="p_9">0</span></td>
		<td class="spell_cost"><span id="p_cost">0</span></td>
	</tr>
	</tbody>
</table>

<table class="spell_tree">
	<thead>
	<tr>
		<th class="spell_school" onclick="switch_schools()">Secondary</th>
		<th class="spell_level" onclick='del_spell("s_1")'>1</th>
		<th class="spell_level" onclick='del_spell("s_2")'>2</th>
		<th class="spell_level" onclick='del_spell("s_3")'>3</th>
		<th class="spell_level" onclick='del_spell("s_4")'>4</th>
		<th class="spell_level" onclick='del_spell("s_5")'>5</th>
		<th class="spell_level" onclick='del_spell("s_6")'>6</th>
		<th class="spell_level" onclick='del_spell("s_7")'>7</th>
		<th class="spell_level" onclick='del_spell("s_8")'>8</th>
		<th class="spell_level" onclick='del_spell("s_9")'>9</th>
		<th class="spell_head">Cost</th>
	</tr>
	</thead>
	<tbody>
	<tr>
		<td class="spell_school" onclick="switch_schools()" id="secondary">Celestial</td>
		<td class="spell_slot" onclick='add_spell("s_1")'><span id="s_1">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_2")'><span id="s_2">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_3")'><span id="s_3">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_4")'><span id="s_4">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_5")'><span id="s_5">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_6")'><span id="s_6">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_7")'><span id="s_7">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_8")'><span id="s_8">0</span></td>
		<td class="spell_slot" onclick='add_spell("s_9")'><span id="s_9">0</span></td>
		<td class="spell_cost"><span id="s_cost">0</span></td >
	</tr>
	</tbody>
</table>

<h2 class="title">Skills</h2>
<div id="add_skills" class="box-white">
	<form onsubmit="return add_selected_skill()">
	<p id="add_skill_row">
		<input type="number" id="skill_number" value="1" onfocus="window.grab_keys=false;" onblur="window.grab_keys = true;" />
		<select id="skill_to_add" onchange="update_skill_cost();" onfocus="window.grab_keys=false;" onblur="window.grab_keys=true;" onkeyup="if (event.keyCode == 13) document.getElementById('skill_add_btn').click();">
EORS

yaml_skills["Skills"].keys.each do |skill|
	if yaml_skills["Skills"][skill].has_key?("Cost") or yaml_skills["Skills"][skill]["Racial"] == true
		page2 += "<option>#{skill}</option>\n" 
	end
end

page2 += <<-EORS

		</select>

	</p>
	<p>
		<input type="text" readonly="readonly" value="0" id="skill_cost" />
		<input type="submit" value="Add Skill" id="skill_add_btn" />
	</p>
	</form>
</div><!-- add_skills -->

<table>
	<thead><tr>
		<th></th>
		<th>Count</th>
		<th>Skill Name</th>
		<th>Build</th>
	</tr></thead>
	<tbody id="skill_table"></tbody>
</table>

<div class="box-white">
	<p><textarea id="notes" placeholder="Notes..." onfocus="window.grab_keys=false;" onblur="window.grab_keys = true;"></textarea></p>
	<!--
		<p><label for="notes1">Notes:</label><input type="text" id="notes1" /></p>
	-->
</div>


EORS

removed = <<-EORS
<div class="dialog" id="class_list">
	<ul>
		<li onclick='set_class("Fighter")'>Fighter</li>
		<li onclick='set_class("Rogue")'>Rogue</li>
		<li onclick='set_class("Scholar")'>Scholar</li>
		<li onclick='set_class("Templar")'>Templar</li>
	</ul>
</div><!-- class list -->

<div class="dialog" id="race_list">
	<ul>
EORS

yaml_skills["Races"].keys.each do |race|
	removed += "\t\t<li onclick='set_race(\"#{race}\")'>#{race}</li>\n"
end

removed += <<-EORS
	</ul>
</div><!-- race_list -->
EORS

page2 += <<-EORS


</div><!-- content -->
</div><!-- main -->
<div id="sidebar">
<div class="header">
<h1 class="title">Keyboard Mapping</h1>
</div><!-- header -->
<div class="content">
<table>
	<ul class="nav">
		<li><a href='#' onclick='run_action("A")'>
			<span class="ico msg" style="text-align: center;">A</span>
			<span>Selects the "Add Skill" drop-down.</span>
		</a></li>
		<li><a>
			<span class="ico msg" style="text-align: center;">1-9</span>
			<span>Adds/removes a spell by level</span>
		</a></li>
		<li><a href='#' onclick='run_action("=")'>
			<span class="ico msg" style="text-align: center;">=</span>
			<span>Toggles Spell Add Mode on/off</span>
		</a></li>
		<li><a href='#' onclick='run_action("+")'>
			<span class="ico msg" style="text-align: center;">+</span>
			<span>Sets Spell Add Mode on</span>
		</a></li>
		<li><a href='#' onclick='run_action("-")'>
			<span class="ico msg" style="text-align: center;">-</span>
			<span>Sets Spell Add Mode off</span>
		</a></li>
		<li><a href='#' onclick='run_action("P")'>
			<span class="ico msg" style="text-align: center;">P</span>
			<span>Toggles the primary school</span>
		</a></li>
		<li><a href='#' onclick='run_action("S")'>
			<span class="ico msg" style="text-align: center;">S</span>
			<span>Toggles the selected school</span>
		</a></li>
		
	</ul>
</table>
<div class="box-white" id="credits">
<p>This web app was developed by Corey Kump in 2012.
It utilizes skills from the <a href="http://www.nerolarp.com" target="_nat">NERO LARP</a> game.
Corey's home chapter is <a href="http://www.neroindy.com" target="_in">NERO Indiana</a>.
</p>
<p>This application is released under the terms of the <a href="http://www.gnu.org/licenses">GNU General Public License</a>, version 3 and its code is available on <a href="http://www.github.com/corvec/ncc-web">gitHub</a></p>
<p>A desktop version of this app is also maintained on <a href="http://www.github.com/corvec/NERO-Character-Creator" target="_git">gitHub</a>.</p>
<p>Follow the author on <a href="twitter.com/corvectkump" target="_twt">Twitter</a>, <a href="http://www.github.com/corvec" target="_git">GitHub</a>, or visit his site and blog at <a href="http://coreykump.com" target="_site">coreykump.com</a>.</p>
</div><!--credits-->


</div><!--content-->
</div><!--sidebar-->

</div><!-- wrap -->
</body>
</html>
EORS


prod_full = page1 + prod + page2
test_full = page1 + test + page2
git_full = page1 + git + page2

File.open('index.html', 'w') { |file| file.write prod_full }
puts "index.html generated"
File.open('debug.html', 'w') { |file| file.write test_full }
puts "debug.html generated"
File.open('git.html', 'w') { |file| file.write git_full }
puts "git.html generated"
