import { ExtractionMode } from '../../core/enums/extraction-mode';

export interface ExtractionPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export const EXTRACTION_PROMPTS: Record<ExtractionMode, (fileName: string, customPrompt?: string) => ExtractionPrompt> = {
  [ExtractionMode.EXTRACT_ALL]: (fileName: string) => ({
    systemPrompt: `You are a world-class data extraction assistant with exceptional vision. You will be given an image or PDF document. Look VERY carefully at every part of the document. This may contain HANDWRITTEN text, typed text, tables, forms, receipts, invoices, or any other document type. 

Your job is to extract ALL data from this document in a beautiful, organized, readable format that closely mirrors the original document's structure.

IMPORTANT: Pay special attention to:
- Handwritten text (cursive, print, any handwriting style)
- Stamps, seals, or watermarks
- Small or faded text
- Complex table structures
- Multi-column layouts
- Forms with filled-in fields
- Any text at unusual angles

Extract everything you can possibly read.`,
    userPrompt: `Look at the attached document "${fileName}" very carefully. This may contain handwritten text, typed text, tables, forms, or mixed content. Extract ALL data visible in this document.

Organize the output into clearly labeled sections that match the document structure. For each section:
- Use a descriptive section name
- Include all data points with their labels
- Preserve the original layout/order as much as possible

Return ONLY valid JSON with this structure:
{
  "documentType": "invoice/receipt/form/letter/etc",
  "sections": [
    {
      "title": "Section Name",
      "fields": [
        { "label": "Field Name", "value": "Field Value" }
      ],
      "items": [
        { "name": "Item", "details": "details", "quantity": "1", "price": "$10" }
      ]
    }
  ],
  "tables": [
    {
      "title": "Table Name (if applicable)",
      "headers": ["col1", "col2"],
      "rows": [["val1", "val2"]]
    }
  ],
  "keyValues": [
    { "key": "Invoice Number", "value": "INV-001" },
    { "key": "Date", "value": "2024-01-15" }
  ],
  "allText": "Complete raw text from the document, preserving layout"
}`,
  }),

  [ExtractionMode.TABLES]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF document that may contain HANDWRITTEN text. Look very carefully at the visual content and extract ALL tabular data visible, including handwritten tables. Return data as structured JSON with headers as keys and rows as arrays of values. Be thorough - extract every table you can see.',
    userPrompt: `Look at the attached document "${fileName}". It may contain handwritten or typed content. Extract ALL tables and tabular data visible in this document.\n\nFor each table, provide:\n- headers: array of column header strings\n- rows: array of arrays, each inner array is one row of values\n\nReturn ONLY valid JSON:\n{"tables": [{"headers": ["col1", "col2"], "rows": [["val1", "val2"], ...]}]}`,
  }),

  [ExtractionMode.EMAILS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL email addresses visible, including handwritten ones. Be thorough.',
    userPrompt: `Look at the attached document "${fileName}". Find every email address visible in this document, including handwritten ones. Carefully examine every part of the document.\n\nReturn ONLY valid JSON:\n{"emails": [{"email": "example@domain.com", "context": "surrounding text where found", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.PHONE_NUMBERS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL phone numbers visible. Normalize them to a standard format.',
    userPrompt: `Look at the attached document "${fileName}". Find every phone number visible in this document, including handwritten ones.\n\nReturn ONLY valid JSON:\n{"phoneNumbers": [{"original": "as shown", "normalized": "+1 234 567 8900", "country": "US", "type": "mobile/landline", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.ADDRESSES]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL postal addresses visible. Parse them into structured components.',
    userPrompt: `Look at the attached document "${fileName}". Extract every postal address visible in this document, including handwritten ones.\n\nReturn ONLY valid JSON:\n{"addresses": [{"street": "123 Main St", "city": "Springfield", "state": "IL", "zip": "62701", "country": "USA", "full": "123 Main St, Springfield, IL 62701, USA", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.PRODUCTS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL product details visible. Be thorough - get every product, its name, description, SKU, quantity, and price.',
    userPrompt: `Look at the attached document "${fileName}". Extract every product or item listed in this document with all available details, including handwritten entries.\n\nReturn ONLY valid JSON:\n{"products": [{"name": "Product Name", "description": "Brief description", "sku": "SKU if available", "quantity": "quantity if mentioned", "price": "price if available", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.PRICES]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL prices and monetary values visible.',
    userPrompt: `Look at the attached document "${fileName}". Find every price and monetary value visible in this document, including handwritten ones.\n\nReturn ONLY valid JSON:\n{"prices": [{"amount": 29.99, "currency": "USD", "symbol": "$", "context": "surrounding text", "label": "what this price is for", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.INVOICE_ITEMS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF of an invoice that may contain handwritten text. Look very carefully at the visual content and extract ALL line items, totals, tax, invoice number, and date. Be extremely thorough.',
    userPrompt: `Look at the attached invoice document "${fileName}". It may contain handwritten entries. Extract every line item and all invoice details.\n\nReturn ONLY valid JSON:\n{"invoiceItems": [{"description": "Item description", "quantity": 1, "unitPrice": 29.99, "total": 29.99, "tax": 0, "discount": 0}], "subtotal": 0, "tax": 0, "total": 0, "invoiceNumber": "INV-001", "date": "2024-01-15"}`,
  }),

  [ExtractionMode.DATES]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and find ALL dates visible. Normalize them to ISO 8601 format.',
    userPrompt: `Look at the attached document "${fileName}". Find every date visible in this document, including handwritten ones.\n\nReturn ONLY valid JSON:\n{"dates": [{"original": "as shown", "normalized": "2024-01-15", "type": "date/datetime/time", "context": "surrounding text", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.BANK_TRANSACTIONS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF of a bank statement that may contain handwritten entries. Look very carefully at the visual content and extract ALL transactions visible.',
    userPrompt: `Look at the attached bank statement "${fileName}". Extract every transaction visible in this document.\n\nReturn ONLY valid JSON:\n{"transactions": [{"date": "2024-01-15", "description": "Transaction description", "amount": 100.00, "type": "credit/debit", "balance": 5000.00, "reference": "ref if available"}], "openingBalance": 0, "closingBalance": 0, "accountNumber": "****1234"}`,
  }),

  [ExtractionMode.CONTACTS]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and extract ALL contact information visible.',
    userPrompt: `Look at the attached document "${fileName}". Extract every contact or person's information visible in this document, including handwritten entries.\n\nReturn ONLY valid JSON:\n{"contacts": [{"name": "Full Name", "email": "email if available", "phone": "phone if available", "company": "company if available", "title": "job title if available", "address": "address if available", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.COMPANY_NAMES]: (fileName: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and identify ALL company and business names visible.',
    userPrompt: `Look at the attached document "${fileName}". Identify every company and business name visible in this document, including handwritten ones.\n\nReturn ONLY valid JSON:\n{"companies": [{"name": "Company Name", "type": "Corporation/LLC/etc", "context": "surrounding text", "website": "if available", "industry": "if determinable", "isHandwritten": false}]}`,
  }),

  [ExtractionMode.CUSTOM]: (fileName: string, customPrompt?: string) => ({
    systemPrompt: 'You are a precise data extraction assistant with exceptional vision. You will be given an image or PDF that may contain handwritten text. Look very carefully at the visual content and follow the user instructions to extract data.',
    userPrompt: `${customPrompt || 'Extract all relevant data from this document.'}\n\nLook at the attached document "${fileName}". It may contain handwritten text. Follow the instructions above and extract the requested data.\n\nReturn ONLY valid JSON matching the requested extraction.`,
  }),
};
