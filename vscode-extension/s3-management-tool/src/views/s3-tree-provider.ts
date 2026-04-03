/**
 * S3TreeProvider — implements vscode.TreeDataProvider<S3TreeItem>
 *
 * Tree hierarchy:
 *   S3BucketItem  (contextValue: 's3Bucket')
 *     S3PrefixItem  (contextValue: 's3Prefix')
 *     S3ObjectItem  (contextValue: 's3Object')
 *     S3ErrorItem   (contextValue: 's3Error')  — rendered on AccessDenied
 *
 * Requirements: 1.3, 1.4, 6.1, 6.2, 6.5, 6.6, 18.5
 */

import * as vscode from 'vscode';
import { BucketStorage } from '../services/bucket-storage';
import { S3Service } from '../services/s3-service';
import { BucketConfig } from '../models/s3-models';

// ---------------------------------------------------------------------------
// Tree item types
// ---------------------------------------------------------------------------

export type S3TreeItem = S3BucketItem | S3PrefixItem | S3ObjectItem | S3ErrorItem;

export class S3BucketItem extends vscode.TreeItem {
    readonly contextValue = 's3Bucket';

    constructor(public readonly config: BucketConfig) {
        super(config.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = config.region;
        this.iconPath = new vscode.ThemeIcon('database');
        this.tooltip = `${config.name} (${config.region})`;
    }
}

export class S3PrefixItem extends vscode.TreeItem {
    readonly contextValue = 's3Prefix';

    constructor(
        public readonly bucket: string,
        public readonly region: string,
        public readonly prefix: string,
        public readonly bucketConfig?: BucketConfig,
    ) {
        // Label is the last non-empty segment of the prefix
        const label = S3PrefixItem.labelFromPrefix(prefix);
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon('folder');
        this.tooltip = prefix;
    }

    private static labelFromPrefix(prefix: string): string {
        // prefix always ends with '/', e.g. "foo/bar/"
        const trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
        const lastSlash = trimmed.lastIndexOf('/');
        return lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
    }
}

export class S3ObjectItem extends vscode.TreeItem {
    readonly contextValue = 's3Object';

    constructor(
        public readonly bucket: string,
        public readonly region: string,
        public readonly key: string,
        public readonly size: number,
        public readonly lastModified: Date,
    ) {
        // Label is the filename (last segment of key)
        const lastSlash = key.lastIndexOf('/');
        const label = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = `${formatSize(size)}  ${lastModified.toLocaleDateString()}`;
        this.iconPath = new vscode.ThemeIcon('file');
        this.tooltip = key;
    }
}

export class S3ErrorItem extends vscode.TreeItem {
    readonly contextValue = 's3Error';

    constructor(message: string) {
        super(message, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('error');
        this.tooltip = message;
    }
}

// ---------------------------------------------------------------------------
// Size formatter
// ---------------------------------------------------------------------------

export function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
}

// ---------------------------------------------------------------------------
// S3TreeProvider
// ---------------------------------------------------------------------------

export class S3TreeProvider implements vscode.TreeDataProvider<S3TreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<S3TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private readonly storage: BucketStorage,
        private readonly s3Service: S3Service,
    ) { }

    /**
     * Fires onDidChangeTreeData for the given item (or the full tree if undefined).
     */
    refresh(item?: S3TreeItem): void {
        this._onDidChangeTreeData.fire(item);
    }

    getTreeItem(element: S3TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: S3TreeItem): Promise<S3TreeItem[]> {
        // Root level — return bucket nodes
        if (!element) {
            const buckets = await this.storage.getBuckets();
            return buckets.map(config => new S3BucketItem(config));
        }

        // Bucket node — list root objects/prefixes
        if (element instanceof S3BucketItem) {
            return this.listChildren(
                element.config.name,
                element.config.region,
                element.config.prefix ?? '',
                element.config,
            );
        }

        // Prefix node — list objects/prefixes under this prefix
        if (element instanceof S3PrefixItem) {
            return this.listChildren(
                element.bucket,
                element.region,
                element.prefix,
                element.bucketConfig,
            );
        }

        // Object node — leaf, no children
        return [];
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private async listChildren(
        bucket: string,
        region: string,
        prefix: string,
        bucketConfig?: BucketConfig,
    ): Promise<S3TreeItem[]> {
        const page = await this.s3Service.listObjects(bucket, prefix, region, undefined, bucketConfig);

        if ((page as { accessDenied?: boolean }).accessDenied) {
            return [new S3ErrorItem(`Access denied to "${bucket}/${prefix}"`)];
        }

        const prefixItems: S3PrefixItem[] = page.commonPrefixes.map(
            p => new S3PrefixItem(bucket, region, p, bucketConfig),
        );

        const objectItems: S3ObjectItem[] = page.objects.map(
            obj => new S3ObjectItem(bucket, region, obj.key, obj.size, obj.lastModified),
        );

        return [...prefixItems, ...objectItems];
    }
}
