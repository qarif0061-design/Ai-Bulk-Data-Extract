export const COLLECTIONS = {
  USERS: 'users',
  JOBS: 'jobs',
  EXTRACTED_DATA: 'extractedData',
  CONFIG: 'config',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

export const USER_FIELDS = {
  UID: 'uid',
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PHOTO_URL: 'photoURL',
  IS_ANONYMOUS: 'isAnonymous',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  SUBSCRIPTION_TIER: 'subscriptionTier',
  CREDITS_REMAINING: 'creditsRemaining',
  CREDITS_USED: 'creditsUsed',
  TOTAL_FILES_PROCESSED: 'totalFilesProcessed',
} as const;

export const JOB_FIELDS = {
  ID: 'id',
  USER_ID: 'userId',
  TITLE: 'title',
  STATUS: 'status',
  EXTRACTION_MODE: 'extractionMode',
  FILES: 'files',
  FILE_COUNT: 'fileCount',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  COMPLETED_AT: 'completedAt',
  RESULT_COUNT: 'resultCount',
  TOTAL_CREDITS_USED: 'totalCreditsUsed',
  ERROR_MESSAGE: 'errorMessage',
  CUSTOM_PROMPT: 'customPrompt',
} as const;

export const EXTRACTED_DATA_FIELDS = {
  ID: 'id',
  JOB_ID: 'jobId',
  USER_ID: 'userId',
  FILE_NAME: 'fileName',
  FILE_INDEX: 'fileIndex',
  DATA: 'data',
  RAW_RESPONSE: 'rawResponse',
  TOKENS_USED: 'tokensUsed',
  CREATED_AT: 'createdAt',
} as const;
