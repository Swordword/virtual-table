import React, { useState } from 'react'

import type { TableProps } from 'antd'
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

interface IProps<RecordType = any> extends TableProps<RecordType> {
  cellRender?: () => React.ReactNode
}

function VirtualTable<DataType extends Record<string, any>>(props: IProps) {
  const { columns } = props

  const [tableWidth, setTableWidth] = useState(1920)

  const VCell = ({ columnIndex, rowIndex, style }) => {
    return (
      <div style={style}>
        Item {rowIndex} ,{columnIndex}
      </div>
    )
  }

  const VBody: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
      <Grid
        columnCount={columns?.length ?? 0}
        columnWidth={(index) => {
          const { width } = columns![index]
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
          y: 900,
        }}
        rowKey='id'
        components={{
          body: VBody,
        }}
      />
    </ResizeObserver>
  )
}

export default VirtualTable
