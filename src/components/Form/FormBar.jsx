import React, {useState, useEffect, useContext} from 'react';
import { Form, Input, DatePicker, Select } from 'antd';
import FormModal from './FormModal.jsx';
import { ModalContext } from "../contexts/ModalContext.jsx"

import 'antd/dist/antd.css';
import './Form.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FormBar = (props) => {

  const { modalState } = useContext(ModalContext)
  const [form, setForm] = useState({dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE})
  const { updateGraph, reset } = props
  const formRef = React.createRef();

  useEffect(() => {
    if(reset){ 
      formRef.current.setFieldsValue({
        ENTITY: "",
        DEGREE: "All",
        DATE_RANGE: null
      });
    }
  }, [reset])

  useEffect(() => {
    updateGraph(form) 
    formRef.current.setFieldsValue({
      ENTITY: form.entity,
      DEGREE: form.degree,
      DATE_RANGE: form.dates
    });
  }, [form])
 
  useEffect(() => {
    setForm({dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE})
  }, [modalState])
   
  return (
      <Form layout='inline' ref={formRef}>
        <FormModal/>
        <Form.Item label="Entity" name="ENTITY">
          <Input placeholder="Search for an entity" onPressEnter={(e) => {
            setForm({...form, entity: e.target.value})
          }} />
        </Form.Item>
        <Form.Item label="Degree" name="DEGREE">
          <Select
            placeholder="All"
            disabled={(form.entity === 'All' | reset) ? true : false}
            onChange={(value) => {
              setForm({...form, degree: value})
            }}
          >  
            <Option value={1}>1st Degree</Option>
            <Option value={2}>2nd Degree</Option>
            <Option value={3}>3rd Degree</Option>
          </Select>
        </Form.Item>
        {modalState.DATE.present && 
          <Form.Item name="DATE_RANGE" label="Date Range">
            <RangePicker 
              allowClear={false}
              showTime
              onChange={(value) => {
                setForm({...form, dates: value})
              }} 
            />
          </Form.Item>
        }
      </Form>
  );
};

export default FormBar;