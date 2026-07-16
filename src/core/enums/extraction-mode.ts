export enum ExtractionMode {
  EXTRACT_ALL = 'extract_all',
  FULL_NAME = 'full_name',
  FIRST_NAME = 'first_name',
  LAST_NAME = 'last_name',
  AGE = 'age',
  GENDER = 'gender',
  SEX = 'sex',
  MARITAL_STATUS = 'marital_status',
  EMAILS = 'emails',
  PHONE_NUMBERS = 'phone_numbers',
  ADDRESSES = 'addresses',
  CONTACTS = 'contacts',
  PRODUCTS = 'products',
  PRICES = 'prices',
  INVOICE_ITEMS = 'invoice_items',
  DATES = 'dates',
  BANK_TRANSACTIONS = 'bank_transactions',
  COMPANY_NAMES = 'company_names',
  TABLES = 'tables',
  CUSTOM = 'custom',
}

export interface ExtractionModeInfo {
  mode: ExtractionMode;
  label: string;
  description: string;
  icon: string;
  creditCost: number;
  standaloneOnly?: boolean;
}

export const EXTRACTION_MODES: ExtractionModeInfo[] = [
  {
    mode: ExtractionMode.EXTRACT_ALL,
    label: 'Extract all data/text',
    description: 'Extract every piece of data in a beautiful readable format',
    icon: 'select-all',
    creditCost: 3,
    standaloneOnly: true,
  },
  {
    mode: ExtractionMode.FULL_NAME,
    label: 'Full Name',
    description: 'Extract full names from the document',
    icon: 'account-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.FIRST_NAME,
    label: 'First Name',
    description: 'Extract first/given names',
    icon: 'account',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.LAST_NAME,
    label: 'Last Name',
    description: 'Extract last/surnames',
    icon: 'account-badge-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.AGE,
    label: 'Age',
    description: 'Extract age information',
    icon: 'cake-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.GENDER,
    label: 'Gender',
    description: 'Extract gender information',
    icon: 'human-male-female',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.SEX,
    label: 'Sex',
    description: 'Extract sex/gender field values',
    icon: 'human-male-female-variant',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.MARITAL_STATUS,
    label: 'Marital Status',
    description: 'Extract marital status information',
    icon: 'ring-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.EMAILS,
    label: 'Emails',
    description: 'Find all email addresses in the document',
    icon: 'email-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.PHONE_NUMBERS,
    label: 'Phone Numbers',
    description: 'Find and normalize phone numbers',
    icon: 'phone-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.ADDRESSES,
    label: 'Addresses',
    description: 'Parse full postal addresses',
    icon: 'map-marker-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.CONTACTS,
    label: 'Contacts',
    description: 'Extract contact information',
    icon: 'account-group-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.PRODUCTS,
    label: 'Products',
    description: 'Extract product details and descriptions',
    icon: 'package-variant',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.PRICES,
    label: 'Prices',
    description: 'Find prices with currency information',
    icon: 'currency-usd',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.INVOICE_ITEMS,
    label: 'Invoice Items',
    description: 'Extract line items from invoices',
    icon: 'file-document-outline',
    creditCost: 2,
    standaloneOnly: true,
  },
  {
    mode: ExtractionMode.DATES,
    label: 'Dates',
    description: 'Find and normalize date references',
    icon: 'calendar-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.BANK_TRANSACTIONS,
    label: 'Bank Transactions',
    description: 'Extract bank statement transaction data',
    icon: 'bank-outline',
    creditCost: 2,
    standaloneOnly: true,
  },
  {
    mode: ExtractionMode.COMPANY_NAMES,
    label: 'Companies',
    description: 'Identify company and business names',
    icon: 'office-building-outline',
    creditCost: 1,
  },
  {
    mode: ExtractionMode.TABLES,
    label: 'Tables',
    description: 'Extract tabular data with headers and rows',
    icon: 'table-large',
    creditCost: 1,
    standaloneOnly: true,
  },
  {
    mode: ExtractionMode.CUSTOM,
    label: 'Custom',
    description: 'Provide your own extraction prompt',
    icon: 'code-braces',
    creditCost: 2,
    standaloneOnly: true,
  },
];

export function getExtractionModeInfo(mode: ExtractionMode): ExtractionModeInfo {
  return EXTRACTION_MODES.find((m) => m.mode === mode)!;
}
