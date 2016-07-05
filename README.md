## aframe-scatter-component

An experimental mix of A-Frame and D3 that generates 3D scatter plots.

### Properties

| Property |         Description         | Default Value |
|:--------:|:---------------------------:|:-------------:|
|    csv   |       Path to CSV data      |      none     |
|    id    |         ID of graph         |       0       |
|   width  |  Width of the graphing area |       1       |
|  height  | Height of the graphing area |       1       |
|   depth  |  Depth of the graphing area |       1       |

### Usage

Creating a 3D scatter plot is as easy as:

```html
<a-entity scatter="csv: yourData.csv;"></a-entity>
```

Of course, you can also manually define the dimensions of the graphing area.

### Multiple Graphs

If you want to display more than one plot, a unique numerical id must be specified.

```html
<a-entity scatter="csv: yourOtherData.csv; id: 1"></a-entity>
```

This limitation is due to the way data is plotted internally (using D3's "selectAll" method).

### Graph Size and Scaling

By default, scatter plots are displayed in a box with an edge length of 1 (i.e. the dimensions are 1x1x1). Data is scaled to fit within these bounds using linear scales provided by D3. The domain goes from the minimum value in the dataset to the maximum (internally this is done with D3's extent method).

The range is a bit more complicated. Before data is plotted, an "origin point" is appended to the graph box--it lies at the front-left vertex. Range for each axis is constructed with this point as the origin; for example, xy-values can range from 0 to 1 (spanning the entire front and vertical edges of the graph box). The z-axis is different as it ranges from 0 to -1 (larger z-values are further from the origin point pushing into the box). When width, height, or depth is modified the relevant range maximums are scaled up or down and the graph area is redrawn. The grid texture applied to each side of the graphing area is also adjusted to prevent horizontal or vertical stretching.

### Advanced Users

The purpose of this component is to enable basic scatter plot graphing and explore the uses of D3 in A-Frame. If you are an expert D3 user you are probably better off using D3 to manipulate A-Frame directly as you will have more control (e.g. parsing data and using transitions). Be aware that [not everything works 100%](http://codepen.io/bryik/pen/ONdyJR). 

Additionally, forking this project might get you part of the way or at least give you some ideas. Since it is built on the [A-Frame component boilerplate](https://github.com/ngokevin/aframe-component-boilerplate) the standard dev commands are available ("npm run dev" for a live server).

### UTF-8

Since D3 is a dependency, you'll need to set the charset to UTF-8 in the script tag.

```html
<script src="https://rawgit.com/bryik/aframe-graph-component/master/dist/aframe-graph-component.min.js" charset="utf-8"></script>
```

### References

The mobile phone accelerometer data used in the examples is from [Phil Pedruco](http://bl.ocks.org/phil-pedruco/9852362).

#### Browser Installation

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.2.0/aframe.min.js"></script>
  <script src="https://rawgit.com/bryik/aframe-scatter-component/master/dist/aframe-scatter-component.min.js" charset="utf-8"></script>
</head>

<body>
  <a-scene>
    <a-entity scatter="csv:myData.csv"></a-entity>
  </a-scene>
</body>
```
