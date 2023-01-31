import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { FormInstance, TableProps } from 'antd'
import { Form, Table } from 'antd'

import { getColumnKey, getColumnPos } from 'antd/es/table/util'
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from 'react-window'
import ResizeObserver from 'rc-resize-observer'
import { indexOf, isFunction, isNumber } from 'lodash'
import { ColumnGroupType, ColumnType } from 'antd/lib/table'
import './virtualTable.less'

enum fixedEnum {
  left = 'left',
  right = 'right',
}

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

type VColumnType<RecordType> = ColumnType<RecordType> & {
  /** 在table中隐藏列 */
  hideInTable?: boolean
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
  /** TODO: 编辑行 key */
  editableKeys?: React.Key[]
  scroll: {
    x?: number | true | string
    y: number
  }
  columns: VColumnType<T>[]
}

const VTableContext = React.createContext<CustomizeScrollBodyContext<object>>(
  {} as CustomizeScrollBodyContext<object>
)

const DEFAULT_ROW_HEIGHT = 30

function VirtualTable<DataType extends Record<string, any>>(
  props: VTableProps<DataType>
) {
  const {
    rowKey,
    columns,
    scroll,
    rowHeight = DEFAULT_ROW_HEIGHT,
    editFormRef: propEditFormRef,
    dataSource: rawData,
    editableKeys = [],
    ...rest
  } = props

  const mergedColumns = columns.filter((column) => !column.hideInTable)

  const fixedLeftColumns = useMemo(
    () => columns.filter((column) => column.fixed === 'left'),
    [columns]
  )
  const fixedRightColumns = useMemo(
    () => columns.filter((column) => column.fixed === 'right'),
    [columns]
  )

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
    const targetColumn = columns[columnIndex]
    const targetData = rawData[rowIndex]
    const ViewItem = () => {
      return isFunction(targetColumn.render)
        ? targetColumn.render(
            targetData[getColumnKey(targetColumn, '')],
            targetData,
            rowIndex
          )
        : targetData[getColumnKey(targetColumn, '')]
    }
    // TODO: edit
    const EditItem = () => {
      return <>edit</>
    }
    return (
      <div className='virtual-table-cell' style={style}>
        {editableKeys.includes(
          targetData[isFunction(rowKey) ? rowKey(targetData, rowIndex) : rowKey]
        ) ? (
          <EditItem />
        ) : (
          <ViewItem />
        )}
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

  const renderNormalBody: CustomizeScrollBody<DataType> = (
    rawData,
    { onScroll, ref, scrollbarSize }
  ) => {
    return (
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
    )
  }

  const FixedRow = ({
    rowIndex,
    style,
    fixed,
  }: {
    rowIndex: number
    style: React.CSSProperties
    fixed: fixedEnum
  }) => {
    const Styles = {
      backgroundColor: '#fff',
      display: 'flex',
    } as const
    const fixedColumns =
      fixed === fixedEnum.left ? fixedLeftColumns : fixedRightColumns
    return (
      <div
        style={{
          ...style,
          ...Styles,
        }}
      >
        {fixedColumns.map((column, index) => {
          const Styles = {
            width: column.width,
          }
          const columnIndex = indexOf(columns, column)
          return (
            <VCell
              key={columnIndex}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              style={Styles}
            ></VCell>
          )
        })}
      </div>
    )
  }

  const renderFixedBody = (fixed: fixedEnum) => {
    const fixedColumns =
      fixed === fixedEnum.right ? fixedRightColumns : fixedLeftColumns
    /** fixed 总宽度 */
    const totalFixedWidth = fixedColumns.reduce((prev, next) => {
      const increaseWidth = prev + Number(next.width)
      return increaseWidth
    }, 0)
    const Styles: React.CSSProperties = {
      position: 'absolute',
      left: fixed === fixedEnum.left ? 0 : null,
      right: fixed === fixedEnum.right ? 0 : null,
      top: 0,
      width: totalFixedWidth,
    }

    return (
      <div className='virtual-table-fixed-body' style={Styles}>
        <List
          height={scroll?.y - 12} // 去除底部滚动条的高度
          style={{
            overflow: 'hidden',
          }}
          itemCount={rawData.length}
          itemSize={() => rowHeight}
          width={totalFixedWidth}
        >
          {({ index: rowIndex, style }) => {
            return (
              <FixedRow
                fixed={fixed}
                rowIndex={rowIndex}
                style={style}
              ></FixedRow>
            )
          }}
        </List>
      </div>
    )
  }

  const VTableBody: CustomizeScrollBody<DataType> = (
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
        <ResizeObserver
          onResize={({ width }) => {
            console.log('setTableWidth', width)
            if (width) {
              // ? 为什么会有0
              setTableWidth(width)
            }
          }}
        >
          <div className='virtual-table'>
            {/* <FormWrapper> */}
            {renderNormalBody(rawData, { onScroll, ref, scrollbarSize })}
            {fixedLeftColumns.length > 0
              ? renderFixedBody(fixedEnum.left)
              : null}
            {fixedRightColumns.length > 0
              ? renderFixedBody(fixedEnum.right)
              : null}
            {/* </FormWrapper> */}
          </div>
        </ResizeObserver>
      </VTableContext.Provider>
    )
  }

  return (
    <>
      <Table
        {...rest}
        rowKey='id'
        tableLayout='fixed'
        columns={columns}
        dataSource={rawData}
        scroll={scroll}
        components={{
          body: VTableBody,
        }}
        pagination={false}
      />
    </>
  )
}

export default VirtualTable
