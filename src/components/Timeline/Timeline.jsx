
   
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import moment from 'moment';
import {getRange, getTicksGenerator, getFormat, getTime} from '../Shared/utils.jsx'
import { Collapse } from 'antd';

const { Panel } = Collapse;

export const brush = d3.brushX()

const Timeline = (props) => {

  const { data, timeInterval, findElementsToHighlight} = props

  const inputEl = useRef(null);

  // set the dimensions and margins of the graph
  const margin = {top: 10, right: 20, bottom: 20, left: 60},
      width = window.innerWidth - 40 - margin.left - margin.right,
      height = window.innerWidth > 1440 ? 160 : 150 - margin.top - margin.bottom;

  // set the ranges
  let x = d3.scaleTime()
            .range([0, width])

  let y = d3.scaleLinear()
            .range([height, 0]);
     
  brush.extent([[0, 0], [width, height]])

  useEffect(() => {

    let svg = d3.select(inputEl.current).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr('class', 'timeline')
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

    // text label for the x axis
    //svg.append("text")             
        //.attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
        //.style("text-anchor", "middle")
        //.text("Date");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Edges");      

    svg.append("g")
        .attr("class", "brush")
        //.call(brush.on("end", brushended));

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr('class', 'x-axis')

    // add the y Axis
    svg.append("g")
        .attr('class', 'y-axis')

  }, [])

  useEffect(() => {

    if(data.length>0){
      update_timeline(data)
    }

    d3.select('.brush')
      .call(brush.on("end", brushended));

  }, [data])

  function brushended() {
    
    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    const tickGenerator = getTicksGenerator(timeInterval)

    var d0 = d3.event.selection.map(x.invert),
        d1 = d0.map(tickGenerator.round);
  
    // If empty when rounded, use floor & ceil instead.
    if (d1[0] >= d1[1]) {
      d1[0] = tickGenerator.floor(d0[0]);
      d1[1] = tickGenerator.offset(d1[0]);
    }

    d3.select(this).transition().call(d3.event.target.move, d1.map(x));

    findElementsToHighlight(getRange(d1[0], d1[1], timeInterval))

  }

  function update_timeline(data) {

    const tickFormat = getFormat(timeInterval)
    const tickGenerator = getTicksGenerator(timeInterval)
 
    data.forEach(function(d) {
      d.dateString = getTime(d.epoch, timeInterval)
      d.date = moment(d.epoch).toDate()
    })

    let MAX = d3.max(data, d=>d.epoch)
    let MIN = d3.min(data, d=>d.epoch)
    MAX = moment(MAX).add(1, timeInterval)
    MIN = moment(MIN).subtract(1, timeInterval)
    const scaleTime =d3.scaleTime().domain([MIN, MAX])

    const ticks = scaleTime.ticks(tickGenerator.every(1))
    const ticks_formatted = ticks.map(d => getTime(d, timeInterval))

    let dataSum = d3.nest()
      .key(d=>d.dateString)
      .rollup(leaves => leaves.length)
      .entries(data)

    let timelineData = []
    ticks_formatted.forEach(d => {
      let tick_data = dataSum.find(el=>el.key === d)
      timelineData.push({
        //data: d,
        date : moment(d, tickFormat).toDate(),
        value : tick_data ? tick_data.value : 0
      })
    })

    // Scale the range of the data in the domains
    let datetimes = timelineData.map(function(d) { return d.date })
    x.domain(d3.extent(timelineData, d=>d.date));
    y.domain([0, d3.max(timelineData, function(d) { return d.value })]);

    // append the rectangles for the bar chart
    let svg = d3.select(inputEl.current).select(".timeline")
    let bars = svg.selectAll(".bar").data(timelineData)

    bars.exit().remove()

    bars = bars.enter().append("rect")
      .attr("class", "bar")
      .merge(bars)

    bars
      .attr('id', d => d.date)
      .attr("x", function(d) { 
        return x(d.date); 
      })
      .attr("width", width/datetimes.length)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr('fill', 'black')

    d3.select('.x-axis')
      .call(d3.axisBottom(x)
          .ticks(timeInterval === 'hours' ? tickGenerator.every(3) : tickGenerator.every(1))
          .tickPadding(0)
      )
      .call(g => g.select(".domain")
      .remove())
      
    d3.select('.y-axis')
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(0)
      )
      .call(g => g.select(".domain")
      .remove())
      .call(g => g.selectAll(".tick text").attr("x", 4))
  }

  return (
    <Collapse defaultActiveKey={['1']} ghost>
      <Panel header="Timeline" key="1">
        <div id="tweets-timeline" ref={inputEl}>
        </div>
      </Panel>
    </Collapse>
  );
};

export default Timeline;