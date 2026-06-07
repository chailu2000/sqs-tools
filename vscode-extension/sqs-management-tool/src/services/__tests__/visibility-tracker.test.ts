import { VisibilityTracker, TrackedMessage } from '../visibility-tracker';
import { ISQSService } from '../../models/sqs-service';

describe('VisibilityTracker', () => {
    let mockSqsService: jest.Mocked<ISQSService>;
    let mockGetSqsService: jest.Mock;
    let tracker: VisibilityTracker;

    beforeEach(() => {
        mockSqsService = {
            changeMessageVisibility: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockGetSqsService = jest.fn().mockReturnValue(mockSqsService);
        tracker = new VisibilityTracker(mockGetSqsService);
    });

    it('should correctly track and count messages', () => {
        const msg1: TrackedMessage = {
            receiptHandle: 'receipt-1',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
            region: 'us-east-1'
        };

        const msg2: TrackedMessage = {
            receiptHandle: 'receipt-2',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
            region: 'us-east-1'
        };

        expect(tracker.getTrackedCount('panel-1')).toBe(0);

        tracker.trackMessage('panel-1', msg1);
        expect(tracker.getTrackedCount('panel-1')).toBe(1);

        tracker.trackMessage('panel-1', msg2);
        expect(tracker.getTrackedCount('panel-1')).toBe(2);

        // Tracking duplicates should not increase count
        tracker.trackMessage('panel-1', msg1);
        expect(tracker.getTrackedCount('panel-1')).toBe(2);
    });

    it('should support tracking different panels independently', () => {
        const msg1: TrackedMessage = {
            receiptHandle: 'receipt-1',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue-1',
            region: 'us-east-1'
        };

        const msg2: TrackedMessage = {
            receiptHandle: 'receipt-2',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue-2',
            region: 'us-east-1'
        };

        tracker.trackMessage('panel-1', msg1);
        tracker.trackMessage('panel-2', msg2);

        expect(tracker.getTrackedCount('panel-1')).toBe(1);
        expect(tracker.getTrackedCount('panel-2')).toBe(1);
    });

    it('should untrack specific messages correctly', () => {
        const msg1: TrackedMessage = {
            receiptHandle: 'receipt-1',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
            region: 'us-east-1'
        };

        const msg2: TrackedMessage = {
            receiptHandle: 'receipt-2',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue',
            region: 'us-east-1'
        };

        tracker.trackMessage('panel-1', msg1);
        tracker.trackMessage('panel-1', msg2);
        expect(tracker.getTrackedCount('panel-1')).toBe(2);

        tracker.untrackMessage('panel-1', 'receipt-1');
        expect(tracker.getTrackedCount('panel-1')).toBe(1);

        // Attempting to untrack non-existent message shouldn't fail
        tracker.untrackMessage('panel-1', 'receipt-3');
        expect(tracker.getTrackedCount('panel-1')).toBe(1);

        tracker.untrackMessage('panel-1', 'receipt-2');
        expect(tracker.getTrackedCount('panel-1')).toBe(0);
    });

    it('should reset visibility of all tracked messages and clear tracking list', async () => {
        const msg1: TrackedMessage = {
            receiptHandle: 'receipt-1',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue-1',
            region: 'us-east-1'
        };

        const msg2: TrackedMessage = {
            receiptHandle: 'receipt-2',
            queueUrl: 'https://sqs.us-west-2.amazonaws.com/123/queue-2',
            region: 'us-west-2'
        };

        tracker.trackMessage('panel-1', msg1);
        tracker.trackMessage('panel-1', msg2);

        await tracker.resetVisibilityForPanel('panel-1');

        // SQS service factory should be called with correct regions
        expect(mockGetSqsService).toHaveBeenCalledWith('us-east-1');
        expect(mockGetSqsService).toHaveBeenCalledWith('us-west-2');

        // SQS service changeMessageVisibility should be called for each message
        expect(mockSqsService.changeMessageVisibility).toHaveBeenCalledWith(
            'https://sqs.us-east-1.amazonaws.com/123/queue-1',
            'receipt-1',
            0
        );
        expect(mockSqsService.changeMessageVisibility).toHaveBeenCalledWith(
            'https://sqs.us-west-2.amazonaws.com/123/queue-2',
            'receipt-2',
            0
        );

        // Tracker list should be cleared
        expect(tracker.getTrackedCount('panel-1')).toBe(0);
    });

    it('should handle client errors gracefully and continue resetting other messages', async () => {
        const msg1: TrackedMessage = {
            receiptHandle: 'receipt-1',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue-1',
            region: 'us-east-1'
        };

        const msg2: TrackedMessage = {
            receiptHandle: 'receipt-2',
            queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/queue-2',
            region: 'us-east-1'
        };

        tracker.trackMessage('panel-1', msg1);
        tracker.trackMessage('panel-1', msg2);

        // Fail for the first message, succeed for the second
        mockSqsService.changeMessageVisibility.mockRejectedValueOnce(new Error('AWS SQS Error'));

        // Silence console.error in tests
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await tracker.resetVisibilityForPanel('panel-1');

        // Both visibility reset calls should have been attempted
        expect(mockSqsService.changeMessageVisibility).toHaveBeenCalledTimes(2);
        expect(mockSqsService.changeMessageVisibility).toHaveBeenCalledWith(
            'https://sqs.us-east-1.amazonaws.com/123/queue-2',
            'receipt-2',
            0
        );

        // Console.error should be called once with the first message error
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();

        // Tracker list should be cleared
        expect(tracker.getTrackedCount('panel-1')).toBe(0);
    });
});
