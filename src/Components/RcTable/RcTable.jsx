import Table from "rc-table"
import { Pagination } from "../Pagination"
import { Empty } from "../Empty"
import "./RcTable.css"
import { Spin } from "../Spin"

const renderSpinOrEmptyBox = (isLoading) => {
  if (isLoading) {
    return (
      <div className="table-spinner-loading">
        <Spin />
      </div>
    )
  }

  return <Empty />
}

export const RcTable = ({
  columns,
  data,
  pagination,
  bordered,
  selectedRow,
  loading,
  ...props
}) => {
  const { position, ...restPagination } = pagination

  return (
    <div>
      <Table
        className="table"
        tableLayout="fixed"
        emptyText={renderSpinOrEmptyBox(loading)}
        rowClassName={({ id }) =>
          `${bordered ? "border" : ""} ${selectedRow.includes(id) ? "row-selection" : ""}`
        }
        columns={columns}
        data={data}
        scroll={{ x: "100%" }}
        {...props}
      />
      {!!pagination && (
        <div className={`d-flex justify-content-${position}`}>
          <Pagination {...restPagination} />
        </div>
      )}
    </div>
  )
}
