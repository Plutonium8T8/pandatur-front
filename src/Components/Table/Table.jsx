/**
 * DEPRECATED
 * This table component is deprecated and will be removed
 */
import { HeaderCell } from "./HeaderCell";
import { RowCell } from "./RowCell";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import "./Table.css";
import { Empty } from "../Empty";

export const Table = ({ data, columns, loading, select }) => {
  const { getHeaderGroups, getRowModel } = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ overflowX: "scroll" }}>
      <table className="table">
        <thead>
          {getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <HeaderCell key={i}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </HeaderCell>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {getRowModel().rows.length ? (
            getRowModel().rows.map((row) => {
              return (
                <tr
                  className={`table-tr ${select?.includes(row.original.id) ? "selected-row" : ""}`}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <RowCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </RowCell>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <RowCell colSpan={columns.length}>
                <Empty />
              </RowCell>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
