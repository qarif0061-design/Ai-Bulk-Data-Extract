import { ExtractionMode } from '../../core/enums/extraction-mode';

interface ExtractionResult {
  data: any;
  method: 'local';
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-!#$&'*/=?^`{|}~]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?(\d{1,3}))?[-.\s]?\(?(?:\d{2,4})?\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
const DATE_REGEX = /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})\b/gi;
const CURRENCY_REGEX = /(?:[$\u20AC\u00A3\u00A5])\s*\d[\d,]*\.?\d{0,2}|\d[\d,]*\.?\d{0,2}\s*(?:USD|EUR|GBP|INR|CAD|AUD)/g;
const PRICE_REGEX = /(?:\$\s*\d[\d,]*\.?\d{0,2}|\d[\d,]*\.?\d{0,2}\s*(?:USD|EUR|GBP|INR))/g;
const NAME_REGEX = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b/g;
const STREET_REGEX = /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir)\b/gi;
const ZIP_REGEX = /\b\d{5}(?:-\d{4})?\b/g;
const INVOICE_NUM_REGEX = /(?:invoice|inv|bill|receipt)\s*(?:#|no|number|num|:|\s)\s*[A-Za-z0-9\-]+/gi;
const COMPANY_SUFFIX = /(?:Inc|LLC|Ltd|Corp|Co|GmbH|S\.?A\.?|P\.?L\.?C\.?|Pty|Limited|Incorporated|Corporation|Company)\.?/gi;

export function extractDataLocally(text: string, mode: ExtractionMode, fileName: string): ExtractionResult {
  if (!text || text.trim().length === 0) {
    return { data: getEmptyResult(mode), method: 'local' };
  }

  switch (mode) {
    case ExtractionMode.EXTRACT_ALL:
      return { data: extractAll(text, fileName), method: 'local' };
    case ExtractionMode.TABLES:
      return { data: extractTables(text), method: 'local' };
    case ExtractionMode.EMAILS:
      return { data: extractEmails(text), method: 'local' };
    case ExtractionMode.PHONE_NUMBERS:
      return { data: extractPhoneNumbers(text), method: 'local' };
    case ExtractionMode.ADDRESSES:
      return { data: extractAddresses(text), method: 'local' };
    case ExtractionMode.PRODUCTS:
      return { data: extractProducts(text, fileName), method: 'local' };
    case ExtractionMode.PRICES:
      return { data: extractPrices(text), method: 'local' };
    case ExtractionMode.INVOICE_ITEMS:
      return { data: extractInvoiceItems(text), method: 'local' };
    case ExtractionMode.DATES:
      return { data: extractDates(text), method: 'local' };
    case ExtractionMode.BANK_TRANSACTIONS:
      return { data: extractBankTransactions(text), method: 'local' };
    case ExtractionMode.CONTACTS:
      return { data: extractContacts(text), method: 'local' };
    case ExtractionMode.COMPANY_NAMES:
      return { data: extractCompanyNames(text), method: 'local' };
    case ExtractionMode.CUSTOM:
      return { data: { raw: text, note: 'Custom extraction requires AI enhancement' }, method: 'local' };
    default:
      return { data: getEmptyResult(mode), method: 'local' };
  }
}

function extractAll(text: string, fileName: string) {
  const lines = text.split('\n').filter(l => l.trim());
  const sections: any[] = [];
  const currentSection: any = { title: 'Document Content', fields: [], items: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(?:invoice|bill|receipt|statement|letter|memo|form|report|contract)/i.test(trimmed)) {
      if (currentSection.fields.length > 0) sections.push(currentSection);
      currentSection = { title: trimmed, fields: [], items: [] };
      continue;
    }

    const colonMatch = trimmed.match(/^(.{2,40}):\s*(.+)$/);
    if (colonMatch) {
      currentSection.fields.push({ label: colonMatch[1].trim(), value: colonMatch[2].trim() });
    } else {
      currentSection.fields.push({ label: 'Line', value: trimmed });
    }
  }
  if (currentSection.fields.length > 0) sections.push(currentSection);

  const emails = text.match(EMAIL_REGEX) || [];
  const phones = text.match(PHONE_REGEX) || [];
  const dates = text.match(DATE_REGEX) || [];
  const prices = text.match(PRICE_REGEX) || [];
  const urls = text.match(URL_REGEX) || [];
  const companies = text.match(COMPANY_SUFFIX) || [];
  const addresses = text.match(STREET_REGEX) || [];

  const keyValues: any[] = [];
  const kvRegex = /^(.{2,40}):\s*(.+)$/gm;
  let m;
  while ((m = kvRegex.exec(text)) !== null) {
    keyValues.push({ key: m[1].trim(), value: m[2].trim() });
  }

  return {
    documentType: guessDocType(text),
    sections,
    tables: extractTableData(text),
    keyValues,
    allText: text,
    summary: {
      emails: emails.length,
      phoneNumbers: phones.length,
      dates: dates.length,
      prices: prices.length,
      urls: urls.length,
    },
  };
}

function guessDocType(text: string): string {
  const lower = text.toLowerCase();
  if (/invoice|bill\s*no|invoice\s*#/i.test(lower)) return 'Invoice';
  if (/receipt|thank\s*you\s*for\s*your\s*purchase/i.test(lower)) return 'Receipt';
  if (/statement|account\s*summary|opening\s*balance/i.test(lower)) return 'Statement';
  if (/letter|dear\s|sincerely|regards/i.test(lower)) return 'Letter';
  if (/form|application|please\s*fill/i.test(lower)) return 'Form';
  if (/contract|agreement|terms\s*and\s*conditions/i.test(lower)) return 'Contract';
  if (/report|summary|analysis/i.test(lower)) return 'Report';
  return 'Document';
}

function extractTables(text: string) {
  return { tables: extractTableData(text) };
}

function extractTableData(text: string): any[] {
  const lines = text.split('\n');
  const tables: any[] = [];
  let currentTable: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentTable && currentTable.rows.length > 0) {
        tables.push(currentTable);
        currentTable = null;
      }
      continue;
    }

    const separators = [/\t/, /\s{3,}/, /\s*\|\s*/];
    let parts: string[] = [];
    for (const sep of separators) {
      parts = trimmed.split(sep).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) break;
    }

    if (parts.length < 2) {
      if (currentTable && currentTable.rows.length > 0) {
        tables.push(currentTable);
        currentTable = null;
      }
      continue;
    }

    const looksLikeHeader = parts.some(p => /^[A-Z]/.test(p)) && !parts.some(p => /^\d+\.?\d*$/.test(p));

    if (!currentTable) {
      if (looksLikeHeader || parts.length >= 2) {
        currentTable = { headers: parts, rows: [] };
      }
    } else {
      currentTable.rows.push(parts);
    }
  }

  if (currentTable && currentTable.rows.length > 0) tables.push(currentTable);
  return tables;
}

function extractEmails(text: string) {
  const matches = text.match(EMAIL_REGEX) || [];
  const unique = [...new Set(matches)];
  return { emails: unique.map(email => ({ email, context: getContext(text, email) })) };
}

function extractPhoneNumbers(text: string) {
  const matches = text.match(PHONE_REGEX) || [];
  const cleaned = matches
    .map(m => m.trim())
    .filter(m => m.replace(/[\s\-\(\)\.+]/g, '').length >= 7)
    .filter(m => !/^\d{4}$/.test(m));
  const unique = [...new Set(cleaned)];
  return {
    phoneNumbers: unique.map(phone => ({
      original: phone,
      normalized: normalizePhone(phone),
      type: guessPhoneType(phone),
    })),
  };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits.slice(0,1)} ${digits.slice(1,4)} ${digits.slice(4,7)} ${digits.slice(7)}`;
  return phone;
}

function guessPhoneType(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? 'mobile/landline' : digits.length > 10 ? 'international' : 'unknown';
}

function extractAddresses(text: string) {
  const streetMatches = text.match(STREET_REGEX) || [];
  const zipMatches = text.match(ZIP_REGEX) || [];
  const cityStateRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*,?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/g;
  const addresses: any[] = [];
  let m;

  while ((m = cityStateRegex.exec(text)) !== null) {
    addresses.push({
      street: '',
      city: m[1],
      state: m[2],
      zip: m[3],
      full: m[0],
    });
  }

  for (const street of streetMatches) {
    if (!addresses.some(a => a.street === street)) {
      addresses.push({ street, city: '', state: '', zip: '', full: street });
    }
  }

  return { addresses };
}

function extractProducts(text: string, fileName: string) {
  const lines = text.split('\n');
  const products: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const priceMatch = trimmed.match(PRICE_REGEX);
    const qtyMatch = trimmed.match(/\b(\d+)\s*(?:pcs?|pieces?|units?|qty|quantity|items?)\b/i);

    if (priceMatch || qtyMatch) {
      const name = trimmed
        .replace(PRICE_REGEX, '')
        .replace(/\b\d+\s*(?:pcs?|pieces?|units?|qty|quantity|items?)\b/gi, '')
        .replace(/[,\s]+$/, '')
        .trim();

      if (name.length > 1) {
        products.push({
          name,
          price: priceMatch ? priceMatch[0] : 'N/A',
          quantity: qtyMatch ? qtyMatch[1] : '1',
          sourceFile: fileName,
        });
      }
    }
  }

  return { products };
}

function extractPrices(text: string) {
  const matches = text.match(PRICE_REGEX) || [];
  return {
    prices: matches.map(price => ({
      amount: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
      symbol: price.match(/[$\u20AC\u00A3]/)?.[0] || price.match(/USD|EUR|GBP|INR/)?.[0] || '$',
      currency: guessCurrency(price),
      context: getContext(text, price),
      label: getLabelForPrice(text, price),
    })),
  };
}

function guessCurrency(price: string): string {
  if (price.includes('$') || price.includes('USD')) return 'USD';
  if (price.includes('\u20AC') || price.includes('EUR')) return 'EUR';
  if (price.includes('\u00A3') || price.includes('GBP')) return 'GBP';
  if (price.includes('INR')) return 'INR';
  return 'USD';
}

function getLabelForPrice(text: string, price: string): string {
  const idx = text.indexOf(price);
  if (idx < 0) return '';
  const before = text.substring(Math.max(0, idx - 60), idx).trim();
  const lastColon = before.lastIndexOf(':');
  if (lastColon >= 0) return before.substring(lastColon + 1).trim();
  const words = before.split(/\s+/);
  return words.slice(-3).join(' ');
}

function extractInvoiceItems(text: string) {
  const items: any[] = [];
  const lines = text.split('\n');
  let subtotal = 0, tax = 0, total = 0, invoiceNumber = '', date = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const invMatch = trimmed.match(INVOICE_NUM_REGEX);
    if (invMatch) invoiceNumber = invMatch[0];

    const dateMatch = trimmed.match(DATE_REGEX);
    if (dateMatch && !date) date = dateMatch[0];

    const subMatch = trimmed.match(/(?:subtotal|sub\s*total|net\s*amount)[:\s]*[$]?\s*([\d,]+\.?\d{0,2})/i);
    if (subMatch) subtotal = parseFloat(subMatch[1].replace(/,/g, ''));

    const taxMatch = trimmed.match(/(?:tax|gst|vat|hst)[:\s]*[$]?\s*([\d,]+\.?\d{0,2})/i);
    if (taxMatch) tax = parseFloat(taxMatch[1].replace(/,/g, ''));

    const totalMatch = trimmed.match(/(?:total|amount\s*due|balance\s*due|grand\s*total)[:\s]*[$]?\s*([\d,]+\.?\d{0,2})/i);
    if (totalMatch) total = parseFloat(totalMatch[1].replace(/,/g, ''));

    const parts = trimmed.split(/\t|\s{3,}/);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const priceInPart = lastPart.match(/\$?\s*([\d,]+\.?\d{0,2})/);
      if (priceInPart) {
        const desc = parts.slice(0, -1).join(' ').trim();
        const qty = desc.match(/\b(\d+)\s*x\b/i) || desc.match(/^\s*(\d+)/);
        items.push({
          description: desc,
          quantity: qty ? parseInt(qty[1]) : 1,
          total: parseFloat(priceInPart[1].replace(/,/g, '')),
        });
      }
    }
  }

  return { invoiceItems: items, subtotal, tax, total, invoiceNumber, date };
}

function extractDates(text: string) {
  const matches = text.match(DATE_REGEX) || [];
  const unique = [...new Set(matches)];
  return {
    dates: unique.map(d => ({
      original: d,
      normalized: normalizeDate(d),
      type: guessDateType(d),
      context: getContext(text, d),
    })),
  };
}

function normalizeDate(d: string): string {
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  } catch {}
  return d;
}

function guessDateType(d: string): string {
  if (/\d{1,2}:\d{2}/.test(d)) return 'datetime';
  return 'date';
}

function extractBankTransactions(text: string) {
  const lines = text.split('\n');
  const transactions: any[] = [];
  let openingBalance = 0, closingBalance = 0, accountNumber = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const acctMatch = trimmed.match(/(?:account|acct)\s*(?:#|no|number|:|\s)\s*[*\d\-]+/i);
    if (acctMatch) accountNumber = acctMatch[0];

    const obMatch = trimmed.match(/(?:opening|beginning)\s*balance[:\s]*[\$]?\s*([\d,]+\.?\d{0,2})/i);
    if (obMatch) openingBalance = parseFloat(obMatch[1].replace(/,/g, ''));

    const cbMatch = trimmed.match(/(?:closing|ending)\s*balance[:\s]*[\$]?\s*([\d,]+\.?\d{0,2})/i);
    if (cbMatch) closingBalance = parseFloat(cbMatch[1].replace(/,/g, ''));

    const dateMatch = trimmed.match(DATE_REGEX);
    const amountMatch = trimmed.match(/\$?\s*([\d,]+\.\d{2})/);
    if (dateMatch && amountMatch) {
      const isCredit = /\b(?:credit|deposit|cr)\b/i.test(trimmed);
      const isDebit = /\b(?:debit|withdrawal|dr)\b/i.test(trimmed);
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      const parts = trimmed.split(/\s{2,}|\t/);
      transactions.push({
        date: dateMatch[0],
        description: parts.find(p => !p.match(DATE_REGEX) && !p.match(/\$?\s*[\d,]+\.\d{2}/)) || '',
        amount,
        type: isCredit ? 'credit' : isDebit ? 'debit' : amount > 0 ? 'credit' : 'debit',
      });
    }
  }

  return { transactions, openingBalance, closingBalance, accountNumber };
}

function extractContacts(text: string) {
  const emails = (text.match(EMAIL_REGEX) || []);
  const phones = (text.match(PHONE_REGEX) || []).filter(m => m.replace(/\D/g, '').length >= 7);
  const names = (text.match(NAME_REGEX) || []).filter(n => !/^(?:The|This|That|And|For|Not|But|Are|Can|You|Our|Has|Had|Was|Were|Will|May|All|Any|Few|Most|Some)$/i.test(n));
  const companies = text.match(COMPANY_SUFFIX) || [];

  const contacts: any[] = [];
  const uniqueEmails = [...new Set(emails)];
  for (const email of uniqueEmails) {
    const nearby = getNearbyContext(text, email, 100);
    const nameMatch = nearby.match(NAME_REGEX);
    const phoneMatch = nearby.match(PHONE_REGEX);
    const companyMatch = nearby.match(COMPANY_SUFFIX);
    contacts.push({
      name: nameMatch?.[0] || '',
      email,
      phone: phoneMatch?.[0] || '',
      company: companyMatch?.[0] || '',
    });
  }

  if (contacts.length === 0 && names.length > 0) {
    for (const name of names.slice(0, 20)) {
      contacts.push({ name, email: '', phone: '', company: '' });
    }
  }

  return { contacts };
}

function extractCompanyNames(text: string) {
  const matches = text.match(COMPANY_SUFFIX) || [];
  const companies: any[] = [];
  for (const match of matches) {
    const idx = text.indexOf(match);
    if (idx < 0) continue;
    const before = text.substring(Math.max(0, idx - 40), idx).trim();
    const words = before.split(/\s+/);
    const name = words.slice(-3).join(' ') + ' ' + match;
    if (!companies.some(c => c.name === name)) {
      companies.push({ name: name.trim(), type: match.replace(/\./g, ''), context: getContext(text, name.trim()) });
    }
  }
  return { companies };
}

function getContext(text: string, target: string, range = 80): string {
  const idx = text.indexOf(target);
  if (idx < 0) return '';
  return text.substring(Math.max(0, idx - range), idx + target.length + range).trim();
}

function getNearbyContext(text: string, target: string, range: number): string {
  return getContext(text, target, range);
}

function getEmptyResult(mode: ExtractionMode): any {
  switch (mode) {
    case ExtractionMode.EXTRACT_ALL: return { documentType: 'Unknown', sections: [], tables: [], keyValues: [], allText: '' };
    case ExtractionMode.TABLES: return { tables: [] };
    case ExtractionMode.EMAILS: return { emails: [] };
    case ExtractionMode.PHONE_NUMBERS: return { phoneNumbers: [] };
    case ExtractionMode.ADDRESSES: return { addresses: [] };
    case ExtractionMode.PRODUCTS: return { products: [] };
    case ExtractionMode.PRICES: return { prices: [] };
    case ExtractionMode.INVOICE_ITEMS: return { invoiceItems: [], subtotal: 0, tax: 0, total: 0, invoiceNumber: '', date: '' };
    case ExtractionMode.DATES: return { dates: [] };
    case ExtractionMode.BANK_TRANSACTIONS: return { transactions: [], openingBalance: 0, closingBalance: 0, accountNumber: '' };
    case ExtractionMode.CONTACTS: return { contacts: [] };
    case ExtractionMode.COMPANY_NAMES: return { companies: [] };
    case ExtractionMode.CUSTOM: return { raw: '' };
    default: return {};
  }
}
