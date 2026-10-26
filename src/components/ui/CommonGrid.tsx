'use client';

import type { ReactNode, MouseEvent } from 'react';
import { Table } from '@mantine/core';

export type CommonGridColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
};

export function CommonGrid<Row>({
  rows,
  columns,
  getRowKey,
  caption,
  emptyMessage,
  minWidth,
  wrapClassName,
  tableClassName,
  emptyCellClassName,
  fixedLayout = false,
  onRowDoubleClick,
}: {
  rows: Row[];
  columns: CommonGridColumn<Row>[];
  getRowKey: (row: Row) => string;
  caption: string;
  emptyMessage: string;
  minWidth: number;
  wrapClassName: string;
  tableClassName: string;
  emptyCellClassName?: string;
  fixedLayout?: boolean;
  onRowDoubleClick?: (row: Row, event: MouseEvent<HTMLTableRowElement>) => void;
}) {
  return (
    <div className={wrapClassName}>
      <Table
        className={tableClassName}
        style={{ minWidth, tableLayout: fixedLayout ? 'fixed' : undefined }}
      >
        <Table.Caption className="srOnly">{caption}</Table.Caption>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th
                key={column.key}
                style={{ textAlign: column.align, width: column.width }}
              >
                {column.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length} className={emptyCellClassName}>
                {emptyMessage}
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((row, index) => (
              <Table.Tr
                key={getRowKey(row)}
                onDoubleClick={(event) => onRowDoubleClick?.(row, event)}
              >
                {columns.map((column) => (
                  <Table.Td
                    key={column.key}
                    style={{ textAlign: column.align, width: column.width }}
                  >
                    {column.render(row, index)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
