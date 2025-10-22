import { SQSEvent, Context } from 'aws-lambda';

// Mock all dependencies before importing handler
const mockExecute = jest.fn();
const mockSave = jest.fn();
const mockPublishSuccess = jest.fn();
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};

jest.mock('@infrastructure/repository/MysqlRepository', () => ({
    MysqlRepository: jest.fn().mockImplementation(() => ({
        save: mockSave
    }))
}));

jest.mock('@infrastructure/repository/EventBridgePublisher', () => ({
    EventBridgePublisher: jest.fn().mockImplementation(() => ({
        publishSuccess: mockPublishSuccess
    }))
}));

jest.mock('@infrastructure/utils/Logger', () => ({
    PinoLoggerAdapter: jest.fn().mockImplementation(() => mockLogger)
}));

jest.mock('@application/SaveMessage', () => ({
    SaveMessageUseCase: jest.fn().mockImplementation(() => ({
        execute: mockExecute
    }))
}));

// Import handler after mocks are set up
import { handler } from '@infrastructure/handler';

describe('SQS Handler - Event Processing', () => {
    let mockContext: Context;

    beforeEach(() => {
        // Setup environment variables
        process.env.SQS_QUEUE_NAME = 'test-queue-PE';
        
        // Reset all mocks
        jest.clearAllMocks();

        // Mock context
        mockContext = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'test-function',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
            memoryLimitInMB: '128',
            awsRequestId: 'test-request-id',
            logGroupName: '/aws/lambda/test-function',
            logStreamName: '2023/10/01/[$LATEST]test-stream',
            getRemainingTimeInMillis: () => 30000,
            done: jest.fn(),
            fail: jest.fn(),
            succeed: jest.fn()
        };
    });

    afterEach(() => {
        delete process.env.SQS_QUEUE_NAME;
    });

    describe('Successful message processing', () => {
        it('should process a single SQS message successfully', async () => {
            const sqsEvent: SQSEvent = {
                Records: [{
                    messageId: 'test-message-123',
                    receiptHandle: 'test-receipt-handle',
                    body: JSON.stringify({
                        insuredId: '12345',
                        scheduleId: '98701',
                        centerId: 101,
                        countryISO: 'PE'
                    }),
                    attributes: {
                        SentTimestamp: '1698845400000',
                        SenderId: 'test-sender',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1698845400000'
                    },
                    messageAttributes: {},
                    md5OfBody: 'test-md5',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue-PE',
                    awsRegion: 'us-east-1'
                }]
            };

            mockExecute.mockResolvedValue(undefined);

            await handler(sqsEvent, mockContext);

            expect(mockExecute).toHaveBeenCalledTimes(1);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'test-message-123',
                    data: {
                        insuredId: '12345',
                        scheduleId: '98701',
                        centerId: 101,
                        countryISO: 'PE'
                    },
                    queueSource: 'test-queue-PE',
                    timestamp: expect.any(String)
                })
            );
        });

        it('should process multiple SQS messages successfully', async () => {
            const sqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: 'test-message-1',
                        receiptHandle: 'test-receipt-handle-1',
                        body: JSON.stringify({
                            insuredId: '12345',
                            scheduleId: '98701'
                        }),
                        attributes: {
                            SentTimestamp: '1698845400000',
                            SenderId: 'test-sender',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1698845400000'
                        },
                        messageAttributes: {},
                        md5OfBody: 'test-md5-1',
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue-PE',
                        awsRegion: 'us-east-1'
                    },
                    {
                        messageId: 'test-message-2',
                        receiptHandle: 'test-receipt-handle-2',
                        body: JSON.stringify({
                            insuredId: '67890',
                            scheduleId: '98702'
                        }),
                        attributes: {
                            SentTimestamp: '1698845460000',
                            SenderId: 'test-sender',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1698845460000'
                        },
                        messageAttributes: {},
                        md5OfBody: 'test-md5-2',
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue-PE',
                        awsRegion: 'us-east-1'
                    }
                ]
            };

            mockExecute.mockResolvedValue(undefined);

            await handler(sqsEvent, mockContext);

            expect(mockExecute).toHaveBeenCalledTimes(2);
            expect(mockExecute).toHaveBeenNthCalledWith(1, 
                expect.objectContaining({
                    id: 'test-message-1',
                    data: { insuredId: '12345', scheduleId: '98701' }
                })
            );
            expect(mockExecute).toHaveBeenNthCalledWith(2,
                expect.objectContaining({
                    id: 'test-message-2',
                    data: { insuredId: '67890', scheduleId: '98702' }
                })
            );
        });

        it('should use default queue name when SQS_QUEUE_NAME is not set', async () => {
            delete process.env.SQS_QUEUE_NAME;

            const sqsEvent: SQSEvent = {
                Records: [{
                    messageId: 'test-message-123',
                    receiptHandle: 'test-receipt-handle',
                    body: JSON.stringify({ test: 'data' }),
                    attributes: {
                        SentTimestamp: '1698845400000',
                        SenderId: 'test-sender',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1698845400000'
                    },
                    messageAttributes: {},
                    md5OfBody: 'test-md5',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                    awsRegion: 'us-east-1'
                }]
            };

            mockExecute.mockResolvedValue(undefined);

            await handler(sqsEvent, mockContext);

            expect(mockExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    queueSource: 'UnknownQueue'
                })
            );
        });
    });

    describe('Error handling', () => {
        it('should throw error when message processing fails', async () => {
            const sqsEvent: SQSEvent = {
                Records: [{
                    messageId: 'test-message-123',
                    receiptHandle: 'test-receipt-handle',
                    body: JSON.stringify({ test: 'data' }),
                    attributes: {
                        SentTimestamp: '1698845400000',
                        SenderId: 'test-sender',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1698845400000'
                    },
                    messageAttributes: {},
                    md5OfBody: 'test-md5',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                    awsRegion: 'us-east-1'
                }]
            };

            const saveError = new Error('Database save failed');
            mockExecute.mockRejectedValue(saveError);

            await expect(handler(sqsEvent, mockContext)).rejects.toThrow('Database save failed');
            expect(mockExecute).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid JSON in message body', async () => {
            const sqsEvent: SQSEvent = {
                Records: [{
                    messageId: 'test-message-123',
                    receiptHandle: 'test-receipt-handle',
                    body: 'invalid-json{',
                    attributes: {
                        SentTimestamp: '1698845400000',
                        SenderId: 'test-sender',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1698845400000'
                    },
                    messageAttributes: {},
                    md5OfBody: 'test-md5',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                    awsRegion: 'us-east-1'
                }]
            };

            await expect(handler(sqsEvent, mockContext)).rejects.toThrow();
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it('should continue processing other messages when one fails', async () => {
            const sqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: 'test-message-1',
                        receiptHandle: 'test-receipt-handle-1',
                        body: JSON.stringify({ test: 'data1' }),
                        attributes: {
                            SentTimestamp: '1698845400000',
                            SenderId: 'test-sender',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1698845400000'
                        },
                        messageAttributes: {},
                        md5OfBody: 'test-md5-1',
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                        awsRegion: 'us-east-1'
                    },
                    {
                        messageId: 'test-message-2',
                        receiptHandle: 'test-receipt-handle-2',
                        body: JSON.stringify({ test: 'data2' }),
                        attributes: {
                            SentTimestamp: '1698845460000',
                            SenderId: 'test-sender',
                            ApproximateReceiveCount: '1',
                            ApproximateFirstReceiveTimestamp: '1698845460000'
                        },
                        messageAttributes: {},
                        md5OfBody: 'test-md5-2',
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                        awsRegion: 'us-east-1'
                    }
                ]
            };

            // First message fails, second would succeed but loop breaks
            mockExecute
                .mockRejectedValueOnce(new Error('First message failed'))
                .mockResolvedValueOnce(undefined);

            await expect(handler(sqsEvent, mockContext)).rejects.toThrow('First message failed');
            expect(mockExecute).toHaveBeenCalledTimes(1);
        });
    });

    describe('Message timestamp processing', () => {
        it('should correctly convert timestamp to ISO string', async () => {
            const sqsEvent: SQSEvent = {
                Records: [{
                    messageId: 'test-message-123',
                    receiptHandle: 'test-receipt-handle',
                    body: JSON.stringify({ test: 'data' }),
                    attributes: {
                        SentTimestamp: '1577836800000', // 2020-01-01T00:00:00.000Z
                        SenderId: 'test-sender',
                        ApproximateReceiveCount: '1',
                        ApproximateFirstReceiveTimestamp: '1577836800000'
                    },
                    messageAttributes: {},
                    md5OfBody: 'test-md5',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
                    awsRegion: 'us-east-1'
                }]
            };

            mockExecute.mockResolvedValue(undefined);

            await handler(sqsEvent, mockContext);

            expect(mockExecute).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: '2020-01-01T00:00:00.000Z'
                })
            );
        });
    });
});