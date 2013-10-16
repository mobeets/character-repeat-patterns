// https://github.com/mbostock/d3/wiki/API-Reference

var d3_slider = d3.slider().value(0);

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 600 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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

var color = d3.scale.ordinal()
    // .domain(["foo", "bar", "baz"])
    .range(colorbrewer.PuOr[9]);

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var cur_data;
d3.csv("data.csv", function(data) {

  data.forEach(init_data);
  cur_data = filter_data(data, 0);
  color.domain([d3.min(data, all_keys), d3.max(data, all_keys)]);

  d3_slider.on("slide", function(evt, value) {
    cur_data = filter_data(data, value);
    // change_sorting(false);
  })

  max_val = d3.max(data, all_keys);
  d3.select('#slider').call(
    d3_slider.axis( d3.svg.axis().ticks(max_val) ).min(0).max(max_val).step(1)
  );

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      // .attr("transform", "rotate(-90)")
      .attr("x", 6)
      .attr("y", 16)
      // .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Pattern");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  // d3.select("#button").on("click", check_sorting);
  d3.selectAll("input").on("change", check_sorting);

});

function check_sorting() {
    // sort_method = $('#button-wrapper').data('sort-method');
    // to_by_value = sort_method == 'frequency';
    val = this.value;
    // alert(val);
    change_sorting(this.value == 'freq');

    // new_sort_method = 'frequency';
    // if (to_by_value)
    //   new_sort_method = 'group';
    
    // $('#button-wrapper').attr('data-sort-method', new_sort_method);
    // $('#button').html('Sort by ' + new_sort_method);
}

function change_sorting(to_by_value) {
  // Copy-on-write since tweens are evaluated after a delay.
  sorter = sort_by_name;
  if (val == 'freq')
    sorter = sort_by_value;
  else if (val == 'nchars')
    sorter = sort_by_group;

  var x0 = x.domain(cur_data.sort(sorter)
      .map(function(d) { return d.pattern; }))
      .copy();
  // var x0 = x.domain(cur_data.sort(to_by_value
  // // var x0 = x.domain(cur_data.sort(this.checked
  //     ? sort_by_value
  //     : sort_by_name)
  //     .map(function(d) { return d.pattern; }))
  //     .copy();

  var transition = svg.transition().duration(750),
      delay = function(d, i) { return i * 50; };

  transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function(d) { return x0(d.pattern); });

  transition.select(".x.axis")
      .call(xAxis)
    .selectAll("g")
      .delay(delay);
}

function init_data(d) {
  d.nchars = +d.nchars;
  d.freq = +d.freq;
}

function all_names(d) {
  return d.pattern;
}

function all_values(d) {
  return d.freq;
}

function all_keys(d) {
  return d.nchars;
}

function sort_by_value(a, b) {
  return b.freq - a.freq;
}

function sort_by_name(a, b) {
  return d3.ascending(a.pattern, b.pattern);
}

function sort_by_group(a, b) {
  return b.nchars - a.nchars;
}

function filter_data(data, val) {
  cur_data = data.filter(function(d) { return d.nchars == val || val == 0; });
  x.domain(cur_data.map(all_names));
  svg.select(".x.axis").transition()
      .duration(1000)
      .call(xAxis);

  y.domain([0, d3.max(cur_data, all_values)]);
  svg.select(".y.axis").transition()
      .duration(1000)
      .call(yAxis);

  bar = svg.selectAll(".bar").data(cur_data);

  bar.enter()
    .append("rect")
    .attr("class", "bar");

  bar.transition()
    .duration(1000)
    .attr("test1", function(d) { return d.nchars; })
    .attr("test2", function(d) { return color(d.nchars); })
    .style("fill", function(d) { return color(d.nchars); })
    .attr("x", function(d) { return x(d.pattern); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.freq); })
    .attr("height", function(d) { return height - y(d.freq); });
  
  bar.exit().transition()
    .duration(100)
    .remove();


  return cur_data;
}
