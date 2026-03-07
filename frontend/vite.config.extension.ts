import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// Build configuration for VS Code extension webview
export default defineConfig({
    plugins: [svelte()],
    build: {
        outDir: '../vscode-extension/sqs-management-tool/media',
        emptyOutDir: false, // Don't delete existing files in media folder
        rollupOptions: {
            input: path.resolve(__dirname, 'src/extension-entry.ts'),
            output: {
                entryFileNames: 'bundle.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'style.css') return 'sqs-management-tool-frontend.css';
                    return assetInfo.name || 'asset';
                },
                // Use iife format for webview
                format: 'iife',
                // Inline all assets to avoid path issues
                inlineDynamicImports: true
            }
        },
        // Ensure compatibility with VS Code webview
        target: 'es2020',
        minify: false, // Easier debugging during development
        sourcemap: true
    }
})
