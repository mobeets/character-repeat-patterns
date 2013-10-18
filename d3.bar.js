// https://github.com/mbostock/d3/wiki/API-Reference
var data_filename = 'eng_data.csv';
var x_axis_name = 'pattern';
var y_axis_name = 'frequency';
var color_axis_name = 'word length';

var margin = {top: 20, right: 20, bottom: 20, left: 40}
var width = 900 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var color_range = ["skyblue","gainsboro"]; // http://www.w3.org/TR/SVG/types.html#ColorKeywords
// var color_range = ["ghostwhite","steelblue"]; // http://www.w3.org/TR/SVG/types.html#ColorKeywords

var formatter = d3.format(".0");

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .3, .4);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(formatter);

var color = d3.scale.ordinal();

var label_mult = 7; // how many pixels per letter in an x-label

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + label_mult*x_axis_name.length)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var radio_val = 'value';
var group_ind = 0;
var dropdown_val;
var groups;
var all_data;
var cur_data;

function sorted_set(data, getter, sorter) {
  group_list = [];
  for (i in data){
    group = getter(data[i]);
    if (group_list.indexOf(group) == -1){
      group_list.push(group);
    }
  }
  return group_list.sort(sorter);
}

function set_colors_by_group() {
  color = d3.scale.linear()
    .domain([0, groups.length-1])
    .range(color_range);
}

function init_dropdown() {
  group_list = sorted_set(all_data, get_group, sort_group);
  group_list.unshift(-1); // for choosing all

  d3.select("#dropdown").append("select")
      .on("change", change_dropdown)
    .selectAll("option").data(group_list).enter()
      .append("option")
        .attr("value", function(d){return d;}) /* Optional */
        .text(function(d){return d == -1 ? 'All': d;});

  d3.select("#dropdown")[0][0].lastChild[group_ind+1].selected=true;
  console.log();
}

function change_dropdown() {
  ind = this.selectedIndex;
  val = this.options[ind].value;
  dropdown_val = val;
  filter_data(val);
}

function update_zero_values(data) {
  remove_zeros = d3.select("input[name=nonzeros]")[0][0].checked;
  if (remove_zeros)
    return data.filter(function(d) { return get_value(d) > 0; });
  return data;
}

function init_radios() {
  d3.selectAll("input[name=nonzeros]")
    .on("change", function() { filter_data(dropdown_val); });
  d3.selectAll("input[name=xlabels]")
    .on("change", function() { filter_data(dropdown_val); });
  d3.selectAll("input[name=sorting]")
    .on("change", function() { radio_val = this.value; resort_data(radio_val); });
  d3.select("input[value=" + radio_val + "]").attr('checked', true);
}

function max_x_label(data) {
  m = 0
  for (i in data){
    v = get_key(data[i]);
    v2 = String(v).length
    if (v2 > m)
      m = v2;
  }
  return hide_x_labels() ? 0 : d3.max([x_axis_name.length, m]);
}

function fix_x_axis(x) {
  return x
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .attr("text-anchor", "start");
}

function init_axes() {
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.select(".x.axis")
    .append("text")
      .attr("x", 6)
      .attr("y", 16)
      .attr("text-anchor", "end")
      .text(x_axis_name);

  fix_x_axis(svg.select(".x.axis").selectAll("text"));

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("text-anchor", "end")
      .text(y_axis_name);
}

function get_sorter(val) {
  sorter = sort_data_by_key;
  if (val == 'value')
    sorter = sort_data_by_value;
  else if (val == 'group')
    sorter = sort_data_by_group;
  return sorter;
}

function resort_data(val) {
  // Copy-on-write since tweens are evaluated after a delay.
  sorter = get_sorter(val);
  var x0 = x.domain(cur_data.sort(sorter).map(get_key)).copy();

  var transition = svg.transition().duration(400);
  var delay = function(d, i) { return i * 50; };

  fix_x_axis(transition.select(".x.axis").call(xAxis).selectAll("text").delay(100));

  transition.selectAll(".bar")
      // .delay(delay)
      .delay(100)
      .attr("x", function(d) { return x0(get_key(d)); });
}

function hide_x_labels() {
  return d3.select("input[name=xlabels]")[0][0].checked;
}
function filter_data(val, first_time) {
  cur_data = all_data.filter(function(d) { return val == -1 || get_group(d) == val; });
  cur_data = update_zero_values(cur_data);

  sorter = get_sorter(radio_val);
  x.domain(cur_data.sort(sorter).map(get_key));

  if (first_time)
    init_axes();
  else {
    fix_x_axis(svg.select(".x.axis").transition().duration(200).call(xAxis).selectAll("text").delay(100));
  }

  y.domain([0, d3.max(cur_data, get_value)]);
  svg.select(".y.axis").transition()
      .duration(200)
      .call(yAxis);

  bar = svg.selectAll(".bar").data(cur_data);

  bar.enter()
    .append("rect")
    .style("opacity", 0.5)
    .on('mouseover', function(d){ d3.select(this).style("opacity", 1.0); })
    .on('mouseout', function(d){ d3.select(this).style("opacity", 0.5); })
    .attr("class", "bar");

  bar.transition()
    .duration(200)
    .style("fill", function(d) { return color(groups.indexOf(get_group(d))); })
    .attr("x", function(d) { return x(get_key(d)); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(get_value(d)); })
    .attr("height", function(d) { return height - y(get_value(d)); });
  
  bar.exit().transition()
    .duration(100)
    .remove();

  if (hide_x_labels()){
    svg.select(".x.axis").selectAll("line").style("opacity", 0.0);
    svg.select(".x.axis").selectAll("text").style("opacity", 0.0);
  }
  else {
    svg.select(".x.axis").selectAll("line").style("opacity", 1.0);
    svg.select(".x.axis").selectAll("text").style("opacity", 1.0);
  }
  n = max_x_label(cur_data);
  d3.select("svg").attr("height", height + margin.top + margin.bottom + n*label_mult);
}

function init_data(d) {
  d.group = +d.group;
  d.val = +d.val;
}

function get_key(d) {
  return d.key;
}

function get_value(d) {
  return d.val;
}

function get_group(d) {
  return d.group;
}

function sort_data_by_value(a, b) {
  return b.val - a.val;
}

function sort_data_by_key(a, b) {
  return d3.ascending(a.key, b.key);
}

function sort_data_by_group(a, b) {
  return b.group - a.group;
}

function sort_group(a, b) {
  return a - b; // n.b. need to change if group values are not integers
}

d3.selectAll('#dropdown_name').text('Filter by ' + color_axis_name + ':');
d3.selectAll('#key_name').text(x_axis_name);
d3.selectAll('#value_name').text(y_axis_name);
d3.selectAll('#group_name').text(color_axis_name);

function get_json() {
  $.getJSON("update", function(data) { render(data); });
}

function get_csv() {
  d3.csv(data_filename, function(data) {render(data);});
}

function render(data) {
  // data = data.filter(function(d) { return get_value(d) > 0; });
  all_data = data;
  all_data.forEach(init_data);
  groups = sorted_set(all_data, get_group, sort_group);
  dropdown_val = groups[group_ind];

  set_colors_by_group();
  init_dropdown();
  init_radios();
  filter_data(dropdown_val, true);
}

get_csv();
