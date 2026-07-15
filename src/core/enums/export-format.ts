export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export const EXPORT_FORMAT_INFO: Record<ExportFormat, { label: string; mimeType: string; extension: string; icon: string }> = {
  [ExportFormat.EXCEL]: {
    label: 'Excel (.xlsx)',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    icon: 'file-excel-box',
  },
  [ExportFormat.CSV]: {
    label: 'CSV (.csv)',
    mimeType: 'text/csv',
    extension: '.csv',
    icon: 'file-delimited',
  },
  [ExportFormat.JSON]: {
    label: 'JSON (.json)',
    mimeType: 'application/json',
    extension: '.json',
    icon: 'code-json',
  },
};
