console.log("hello World")


// specifying that the height or width which is bigger the values we put or the devices window 
var width = Math.max(968, window.innerWidth),
    height = Math.max(500, window.innerHeight);

// creating our pi and tau elements for useful data transforms later on 
var pi = Math.PI,
    tau = 2 * pi;

// creating a projection, that is the 
var projection = d3.geoMercator()
    .scale(1 / tau) //altering the projection a tiny bit by 1/ 2 pi
    .translate([0, 0]); // will return the projection of this projection on the point [0,0]

// creating our scale that will create our objects with SVG
var path = d3.geoPath()
    .projection(projection);

// creates a layout that for our map tiles , we are making it as big as the height and width 
var tile = d3.tile()
    .size([width, height]);

// creating a zoom event with d3
var zoom = d3.zoom()
    .scaleExtent([ // making the scale of the zoom event be between values 2048 to 16777216  
        1 << 11,
        1 << 24
    ]).on("zoom", zoomed); //on a zoom event call on the zoomed function

//creating a radius scale for our earthquakes 
var radius = d3.scaleSqrt().range([0, 10]);

// creating the svg view port , specifying it have the same height and width 
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// making our raster path 
var raster = svg.append("g")

// we are render to multiple paths 
var vector = svg.selectAll("path")

// call back function processing the intersection of earth quakes 
d3.json("data/earthquakes_4326_cali.geojson", function(error, geojson) {
    if (error) throw error // halts function if an error should occur

    // verifying that the geojosn is loaded and that is conforms to our expectations 
    console.log(geojson)

    radius.domain([0, d3.max(geojson.features, function(d) {
        return d.properties.mag;
    })]);

    // vector.datum(geojson); since we are doing multiple paths we need to call on data not datum
    vector = vector.data(geojson.features)
        .enter() // starting the general update pattern 
        .append("path") // making multiple paths by appending 
        .attr("d", path) // we are giving our circles a coordinate according to path
        .on("mouseover", function(d) {
            console.log(d);
        });


    var center = projection([-119.665, 37.414]); // creating the center of California


    svg.call(zoom) // calls the event zoom that could trigger the zoomed function
        .call(
            zoom.transform, // resets the zoom transformation to the identity transform 
            d3.zoomIdentity
            .translate(width / 2, height / 2) // returns a translation to the units width/2 and height /2 
            .scale(1 << 14) // creates our zoomed scale , this allows us to see the state of California upon starting our window 
            .translate(-center[0], -center[1]) // making our coordinates negative our else well be sent to china or afirca 
        );
});

function zoomed() {

    // returns the current zoom state on our current selection in a zoom function 
    var transform = d3.event.transform;
    console.log(transform)

    
    // creates the tiles we need to get the images of our map
    var tiles = tile.scale(transform.k)
        .translate([transform.x, transform.y])();

    console.log(transform.x, transform.y, transform.k);
    console.log(tiles)
    
    projection.scale(transform.k / tau) // changing the scale of our projection
        .translate([transform.x, transform.y]); // translating x and y based on the new projection

    vector.attr("d", path); // updates the position of the according to our new projection scale 


    var image = raster.attr("transform",
            stringify(tiles.scale, tiles.translate) //returns a translation based on the scale 
        )
        .selectAll("image") // we will be creating multiple images based on the new tiles 
        .data(tiles, function(d) {
            return d; // we  selection of d for all our all data 
        });
    // getting our images based on the scales and translates 

    image.exit().remove(); // we then remove any existing earthquake points 


    // we then use the data and bind it our image selections 
    image.enter()
    .append("image") // we make an image 
        .attr("xlink:href", function(d) { // this function returns very specific maps that will fit our tiles based on the data that was entered 
            return "http://" + "abc" [d[1] % 3] + ".basemaps.cartocdn.com/rastertiles/voyager/" +
                d[2] + "/" + d[0] + "/" + d[1] + ".png"
        })
        .attr("x", function(d) { 
            return d[0] * 256; //applying our scale to the location of x 
        })
        .attr("y", function(d) {
            return d[1] * 256; //applying our scale to the location of y 
        })
        .attr("width", 256) // specifying the height and width of our images 
        .attr("height", 256);

}

// function that lets us make translations 
function stringify(scale, translate) {
    var k = scale / 256,
        r = scale % 1 ? Number : Math.round;
    return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}