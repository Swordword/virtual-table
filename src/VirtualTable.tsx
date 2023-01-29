import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { FormInstance, TableProps } from 'antd'
import { Form, Table } from 'antd'
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from 'react-window'
import ResizeObserver from 'rc-resize-observer'
import './virtual-table.css'
import { isNumber } from 'lodash'

type RCProps = {
  children?: React.ReactNode
}

type CustomizeScrollBodyRawData<RecordType> = readonly RecordType[]

type CustomizeScrollBodyInfo = {
  scrollbarSize: number
  ref: React.Ref<{
    scrollLeft: number
  }>
  onScroll: (info: { currentTarget?: HTMLElement; scrollLeft?: number }) => void
}

type CustomizeScrollBodyContext<RecordType> = {
  data: CustomizeScrollBodyRawData<RecordType>
  info: CustomizeScrollBodyInfo
}

export declare type CustomizeScrollBody<RecordType> = (
  rawData: CustomizeScrollBodyRawData<RecordType>,
  info: CustomizeScrollBodyInfo
) => React.ReactNode

interface VTableProps<T> extends TableProps<T> {
  /** 编辑 formRef */
  editFormRef?: React.Ref<FormInstance>
  rowHeight?: number
  itemRender?: () => React.ReactNode
  extendRender?: () => React.ReactNode
  scroll: {
    x?: number | true | string;
    y: number
  }
}

const VTableContext = React.createContext<CustomizeScrollBodyContext<object>>(
  {} as CustomizeScrollBodyContext<object>
)

const DEFAULT_ROW_HEIGHT = 30

function VirtualTable<DataType extends Record<string, any>>(
  props: VTableProps<DataType>
) {
  const {
    columns,
    scroll,
    rowHeight = DEFAULT_ROW_HEIGHT,
    editFormRef: propEditFormRef,
    ...rest
  } = props

  useEffect(() => {
    if (!scroll.y || !isNumber(scroll.y)) {
      console.error('scroll.y need provided and scroll.y need to be a number')
    }
  }, [])

  const editFormRef = useRef<FormInstance>()

  if (propEditFormRef) {
    useImperativeHandle(propEditFormRef, () => ({ ...editFormRef.current }))
  }

  // Table ref
  const gridRef = useRef<any>()

  // Gird outer container element
  const gridOutRef = useRef<any>()

  const [tableWidth, setTableWidth] = useState(1920)

  const resetVirtualGrid = () => {
    if (gridRef.current) {
      gridRef.current.resetAfterIndices({
        columnIndex: 0,
        shouldForceUpdate: true,
      })
    }
  }

  useEffect(() => resetVirtualGrid, [tableWidth])

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
      <ResizeObserver
        onResize={({ width }) => {
          console.log('setTableWidth', width)
          setTableWidth(width)
        }}
      >
        <Grid
          ref={gridRef}
          outerRef={gridOutRef}
          columnCount={columns?.length ?? 0}
          columnWidth={(index) => {
            const { width } = columns[index]
            let realWidth = Number(width)
            return index === columns!.length - 1
              ? realWidth - scrollbarSize - 1
              : realWidth
          }}
          rowHeight={() => rowHeight}
          height={scroll.y}
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
      </ResizeObserver>
    )
  }

  const VTable: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
      <VTableContext.Provider
        value={{
          data: rawData,
          info: { onScroll, ref, scrollbarSize },
        }}
      >
        <FormWrapper>
          {VTableBody(rawData, { onScroll, ref, scrollbarSize })}
        </FormWrapper>
      </VTableContext.Provider>
    )
  }

  return (
    <>
      <Table
        {...rest}
        rowKey='id'
        columns={columns}
        scroll={scroll}
        components={{
          body: VTable,
        }}
        pagination={false}
      />
    </>
  )
}

export default VirtualTable
