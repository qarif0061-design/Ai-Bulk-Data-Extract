export class AppException extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'AppException';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthException extends AppException {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'AuthException';
  }
}

export class FirestoreException extends AppException {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'FirestoreException';
  }
}

export class StorageException extends AppException {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'StorageException';
  }
}

export class ExtractionException extends AppException {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'ExtractionException';
  }
}

export class CreditException extends AppException {
  constructor(message: string = 'Insufficient credits') {
    super(message, 'insufficient-credits');
    this.name = 'CreditException';
  }
}

export class FileException extends AppException {
  constructor(message: string, code: string = 'file-error') {
    super(message, code);
    this.name = 'FileException';
  }
}
