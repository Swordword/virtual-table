import React, { useImperativeHandle, useRef, useState } from 'react'

import type { FormInstance, TableProps } from 'antd'
import { Form, Table } from 'antd'
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from 'react-window'
import ResizeObserver from 'rc-resize-observer'

export declare type CustomizeScrollBody<RecordType> = (
  data: readonly RecordType[],
  info: {
    scrollbarSize: number
    ref: React.Ref<{
      scrollLeft: number
    }>
    onScroll: (info: {
      currentTarget?: HTMLElement
      scrollLeft?: number
    }) => void
  }
) => React.ReactNode

interface VTableProps<T> extends TableProps<T> {
  height: number
  editFormRef: React.Ref<FormInstance>
  itemRender: () => React.ReactNode
}

// const VTableContext = React.createContext<CustomizeScrollBody<T>>({

// })

function VirtualTable<DataType extends Record<string, any>>(
  props: VTableProps<DataType>
) {
  const { columns, height = 900, editFormRef: propEditFormRef } = props

  const editFormRef = useRef<FormInstance>()

  useImperativeHandle(propEditFormRef, () => ({ ...editFormRef.current }))

  const [tableWidth, setTableWidth] = useState(1920)

  const defaultItemRender = () => {}

  const VCell = ({ columnIndex, rowIndex, style }) => {
    return (
      <div style={style}>
        {rowIndex} ,{columnIndex}
      </div>
    )
  }

  const FormWrapper = (children) => {
    return <Form ref={editFormRef}>{children}</Form>
  }

  const VTable: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
      <FormWrapper>
        {/* <VTableBody></VTableBody> */}
        {VTableBody(rawData, { onScroll, ref, scrollbarSize })}
      </FormWrapper>
    )
  }

  const VTableBody: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    console.log('scrollbarSize', scrollbarSize)
    return (
      <Grid
        columnCount={columns?.length ?? 0}
        columnWidth={(index) => {
          const { width } = columns[index]
          return index === columns!.length - 1
            ? width - scrollbarSize - 1
            : width
        }}
        rowHeight={() => 30}
        height={900}
        rowCount={rawData.length}
        width={tableWidth}
      >
        {VCell}
      </Grid>
    )
  }
  return (
    <ResizeObserver
      onResize={({ width }) => {
        setTableWidth(width)
      }}
    >
      <Table
        {...props}
        scroll={{
          x: 'max-content',
          y: height,
        }}
        rowKey='id'
        components={{
          body: VTable,
        }}
        pagination={false}
      />
    </ResizeObserver>
  )
}

export default VirtualTable
