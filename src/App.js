Ext.define('CustomApp', {
  extend: 'Rally.app.App',
  componentCls: 'app',
  id: 'CustomD3App',
  listeners:
  {
    afterrender: function() {
      this.getData();
    }
  },

  getData: function() {

    Ext.create('Rally.data.lookback.SnapshotStore', {
        autoLoad: true,
        listeners: {
            load: function(store, data, success) {
                //process data
                //console.log('data', _.pluck(_.pluck(data, 'data'), '_ItemHierarchy'), success);
                this.transformData(data);
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
                value: 5154216954       // (Initiative)  I504 - Improved Story Splitting   // FIXME h/c initiative
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
  transformData: function(snapshots) {
    // Sort by Artifact Type:  Theme > Initiative > Story
    var sortedData = Ext.Array.sort(snapshots, function(v1, v2) {
      var l1 = v1.get('_ItemHierarchy').length;
      var l2 = v2.get('_ItemHierarchy').length;
      if (l1 > l2) { return 1; }
      if (l1 == l2) { return 0; }
      if (l1 < l2) { return -1; }
    });

    tree = {0:{name: null, children: {}}};

    _.each(_.pluck(sortedData, 'data'), function (data) {


      hierarchy = data._ItemHierarchy;
      name = data.Name;
      hl = hierarchy.length;
      current = hierarchy[hl - 1];
      if (hl === 2) {
        tree[0].children[current] = {name: name, children: {}};
      }
      else {
        parent = tree[0];
        for (var i = 1; i < hl - 1; i++) {
          item = hierarchy[i];
          parent = parent.children[item];
        }
        parent.children[current] = {name: name, children: {}};
      }
    });
    console.log("the completed tree: ", tree);



    // var tree = Ext.create('Ext.data.Tree', {});

    // var nodeInterface = Ext.create('Ext.data.NodeInterface', {});
    
    // root = nodeInterface.createNode({
    //   id: 'root',
    //   name: ''
    // });

    // tree.root = root;
    // Ext.Array.each(sortedData, function(data) {
    //   var parentId;
    //   if (data.get('_ItemHierarchy').length === 2) {   // top level artifact   // FIXME assuming 2nd level Initiative 
    //     parentId = 'root';
    //   } else {
    //     parentId = String(data.get('_ItemHierarchy')[data.get('_ItemHierarchy').length - 2]);
    //   }
    //   console.log('parent id', parentId);
    //   var parentNode = tree.root.getNodeById(parentId);

    //   console.log('parent node', parentNode, typeof parentNode);
    //   var node = {
    //     name: data.Name,
    //     id: data.ObjectID
    //     };

    //   parentNode.appendChild(node);
    //   console.log('parent node', parentNode);
    // });

    // console.log('tree store', treeStore);
/*
    Ext.Array.each(sortedData, function(data) {

    });
       var json = 
    [
    {
      "name": "Aromas",
      "children": [
      {
        "name": "Enzymatic",
        "children": [
        {
          "name": "Flowery",
          "children": [
          {
            "name": "Floral",
            "children": [
*/ 
    this.renderChart();
  },
  renderChart: function() {
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
      .on("mouseover", function(){d3.select(this).style("fill", "aliceblue");})
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


    var json = 
    [
    {
      "name": "Aromas",
      "children": [
      {
        "name": "Enzymatic",
        "children": [
        {
          "name": "Flowery",
          "children": [
          {
            "name": "Floral",
            "children": [
            {
              "name": "Coffee Blossom", "colour": "#f9f0ab"
            },
            {
              "name": "Tea Rose", "colour": "#e8e596"
            }
            ]
          },
          {
            "name": "Fragrant",
            "children": [
            {
              "name": "Cardamon Caraway", "colour": "#f0e2a3"
            },
            {
              "name": "Coriander Seeds", "colour": "#ede487"
            }
            ]
          }
          ]
        },
        {
          "name": "Fruity",
          "children": [
          {
            "name": "Citrus",
            "children": [
            {
              "name": "Lemon", "colour": "#efd580"
            },
            {
              "name": "Apple", "colour": "#f1cb82"
            }
            ]
          },
          {
            "name": "Berry-like",
            "children": [
            {
              "name": "Apricot", "colour": "#f1c298"
            },
            {
              "name": "Blackberry", "colour": "#e8b598"
            }
            ]
          }
          ]
        },
        {
          "name": "Herby",
          "children": [
          {
            "name": "Alliaceous",
            "children": [
            {
              "name": "Onion", "colour": "#d5dda1"
            },
            {
              "name": "Garlic", "colour": "#c9d2b5"
            }
            ]
          },
          {
            "name": "Leguminous",
            "children": [
            {
              "name": "Cucumber", "colour": "#aec1ad"
            },
            {
              "name": "Garden Peas", "colour": "#a7b8a8"
            }
            ]
          }
          ]
        }
        ]
      },
      {
        "name": "Sugar Browning",
        "children": [
        {
          "name": "Nutty",
          "children": [
          {
            "name": "Nut-like",
            "children": [
            {
              "name": "Roasted Peanuts", "colour": "#b49a3d"
            },
            {
              "name": "Walnuts", "colour": "#b28647"
            }
            ]
          },
          {
            "name": "Malt-like",
            "children": [
            {
              "name": "Balsamic Rice", "colour": "#a97d32"
            },
            {
              "name": "Toast", "colour": "#b68334"
            }
            ]
          }
          ]
        },
        {
          "name": "Carmelly",
          "children": [
          {
            "name": "Candy-like",
            "children": [
            {
              "name": "Roasted Hazelnut", "colour": "#d6a680"
            },
            {
              "name": "Roasted Almond", "colour": "#dfad70"
            }
            ]
          },
          {
            "name": "Syrup-like",
            "children": [
            {
              "name": "Honey", "colour": "#a2765d"
            },
            {
              "name": "Maple Syrup", "colour": "#9f6652"
            }
            ]
          }
          ]
        },
        {
          "name": "Chocolatey",
          "children": [
          {
            "name": "Chocolate-like",
            "children": [
            {
              "name": "Bakers", "colour": "#b9763f"
            },
            {
              "name": "Dark Chocolate", "colour": "#bf6e5d"
            }
            ]
          },
          {
            "name": "Vanilla-like",
            "children": [
            {
              "name": "Swiss", "colour": "#af643c"
            },
            {
              "name": "Butter", "colour": "#9b4c3f"
            }
            ]
          }
          ]
        }
        ]
      },
      {
        "name": "Dry Distillation",
        "children": [
        {
          "name": "Resinous",
          "children": [
          {
            "name": "Turpeny",
            "children": [
            {
              "name": "Piney", "colour": "#72659d"
            },
            {
              "name": "Blackcurrant-like", "colour": "#8a6e9e"
            }
            ]
          },
          {
            "name": "Medicinal",
            "children": [
            {
              "name": "Camphoric", "colour": "#8f5c85"
            },
            {
              "name": "Cineolic", "colour": "#934b8b"
            }
            ]
          }
          ]
        },
        {
          "name": "Spicy",
          "children": [
          {
            "name": "Warming",
            "children": [
            {
              "name": "Cedar", "colour": "#9d4e87"
            },
            {
              "name": "Pepper", "colour": "#92538c"
            }
            ]
          },
          {
            "name": "Pungent",
            "children": [
            {
              "name": "Clove", "colour": "#8b6397"
            },
            {
              "name": "Thyme", "colour": "#716084"
            }
            ]
          }
          ]
        },
        {
          "name": "Carbony",
          "children": [
          {
            "name": "Smokey",
            "children": [
            {
              "name": "Tarry", "colour": "#2e6093"
            },
            {
              "name": "Pipe Tobacco", "colour": "#3a5988"
            }
            ]
          },
          {
            "name": "Ashy",
            "children": [
            {
              "name": "Burnt", "colour": "#4a5072"
            },
            {
              "name": "Charred", "colour": "#393e64"
            }
            ]
          }
          ]
        }
        ]
      }
      ]
    },
    {
      "name": "Tastes",
      "children": [
      {
        "name": "Bitter",
        "children": [
        {
          "name": "Pungent",
          "children": [
          {
            "name": "Creosol", "colour": "#aaa1cc"
          },
          {
            "name": "Phenolic", "colour": "#e0b5c9"
          }
          ]
        },
        {
          "name": "Harsh",
          "children": [
          {
            "name": "Caustic", "colour": "#e098b0"
          },
          {
            "name": "Alkaline", "colour": "#ee82a2"
          }
          ]
        }
        ]
      },
      {
        "name": "Salt",
        "children": [
        {
          "name": "Sharp",
          "children": [
          {
            "name": "Astringent", "colour": "#ef91ac"
          },
          {
            "name": "Rough", "colour": "#eda994"
          }
          ]
        },
        {
          "name": "Bland",
          "children": [
          {
            "name": "Neutral", "colour": "#eeb798"
          },
          {
            "name": "Soft", "colour": "#ecc099"
          }
          ]
        }
        ]
      },
      {
        "name": "Sweet",
        "children": [
        {
          "name": "Mellow",
          "children": [
          {
            "name": "Delicate", "colour": "#f6d5aa"
          },
          {
            "name": "Mild", "colour": "#f0d48a"
          }
          ]
        },
        {
          "name": "Acidy",
          "children": [
          {
            "name": "Nippy", "colour": "#efd95f"
          },
          {
            "name": "Piquant", "colour": "#eee469"
          }
          ]
        }
        ]
      },
      {
        "name": "Sour",
        "children": [
        {
          "name": "Winey",
          "children": [
          {
            "name": "Tangy", "colour": "#dbdc7f"
          },
          {
            "name": "Tart", "colour": "#dfd961"
          }
          ]
        },
        {
          "name": "Soury",
          "children": [
          {
            "name": "Hard", "colour": "#ebe378"
          },
          {
            "name": "Acrid", "colour": "#f5e351"
          }
          ]
        }
        ]
      }
      ]
    }
    ];


    var nodes = partition.nodes({children: json});

    var path = vis.selectAll("path").data(nodes);

    path.enter().append("path")
      .attr("id", function(d, i) { return "path-" + i; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", colour)
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
        var multiline = (d.name || "").split(" ").length > 1,
        angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
        rotate = angle + (multiline ? -0.5 : 0);
        return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
      .on("click", click);

    textEnter.append("tspan")
      .attr("x", 0)
      .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
      textEnter.append("tspan")
      .attr("x", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });

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
          var multiline = (d.name || "").split(" ").length > 1;
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
      return d.colour || "#fff";
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
