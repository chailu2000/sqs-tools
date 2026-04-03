/**
 * Command: Upload object(s)
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { S3Service } from '../services/s3-service';
import { S3TreeProvider, S3BucketItem, S3PrefixItem } from '../views/s3-tree-provider';

const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5 MB

export async function uploadObject(
    context: S3PrefixItem | S3BucketItem | undefined,
    s3Service: S3Service,
    treeProvider: S3TreeProvider,
): Promise<void> {
    const fileUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true,
        openLabel: 'Upload',
    });

    if (!fileUris || fileUris.length === 0) {
        return;
    }

    // Determine default prefix from context
    let defaultPrefix = '';
    let bucket = '';
    let region = '';
    let configuredPrefix = '';

    if (context instanceof S3PrefixItem) {
        defaultPrefix = context.prefix;
        bucket = context.bucket;
        region = context.region;
        configuredPrefix = context.bucketConfig?.prefix ?? '';
    } else if (context instanceof S3BucketItem) {
        bucket = context.config.name;
        region = context.config.region;
        configuredPrefix = context.config.prefix ?? '';
        defaultPrefix = configuredPrefix;
    }

    if (!bucket) {
        vscode.window.showErrorMessage('No bucket context selected. Please select a bucket or prefix in the tree.');
        return;
    }

    const destinationPrefix = await vscode.window.showInputBox({
        prompt: 'Destination prefix (folder path in S3)',
        placeHolder: 'folder/subfolder/',
        value: defaultPrefix,
    });

    if (destinationPrefix === undefined) {
        return;
    }

    // Prepend configured prefix scope if not already present
    const effectivePrefix = resolveDestinationPrefix(destinationPrefix, configuredPrefix);

    let refreshNode: S3PrefixItem | S3BucketItem | undefined = context;

    for (const fileUri of fileUris) {
        const filePath = fileUri.fsPath;
        const filename = path.basename(filePath);
        const destKey = effectivePrefix ? `${effectivePrefix}${filename}` : filename;

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Uploading ${filename}…`,
                cancellable: false,
            },
            async (progress) => {
                try {
                    const stat = fs.statSync(filePath);

                    if (stat.size > MULTIPART_THRESHOLD) {
                        await s3Service.putObjectMultipart(
                            bucket,
                            destKey,
                            filePath,
                            region,
                            (bytesTransferred, totalBytes) => {
                                const pct = Math.round((bytesTransferred / totalBytes) * 100);
                                progress.report({ message: `${pct}%` });
                            },
                        );
                    } else {
                        const body = fs.readFileSync(filePath);
                        await s3Service.putObject(bucket, destKey, body, region);
                    }
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Failed to upload "${filename}": ${msg}`);
                }
            },
        );
    }

    treeProvider.refresh(refreshNode);
}

function resolveDestinationPrefix(prefix: string, configuredPrefix: string): string {
    if (!configuredPrefix) {
        return prefix;
    }
    if (prefix.startsWith(configuredPrefix)) {
        return prefix;
    }
    return configuredPrefix + prefix;
}
