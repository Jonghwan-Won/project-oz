const paths: Record<string, string> = {
  backgroundColor: 'm5 3 8 8-6 6-6-6 6-6 M14 12q5 6 0 6q-4 0 0-6 M2 21h17',
  borders: 'M3 3h18v18H3z M3 12h18 M12 3v18',
  borderColor: 'm5 15 10-10 3 3-10 10-4 1z M2 22h20',
  borderWidth: 'M3 5h18 M3 10h18 M3 16h18 M3 18h18',
  borderStyle: 'M3 5h3m3 0h3m3 0h3m3 0h1 M3 12h6m3 0h6m3 0h1 M3 20h18',
  fit: 'M6 5h12v14H6z M10 5v14 M14 5v14 M6 10h12 M6 14h12 M2 3v18 M22 3v18',
  rowBefore: 'M3 9h14v12H3z M3 15h14 M3 3h14v3H3z M21 1v6 M18 4h6',
  rowAfter: 'M3 3h14v12H3z M3 9h14 M3 18h14v3H3z M21 17v6 M18 20h6',
  columnBefore: 'M9 4h12v16H9z M15 4v16 M3 8h3v12H3z M4 0v6 M1 3h6',
  columnAfter: 'M3 4h12v16H3z M9 4v16 M18 8h3v12h-3z M20 0v6 M17 3h6',
  rowDelete: 'M3 3h16v18H3z M3 9h16 M3 15h9 M15 14l7 7 M22 14l-7 7',
  columnDelete: 'M3 3h18v18H3z M9 3v18 M15 3v9 M14 15l8 7 M22 15l-8 7',
  delete: 'M3 5h18 M8 5V2h8v3 M5 5v17h14V5 M9 9v9 M15 9v9',
  cellAlign: 'M2 2h20v20H2z M6 7h12 M6 11h8 M6 15h10',
  verticalAlign: 'M2 2h20v20H2z M6 9h12 M6 12h12 M6 15h12',
  size: 'M4 11h16v10H4z M12 11v10 M4 4h16 M4 4l3-3 M4 4l3 3 M20 4l-3-3 M20 4l-3 3',
  merge: 'M3 3h18v18H3z M3 9h18 M9 3v6 M15 3v6',
  split: 'M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18',
  cell: 'M3 3h18v18H3z M8 16l8-8 M16 8v6 M16 8h-6',
  table: 'M3 3h18v18H3z M3 9h18 M9 3v18 M12 19l7-7 M19 12v5 M19 12h-5',
};

export function TableToolIcon({ name }: { name: string }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
