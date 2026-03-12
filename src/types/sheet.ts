export type CellValue = string | number | null;

export interface SheetData {
  title: string;
  textLabels: string[];
  doubles: number[];
  table: CellValue[][];
  maxRow: number;
  maxCol: number;
}

/** Raw cell from protobuf */
export interface RawCell {
  row: number;
  col: number;
  cellType: number;
  rawValue: number | null;
}
