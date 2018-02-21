/* Various accessors that specify the how to get at the data to visualize.
   All of these are functions that will be used later to determine how parts
   of the dataset are accessed, hence the name, accessor functions. */
function x(d) { return d.income; } // Income will be on x axis
function y(d) { return d.lifeExpectancy; } // Life Expectancy on y axis
function radius(d) { return d.population; } // Population represented by circle radius
function color(d) { return d.region; } // Region represented by color
function key(d) { return d.name; } // Hover text contains country name

/* Chart dimensions. Will be used in setting up chart area.
   Notice that `var` is only used once, but 3 variables are declared.
   They're on separate lines, but what makes this possible are really the commas
   at the end of each line. */
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

/* Various scales. These domains make assumptions of data.

   The scales map the domain, or the values in the data, to the range, the
   desired output values for visualization. The domain is constrained by the
   data,  but the range is constrained by aesthetic choices, like the size of
   the visualization or the desired size of marks on the visualization.

   Because we're explicitly setting the domain values, if our data changes or
   updates to include larger values, we'll need to update this code.

   This is also a good time to point out the "chaining" convention, which is
   common in d3 code. The first variable declaration is functionally equivalent
   to the following code:
     var xScale = d3.scaleLog();
     xScale = xScale.domain([300,1e5]);
     xScale = sScale.range(0,width);
   Instead of changing the variable over and over with functions that return a
   modified version of the same object, we "chain" them all together, running
   these functions together to create the object that we want. It's common
   practice to put each function on its own line, to make the code more readable. */
var xScale = d3.scaleLog()
           .domain([300, 1e5])
           .range([0, width]),
    yScale = d3.scaleLinear()
             .domain([10, 85])
             .range([height, 0]),
    radiusScale = d3.scaleSqrt()
                  .domain([0, 5e8])
                  .range([2, 40]),
    colorScale = d3.scaleOrdinal(d3.schemeCategory10);

/* The x & y axes. They are being set up with the scale information that we
   just declared. */
var xAxis = d3.axisBottom()
            .scale(xScale)
            .ticks(12, d3.format(",d")),
    yAxis = d3.axisLeft()
            .scale(yScale);

/* Create the SVG container and set the origin.
   This is where the SVG that will contain our visualization actually gets
   created. So far we've just been setting up JavaScript objects, but now those
   objects get put to use drawing parts of our visualization. */
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Draw the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Draw the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("income per capita, inflation-adjusted (dollars)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1800);

/* Load the data.

   This is a long section of our code, where we'll do everything that involves
   the data itself. Note the unclosed curly brace at the end of the first line
   of this block. Everything inside of it has access to the data we're loading
   from our JSON file, but we can't access that data outside of the d3.json
   function without a good deal of extra fiddling, due to the asynchronous
   nature of JavaScript. */
d3.json("https://bost.ocks.org/mike/nations/nations.json", function(nations) {

  // Add a legend
  var regionSet = new Set();
  for(var i = 0; i < nations.length; i++){
    regionSet.add(nations[i].region);
  };
  var regions = Array.from(regionSet);
  var ordinal = d3.scaleOrdinal()
    .domain(regions)
    .range(d3.schemeCategory10);

  svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(20,20)");

  var legendOrdinal = d3.legendColor()
    .title("Legend: Region")
    .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
    .shapePadding(10)
    .scale(ordinal);

  svg.select(".legendOrdinal")
    .call(legendOrdinal);
  
  /* A bisector since many nation's data is sparsely-defined.
     For more on what a bisector is, check out this StackOverflow post:
     https://stackoverflow.com/questions/26882631/d3-what-is-a-bisector */
  var bisect = d3.bisector(function(d) { return d[0]; });

  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot") // Start working with .dot elements, which implicitly creates them
      .data(interpolateData(1800)) // `interpolateData` function defined later in code
    .enter().append("circle") // Start working circle elements, which implicitly creates them
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position) // `position` function defined later in code
      .sort(order); // `order` function defined later in code

  // Add a title. Title attributes display on hover, which is a standard part of HTML
  dot.append("title")
      .text(function(d) { return d.name; });

  /* Add an overlay for the year label by getting the bounding box of the label
     and appending a rectangle over it. */
  var box = label.node().getBBox();

  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", enableInteraction); // `enableInteraction` function defined later in code

  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(30000) // time in milliseconds, so 30 seconds for the whole thing.
      .ease(d3.easeLinear)
      .tween("year", tweenYear) // `tweenYear` function defined later in code
      .on("end", enableInteraction); // `enableInteraction` function defined later in code

  // Positions the dots based on data.
  function position(dot) {
    dot .attr("cx", function(d) { return xScale(x(d)); })
        .attr("cy", function(d) { return yScale(y(d)); })
        .attr("r", function(d) { return radiusScale(radius(d)); });
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }

  // After the transition finishes, you can mouseover to change the year.
  function enableInteraction() {
    var yearScale = d3.scaleLinear()
        .domain([1800, 2009])
        .range([box.x + 10, box.x + box.width - 10])
        .clamp(true);

    // Cancel the current transition, if any.
    svg.transition().duration(0);

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
      label.classed("active", true);
    }

    function mouseout() {
      label.classed("active", false);
    }

    function mousemove() {
      displayYear(yearScale.invert(d3.mouse(this)[0]));
    }
  }

  /* Tweens the entire chart by first tweening the year, and then the data.
     For the interpolated data, the dots and label are redrawn.
     For more on "tween" functions, check out this blog post:
     https://drewblaster.wordpress.com/2015/07/14/a-simple-introduction-to-tween-functions-in-d3/ */
  function tweenYear() {
    var year = d3.interpolateNumber(1800, 2009);
    return function(t) { displayYear(year(t)); };
  }

  // Updates the display to show the specified year.
  function displayYear(year) {
    dot.data(interpolateData(year), key).call(position).sort(order);
    label.text(Math.round(year));
  }

  /* Interpolates the dataset for the given (fractional) year.
     This is an important function, because it smooths the data so that we can
     see an animation of the movement and growth of these bubbles over time. If
     you look at the data itself, you might notice that there are huge gaps
     around the world from 1800 until the early to mid-1900s. This is the
     function that takes a year and rolls the interpolated values together.*/
  function interpolateData(year) {
    return nations.map(function(d) {
      return {
        name: d.name,
        region: d.region,
        income: interpolateValues(d.income, year),
        population: interpolateValues(d.population, year),
        lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
      };
    });
  }

  /* Finds (and possibly interpolates) the value for the specified year.

     Where in the previous function we were putting values together, this
     function enacts the actual process of interpolating the values of the data
     between the points of data that we have. */
  function interpolateValues(values, year) {
    var i = bisect.left(values, year, 0, values.length - 1),
        a = values[i];
    if (i > 0) {
      var b = values[i - 1],
          t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }
});

