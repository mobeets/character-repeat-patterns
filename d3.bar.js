// https://github.com/mbostock/d3/wiki/API-Reference
var data_filename = 'eng_data.csv';
var x_axis_name = 'pattern';
var y_axis_name = 'frequency';
var color_axis_name = 'word length';

d3.selectAll('#dropdown_name').text('Filter by ' + color_axis_name + ':');
d3.selectAll('#key_name').text(x_axis_name);
d3.selectAll('#value_name').text(y_axis_name);
d3.selectAll('#group_name').text(color_axis_name);

var margin = {top: 20, right: 20, bottom: 30, left: 40}
var width = 600 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
var color_range = ["ghostwhite","steelblue"]; // http://www.w3.org/TR/SVG/types.html#ColorKeywords

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

var formatter = d3.format(".0");

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .3, .3);

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

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var radio_val = 'value';
var group_ind = 1;
var groups;
var all_data;
var cur_data;

d3.csv(data_filename, function(data) {
  all_data = data;
  all_data.forEach(init_data);
  groups = sorted_set(all_data, get_group, sort_group);

  set_colors_by_group();
  init_axes();
  init_dropdown();
  init_radios();
  filter_data(groups[group_ind]);
});

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

  d3.select("#dropdown")[0][0].lastChild[group_ind].selected=true;
  console.log();
}

function change_dropdown() {
  ind = this.selectedIndex;
  val = this.options[ind].value;
  filter_data(val);
}

function init_radios() {
  d3.selectAll("input")
    .on("change", function() { radio_val = this.value; resort_data(radio_val); });
  d3.select("input[value=" + radio_val + "]").attr('checked', true);
}

function init_axes() {
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    // .selectAll("text")
    //   .attr("transform", function(d) {
    //             return "rotate(-90)" 
    //             });
    .append("text")
      .attr("x", 6)
      .attr("y", 16)
      .style("text-anchor", "end")
      .text(x_axis_name);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
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
  sorter = get_sorter(val);

  // Copy-on-write since tweens are evaluated after a delay.
  var x0 = x.domain(cur_data.sort(sorter).map(get_key)).copy();

  var transition = svg.transition().duration(400);
  var delay = function(d, i) { return i * 50; };

  transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function(d) { return x0(get_key(d)); });

  transition.select(".x.axis")
      .call(xAxis)
    .selectAll("g")
      .delay(delay);
}

function filter_data(val) {
  cur_data = all_data.filter(function(d) { return val == -1 || get_group(d) == val; });

  sorter = get_sorter(radio_val);
  x.domain(cur_data.sort(sorter).map(get_key));
  svg.select(".x.axis").transition()
      .duration(200)
      .call(xAxis)
      .selectAll("text")
      // .attr("transform", function(d) {
      //           return "rotate(-90)" 
      //           });

  y.domain([0, d3.max(cur_data, get_value)]);
  svg.select(".y.axis").transition()
      .duration(200)
      .call(yAxis);

  bar = svg.selectAll(".bar").data(cur_data);

  bar.enter()
    .append("rect")
    .attr("class", "bar");

  bar.transition()
    .duration(200)
    .style("fill", function(d) { return color(groups.indexOf(get_group(d))); })
    // .style("fill", function(d) { return color(get_group(d)); })
    .attr("x", function(d) { return x(get_key(d)); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(get_value(d)); })
    .attr("height", function(d) { return height - y(get_value(d)); });
  
  bar.exit().transition()
    .duration(100)
    .remove();

}
