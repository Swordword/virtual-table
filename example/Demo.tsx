import { TableProps } from 'antd'
import VirtualTable from '../src/VirtualTable'

type DataType = {
  id: React.Key
  spec: string
  name: string
  age: number
}

const Demo = () => {
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'FixedLeft',
      dataIndex: 'spec',
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: 80,
    },
    {
      title: 'Action',
      fixed: 'right',
      width: 120,
      render: (value, record, index) => {
        return <a>{record.age}</a>
      },
    },
  ]
  const dataSource: DataType[] = Array(10000)
    .fill(true)
    .map((_, idx) => ({
      id: idx + 1,
      spec: 'abcdef',
      name: 'Bob',
      age: 12,
    }))

  return (
    <div>
      <VirtualTable
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
    </div>
  )
}

export default Demo
