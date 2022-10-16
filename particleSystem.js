/* author: Andrew Burks */
"use strict";

/* Get or create the application global variable */
var App = App || {};

const ParticleSystem = function () {

    // setup the pointer to the scope 'this' variable
    const self = this;

    // data container
    const data = [];

    // scene graph group for the particle system
    const sceneObject = new THREE.Group();

    // bounds of the data
    const bounds = {};

    // create the containment box.
    // This cylinder is only to guide development.
    // TODO: Remove after the data has been rendered
    self.drawContainment = function () {

        // get the radius and height based on the data bounds
        const radius = (bounds.maxX - bounds.minX) / 2.0 + 1;
        const height = (bounds.maxY - bounds.minY) + 1;

        // create a cylinder to contain the particle system
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
        const cylinder = new THREE.Mesh(geometry, material);

        // add the containment to the scene
        sceneObject.add(cylinder);
    };

    var particleSystem;

    var colorScale = d3.scaleSequential()
            .domain([2,20])
            .interpolator(d3.interpolateBlues);

    var greyScale = d3.scaleSequential()
            .domain([0,20])
            .interpolator(d3.interpolateGreys);

    // creates the particle system
    self.createParticleSystem = function () {

        // use self.data to create the particle system
        // draw your particle system here!

        // create the particle variables
        var particleCount = 1800,
            particles = new THREE.Geometry(),
            pMaterial = new THREE.PointsMaterial({
                size: 1,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors,
            });

        // now create the individual particles
        for (var i = 0; i < data.length; i++) {

            var pX = data[i].X,
                pY = data[i].Y,
                pZ = data[i].Z,
                particle = new THREE.Vector3(pX, pY, pZ);
            particles.vertices.push(particle);

            var color = new THREE.Color(colorScale(data[i].concentration));
            // console.log(data[i].concentration)
            particles.colors.push(color);
        }

        // create the particle system
        particleSystem = new THREE.Points(
            particles,
            pMaterial);

        // add it to the scene
        // sceneObject.addChild(particleSystem);

        // get the radius and height based on the data bounds
        const radius = (bounds.maxX - bounds.minX) / 2.0 + 0.5;
        const height = (bounds.maxY - bounds.minY) + 1;
        const ycenterCylinder = (bounds.maxY + bounds.minY) / 2
        var planegeometry = new THREE.PlaneGeometry(radius * 2, height);
        var planematerial = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true, side: THREE.DoubleSide });
        var plane = new THREE.Mesh(planegeometry, planematerial);
        plane.translateY(ycenterCylinder);
        document.addEventListener('keydown', function (event) {
            switch (event.key) {
                case 'a':
                    plane.translateZ(0.1);
                    self.scatterPlot(plane.position.z);
                    self.greyPoints(plane.position.z);
                    break;
                case 'd':
                    plane.translateZ(-0.1);
                    self.scatterPlot(plane.position.z);
                    self.greyPoints(plane.position.z);
                    break;
            }
        });
        // plane.position.z;
        // console.log(ycenterCylinder, bounds);
        sceneObject.add(plane);
        sceneObject.add(particleSystem)
    };

    //Plot

    self.scatterPlot = function (selectedPoint) {

        d3.select('#scatterPlot').select('svg').remove();

        // set the dimensions and margins of the graph
        var margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#scatterPlot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var dataSelected = data.filter(p => {
            return p.Z >= (selectedPoint - 0.005) && p.Z <= (selectedPoint + 0.005);
        });

        // Add X axis
        var x = d3.scaleLinear()
            .domain(d3.extent(dataSelected.map(p => p.X)))
            .range([0, width]);
        var xAxis = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain(d3.extent(dataSelected.map(p => p.Y)))
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add a clipPath: everything out of this area won't be drawn.
        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Add brushing
        var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

        // Create the scatter variable: where both the circles and the brush take place
        var scatter = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Add dots
        scatter.append('g')
            .selectAll("dot")
            .data(dataSelected)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.X); })
            .attr("cy", function (d) { return y(d.Y); })
            .attr("r", 4)
            .style("fill", function (d) {
                return colorScale(d.concentration)
            })

        // Add the brushing
        scatter
            .append("g")
            .attr("class", "brush")
            .call(brush);

        // A function that set idleTimeOut to null
        var idleTimeout
        function idled() { idleTimeout = null; }

        // A function that update the chart for given boundaries
        function updateChart() {

            var extent = d3.event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain([4, 8])
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])])
                scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and circle position
            xAxis.transition().duration(1000).call(d3.axisBottom(x))
            scatter
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d.X); })
                .attr("cy", function (d) { return y(d.Y); })

        }

    }

    // greyPoints
    self.greyPoints = function(selectedZPoint)
    {

    	for(var i = 0; i < particleSystem.geometry.vertices.length; i++)
    	{
        	if(data[i].Z >= (selectedZPoint - 0.05) && data[i].Z <= (selectedZPoint + 0.05))
        	{
                particleSystem.geometry.colors[i].set(colorScale(data[i].concentration));
        	}
        	else
        	{
                particleSystem.geometry.colors[i].set(greyScale(data[i].concentration));
        	}
        }

        // updating color of particles geometry
    	particleSystem.geometry.colorsNeedUpdate = true;
    }

    // data loading function
    self.loadData = function (file) {

        // read the csv file
        d3.csv(file)
            // iterate over the rows of the csv file
            .row(function (d) {

                // get the min bounds
                bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
                bounds.minY = Math.min(bounds.minY || Infinity, d.Points2);
                bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points1);
                bounds.minConcentration = Math.min(bounds.minConcentration || Infinity, d.concentration);

                // get the max bounds
                bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
                bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points2);
                bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points1);
                bounds.maxConcentration = Math.max(bounds.maxConcentration || -Infinity, d.concentration);

                // add the element to the data collection
                data.push({
                    // concentration density
                    concentration: Number(d.concentration),
                    // Position
                    X: Number(d.Points0),
                    Z: Number(d.Points1),
                    Y: Number(d.Points2),
                    // Velocity
                    U: Number(d.velocity0),
                    W: Number(d.velocity1),
                    V: Number(d.velocity2)
                });
            })
            // when done loading
            .get(function () {
                // draw the containment cylinder
                // TODO: Remove after the data has been rendered
                // self.drawContainment();

                // create the particle system
                self.createParticleSystem();
            });
    };

    // publicly available functions
    self.public = {

        // load the data and setup the system
        initialize: function (file) {
            self.loadData(file);
        },

        // accessor for the particle system
        getParticleSystems: function () {
            return sceneObject;
        }
    };

    return self.public;

};