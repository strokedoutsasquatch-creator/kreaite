import mammoth from 'mammoth';
// @ts-ignore - pdf-parse has complex exports
const pdfParse = require('pdf-parse');

export interface ParsedDocument {
  content: string;
  metadata: {
    format: string;
    wordCount: number;
    pageCount?: number;
    title?: string;
    author?: string;
    language?: string;
  };
}

export async function parseDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocument> {
  let content = '';
  let metadata: ParsedDocument['metadata'] = {
    format: mimeType,
    wordCount: 0,
  };

  try {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        filename.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      metadata.format = 'docx';
    } else if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
      const result = await pdfParse(buffer);
      content = result.text;
      metadata.format = 'pdf';
      metadata.pageCount = result.numpages;
      if (result.info) {
        metadata.title = result.info.Title;
        metadata.author = result.info.Author;
      }
    } else if (mimeType === 'text/plain' || filename.endsWith('.txt')) {
      content = buffer.toString('utf-8');
      metadata.format = 'txt';
    } else if (mimeType === 'text/markdown' || filename.endsWith('.md')) {
      content = buffer.toString('utf-8');
      metadata.format = 'markdown';
    } else if (mimeType === 'text/html' || filename.endsWith('.html')) {
      content = buffer.toString('utf-8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      metadata.format = 'html';
    } else if (mimeType.startsWith('text/') || 
               filename.endsWith('.js') || filename.endsWith('.ts') || 
               filename.endsWith('.py') || filename.endsWith('.json') ||
               filename.endsWith('.css') || filename.endsWith('.jsx') ||
               filename.endsWith('.tsx') || filename.endsWith('.go') ||
               filename.endsWith('.rs') || filename.endsWith('.java') ||
               filename.endsWith('.cpp') || filename.endsWith('.c') ||
               filename.endsWith('.rb') || filename.endsWith('.php')) {
      content = buffer.toString('utf-8');
      metadata.format = 'code';
      metadata.language = getCodeLanguage(filename);
    } else {
      content = buffer.toString('utf-8');
      metadata.format = 'unknown';
    }

    metadata.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    return { content, metadata };
  } catch (error) {
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getCodeLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'json': 'json',
    'css': 'css',
    'html': 'html',
    'md': 'markdown',
  };
  return languages[ext || ''] || 'text';
}

export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'py': 'text/x-python',
    'json': 'application/json',
    'css': 'text/css',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export function isSupported(filename: string): boolean {
  const supportedExtensions = [
    'pdf', 'docx', 'doc', 'txt', 'md', 'html',
    'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs',
    'java', 'cpp', 'c', 'php', 'json', 'css'
  ];
  const ext = filename.split('.').pop()?.toLowerCase();
  return supportedExtensions.includes(ext || '');
}
