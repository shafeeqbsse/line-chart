angular.module('n3-charts.linechart', [])

.factory('lineUtil', function() {
  var height,width,interMode = 'linear';
  return {
    getDefaultMargins: function() {
      return {top: 20, right: 50, bottom: 30, left: 50};
    },
    
    bootstrap: function(element, dimensions, lineMode) {
      d3.select(element).classed('linechart', true);
      
      width = dimensions.width;
      height = dimensions.height;

      if(lineMode && typeof lineMode === 'string'){
        interMode = lineMode;
      }
      
      width = width - dimensions.left - dimensions.right;
      height = height - dimensions.top - dimensions.bottom;
      
      var svg = d3.select(element).append('svg')
        .attr('width', width + dimensions.left + dimensions.right)
        .attr('height', height + dimensions.top + dimensions.bottom)
        .append('g')
          .attr('transform', 'translate(' + dimensions.left + ',' + dimensions.top + ')');
      
      return svg;
    },
    
    getTooltipTextWidth: function(text) {
      return Math.max(25, text.length*6.5);
    },
    
    getWidestOrdinate: function(data, series) {
      var widest = '';
      
      data.forEach(function(row) {
        series.forEach(function(series) {
          if (('' + row[series.y]).length > ('' + widest).length) {
            widest = row[series.y];
          }
        })
      })
      
      return widest;
    },
    
    getYTooltipPath: function(text) {
      var w = this.getTooltipTextWidth(text);
      var h = 18;
      var p = 5;
      
      return 'm0 0' +
        'l-' + p + ' -' + p + ' ' +
        'l0 -' + (h/2 - p) + ' ' +
        'l-' + w + ' 0 ' +
        'l0 ' + h + ' ' +
        'l' + w + ' 0 ' +
        'l0 -' + (h/2 - p) +
        'l-' + p + ' ' + p + 'z';
    },
    
    getXTooltipPath: function(text) {
      var w = this.getTooltipTextWidth(text);
      var h = 18;
      var p = 5;
      
      return 'm-' + w/2 + ' ' + p + ' ' +
        'l0 ' + h + ' ' +
        'l' + w + ' 0 ' +
        'l0 ' + '-' + h +
        'l-' + (w/2 - p) + ' 0 ' +
        'l-' + p + ' -' + h/4 + ' ' +
        'l-' + p + ' ' + h/4 + ' ' +
        'l-' + (w/2 - p) + ' 0z';
    },
    
    addAxes: function(svg, dimensions) {
      var width = dimensions.width;
      var height = dimensions.height;
      
      width = width - dimensions.left - dimensions.right;
      height = height - dimensions.top - dimensions.bottom;
      
      var x = d3.scale.linear().rangeRound([0, width]);
      var y = d3.scale.linear().rangeRound([height, 0]);
      
      var xAxis = d3.svg.axis().scale(x).orient('bottom');
      var yAxis = d3.svg.axis().scale(y).orient('left');
      
      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
      
      svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
      
      
      var w = 24;
      var h = 18;
      var p = 5;
      
      var xTooltip = svg.append('g')
        .attr({
          'id': 'xTooltip',
          'opacity': 0
        });
      
      xTooltip.append('path')
        .attr({
          'fill': 'grey',
          'transform': 'translate(0,' + (height + 1) + ')'
        });
      
      xTooltip.append('text')
        .style({
          'text-anchor': 'middle'
        })
        .attr({
          'width': w,
          'height': h,
          'font-family': 'monospace',
          'font-size': 10,
          'transform': 'translate(0,' + (height + 19) + ')',
          'fill': 'white',
          'text-rendering': 'geometric-precision'
        });
      
      var yTooltip = svg.append('g')
        .attr({
          'id': 'yTooltip',
          'opacity': 0
        });
      
      yTooltip.append('path')
        .attr('fill', 'grey');
      
      yTooltip.append('text')
        .style({
          // 'text-anchor': 'middle'
        })
        .attr({
          'width': h,
          'height': w,
          'font-family': 'monospace',
          'font-size': 10,
          'fill': 'white',
          'text-rendering': 'geometric-precision'
        })
        .text('28');
      
      return {
        xScale: x, yScale: y,
        xAxis: xAxis, yAxis: yAxis
      }
    },
    
    removeContent: function(svg) {
      svg.selectAll('.content').remove();
    },
    
    createContent: function(svg) {
      svg.append('g')
        .attr('class', 'content');
    },
    
    createLineDrawer: function(scales) {
      interMode = interMode || 'linear';
      return d3.svg.line()
        .x(function(d) {return scales.xScale(d.x);})
        .y(function(d) {return scales.yScale(d.value);})
        .interpolate(interMode);
    },

    createAreaDrawer:function(scales){
      interMode = interMode || 'linear';
      return d3.svg.area()
        .x(function(d) { return scales.xScale(d.x); })
        .y0(height)
        .y1(function(d) { return scales.yScale(d.value); })
        .interpolate(interMode);
    },
    
    drawLines: function(svg, drawer, data) {
      svg.select('.content').selectAll('.lineGroup')
        .data(data).enter().append('g')
          .style('stroke', function(serie) {return serie.color;})
          .attr('class', 'lineGroup')
          .append('path')
            .attr('class', 'line')
            .attr('d', function(d) {return drawer(d.values);});
    },

    drawArea: function(svg,drawer,data){
      svg.select('.content').selectAll('.area')
        .data(data).enter().append('g')
        .attr('class','areaGroup')
        .append("path")
          .datum(function(d){
            return d;
          })
        .style('fill', function(serie) {return serie.color;})
        .style('opacity', '0.1')
          .attr("class", "area")
          .attr("d",  function(d) {
            return drawer(d.values);
          });
    },
    
    drawDots: function(svg, data, scales) {
      var that = this;
      
      svg.select('.content').selectAll('.dotGroup')
        .data(data).enter().append('g')
          .attr('class', 'dotGroup')
          .attr('fill', function(s) {return s.color;})
          .on('mouseover', function(s) {
            var target = d3.select(d3.event.target);
            
            target.attr('r', 4);
            
            var textX = '' + target.datum().x;
            
            var xTooltip = d3.select("#xTooltip")
              .transition()
              .attr({
                'opacity': 1.0,
                'transform': 'translate(' + target.attr('cx') + ',0)'
              })
            xTooltip.select('text').text(textX)
            xTooltip.select('path')
              .attr('fill', s.color)
              .attr('d', that.getXTooltipPath(textX));
            
            var yTooltip = d3.select("#yTooltip")
              .transition()
              .attr({
                'opacity': 1.0,
                'transform': 'translate(0, ' + target.attr('cy') + ')'
              })
            
            var textY = '' + target.datum().value;
            
            var yTooltipText = yTooltip.select('text')
              .text(textY);
            
            yTooltipText.attr(
              'transform',
              'translate(-' + (that.getTooltipTextWidth(textY) + 2) + ',3)'
            );
            
            yTooltip.select('path')
              .attr('fill', s.color)
              .attr('d', that.getYTooltipPath(textY));
          })
          .on('mouseout', function(d) {
            d3.select(d3.event.target).attr('r', 2);
            
            d3.select("#xTooltip")
              .transition()
              .attr({
                'opacity': .0
              })
            
            d3.select("#yTooltip")
              .transition()
              .attr({
                'opacity': .0
              })
          })
          .selectAll('.dot').data(function(d) {return d.values;})
            .enter().append('circle')
            .attr({
              'class': 'dot',
              'r': 2,
              'cx': function(d) {return scales.xScale(d.x)},
              'cy': function(d) {return scales.yScale(d.value)}
            })
        
    },
    
    getLineData: function(data, options) {
      var series = options ? options.series : null;
      
      if (!series || !series.length || !data || !data.length) {
        return [];
      } 
      
      var lineData = [];
      
      series.forEach(function(s) {
        var seriesData = {name: s.y, values: [], color: s.color};
        
        data.forEach(function(row) {
          seriesData.values.push({x: row.x, value: row[s.y]})
        });
        
        lineData.push(seriesData);
      });
      
      return lineData;
    },
    
    setScalesDomain: function(scales, data, series, svg) {
      scales.xScale.domain(d3.extent(data, function(d) {return d.x;}));
      scales.yScale.domain(this.yExtent(series, data)).nice();
      
      svg.selectAll('.x.axis').call(scales.xAxis)
      svg.selectAll('.y.axis').call(scales.yAxis)
    },
    
    yExtent: function(series, data) {
      var minY = Number.POSITIVE_INFINITY;
      var maxY = Number.NEGATIVE_INFINITY;
      
      series.forEach(function(s) {
        minY = Math.min(minY, d3.min(data, function(d) {return d[s.y]}));
        maxY = Math.max(maxY, d3.max(data, function(d) {return d[s.y]}));
      });
      
      return [minY, maxY];
    }
  }
})

.directive('linechart', ['lineUtil', function(lineUtil) {
  var link  = function(scope, element, attrs, ctrl) {
    var dimensions = lineUtil.getDefaultMargins();
    dimensions.width = 900;
    dimensions.height = 500;
    
    scope.redraw = function() {
      var data = scope.data;
      var options = scope.options;
      
      
      var lineData = lineUtil.getLineData(data, options);
      
      var widest = lineUtil.getWidestOrdinate(
        data || [],
        options ? options.series : []
      );
      
      dimensions.left = lineUtil.getTooltipTextWidth('' + widest) + 20;
      
      d3.select(element[0]).select('svg').remove();
      
      var svg = lineUtil.bootstrap(element[0], dimensions, options.lineMode);
      var axes = lineUtil.addAxes(svg, dimensions);
      
      lineUtil.createContent(svg);
      
      var lineDrawer = lineUtil.createLineDrawer(axes);
      var areaDrawer = lineUtil.createAreaDrawer(axes);
      
      if (lineData.length > 0) {
        
        lineUtil.setScalesDomain(axes, data, options.series, svg);
        
        lineUtil.drawLines(svg, lineDrawer, lineData);
        
        if(options.showArea){
          lineUtil.drawArea(svg, areaDrawer, lineData);
        }
        
        lineUtil.drawDots(
          svg,
          lineData,
          axes,
          d3.select(element[0]).select('#tooltip')
        );
      }
    }
    
    scope.$watch('data + options', scope.redraw);
  };
  
  return {
    replace: true,
    restrict: 'E',
    scope: {data: '=', options: '='},
    template: '<div></div>',
    link: link
  };
}]);