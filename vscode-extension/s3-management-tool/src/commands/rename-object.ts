/**
 * Command: Rename S3 object or prefix (folder)
 *
 * S3 doesn't support rename natively, so this is implemented as:
 * 1. Copy object(s) to new key
 * 2. Delete original object(s)
 *
 * For prefixes (folders), all objects under the prefix are renamed recursively.
 */

import * as vscode from 'vscode';
import { S3Service } from '../services/s3-service';
import { S3ObjectItem, S3PrefixItem, S3TreeProvider } from '../views/s3-tree-provider';

export async function renameObject(
    item: S3ObjectItem | S3PrefixItem,
    s3Service: S3Service,
    treeProvider: S3TreeProvider,
): Promise<void> {
    // Determine current name
    let currentName: string;
    let isPrefix = false;

    if (item instanceof S3ObjectItem) {
        currentName = item.key.split('/').pop()!;
    } else {
        isPrefix = true;
        const prefix = item.prefix;
        currentName = prefix.endsWith('/') ? prefix.slice(0, -1).split('/').pop()! : prefix.split('/').pop()!;
    }

    // Prompt for new name
    const newName = await vscode.window.showInputBox({
        prompt: `Enter new name for "${currentName}"`,
        value: currentName,
        placeHolder: isPrefix ? 'folder-name' : 'file-name.ext',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Name cannot be empty';
            }
            if (value.includes('/')) {
                return 'Name cannot contain "/" (use a different prefix to reorganize)';
            }
            return null;
        },
    });

    if (!newName || newName.trim() === currentName) {
        return; // User cancelled or no change
    }

    const trimmedNewName = newName.trim();

    // Confirm the operation
    const action = isPrefix ? 'Rename folder' : 'Rename file';
    const confirm = await vscode.window.showWarningMessage(
        `${action} "${currentName}" to "${trimmedNewName}"?\n\nThis will copy the object(s) to the new name and delete the original.`,
        { modal: true },
        'Rename',
    );

    if (!confirm) {
        return;
    }

    try {
        if (isPrefix) {
            await renamePrefix(item as S3PrefixItem, trimmedNewName, s3Service, treeProvider);
        } else {
            await renameSingleObject(item as S3ObjectItem, trimmedNewName, s3Service, treeProvider);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to rename "${currentName}": ${msg}`);
    }
}

async function renameSingleObject(
    item: S3ObjectItem,
    newName: string,
    s3Service: S3Service,
    treeProvider: S3TreeProvider,
): Promise<void> {
    const parts = item.key.split('/');
    parts[parts.length - 1] = newName;
    const newKey = parts.join('/');

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Renaming "${item.key.split('/').pop()}" to "${newName}"...`,
        },
        async () => {
            // 1. Copy to new key
            await s3Service.copyObject(
                item.bucket,
                item.key,
                item.bucket,
                newKey,
                item.region,
                item.region,
            );

            // 2. Delete original
            await s3Service.deleteObject(item.bucket, item.key, item.region);
        },
    );

    vscode.window.showInformationMessage(`Renamed to "${newKey}"`);
    treeProvider.refresh();
}

async function renamePrefix(
    item: S3PrefixItem,
    newName: string,
    s3Service: S3Service,
    treeProvider: S3TreeProvider,
): Promise<void> {
    const srcPrefix = item.prefix;
    const parentPrefix = srcPrefix.endsWith('/')
        ? srcPrefix.slice(0, -1).split('/').slice(0, -1).join('/')
        : srcPrefix.split('/').slice(0, -1).join('/');
    const destPrefix = parentPrefix ? `${parentPrefix}/${newName}/` : `${newName}/`;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Renaming folder "${srcPrefix.split('/').filter(Boolean).pop()}" to "${newName}"...`,
            cancellable: false,
        },
        async (progress) => {
            let copied = 0;
            let errors = 0;
            const errorDetails: string[] = [];

            // List all objects under the source prefix
            let continuationToken: string | undefined;
            const objectsToRename: Array<{ key: string }> = [];

            do {
                const page = await s3Service.listObjects(
                    item.bucket,
                    srcPrefix,
                    item.region,
                    continuationToken,
                );

                objectsToRename.push(...page.objects.map(obj => ({ key: obj.key })));
                continuationToken = page.nextContinuationToken;
            } while (continuationToken);

            progress.report({ message: `Found ${objectsToRename.length} object(s) to rename...` });

            // Copy each object to the new prefix
            for (let i = 0; i < objectsToRename.length; i++) {
                const obj = objectsToRename[i];
                progress.report({ message: `[${i + 1}/${objectsToRename.length}] ${obj.key}` });

                try {
                    // Calculate new key
                    const relativeKey = obj.key.startsWith(srcPrefix)
                        ? obj.key.slice(srcPrefix.length)
                        : obj.key;
                    const newKey = destPrefix + relativeKey;

                    // Copy to new key
                    await s3Service.copyObject(
                        item.bucket,
                        obj.key,
                        item.bucket,
                        newKey,
                        item.region,
                        item.region,
                    );

                    copied++;
                } catch (err) {
                    errors++;
                    const msg = err instanceof Error ? err.message : String(err);
                    errorDetails.push(`${obj.key}: ${msg}`);
                }
            }

            // Delete all originals (only if all copies succeeded)
            if (errors === 0) {
                for (let i = 0; i < objectsToRename.length; i++) {
                    const obj = objectsToRename[i];
                    progress.report({ message: `Deleting ${i + 1}/${objectsToRename.length}...` });

                    try {
                        await s3Service.deleteObject(item.bucket, obj.key, item.region);
                    } catch {
                        // Best-effort cleanup — log but don't fail
                    }
                }

                // Also delete the folder placeholder object (zero-byte object ending with /)
                // This is filtered out by listObjects so we need to delete it explicitly
                try {
                    await s3Service.deleteObject(item.bucket, srcPrefix, item.region);
                } catch {
                    // Folder placeholder may not exist — that's OK
                }
            }

            if (errors > 0) {
                throw new Error(`Failed to copy ${errors} object(s):\n${errorDetails.join('\n')}`);
            }
        },
    );

    vscode.window.showInformationMessage(`Renamed folder to "${newName}"`);
    treeProvider.refresh();
}
