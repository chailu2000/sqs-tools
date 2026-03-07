// Mock VS Code API
jest.mock('vscode', () => ({
    window: {
        showInputBox: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        createOutputChannel: jest.fn(() => ({
            appendLine: jest.fn(),
            show: jest.fn(),
            dispose: jest.fn()
        }))
    },
    commands: {
        registerCommand: jest.fn()
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn()
        }))
    },
    Uri: {
        file: jest.fn((path) => ({ fsPath: path })),
        parse: jest.fn((uri) => ({ fsPath: uri }))
    }
}), { virtual: true });
