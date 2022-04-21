import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const Timeline = (props) => {

  const { data } = props

  const inputEl = useRef(null);

  var extent = d3.extent(data, d => d.value);
  
  var padding = 10;
  var width = 220;
  var innerWidth = width - (padding * 2);
  var barHeight = 8;
  var height = 50;

  var xScale = d3.scaleLinear()
      .range([0, innerWidth])
      .domain(extent);

  var xTicks = data.map(d => d.value);

  var xAxis = d3.axisBottom(xScale)
      .tickSize(barHeight * 2)
      .tickValues(xTicks);

  useEffect(() => {

    d3.select(inputEl.current).select('svg').remove()

    //if(data.length > 0){
      var svg =  d3.select(inputEl.current).append("svg").attr("width", width).attr("height", height);
      var g = svg.append("g").attr("transform", "translate(" + padding + "," +  padding + ")");

      var defs = svg.append("defs");
      var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
      linearGradient.selectAll("stop")
          .data(data)
        .enter().append("stop")
          .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
          .attr("stop-color", d => d.color);

      g.append("rect")
          .attr("width", innerWidth)
          .attr("height", barHeight)
          .style("fill", "url(#myGradient)");

      g.append("g")
          .attr("class", "svg-axis-y")
          .call(xAxis)
        .select(".domain").remove();

    //}

  }, [data])

  return (
    <div id="legend-edge-color" ref={inputEl}>
      <p style={{padding: '0px', margin: '0px'}}>{props.label}</p>
    </div>
  );
};

export default Timeline;