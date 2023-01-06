import React, { useImperativeHandle, useRef, useState } from 'react'

import type { FormInstance, TableProps } from 'antd'
import { Form, Table } from 'antd'
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from 'react-window'
import ResizeObserver from 'rc-resize-observer'
import './virtual-table.css'

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

type RCProps = {
  children?: React.ReactNode
}

interface VTableProps<T> extends TableProps<T> {
  height: number
  editFormRef?: React.Ref<FormInstance>
  rowHeight?: number
  itemRender?: () => React.ReactNode
}

const VTableContext = React.createContext<CustomizeScrollBody<object>>({})

const DEFAULT_HEIGHT = 900
const DEFAULT_ROW_HEIGHT = 30

function VirtualTable<DataType extends Record<string, any>>(
  props: VTableProps<DataType>
) {
  const {
    columns,
    height = DEFAULT_HEIGHT,
    rowHeight = DEFAULT_ROW_HEIGHT,
    editFormRef: propEditFormRef,
  } = props

  const editFormRef = useRef<FormInstance>()

  if (propEditFormRef) {
    useImperativeHandle(propEditFormRef, () => ({ ...editFormRef.current }))
  }

  const [tableWidth, setTableWidth] = useState(1920)

  const defaultItemRender = () => {}

  const VCell = ({ columnIndex, rowIndex, style }) => {
    return (
      <div style={style}>
        {rowIndex} ,{columnIndex}
      </div>
    )
  }

  const FormWrapper = (props: RCProps) => {
    const { children, ...rest } = props
    return (
      <Form ref={editFormRef} {...rest}>
        {children}
      </Form>
    )
  }

  const VTableBody: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
      <Grid
        className='aaa'
        columnCount={columns?.length ?? 0}
        columnWidth={(index) => {
          const { width } = columns[index]
          return index === columns!.length - 1
            ? width - scrollbarSize - 1
            : width
        }}
        rowHeight={() => rowHeight}
        height={height}
        rowCount={rawData.length}
        width={tableWidth}
        onScroll={({ scrollLeft }) => {
          onScroll({
            scrollLeft,
          })
        }}
      >
        {VCell}
      </Grid>
    )
  }

  const VTable: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
      <ResizeObserver
        onResize={({ width }) => {
          console.log('setTableWidth', width)
          // setTableWidth(width)
        }}
      >
        <FormWrapper className='fff'>
          {VTableBody(rawData, { onScroll, ref, scrollbarSize })}
        </FormWrapper>
      </ResizeObserver>
    )
  }

  return (
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
  )
}

export default VirtualTable
