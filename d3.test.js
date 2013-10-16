
var svg = d3.select("#viz")
    .append("svg")
    .attr("width", 500)
    .attr("height", 500);

var color_on = "aliceblue";
var color_off = "green";

svg.selectAll("circle")
    .data([32, 57, 112, 293])
  .enter().append("circle")
    .attr("cy", String)
    .attr("cx", String)
    .attr("r", Math.sqrt)
   .on("mouseover", function(){d3.select(this).style("fill", color_on);})
   .on("mouseout", function(){d3.select(this).style("fill", color_off);})
   .on("mousedown", animate);

function animate() {
    d3.select(this).transition()
        .duration(1000)
        .attr("r", 10)
        .attr("cx", 30)
        .attr("cy", 100)
      .transition()
        .delay(1000)
        .attr("r", Math.sqrt)
        .attr("cx", String)
        .attr("cy", 90);
};
