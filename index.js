/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./lib/aframe-bmfont-text-component.min.js');
var d3 = require('d3');

/**
 * Graph component for A-Frame.
 */
AFRAME.registerComponent('graph', {
  schema: {
    csv: {
      type: 'string'
    },
    id: {
      type: 'int',
      default: '0'
    },
    width: {
      type: 'number',
      default: 1
    },
    height: {
      type: 'number',
      default: 1
    },
    depth: {
      type: 'number',
      default: 1
    }
  },

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  update: function () {
    // Entity data
    var el = this.el;
    var object3D = el.object3D;
    var data = this.data;

    var width = data.width;
    var height = data.height;
    var depth = data.depth;

    // These will be used to set the range of the axes' scales
    var xRange = [0, width];
    var yRange = [0, height];
    var zRange = [0, -depth];

    /**
     * Create origin point.
     * This gives a solid reference point for scaling data.
     * It is positioned at the vertex of the left grid and bottom grid (towards the front).
     */
    var originPointPosition = (-width / 2) + ' 0 ' + (depth / 2);
    var originPointID = 'originPoint' + data.id;

    d3.select(el).append('a-entity')
                 .attr('id', originPointID)
                 .attr('position', originPointPosition);
                 /** DEBUG
                  * .attr('geometry', "primitive: sphere; radius: 0.021")
                  * .attr('material', "color: green");
                  */

    // Create graphing area out of three textured planes
    var grid = gridMaker(width, height, depth);
    object3D.add(grid);

    // Label axes
    var xLabelPosition = (width / 2.2) + ' ' + '-0.1' + ' ' + '0';
    d3.select('#' + originPointID)
      .append('a-entity')
      .attr('id', 'x')
      .attr('bmfont-text', 'text: x')
      .attr('position', xLabelPosition);

    var yLabelPosition = (width + 0.05) + ' ' + (height / 2.2) + ' ' + (-depth);
    d3.select('#' + originPointID)
      .append('a-entity')
      .attr('id', 'y')
      .attr('bmfont-text', 'text: y')
      .attr('position', yLabelPosition);

    var zLabelPosition = (width + 0.02) + ' ' + '-0.05' + ' ' + (-depth / 2);
    d3.select('#' + originPointID)
      .append('a-entity')
      .attr('id', 'z')
      .attr('bmfont-text', 'text: z')
      .attr('position', zLabelPosition);

    if (data.csv) {
      /* Plot data from CSV */

      var originPoint = d3.select('#originPoint' + data.id);

      // Convert CSV data from string to number
      d3.csv(data.csv, function (data) {
        data.forEach(function (d) {
          d.x = +d.x;
          d.y = +d.y;
          d.z = +d.z;
        });

        plotData(data);
      });

      var plotData = function (data) {
        // Scale x, y, and z values
        // d3.extent is just short hand for d3.max and d3.min.
        var xExtent = d3.extent(data, function (d) { return d.x; });
        var xScale = d3.scale.linear()
                       .domain(xExtent)
                       .range([xRange[0], xRange[1]]);

        var yExtent = d3.extent(data, function (d) { return d.y; });
        var yScale = d3.scale.linear()
                       .domain(yExtent)
                       .range([yRange[0], yRange[1]]);

        var zExtent = d3.extent(data, function (d) { return d.z; });
        var zScale = d3.scale.linear()
                       .domain(zExtent)
                       .range([zRange[0], zRange[1]]);

        // Append data to graph and attach event listeners
        originPoint.selectAll('a-sphere')
                   .data(data)
                   .enter()
                   .append('a-sphere')
                   .attr('radius', 0.02)
                   .attr('color', '#D50000')
                   .attr('position', function (d) {
                     return xScale(d.x) + ' ' + yScale(d.y) + ' ' + zScale(d.z);
                   })
                   .on('mouseenter', mouseEnter);

        /**
         * Event listener adds and removes data labels.
         * "this" refers to sphere element of a given data point.
         */
        function mouseEnter () {
          // Get height of graphBox (needed to scale label position)
          var graphBoxEl = this.parentElement.parentElement;
          var graphBoxData = graphBoxEl.components.graph.data;
          var graphBoxHeight = graphBoxData.height;

          // Look for an existing label
          var oldLabel = d3.select('#tempDataLabel');
          var oldLabelParent = oldLabel.select(function () { return this.parentNode; });

          // Look for an existing beam
          var oldBeam = d3.select('#tempDataBeam');

          // If there is no existing label, make one
          if (oldLabel[0][0] === null) {
            labelMaker(this, graphBoxHeight);
          } else {
            // Remove old label
            oldLabel.remove();
            // Remove beam
            oldBeam.remove();
            // Remove highlight
            oldLabelParent.attr('material', 'color: red');
            oldLabelParent.attr('radius', 0.02);
            // Create new label
            labelMaker(this, graphBoxHeight);
          }
        }
      };
    }
  }
});

/* HELPER FUNCTIONS */

/**
 * planeMaker() creates a plane given width and height (kind of).
 *  It is used by gridMaker().
 */
function planeMaker (horizontal, vertical) {
  // Controls texture repeat for U and V
  var uHorizontal = horizontal * 4;
  var vVertical = vertical * 4;

  // Load a texture, set wrap mode to repeat
  var texture = new THREE.TextureLoader().load('https://cdn.rawgit.com/bryik/aframe-scatter-component/master/assets/grid.png');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // should be: texture.anisotropy = renderer.getMaxAnisotropy();
  // but I can't figure out how to get this working
  texture.anisotropy = 16;
  texture.repeat.set(uHorizontal, vVertical);

  // Create material and geometry
  var material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
  var geometry = new THREE.PlaneGeometry(horizontal, vertical);

  return new THREE.Mesh(geometry, material);
}

/**
 * gridMaker() creates a graphing box given width, height, and depth.
 * The textures are also scaled to these dimensions.
 *
 * There are many ways this function could be improved or done differently
 * e.g. buffer geometry, merge geometry, better reuse of material/geometry.
 */
function gridMaker (width, height, depth) {
  var grid = new THREE.Object3D();

  // AKA bottom grid
  var xGrid = planeMaker(width, depth);
  xGrid.rotation.x = 90 * (Math.PI / 180);
  grid.add(xGrid);

  // AKA far grid
  var yPlane = planeMaker(width, height);
  yPlane.position.y = (0.5) * height;
  yPlane.position.z = (-0.5) * depth;
  grid.add(yPlane);

  // AKA side grid
  var zPlane = planeMaker(depth, height);
  zPlane.position.x = (-0.5) * width;
  zPlane.position.y = (0.5) * height;
  zPlane.rotation.y = 90 * (Math.PI / 180);
  grid.add(zPlane);

  return grid;
}

/**
 * labelMaker() creates a label for a given data point and graph height.
 * dataEl - A data point's element.
 * graphBoxHeight - The height of the graph.
 */
function labelMaker (dataEl, graphBoxHeight) {
  var dataElement = d3.select(dataEl);
  // Retrieve original data
  var dataValues = dataEl.__data__;

  // Create individual x, y, and z labels using original data values
  // round to 1 decimal space (should use d3 format for consistency later)
  var labelText = 'text: (' + d3.round(dataValues.x, 1) + ', ' + d3.round(dataValues.y, 1) + ', ' + d3.round(dataValues.z, 1) + ')';

  // Position label above graph
  var padding = 0.2;
  var sphereYPosition = dataEl.getAttribute('position').y;
  var labelYPosition = (graphBoxHeight + padding) - sphereYPosition;
  var labelPosition = '0 ' + labelYPosition + ' 0';

  // Highlight selected data point
  dataElement.attr('material', 'color: blue');
  dataElement.attr('radius', 0.03);

  // Add pointer
  var beamHeight = String(labelYPosition);
  var beamPosition = '0 ' + (labelYPosition - (beamHeight / 2)) + ' 0';
  dataElement.append('a-box')
             .attr('id', 'tempDataBeam')
             .attr('width', '0.01')
             .attr('height', beamHeight)
             .attr('depth', '0.01')
             .attr('color', 'green')
             .attr('position', beamPosition);

  // Add label
  dataElement.append('a-entity')
             .attr('id', 'tempDataLabel')
             .attr('bmfont-text', labelText)
             .attr('position', labelPosition)
             .attr('look-at', '[camera]');
}
