/**
 * Google Workspace Integration Service
 * Provides real document editing via Google Docs, Slides, Forms, and Sheets
 * 
 * Features:
 * - Create/edit books in Google Docs
 * - Create course presentations in Google Slides
 * - Build course quizzes with Google Forms
 * - Manage content data with Google Sheets
 * - Export to PDF, DOCX, PPTX formats
 */

interface GoogleWorkspaceConfig {
  docsApiKey: string;
  sheetsApiKey: string;
  formsApiKey: string;
  slidesApiKey: string;
  serviceAccountKey?: string;
}

interface DocumentMetadata {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  lastModified: string;
  mimeType: string;
}

interface CreateDocumentRequest {
  title: string;
  content?: string;
  templateId?: string;
}

interface CreateSlideRequest {
  title: string;
  slides?: Array<{
    title: string;
    content: string;
    notes?: string;
  }>;
}

interface CreateFormRequest {
  title: string;
  description?: string;
  questions: Array<{
    title: string;
    type: 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'dropdown';
    required: boolean;
    options?: string[];
  }>;
}

interface CreateSheetRequest {
  title: string;
  sheets?: Array<{
    name: string;
    headers: string[];
    data?: string[][];
  }>;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth 2.0 access token from service account
 */
async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  }

  const crypto = await import('crypto');
  let credentials;
  
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY format");
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
    scope: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ')
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');
  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token error: ${errorText}`);
  }

  const tokenData = await response.json() as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };

  return tokenData.access_token;
}

/**
 * Create a new Google Doc for book writing
 */
export async function createGoogleDoc(request: CreateDocumentRequest): Promise<DocumentMetadata> {
  const accessToken = await getAccessToken();

  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: request.title })
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create document: ${error}`);
  }

  const doc = await createResponse.json() as { documentId: string; title: string };

  if (request.content) {
    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          insertText: {
            location: { index: 1 },
            text: request.content
          }
        }]
      })
    });
  }

  return {
    id: doc.documentId,
    title: doc.title,
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mimeType: 'application/vnd.google-apps.document'
  };
}

/**
 * Get Google Doc content
 */
export async function getGoogleDoc(documentId: string): Promise<{ title: string; content: string; url: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get document: ${await response.text()}`);
  }

  const doc = await response.json() as any;
  
  let textContent = '';
  if (doc.body?.content) {
    for (const element of doc.body.content) {
      if (element.paragraph?.elements) {
        for (const e of element.paragraph.elements) {
          if (e.textRun?.content) {
            textContent += e.textRun.content;
          }
        }
      }
    }
  }

  return {
    title: doc.title,
    content: textContent,
    url: `https://docs.google.com/document/d/${documentId}/edit`
  };
}

/**
 * Update Google Doc content
 */
export async function updateGoogleDoc(documentId: string, content: string): Promise<boolean> {
  const accessToken = await getAccessToken();

  const docResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const doc = await docResponse.json() as any;
  const endIndex = doc.body?.content?.[doc.body.content.length - 1]?.endIndex || 2;

  if (endIndex > 2) {
    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          deleteContentRange: {
            range: { startIndex: 1, endIndex: endIndex - 1 }
          }
        }]
      })
    });
  }

  const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        insertText: {
          location: { index: 1 },
          text: content
        }
      }]
    })
  });

  return updateResponse.ok;
}

/**
 * Create Google Slides presentation for courses
 */
export async function createGoogleSlides(request: CreateSlideRequest): Promise<DocumentMetadata> {
  const accessToken = await getAccessToken();

  const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: request.title })
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create presentation: ${await createResponse.text()}`);
  }

  const presentation = await createResponse.json() as { presentationId: string; title: string };

  if (request.slides && request.slides.length > 0) {
    const requests: any[] = [];
    
    for (let i = 0; i < request.slides.length; i++) {
      const slide = request.slides[i];
      const slideId = `slide_${i}`;
      
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: i + 1,
          slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
        }
      });
    }

    await fetch(`https://slides.googleapis.com/v1/presentations/${presentation.presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  return {
    id: presentation.presentationId,
    title: request.title,
    url: `https://docs.google.com/presentation/d/${presentation.presentationId}/edit`,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mimeType: 'application/vnd.google-apps.presentation'
  };
}

/**
 * Create Google Sheet for course outlines/data
 */
export async function createGoogleSheet(request: CreateSheetRequest): Promise<DocumentMetadata> {
  const accessToken = await getAccessToken();

  const sheetsConfig: any = {
    properties: { title: request.title },
    sheets: request.sheets?.map((sheet, index) => ({
      properties: {
        sheetId: index,
        title: sheet.name,
        gridProperties: {
          rowCount: Math.max(100, (sheet.data?.length || 0) + 10),
          columnCount: Math.max(26, sheet.headers.length)
        }
      }
    })) || [{ properties: { title: 'Sheet1' } }]
  };

  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sheetsConfig)
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create spreadsheet: ${await createResponse.text()}`);
  }

  const spreadsheet = await createResponse.json() as { spreadsheetId: string; properties: { title: string } };

  if (request.sheets) {
    for (const sheet of request.sheets) {
      const values = [sheet.headers, ...(sheet.data || [])];
      
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.spreadsheetId}/values/${encodeURIComponent(sheet.name)}!A1:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );
    }
  }

  return {
    id: spreadsheet.spreadsheetId,
    title: spreadsheet.properties.title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mimeType: 'application/vnd.google-apps.spreadsheet'
  };
}

/**
 * Create Google Form for course quizzes
 */
export async function createGoogleForm(request: CreateFormRequest): Promise<DocumentMetadata> {
  const accessToken = await getAccessToken();

  const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: request.title,
        documentTitle: request.title
      }
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create form: ${await createResponse.text()}`);
  }

  const form = await createResponse.json() as { formId: string; info: { title: string } };

  if (request.questions.length > 0) {
    const requests = request.questions.map((q, index) => {
      const questionItem: any = {
        createItem: {
          item: {
            title: q.title,
            questionItem: {
              question: {
                required: q.required
              }
            }
          },
          location: { index }
        }
      };

      switch (q.type) {
        case 'short_answer':
          questionItem.createItem.item.questionItem.question.textQuestion = { paragraph: false };
          break;
        case 'paragraph':
          questionItem.createItem.item.questionItem.question.textQuestion = { paragraph: true };
          break;
        case 'multiple_choice':
          questionItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: q.options?.map(o => ({ value: o })) || []
          };
          break;
        case 'checkbox':
          questionItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'CHECKBOX',
            options: q.options?.map(o => ({ value: o })) || []
          };
          break;
        case 'dropdown':
          questionItem.createItem.item.questionItem.question.choiceQuestion = {
            type: 'DROP_DOWN',
            options: q.options?.map(o => ({ value: o })) || []
          };
          break;
      }

      return questionItem;
    });

    await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  return {
    id: form.formId,
    title: form.info.title,
    url: `https://docs.google.com/forms/d/${form.formId}/edit`,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mimeType: 'application/vnd.google-apps.form'
  };
}

/**
 * Export Google Doc to various formats
 */
export async function exportDocument(
  documentId: string, 
  format: 'pdf' | 'docx' | 'txt' | 'html',
  documentType: 'document' | 'presentation' | 'spreadsheet' = 'document'
): Promise<{ data: Buffer; mimeType: string; filename: string }> {
  const accessToken = await getAccessToken();
  
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    html: 'text/html',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  const exportMimeType = mimeTypes[format] || mimeTypes.pdf;
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to export document: ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  
  return {
    data: Buffer.from(arrayBuffer),
    mimeType: exportMimeType,
    filename: `export.${format}`
  };
}

/**
 * Check if Google Workspace APIs are configured
 */
export function isGoogleWorkspaceConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    (process.env.GOOGLE_DOCS_API_KEY && 
     process.env.GOOGLE_SHEETS_API_KEY && 
     process.env.GOOGLE_SLIDES_API_KEY)
  );
}

/**
 * Get configuration status for each service
 */
export function getWorkspaceStatus(): {
  docs: boolean;
  sheets: boolean;
  slides: boolean;
  forms: boolean;
  textToSpeech: boolean;
} {
  return {
    docs: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_DOCS_API_KEY,
    sheets: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_SHEETS_API_KEY,
    slides: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_SLIDES_API_KEY,
    forms: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_FORMS_API_KEY,
    textToSpeech: !!process.env.CLOUD_TEXT_TO_SPEECH_API_KEY
  };
}
