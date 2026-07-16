export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  TXT = 'txt',
  GOOGLE_SHEETS = 'google_sheets',
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
  [ExportFormat.PDF]: {
    label: 'PDF (.pdf)',
    mimeType: 'application/pdf',
    extension: '.pdf',
    icon: 'file-pdf-box',
  },
  [ExportFormat.TXT]: {
    label: 'Text (.txt)',
    mimeType: 'text/plain',
    extension: '.txt',
    icon: 'file-document-outline',
  },
  [ExportFormat.GOOGLE_SHEETS]: {
    label: 'Google Sheets',
    mimeType: 'text/csv',
    extension: '.csv',
    icon: 'table-large',
  },
};
