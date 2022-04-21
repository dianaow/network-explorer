import React, { useState, createContext } from "react"

export const initialState = {
  raw: {nodes: [], edges: []},
  ID: {column: "", present:true},
  SOURCE: {column: "", present:true},
  TARGET: {column: "", present:true},
  NODE_RADIUS: {column: "", present:false},
  NODE_COLOR: {column: "", present:false},
  EDGE_WIDTH: {column: "", present:false},
  EDGE_COLOR: {column: "", present:false},
  NODE_TOOLTIP_TITLE: {column: "", present:false},
  NODE_TOOLTIP_DESCRIPTION: {column: "", present:false},
  EDGE_TOOLTIP_TITLE: {column: "", present:false},
  EDGE_TOOLTIP_DESCRIPTION: {column: "", present:false},
  DATE: {column: "", present:false},
  ENTITY: "All",
  DEGREE: "All",
  TIME_INTERVAL: "hours",
  DATE_RANGE: [],
  BG_COLOR: 'light',
  SHOW_NODE_LABEL: false,
  SHOW_EDGE_LABEL: false,
  SHOW_EDGE_DIRECTION: false
}

export const ModalContext = createContext({
  modalState: initialState,
  setModal: () => null,
})

export function ModalProvider(props) {
  const [modalState, setModal] = useState(initialState)

  return (
    <ModalContext.Provider value={{ modalState, setModal }}>
      {props.children}
    </ModalContext.Provider>
  )
}

