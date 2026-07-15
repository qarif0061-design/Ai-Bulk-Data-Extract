import { ExtractionMode } from '../../core/enums/extraction-mode';

export interface ExtractionPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export const EXTRACTION_PROMPTS: Record<ExtractionMode, (content: string, customPrompt?: string) => ExtractionPrompt> = {
  [ExtractionMode.TABLES]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Extract all tabular data from the provided content. Return data as structured JSON with headers as keys and rows as arrays of values.',
    userPrompt: `Extract all tables from the following content. For each table, provide the headers and rows.\n\nContent:\n${content}\n\nReturn the result as a JSON object with this structure:\n{\n  "tables": [\n    {\n      "headers": ["col1", "col2", ...],\n      "rows": [["val1", "val2", ...], ...]\n    }\n  ]\n}`,
  }),

  [ExtractionMode.EMAILS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Find all email addresses in the provided content.',
    userPrompt: `Find all email addresses in the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "emails": [\n    {\n      "email": "example@domain.com",\n      "context": "surrounding text where found"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.PHONE_NUMBERS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Find all phone numbers in the provided content and normalize them.',
    userPrompt: `Find all phone numbers in the following content. Normalize each to international format where possible.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "phoneNumbers": [\n    {\n      "original": "as found in text",\n      "normalized": "+1 234 567 8900",\n      "country": "US",\n      "type": "mobile/landline"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.ADDRESSES]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Parse all postal addresses from the provided content.',
    userPrompt: `Extract all postal addresses from the following content. Parse them into structured components.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "addresses": [\n    {\n      "street": "123 Main St",\n      "city": "Springfield",\n      "state": "IL",\n      "zip": "62701",\n      "country": "USA",\n      "full": "123 Main St, Springfield, IL 62701, USA"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.PRODUCTS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Extract product details from the provided content.',
    userPrompt: `Extract all products from the following content with their details.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "products": [\n    {\n      "name": "Product Name",\n      "description": "Brief description",\n      "sku": "SKU if available",\n      "quantity": "quantity if mentioned",\n      "price": "price if available"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.PRICES]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Find all prices and monetary values in the provided content.',
    userPrompt: `Find all prices and monetary values in the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "prices": [\n    {\n      "amount": 29.99,\n      "currency": "USD",\n      "symbol": "$",\n      "context": "surrounding text",\n      "label": "description of what this price is for"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.INVOICE_ITEMS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Extract line items from invoices in the provided content.',
    userPrompt: `Extract all line items from the invoice(s) in the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "invoiceItems": [\n    {\n      "description": "Item description",\n      "quantity": 1,\n      "unitPrice": 29.99,\n      "total": 29.99,\n      "tax": 0,\n      "discount": 0\n    }\n  ],\n  "subtotal": 0,\n  "tax": 0,\n  "total": 0,\n  "invoiceNumber": "INV-001",\n  "date": "2024-01-15"\n}`,
  }),

  [ExtractionMode.DATES]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Find and normalize all dates in the provided content.',
    userPrompt: `Find all dates in the following content and normalize them to ISO 8601 format.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "dates": [\n    {\n      "original": "as found in text",\n      "normalized": "2024-01-15",\n      "type": "date/datetime/time",\n      "context": "surrounding text"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.BANK_TRANSACTIONS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Extract bank transaction data from statements.',
    userPrompt: `Extract all bank transactions from the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "transactions": [\n    {\n      "date": "2024-01-15",\n      "description": "Transaction description",\n      "amount": 100.00,\n      "type": "credit/debit",\n      "balance": 5000.00,\n      "reference": "reference number if available"\n    }\n  ],\n  "openingBalance": 0,\n  "closingBalance": 0,\n  "accountNumber": "****1234"\n}`,
  }),

  [ExtractionMode.CONTACTS]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Extract contact information from the provided content.',
    userPrompt: `Extract all contact information from the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "contacts": [\n    {\n      "name": "Full Name",\n      "email": "email if available",\n      "phone": "phone if available",\n      "company": "company if available",\n      "title": "job title if available",\n      "address": "address if available"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.COMPANY_NAMES]: (content: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Identify all company and business names in the provided content.',
    userPrompt: `Identify all company and business names in the following content.\n\nContent:\n${content}\n\nReturn the result as a JSON object:\n{\n  "companies": [\n    {\n      "name": "Company Name",\n      "type": "Corporation/LLC/etc",\n      "context": "surrounding text where found",\n      "website": "if available",\n      "industry": "if determinable"\n    }\n  ]\n}`,
  }),

  [ExtractionMode.CUSTOM]: (content: string, customPrompt?: string) => ({
    systemPrompt: 'You are a precise data extraction assistant. Follow the user instructions to extract data from the provided content.',
    userPrompt: `${customPrompt || 'Extract all relevant data'}\n\nContent:\n${content}\n\nReturn the result as a structured JSON object matching the requested extraction.`,
  }),
};
