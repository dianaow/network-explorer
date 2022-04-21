import React, { useState, useContext } from 'react';
import { Row, Col, Button, Modal, Form, Input, Typography, Tooltip, Select, DatePicker, Alert, Steps, Switch } from 'antd';
import { InfoCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import FileUpload from './FileUpload.jsx';
import { ModalContext } from "../contexts/ModalContext.jsx"
import test from "../../data/test.json"
import node_test from "../../data/nodes.json"
import got_nodes from "../../data/got_nodes.json"
import got_links from "../../data/got_links.json"

const { Step } = Steps;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const style = { padding: '0px 4px' };

const steps = [
  {
    title: 'Import Data',
  },
  {
    title: 'Styles',
  },
  {
    title: 'Filter Data',
  }
];

const colorPaletteList = {
  pop: ['#ffa822', '#134e6f', '#ff6150', '#1ac0c6', '#dee0e6'], 
  primary: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c'],
  space: ["#028FFC","#FE430E","#F68EEF","#BAA2FE","#FEFDA3","#F5C158"],
  tropical: ["#f76c5e", "#d510d0", "#0f7173", "#d3f38f", "#f49cbb"], 
  science: ["#0800FF", "#C900C8", "#5FE81B", "#FD3800", "#F04BB0"],
  antv: ['#5B8FF9', '#61DDAA', '#65789B', '#F6903D', '#F6BD16', '#78D3F8', '#9661BC', '#008685', '#F08BB4'],
}

const FormModal = (props) => {

  const [expand, setExpand] = useState(false)
  const [current, setCurrent] = useState(0);
  const [state, setState] = useState({ visible: false, data: {nodes: [], edges: []}, warning: false, counter: 0 })
  const { setModal } = useContext(ModalContext)
  const [form] = Form.useForm();
  const formRef = React.createRef();

  const showModal = () => {
    setState({
      ...state,
      visible: true
    });
  };

  const next = () => {
    const currentNew = current + 1;
    setCurrent(currentNew);
  }

  const prev = () => {
    const currentNew = current - 1;
    setCurrent(currentNew);
  }

  const onFinish = values => {

    let params = {
      host: values.HOST,
      user: values.USER,
      database: values.DATABASE,
      password: values.PASSWORD,
      port: values.PORT,
      entity: values.ENTITY,
      entities_col: values.SOURCE,
      date_range: values.DATE_RANGE,
      date_col: values.DATE,
      nodes_db_table: values.NODES_DB_TABLE,
      edges_db_table: values.EDGES_DB_TABLE
    }

    if(values.HOST & values.USER & values.DATABASE & values.PASSWORD & values.PORT){
      fetch("/data", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      .then(response => response.json())
      .then(data=> {
        dataProcessing(data)
      })
    }

    dataProcessing(state.data)

    function dataProcessing(data){

      const { nodes, edges } = data

      // edges data-processing
      let newEdges = []
      if(edges.length > 0){
        edges.forEach((d,i)=>{
          if(d[values.SOURCE] && d[values.TARGET]){
            newEdges.push({
              index: i,
              //id: d.EdgeID.toString(),
              source : d[values.SOURCE].toString(),
              target : d[values.TARGET].toString(),
              edgeWidth: d[values.EDGE_WIDTH] ? +d[values.EDGE_WIDTH] : 0,
              edgeColor: d[values.EDGE_COLOR] ? +d[values.EDGE_COLOR] : 0,
              tooltip_title: d[values.EDGE_TOOLTIP_TITLE] ? d[values.EDGE_TOOLTIP_TITLE] : "",
              tooltip_description: d[values.EDGE_TOOLTIP_DESCRIPTION] ? d[values.EDGE_TOOLTIP_DESCRIPTION] : "",
              epoch: Number.isInteger(d[values.DATE]) ? d[values.DATE] : new Date(d[values.DATE])
            })
          }
         })
      }

      // nodes data-processing
      let newNodes = []
      if(nodes.length > 0){
        nodes.forEach((d,i)=>{
          newNodes.push({
            index: i,
            id: d[values.ID].toString(),
            nodeRadius: d[values.NODE_RADIUS] ? +d[values.NODE_RADIUS] : 0,
            nodeColor: d[values.NODE_COLOR] ? d[values.NODE_COLOR] : 0,
            tooltip_title: d[values.NODE_TOOLTIP_TITLE] ? d[values.NODE_TOOLTIP_TITLE] : "",
            tooltip_description: d[values.NODE_TOOLTIP_DESCRIPTION] ? d[values.NODE_TOOLTIP_DESCRIPTION] : ""
          })
        }) 
      } 

      if((newNodes.length < 300 && newEdges.length < 300) | state.counter === 1){
        setModal({
          raw: {nodes: newNodes, edges: newEdges},
          ID: {column: values.ID, present: true},
          SOURCE: {column: values.SOURCE, present: true},
          TARGET: {column: values.TARGET, present: true},
          EDGE_WIDTH: {column: values.EDGE_WIDTH, present: findAttr(edges, values.EDGE_WIDTH)},
          EDGE_COLOR: {column: values.EDGE_COLOR, present: findAttr(edges, values.EDGE_COLOR)},
          NODE_RADIUS: {column: values.NODE_RADIUS, present: findAttr(nodes, values.NODE_RADIUS)},
          NODE_COLOR: {column: values.NODE_COLOR, present: findAttr(nodes, values.NODE_COLOR)},
          EDGE_TOOLTIP_TITLE: {column: values.EDGE_TOOLTIP_TITLE, present: findAttr(edges, values.EDGE_TOOLTIP_TITLE)},
          EDGE_TOOLTIP_DESCRIPTION: {column: values.EDGE_TOOLTIP_DESCRIPTION, present: findAttr(edges, values.EDGE_TOOLTIP_DESCRIPTION)},
          NODE_TOOLTIP_TITLE: {column: values.NODE_TOOLTIP_TITLE, present: findAttr(nodes, values.NODE_TOOLTIP_TITLE)},
          NODE_TOOLTIP_DESCRIPTION: {column: values.NODE_TOOLTIP_DESCRIPTION, present: findAttr(nodes, values.NODE_TOOLTIP_DESCRIPTION)},
          DATE: {column: values.DATE, present: findAttr(edges, values.DATE)},
          ENTITY: values.ENTITY ? values.ENTITY : "All",
          DEGREE: values.DEGREE ? values.DEGREE : "All",
          DATE_RANGE: values.DATE_RANGE ? values.DATE_RANGE : [],
          COLOR_PALETTE: colorPaletteList[values.COLOR_PALETTE],
          SHOW_NODE_LABEL: values.SHOW_NODE_LABEL,
          SHOW_EDGE_LABEL: values.SHOW_EDGE_LABEL,
          SHOW_EDGE_DIRECTION: values.SHOW_EDGE_DIRECTION,
          TIME_INTERVAL: values.TIME_INTERVAL
        })
        setState({
          ...state,
          visible: false,
          warning: false,
          counter: 0
        });
      } else {
        setState({
          ...state,
          visible: true,
          warning: true,
          counter: state.counter + 1
        });
      }
  
    }

  };

  function findAttr(data, col){
    return data.some(item=> item.hasOwnProperty(col))
  }

  const handleCancel = e => {
    setState({
      ...state,
      visible: false,
    });
  };

  const update = (data) => {
    setState({
      ...state,
      data: {nodes: data.nodes, edges: data.edges},
      visible: true
    })
  }

  const onFill_1 = () => {
    formRef.current.setFieldsValue({
      ID: 'id',
      SOURCE: 'original_user_id',
      TARGET: 'user_id',
      DATE: 'epoch',
      EDGE_WIDTH: 'duration',
      EDGE_COLOR: 'distance',
      NODE_COLOR: 'category',
      NODE_RADIUS: 'weight',
      COLOR_PALETTE: 'antv',
      EDGE_TOOLTIP_TITLE: 'created_at',
      EDGE_TOOLTIP_DESCRIPTION: 'full_text'
    });
    update({nodes: node_test, edges: test})
  };

  const onFill_2 = () => {
    formRef.current.setFieldsValue({
      SOURCE: 'source',
      TARGET: 'target'
    });
    update({nodes: got_nodes, edges: got_links})
  };

  return (
    <>
      <Form.Item>
        <Button default block onClick={showModal}>
          Import data
        </Button>
      </Form.Item>
      <Modal
        title="Load Graph"
        visible={state.visible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          id='myForm'
          ref={formRef} 
          form={form}
          layout='horizontal'
          name="form_in_modal"
          initialValues={{
            modifier: 'public',
          }}
          onFinish={onFinish}
        >
        <>
          <Steps current={current}>
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <div className="steps-content">
            { state.warning && 
              <Row>
               <Alert message="Warning" 
                 description="There is either more than 300 nodes or edges to load the graph with. You may still proceed with rendering the graph or filter the data to reduce the number of graph elements." 
                 type="warning" 
                 showIcon closable />
              </Row>
            }

            {/* <a
              style={{
                fontSize: 12,
                display: current === 0 ? 'block' : 'none'
              }}
              onClick={() => {
                setExpand(!expand);
              }}
            >
              {expand ? <UpOutlined /> : <DownOutlined />} 
              {expand ? " Hide" : "Connect to postgresql database"}
            </a>

            { expand && 
              <Row style={{display: current === 0 ? 'block' : 'none'}}> 
                <Row>
                  <Col span={6}>
                    <div style={style}>
                      <Form.Item name="USER" label="User">
                        <Input type="textarea"/>
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={18}>
                    <div style={style}>
                      <Form.Item name="HOST" label="Host">
                        <Input type="textarea"/>
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col span={8}>
                    <div style={style}>
                      <Form.Item name="DATABASE" label="database">
                        <Input type="textarea"/>
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={10}>
                    <div style={style}>
                      <Form.Item name="PASSWORD" label="password">
                        <Input type="textarea"/>
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={style}>
                      <Form.Item name="PORT" label="port">
                        <Input type="textarea"/>
                      </Form.Item>
                    </div>
                  </Col>
                </Row>                  
              </Row>
            } */}

              <Row style={{display: current === 0 ? 'block' : 'none'}}> 

                <Form.Item style={{'marginBottom': '2px'}}>
                  <Text strong underline>Load sample data & Fill form</Text>
                </Form.Item>

                <Form.Item>
                  <Button value="small" type="dashed" htmlType="button" onClick={onFill_1}>
                    Temporal: Tweets
                  </Button>
                  <Button value="small" type="dashed" htmlType="button" onClick={onFill_2}>
                    Non-temporal: Game of Thrones 
                  </Button>
                  <Button value="small" type="dashed" htmlType="button" onClick={onFill_2}>
                    Edges only: Les Miserables
                  </Button>
                </Form.Item>

                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="title"
                      label="Choose a CSV/JSON file (nodes and edges)"
                    >
                       <FileUpload updateData={(data) => update({nodes: data.nodes, edges: data.links})}/>
                    </Form.Item> 
                  </Col>
                </Row>

                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="title"
                      label="Choose a CSV/JSON file (only containing nodes)"
                    >
                      <FileUpload updateData={(data) => update({nodes: data, edges: state.data.edges})}/>
                    </Form.Item> 
                  </Col>
                  {/* <Col span={24}>
                    <div style={style}>
                    <Form.Item name="NODES_DB_TABLE" label="Database Table">
                      <Input type="textarea" />
                    </Form.Item>
                    </div>
                  </Col>     */}
                </Row>

                <Row>
                  <Col span={24}>
                    <Form.Item
                      name="title"
                      label="Choose a CSV/JSON file (only containing edges)"
                    >
                       <FileUpload updateData={(data) => update({nodes: state.data.nodes, edges: data})}/>
                    </Form.Item> 
                  </Col>
                  {/* <Col span={24}>
                    <div style={style}>
                    <Form.Item name="EDGES_DB_TABLE" label="Database Table">
                      <Input type="textarea" />
                    </Form.Item>
                    </div>
                  </Col> */}
                </Row>

                <Form.Item>
                  <Text strong underline>Column Mapping</Text>
                </Form.Item>
                <Row>
                  <Col span={12}>
                    <div style={style}>
                    <Form.Item name="ID" label="Entity ID">
                      <Input type="textarea" />
                    </Form.Item>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={style}>
                      <Form.Item name="DATE" label="Date">
                        <Input type="textarea" suffix={
                          <Tooltip title="Dates have to be in UNIX timestamps">
                            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                          </Tooltip>
                        }/>
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <div style={style}>
                      <Form.Item name="SOURCE" label="Source" rules={[
                        {
                          required: true,
                          message: 'Please select column for Source',
                        },
                      ]}>
                        <Input type="textarea" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={style}>
                    <Form.Item name="TARGET" label="Target" rules={[
                      {
                        required: true,
                        message: 'Please select column for Target',
                      },
                    ]}>
                      <Input type="textarea" />
                    </Form.Item>
                    </div>
                  </Col>
                </Row>

              </Row>
              
            <Row style={{display: current === 1 ? 'block' : 'none'}}> 
              <Form.Item>
                <Text strong underline>Styles</Text>
              </Form.Item>
              <Row>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="EDGE_WIDTH" label="Edge Width">
                      <Input type="textarea" suffix={
                        <Tooltip title="Only continuous values">
                          <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                        </Tooltip>
                      }/>
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="EDGE_COLOR" label="Edge Color">
                      <Input type="textarea" suffix={
                        <Tooltip title="Only continuous values">
                          <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                        </Tooltip>
                      }/>
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="NODE_RADIUS" label="Node Radius">
                      <Input type="textarea" suffix={
                        <Tooltip title="Only continuous values">
                          <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                        </Tooltip>
                      }/>
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="NODE_COLOR" label="Node Color">
                      <Input type="textarea" suffix={
                        <Tooltip title="Only categorical values">
                          <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                        </Tooltip>
                      }/>
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="SHOW_NODE_LABEL" label="Show Node Label">
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="SHOW_EDGE_LABEL" label="Show Edge Label">
                    <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="SHOW_EDGE_DIRECTION" label="Show Edge Direction">
                    <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={24}>
                  <div style={style}>
                    <Form.Item name="COLOR_PALETTE" label="Color Palette">
                      <Select placeholder="Choose colors to assign to nodes based on category">
                        {
                          Object.entries(colorPaletteList).map(([key, colors]) => {
                            return (<Option key={key} value={key}>{key} {colors.map(p => <span key={p} style={{width: 20, height: 20, backgroundColor: p, display: 'inline-block'}}></span>)}</Option>)
                          })
                        }
                      </Select>
                    </Form.Item>
                  </div>
                </Col>   
                {/* <Col span={10}>
                  <div style={style}>
                    <Form.Item name="BG_COLOR" label="Canvas Background color">
                    <Input type="textarea" />
                    </Form.Item>
                  </div>
                </Col>   */}
              </Row>

              <Form.Item>
                <Text strong underline>Edge Tooltip Content</Text>
              </Form.Item>
              <Row>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="EDGE_TOOLTIP_TITLE" label="Title">
                      <Input type="textarea" />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="EDGE_TOOLTIP_DESCRIPTION" label="Description">
                      <Input type="textarea" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Form.Item>
                <Text strong underline>Node Tooltip Content</Text>
              </Form.Item>
              <Row>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="NODE_TOOLTIP_TITLE" label="Title">
                      <Input type="textarea" />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={style}>
                    <Form.Item name="NODE_TOOLTIP_DESCRIPTION" label="Description">
                      <Input type="textarea" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              </Row>
             
              <Row style={{display: current === 2 ? 'block' : 'none'}}> 

                <Form.Item>
                    <Text strong underline>Timebar</Text>
                  </Form.Item>
                  <Row>
                    <Col span={12}>
                      <div style={style}>
                        <Form.Item name="TIME_INTERVAL" label="">
                          <Select placeholder="Time interval between dates">
                            {
                              ['minutes', 'hours', 'days', 'months', 'years'].map(d => {
                                return (<Option key={d} value={d}>{d}</Option>)
                              })
                            }
                          </Select>
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                  
                <Form.Item>
                  <Text strong underline>Search</Text>
                </Form.Item>
                <Row>
                  <Col span={12}>
                    <div style={style}>
                      <Form.Item name="ENTITY" label="Entity">
                        <Input placeholder="Search for an entity" />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={style}>
                      <Form.Item name="DEGREE" label="Degree">
                        <Select
                          placeholder="All"
                          disabled={form.device === 'All' ? true : false}
                        >  
                          <Option value={1}>1st Degree</Option>
                          <Option value={2}>2nd Degree</Option>
                          <Option value={3}>3rd Degree</Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <div style={style}>
                      <Form.Item name="DATE_RANGE" label="Date Range">
                        <RangePicker 
                          allowClear={false}
                          showTime
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
              </Row>
       
          </div>
          <div className="steps-action">
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" form="myForm" key="submit" htmlType="submit">
                Done
              </Button>
            )}
            {current > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={prev}>
                Previous
              </Button>
            )}
          </div>
        </>

        </Form>
      </Modal>
    </>
  );

};

export default FormModal