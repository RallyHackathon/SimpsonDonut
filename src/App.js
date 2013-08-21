Ext.define('CustomApp', {
  extend: 'Rally.app.App',
  componentCls: 'app',
  id: 'CustomD3App',
  listeners:
  {
    afterrender: function() {
      this.artifactSelection();
      //this.getData();
    }
  },

  
  artifactSelection: function () {
    comboBox = Ext.create('Rally.ui.combobox.ComboBox', {
      storeConfig: {
        autoLoad: true,
        model: 'PortfolioItem',
        fetch: ['FormattedID', 'Name', 'PortfolioItemType,Ordinal'],
        sorters: [{
            sorterFn: function(v1, v2) {
              console.log(v1, v2);
              o1 = v1.data.PortfolioItemType.Ordinal;
              o2 = v2.data.PortfolioItemType.Ordinal;
              console.log(o1, o2);
              if (o1 > o2) {return -1;}
              if (o1 == o2) {return 0;}
              if (o1 < o2) {return 1;}
            }

        }]
      },
      displayField: 'FormattedID',
      listeners: {
        select: function(combo, records) {
          console.log(records);
        }
      }
    });
    this.add(comboBox);
  },

  getData: function() {

    Ext.create('Rally.data.lookback.SnapshotStore', {
        autoLoad: true,
        listeners: {
            load: function(store, data, success) {
                //process data
                //console.log('data', _.pluck(_.pluck(data, 'data'), '_ItemHierarchy'), success);
                this.transformDataToTree(data);
            },
            scope: this
        },
        fetch: ['Name', 'ObjectID', '_TypeHierarchy', '_ItemHierarchy'],
        filters: [
            {
                property: '__At',
                value: 'current'
            },
            {
                property: '_ItemHierarchy',
                operator: '=',
                value: 11241019501 // Susan's Roadmap
                //value: 5154216954       // (Initiative)  I504 - Improved Story Splitting   // FIXME h/c initiative
                //value: 4930994830     //     (Theme)  TH190 - SaaS Scalability
            },
            {
                property: '_TypeHierarchy',
                operator: 'in',
                value: ['PortfolioItem', 'HierarchicalRequirement']
            },
        ]
    });

  },
  transformDataToTree: function(snapshots) {
    // Sort by Artifact Type:  Theme > Initiative > Story
    var sortedData = Ext.Array.sort(snapshots, function(v1, v2) {
      var l1 = v1.get('_ItemHierarchy').length;
      var l2 = v2.get('_ItemHierarchy').length;
      if (l1 > l2) { return 1; }
      if (l1 == l2) { return 0; }
      if (l1 < l2) { return -1; }
    });


    var leaf_depth = _.last(sortedData).data._ItemHierarchy.length;
    console.log(leaf_depth);

    var tree = {0:{"name": null, "children": []}};

    _.each(_.pluck(sortedData, 'data'), function (data) {


      var hierarchy = data._ItemHierarchy;
      var name = data.Name;
      var hl = hierarchy.length;
      var current = hierarchy[hl - 1];
      if (hl === 2) {
        tree[0]["children"].push({"name": name, "data": String(current), "children": []});
      }
      else {
        var parent = tree[0];
        for (var i = 1; i < hl - 1; i++) {
            for (var j in parent["children"]) {
                var child = parent["children"][j];
                if (child["data"] == String(hierarchy[i])) {
                    parent = child;
                    break;
                }
            }
        }
        if (hl == leaf_depth) {
            parent["children"].push({"name": name, "data": String(current), "colour": "#388E8E"});
        }
        else {
            parent["children"].push({"name": name, "data": String(current), "children": []})
        }
      }
    });
    console.log(tree);
    this.renderChart(tree[0]["children"]);
    //this.treeToJSON(tree);
  },

  
  renderChart: function(json) {
    var width = 600,
    height = width,
    radius = width / 2,
    x = d3.scale.linear().range([0, 2 * Math.PI]),
    y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, radius]),
    padding = 5,
    duration = 1000;



    var div = d3.select("#CustomD3App");

    minimap = div.append("svg")
      .attr("width", 50)
      .attr("height", 50);

    minimap.append("circle")
      .style("stroke", "gray")
      .style("fill", "white")
      .attr("r", 10)
      .attr("cx", 30)
      .attr("cy", 30)
      .on("mouseover", function(){d3.select(this).style("fill", "black");})
      .on("mouseout", function(){d3.select(this).style("fill", "white");});


    div.select("img").remove();

    var vis = div.append("svg")
      .attr("width", width + padding * 2)
      .attr("height", height + padding * 2)
      .append("g")
      .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");


    var partition = d3.layout.partition()
      .sort(null)
      .value(function(d) { return 5.8 - d.depth; });

    var arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
      .innerRadius(function(d) { return Math.max(0, d.y ? y(d.y) : d.y); })
      .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    var nodes = partition.nodes({children: json});

    var path = vis.selectAll("path").data(nodes);

    path.enter().append("path")
      .attr("id", function(d, i) { return "path-" + i; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", colour)
      .style("stroke", "#fff")
      .on("click", click);

    var text = vis.selectAll("text").data(nodes);

    var textEnter = text.enter().append("text")
      .style("fill-opacity", 1)
      .style("fill", function(d) {
        return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
      })
      .attr("text-anchor", function(d) {
        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
      })
      .attr("dy", ".2em")
      .attr("transform", function(d) {
        var multiline = (d.data || "").split(" ").length > 1, //used to be d.name
        angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
        rotate = angle + (multiline ? -0.5 : 0);
        return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
      .on("click", click);

    textEnter.append("tspan")
      .attr("x", 0)
      .text(function(d) { return d.depth ? d.data.split(" ")[0] : ""; }); //used to be d.name
    textEnter.append("tspan")
      .attr("x", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.depth ? d.data.split(" ")[1] || "" : ""; }); //used to be d.name

    function click(d) {
      path.transition()
        .duration(duration)
        .attrTween("d", arcTween(d));

    // Somewhat of a hack as we rely on arcTween updating the scales.
      text.style("visibility", function(e) {
          return isParentOf(d, e) ? null : d3.select(this).style("visibility");
        })
        .transition()
        .duration(duration)
        .attrTween("text-anchor", function(d) {
          return function() {
            return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
          };
        })
        .attrTween("transform", function(d) {
          var multiline = (d.data || "").split(" ").length > 1; //used to be d.name
          return function() {
            var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
            rotate = angle + (multiline ? -0.5 : 0);
            return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
          };
        })
        .style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
        .each("end", function(e) {
          d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
        });
    }

    function isParentOf(p, c) {
      if (p === c) return true;
      if (p.children) {
        return p.children.some(function(d) {
          return isParentOf(d, c);
        });
      }
      return false;
    }

    function colour(d) {
      if (d.children) {
        // There is a maximum of two children!
        var colours = d.children.map(colour),
        a = d3.hsl(colours[0]),
        b = d3.hsl(colours[1]);
        // L*a*b* might be better here...
        return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
      }
      return d.colour || "#FF0000";
    }

// Interpolate the scales!
    function arcTween(d) {
      var my = maxY(d),
      xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, my]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
      return function(d) {
        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
      };
    }

    function maxY(d) {
      return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
    }

    function brightness(rgb) {
      return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
    }
  }
});
