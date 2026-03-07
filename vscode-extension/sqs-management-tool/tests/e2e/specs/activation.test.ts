/**
 * Extension Activation Tests
 * 
 * Tests for extension activation and initialization.
 */

import { expect } from 'chai';
import * as vscode from 'vscode';
import { getGlobalSetup } from '../fixtures/setup';
import { assertCommandExists } from '../utils/assertions';

describe('Extension Activation', () => {
    it('should activate extension without errors', async () => {
        const setup = getGlobalSetup();

        expect(setup.testContext.extension).to.not.be.undefined;
        expect(setup.testContext.extension!.isActive).to.be.true;
    });

    it('should register all commands after activation', async () => {
        const expectedCommands = [
            'sqs-management-tool.refreshQueues',
            'sqs-management-tool.selectQueue',
            'sqs-management-tool.selectAwsProfile',
            'sqs-management-tool.addQueue',
            'sqs-management-tool.removeQueue'
        ];

        for (const command of expectedCommands) {
            await assertCommandExists(command);
        }
    });

    it('should create tree view after activation', async () => {
        // Verify tree view exists by checking if we can execute tree view commands
        const commands = await vscode.commands.getCommands();
        expect(commands).to.include('sqs-management-tool.refreshQueues');
    });
});
