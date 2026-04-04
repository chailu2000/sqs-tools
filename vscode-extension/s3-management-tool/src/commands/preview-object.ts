/**
 * Command: Preview text-based S3 object content in a read-only editor tab.
 *
 * Supports files with text-like extensions or text/* MIME types.
 * Capped at 50 KB to prevent loading large files into memory.
 */

import * as vscode from 'vscode';
import { S3Service } from '../services/s3-service';
import { S3ObjectItem } from '../views/s3-tree-provider';

const MAX_BYTES = 50 * 1024; // 50 KB

// Extensions that are considered "text-previewable"
const TEXT_EXTENSIONS = new Set([
    '.json', '.csv', '.txt', '.log', '.yaml', '.yml', '.xml', '.md',
    '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.less',
    '.py', '.sh', '.bash', '.zsh', '.ini', '.cfg', '.conf', '.toml',
    '.env', '.gitignore', '.dockerignore', '.sql', '.graphql', '.proto',
    '.tf', '.hcl', '.properties', '.plist', '.svg',
]);

// VS Code language ID mapping
const EXTENSION_LANGUAGE: Record<string, string> = {
    '.json': 'json',
    '.csv': 'csv',
    '.txt': 'plaintext',
    '.log': 'plaintext',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.md': 'markdown',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.py': 'python',
    '.sh': 'shellscript',
    '.bash': 'shellscript',
    '.zsh': 'shellscript',
    '.ini': 'properties',
    '.cfg': 'properties',
    '.conf': 'properties',
    '.toml': 'toml',
    '.env': 'properties',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.proto': 'proto3',
    '.tf': 'terraform',
    '.hcl': 'terraform',
    '.properties': 'properties',
    '.svg': 'xml',
};

// MIME type prefixes that indicate text content
const TEXT_MIME_PREFIXES = [
    'text/',
    'application/json',
    'application/xml',
    'application/x-yaml',
    'application/x-sh',
    'application/javascript',
    'application/typescript',
];

export async function previewObject(
    item: S3ObjectItem,
    s3Service: S3Service,
): Promise<void> {
    // Step 1: Fetch metadata for size and content type
    let metadata;
    try {
        metadata = await s3Service.headObject(item.bucket, item.key, item.region);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to get metadata for "${item.key}": ${msg}`);
        return;
    }

    // Step 2: Size guard
    if (metadata.size > MAX_BYTES) {
        vscode.window.showInformationMessage(
            `File "${item.key}" is ${formatSize(metadata.size)} — exceeds the 50 KB preview limit. Please download it instead.`,
        );
        return;
    }

    // Step 3: Previewability check
    const ext = getFileExtension(item.key);
    const isPreviewableByExt = TEXT_EXTENSIONS.has(ext);
    const isPreviewableByMime = metadata.contentType
        ? TEXT_MIME_PREFIXES.some(prefix => metadata.contentType!.startsWith(prefix))
        : false;

    if (!isPreviewableByExt && !isPreviewableByMime) {
        vscode.window.showInformationMessage(
            `File "${item.key}" appears to be binary or an unsupported format. Content type: ${metadata.contentType ?? 'unknown'}. Try downloading instead.`,
        );
        return;
    }

    // Step 4: Fetch content
    let content: string;
    try {
        content = await readStreamText(item, s3Service);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to read content of "${item.key}": ${msg}`);
        return;
    }

    // Step 5: Build preview with header
    const language = detectLanguage(item.key);
    const commentDelim = getCommentDelimiter(language);
    const header = `${commentDelim} S3 Preview: s3://${item.bucket}/${item.key}\n${commentDelim} Read-only — download to edit\n\n`;

    const doc = await vscode.workspace.openTextDocument({
        content: header + content,
        language,
    });

    await vscode.window.showTextDocument(doc, { preview: false });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readStreamText(
    item: S3ObjectItem,
    s3Service: S3Service,
): Promise<string> {
    const readStream = await s3Service.getObject(item.bucket, item.key, item.region);

    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of readStream as AsyncIterable<Buffer>) {
        totalBytes += chunk.length;
        if (totalBytes > MAX_BYTES) {
            // Truncate to limit
            const excess = totalBytes - MAX_BYTES;
            chunks.push(chunk.slice(0, chunk.length - excess));
            break;
        }
        chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString('utf-8');
}

function getFileExtension(key: string): string {
    const basename = key.includes('/')
        ? key.slice(key.lastIndexOf('/') + 1)
        : key;
    const dotIndex = basename.lastIndexOf('.');
    if (dotIndex >= 0) {
        return basename.slice(dotIndex).toLowerCase();
    }
    return '';
}

function detectLanguage(key: string): string {
    const ext = getFileExtension(key);
    return EXTENSION_LANGUAGE[ext] ?? 'plaintext';
}

function getCommentDelimiter(language: string): string {
    switch (language) {
        case 'html':
        case 'xml':
        case 'svg':
            return '<!-- -->';
        case 'css':
        case 'scss':
        case 'less':
            return '/* */';
        case 'python':
        case 'ruby':
        case 'shellscript':
        case 'yaml':
            return '#';
        case 'json':
        case 'toml':
        case 'properties':
        case 'terraform':
        case 'plaintext':
        case 'csv':
            return '//';
        case 'markdown':
            return '<!--';
        case 'graphql':
        case 'proto3':
        case 'sql':
            return '--';
        case 'javascript':
        case 'typescript':
        default:
            return '//';
    }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${Math.round(bytes / 1024)} KB`; }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
}
