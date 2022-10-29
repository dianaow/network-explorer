import React, {useState, useRef, useEffect, createRef, useContext} from 'react';
import Graphin, { Behaviors } from '@antv/graphin';
import { Toolbar, Legend, Tooltip } from '@antv/graphin-components';
import { ZoomOutOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import * as d3 from 'd3';

import '@antv/graphin/dist/index.css'; 
import '@antv/graphin-components/dist/index.css'; 

import "./App.css"

import Timeline, {brush} from './components/Timeline/Timeline.jsx';
import FormBar from './components/Form/FormBar.jsx';
import LandingPage from './components/Shared/LandingPage.jsx'
//import Legend from './components/Shared/Legend.jsx'
import LegendSVG from './components/Shared/LegendSVG.jsx'
import { findDegree, filterDataFromForm, filterByDevices, onlyUnique, getTime } from './components/Shared/utils.jsx'
import { ModalContext } from "./components/contexts/ModalContext.jsx"

const { ZoomCanvas } = Behaviors;

const App = () => { 
  
  const { modalState } = useContext(ModalContext)
  const [filters, setFilters] = useState({timeInterval: 'hours', dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE, reset: false}) // form values
  const [highlight, setHighlight] = useState({brushedDates: []}) // dates selected upon brushing
  const [selected, setSelected] = useState([]) // clicked node

  const [data, setData] = useState({
    filteredData: [],
    graphData:{nodes: [], edges:[]}, 
    degreeData: [], 
    accessors: {widthAccessor: () => 2, strokeAccessor: () => 'dimgray'},
    legendOptions: {node_color: [], edge_color: []},
  }) // graph is re-rendered each time setData is executed

  const graphinRef = createRef(null);
  const prevFilterRef = useRef();
  const prevModalRef = useRef();

  let { raw, DATE, NODE_COLOR, NODE_RADIUS, EDGE_COLOR, EDGE_WIDTH, COLOR_PALETTE, EDGE_TOOLTIP_TITLE, EDGE_TOOLTIP_DESCRIPTION, SHOW_NODE_LABEL, SHOW_EDGE_LABEL, SHOW_EDGE_DIRECTION} = modalState
  const { nodes, edges } = raw
  const { filteredData, graphData, degreeData, accessors, legendOptions } = data
  const { widthAccessor, strokeAccessor, colorAccessor } = accessors

  // helper function to reset graph to original state and style
  const clearAllStats = () => {
    
    const { graph } = graphinRef.current;

    graph.setAutoPaint(false);
    graph.getNodes().forEach(function(node) {
      let D = node._cfg.model.data
      graph.updateItem(node, {style : {keyshape: { stroke: colorAccessor(D.nodeColor), fill: colorAccessor(D.nodeColor) }}})
    });
    graph.getEdges().forEach(function(edge) {
      let D = edge._cfg.model.data
      graph.updateItem(edge, {style : {keyshape: { 
        stroke: strokeAccessor(D.content.edgeColor['value']), 
        lineWidth: widthAccessor(D.content.edgeWidth['value']),
        endArrow: {
          path: SHOW_EDGE_DIRECTION ? 'M 0,0 L 8,4 L 8,-4 Z' : ''
        },
      }}})
    });
    graph.paint();
    graph.setAutoPaint(true);

  };

  // render graph after data upload
  useEffect(() => {
    if(edges.length > 0 && prevFilterRef.current !== filters && prevModalRef.current !== modalState){
      console.log('graph re-render')
      let widthAccessor, strokeAccessor, radiusAccessor, colorAccessor 
      let edge_width_DataArr = edges.map(d=>d.edgeWidth)
      let edge_color_DataArr = edges.map(d=>d.edgeColor)
      let node_radius_DataArr = nodes.map(d=>d.nodeRadius)
      let node_color_DataArr = nodes.map(d=>d.nodeColor)

      if(EDGE_WIDTH.present && !edge_width_DataArr.some(isNaN)){
        let widthScale = d3.scaleLinear()
          .domain([0, d3.max(edges, d=>d.edgeWidth)])
          .range([2, 20])
 
        widthAccessor = (d) => widthScale(d)

      } else {
        widthAccessor = (d) => 2
      }
 
      let legend_edge_color = []
      if(EDGE_COLOR.present && !edge_color_DataArr.some(isNaN)){
        let arr = [0, d3.max(edges, d=>d.edgeColor)]
        let strokeScale = d3.scaleLinear()
          .domain(arr)
          .range(["#f5f5f5", "#696969"])

        const start = 0, stop = d3.max(edges, d=>d.edgeColor), step = 10;
        const array = [];
        for (let i = 0, n = Math.ceil((stop - start) / step); i < n; ++i) {
          array.push(start + i * step);
        }

        array.forEach((d,i) => {
           legend_edge_color.push({
             label: d,
             value: d,
             color: strokeScale(d)
           })
        })

        strokeAccessor = (d) => strokeScale(d)
      } else {
        strokeAccessor = (d) => 'dimgray'
      }

      if(NODE_RADIUS.present && !node_radius_DataArr.some(isNaN)){
        let radiusScale = d3.scaleLinear()
          .domain([0, d3.max(nodes, d=>d.nodeRadius)])
          .range([10, 100])

        radiusAccessor = (d) => radiusScale(d)
        
      } else {
        radiusAccessor = (d) => 20
      }

      let colorScale = d3.scaleOrdinal()
      if(NODE_COLOR.present){
        let categories = nodes.map(d=>d.nodeColor).filter(onlyUnique)

        // sort categories by decreasing value count so that primary colors get displayed first
        let categoriesStats = d3.nest()
          .key(d => d.nodeColor)
          .rollup()
          .entries(nodes)
        let sortBy = categoriesStats.map(d=>d.key)

        categories = categories.sort((a,b) => sortBy.indexOf(a) - sortBy.indexOf(b))

        colorScale
          .domain(categories)
          .range(COLOR_PALETTE || ['#5B8FF9', '#61DDAA', '#65789B', '#F6903D', '#F6BD16', '#78D3F8', '#9661BC', '#008685', '#F08BB4'])

        colorAccessor = (d) => colorScale(d)
      } else {

        colorScale
          .domain(['parent', 'child'])
          .range(COLOR_PALETTE || ['#5B8FF9', '#61DDAA'])

        colorAccessor = (d) => colorScale(d)
      }

      let legend_node_color = []
      colorScale.domain().forEach((d,i) => {
         legend_node_color.push({
           label: d,
           value: d,
           color: colorScale(d)
         })
      })

      let legendOptions = {node_color: legend_node_color, edge_color: legend_edge_color, node_color_label: NODE_COLOR.column, edge_color_label: EDGE_COLOR.column}
      let accessors = {widthAccessor, strokeAccessor, radiusAccessor, colorAccessor}
      let degreeData = findDegree(edges)
      
      let newEdges = filterDataFromForm(edges, filters)
      let graphData = transformDataToGraph({nodes, edges: newEdges}, degreeData, accessors)
      setData({...data, filteredData: newEdges, graphData, degreeData, accessors, legendOptions}) // graph loads on initial render
      //setFilters({dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE, reset: false})

      const { graph } = graphinRef.current;
      graph.on("node:click", (e) => { setSelected(e.item._cfg.id) });
      graph.render();

      prevFilterRef.current = filters 
      prevModalRef.current = modalState 
    }

  }, [modalState, filters]);

  // modify graph element style through timeline bar chart brushing event
  useEffect(() => {

    const { nodes, edges } = data.graphData // current graph state (taking into account filters, if any)
    let dataNodes = nodes
    let dataEdges = edges

    if(highlight.brushedDates.length > 0){

      const { graph } = graphinRef.current;
      //graph.on("node:mouseenter", null);
  
      // identify list of nodes and edges to highlight based on selected datetime range
      // highlight target device nodes which source device has sessions with + session edges within the filtered time frame
      dataEdges = dataEdges.filter(d=>highlight.brushedDates.indexOf(getTime(d.data.date, modalState.TIME_INTERVAL || 'hours')) !== -1)
      let edgeIds = dataEdges.map(d=>d.id)
      let start_edgeIds = dataEdges.map(d=>d.id.split('-')[0])
      let end_edgeIds = dataEdges.map(d=>d.id.split('-')[1])
      dataNodes = dataNodes.filter(d=>start_edgeIds.indexOf(d.id) !== -1 | end_edgeIds.indexOf(d.id) !== -1)
      let nodeIds = dataNodes.map(d=>d.id)

      graph.getNodes().forEach(function(node) {
        graph.updateItem(node, {style : {keyshape: {stroke: 'lightgray', fill: 'lightgray'}}})
      });
 
      nodeIds.forEach(function(node) {
        graph.updateItem(node, {style : {keyshape: {
          stroke: '#5B8FF9', 
          fill: '#5B8FF9',
        }}})
      });

      graph.getEdges().forEach(function(edge) {
        graph.updateItem(edge, {style : {keyshape: {stroke: 'lightgray'}}})
      });
      
      edgeIds.forEach(function(edge) {
        let D = dataEdges.find(d=>d.id === edge).data
        graph.updateItem(edge, {style : {keyshape: { 
          stroke: '#5B8FF9', 
          lineWidth: widthAccessor(D.content.edgeWidth['value']),
          endArrow: {
            path: SHOW_EDGE_DIRECTION ? 'M 0,0 L 8,4 L 8,-4 Z' : ''
          },
        }}})
        //graph.updateItem(edge, {style : {keyshape: { stroke: '#5B8FF9', lineWidth: 2 }}})
      });

      graph.paint();
      graph.setAutoPaint(true);

    }  

  }, [highlight.brushedDates, modalState.timeInterval]);

  // modify graph by showing/hiding connected nodes to clicked node (taking into account filtered time submitted by form, if any)
  useEffect(() => {
    if(selected.length === 0) return
    const { graph } = graphinRef.current;

    let newData = filterByDevices([selected], edges, filters.dates) 
    let expandData = transformDataToGraph({nodes, edges:newData}, degreeData, accessors)

    // remove nodes and edges that already exist on graph
    let existingNodeIds = graph.getNodes().map(d=>d._cfg.id)
    let existingEdgeIds = graph.getEdges().map(d=>d._cfg.model.data.index)
    let expandNodes = expandData.nodes.filter(d=>{
      return existingNodeIds.indexOf(d.id) === -1
    })
    let expandEdges = expandData.edges.filter(d=>{
      return existingEdgeIds.indexOf(d.data.index) === -1
    })

    if(expandNodes.length > 0 | expandEdges.length > 0){
      setData({
        ...data,
        graphData: {
          nodes: [...data.graphData.nodes, ...expandNodes],
          edges: [...data.graphData.edges, ...expandEdges],
        },
      });
    }

  
  }, [selected])

  // set new date range based on brush
  const findElementsToHighlight = (dates) => {
    setHighlight({brushedDates: dates})
  }

  // set new filters based on form values
  const updateGraph = (form) => {

    const { entity, dates, degree } = form
    setFilters({
      ...filters, entity, degree, dates: dates.length > 0 ? [dates[0], dates[1]] : [], reset: false
    })
  
    d3.selectAll('.brush').call(brush.move, null) // remove brush each time form values change

  }

  function transformDataToGraph(data, degreeData, accessors) {

    const {widthAccessor, strokeAccessor, radiusAccessor, colorAccessor} = accessors

    let ids_1 = data.edges.map(d=>d.source)
    let ids_2 = data.edges.map(d=>d.target)
    let nodeIDs = ids_1.concat(ids_2).filter(onlyUnique)
 
    // only filter for entities present in edges
    let nodes = []
    if(data.nodes.length > 0){
      let filteredNodes = data.nodes.filter(d=>nodeIDs.indexOf(d.id) !== -1)
      filteredNodes.forEach((d,i) => {
        if(d){
          let degree = degreeData.find(el=>el.key === d.id.toString()) ? degreeData.find(el=>el.key === d.id.toString()).value : 0
          let type =  degree === 1 ? 'child' : 'parent'
          nodes.push({
            id : d.id.toString(),
            data: {
              type: NODE_COLOR.present ? d.nodeColor : type,
              nodeColor: d.nodeColor
            },
            style : {
              keyshape: {
                size: radiusAccessor(d.nodeRadius),
                stroke: NODE_COLOR.present ? colorAccessor(d.nodeColor) : colorAccessor(type),
                fill: NODE_COLOR.present ? colorAccessor(d.nodeColor) : colorAccessor(type),
                fillOpacity: 0.8,
              },
              label: {
                visible: SHOW_NODE_LABEL ? true: false,
                value: d.id,
              },
            }
          })
        }
      })
    } else {

      nodeIDs.forEach((d,i) => {
        if(d){
          let degree = degreeData.find(el=>el.key === d.toString()) ? degreeData.find(el=>el.key === d.toString()).value : 0
          let type =  degree === 1 ? 'child' : 'parent'
          nodes.push({
            id : d.toString(),
            data: {
              type: type,
            },
            style : {
              keyshape: {
                size: radiusAccessor(),
                stroke: colorAccessor(type),
                fill: colorAccessor(type),
                fillOpacity: 0.8,
              },
              label: {
                visible: SHOW_NODE_LABEL ? true: false,
                value: d,
              },
            }
          })
        }
      })     
    }

    let edges = []
    data.edges.forEach((d,i) => {
      //if(d.source.toString() ===  d.target.toString()) return
      edges.push({
        id : d.source + '-' + d.target + '-' + i,
        source : d.source.toString(),
        target : d.target.toString(),
        data : {
          index: d.index, 
          date: d.epoch, 
          content: {
            title: EDGE_TOOLTIP_TITLE.present ? d.tooltip_title : d.index, 
            description: {label: EDGE_TOOLTIP_DESCRIPTION.present ? EDGE_TOOLTIP_DESCRIPTION.column : null, value: d.tooltip_description},
            edgeColor: {label: EDGE_COLOR.present ? EDGE_COLOR.column : null, value: d.edgeColor},
            edgeWidth: {label: EDGE_WIDTH.present ? EDGE_WIDTH.column : null, value: d.edgeWidth}
          }
        },
        style: {
          keyshape: {
            stroke: strokeAccessor(d.edgeColor),
            lineWidth: widthAccessor(d.edgeWidth),
            endArrow: {
              path: SHOW_EDGE_DIRECTION ? 'M 0,0 L 8,4 L 8,-4 Z' : ''
            },
          },
          label: {
            visible: SHOW_EDGE_LABEL ? true: false,
            value: SHOW_EDGE_LABEL ? d.index: "",
          },
        },
        
      })
    })

    return { nodes, edges }

  }

const handleClick = (graphinContext, config) => {
  const { apis } = graphinContext;
  const { handleZoomIn, handleZoomOut } = apis;
  if (config.key === 'zoomIn') {
    handleZoomIn();
  } else if (config.key === 'zoomOut') {
    handleZoomOut();
  }
};

  // modify toolbar
  const options = [
    {
      key: 'zoomOut',
      name: <ZoomOutOutlined />
    },
    {
      key: 'zoomIn',
      name: <ZoomInOutlined />,
    }
  ];

  return (
    <div className="App">
      { edges.length === 0 &&  <LandingPage/> }    
      { edges.length > 0 &&  
      <div id="form-bar">
        <Button type="link" onClick={clearAllStats}>
          Reset
        </Button>
        <div style={{float: 'left'}}>
          <FormBar updateGraph={updateGraph} reset={filters.reset}/> 
        </div>
      </div>
      }
        <Graphin 
          data={graphData}
          layout={{
            type:'gForce',
            gpuEnabled: true,
            preventOverlap: true,
            linkCenter: true
          }}
          ref={graphinRef}
        >
        < ZoomCanvas enableOptimize /> 
        <Tooltip bindType="node" placement={"top"} hasArrow={"yes"} style={{"background":"#fff", "width":"200px"}}>
          <Tooltip.Node>
            {model => {
              return (
                <div>
                  {model.id}
                </div>
              );
            }}
          </Tooltip.Node>
        </Tooltip>
        <Tooltip bindType="edge" placement={"top"} hasArrow={"yes"} style={{"background":"#fff", "width":"200px"}}>
          <Tooltip.Edge>
            {model => {
              let content = model.data.content  
              return (
                <div>
                  <h3>{content.title}</h3>
                  {
                    content.edgeColor.label && <p><span className='label'>{content.edgeColor.label}: </span>{content.edgeColor.value}</p>               
                  }
                  {
                    content.edgeWidth.label && <p><span className='label'>{content.edgeWidth.label}: </span>{content.edgeWidth.value}</p>
                  }
                  {
                    content.description.label && <p>{content.description.value}</p>
                  }
                </div>
              );
            }}
          </Tooltip.Edge>
        </Tooltip>
        { (edges.length > 0 && legendOptions.edge_color.length > 0) && <LegendSVG data={legendOptions.edge_color} label={legendOptions.edge_color_label}/> }
        <Legend bindType="node" sortKey="data.type" colorKey="style.keyshape.stroke">
          <Legend.Node />
        </Legend>
        { edges.length > 0 && <Toolbar options={options} onChange={handleClick} direction={'horizontal'}/> } 
      </Graphin>
      { (edges.length > 0 && DATE.present) && <Timeline data={filteredData} timeInterval={modalState.TIME_INTERVAL || 'hours'} findElementsToHighlight={findElementsToHighlight}/> }
    </div>
  );

};


export default App;