// Here's a real data set drawn from our solar system. Let's combine this data with our previous visualization to make a simple model of our solar system.
/**Data set **/
//Source: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
//Planet diameters in km
var planetDiameters = [4879,	12104,	12756, 6792,	142984,	120536,	51118,	49528];
//Let's turn these diameters into radii
var planetRadii = [];
for (var i = 0; i < planetDiameters.length; i++) {
  var radius = planetDiameters[i] / 2;
  planetRadii[i] = radius;
}
//Planet distances from the sun, 10^6 km
var planetDistances = [57.9, 108.2, 149.6, 227.9, 778.6, 1433.5, 2872.5, 4495.1];

//Planet colors, web safe colors http://curious.astro.cornell.edu/about-us/58-our-solar-system/planets-and-dwarf-planets/planet-watching/249-what-color-is-each-planet-intermediate
var planetColors = ["Gray", "PaleGoldenrod", "Blue", "DarkRed", "DarkOrange", "Gold", "PowderBlue", "SteelBlue"];

//Planet names
var planetNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];


/**D3 **/
// create the svg, same as before.
      var svg = d3.select("body").append("svg")
      .attr('height',600)                             //Is this big enough?
      .attr('width',600);
      // select circle elements (which do not yet exist!!!)
      // and bind them to our data
      // This is the infamous "data join!"
      var circle = svg.selectAll('circle').data(planetRadii);
      // "enter" creates a "selection" matching data for which
      // we do not yet have a corresponding ui element.
      // For each of these, let's create a circle.
      // The radius and horizontal position are
      // "dynamic properties" computed from the data.
      circle.enter()
      .append('circle')
      .attr('r',function(d){ return d/1000; } )         //Computed via data source
      .attr('cx',function(d,i){ return 50 + (i*50); })  //Computed via iteration - currently same distance between each plant.
                                                        //How would we change this to use a data source so it
                                                        //makes sense as part of the model?
      .attr('cy',100)                                   //Static
      .attr('fill','blue');                             //Change to a data source
                                                        //How would we add a label?
                                                        //Finished product: https://codepen.io/ColeDCrawford/pen/GyqEjM
