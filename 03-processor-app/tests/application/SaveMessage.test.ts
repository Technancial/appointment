import { SaveMessageUseCase } from '@application/SaveMessage';
import { IDBRepository, IEventPublisher, ProcessedMessage } from '@domain/entities';
import { ILogger } from '@domain/Logger';

describe('SaveMessageUseCase - DB Persistence and EventBridge Notification', () => {
    let saveMessageUseCase: SaveMessageUseCase;
    let mockDBRepository: jest.Mocked<IDBRepository>;
    let mockEventPublisher: jest.Mocked<IEventPublisher>;
    let mockLogger: jest.Mocked<ILogger>;

    beforeEach(() => {
        mockDBRepository = {
            save: jest.fn()
        };

        mockEventPublisher = {
            publishSuccess: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        };

        saveMessageUseCase = new SaveMessageUseCase(
            mockDBRepository,
            mockEventPublisher,
            mockLogger
        );
    });

    describe('Successful execution', () => {
        it('should save message to DB and publish success event', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'test-message-123',
                data: {
                    insuredId: '12345',
                    scheduleId: '98701',
                    centerId: 101,
                    specialtyId: 105,
                    medicId: 201,
                    date: '2025-12-25T10:00:00Z',
                    countryISO: 'PE'
                },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T17:30:00.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            expect(mockLogger.info).toHaveBeenCalledWith(`SaveMessage: ${JSON.stringify(processedMessage)}`);
            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
        });

        it('should handle Chilean queue messages', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'test-message-456',
                data: {
                    insuredId: '67890',
                    scheduleId: '98702',
                    centerId: 201,
                    countryISO: 'CL'
                },
                queueSource: 'queue-CL',
                timestamp: '2023-11-02T10:15:30.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
            expect(mockLogger.info).toHaveBeenCalledTimes(1);
        });

        it('should handle messages with complex appointment data', async () => {
            const complexAppointmentData = {
                insuredId: '54321',
                scheduleId: '98703',
                centerId: 301,
                specialtyId: 105,
                medicId: 401,
                date: '2025-12-26T14:30:00Z',
                countryISO: 'PE',
                additionalInfo: {
                    patientName: 'Juan Pérez',
                    specialty: 'Cardiología',
                    medicName: 'Dr. García'
                }
            };

            const processedMessage: ProcessedMessage = {
                id: 'complex-message-789',
                data: complexAppointmentData,
                queueSource: 'queue-PE',
                timestamp: '2023-11-03T08:45:15.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
        });
    });

    describe('Error handling', () => {
        it('should throw error when DB save fails', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'test-message-123',
                data: { test: 'data' },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T17:30:00.000Z'
            };

            const dbError = new Error('Database connection failed');
            mockDBRepository.save.mockRejectedValue(dbError);

            await expect(saveMessageUseCase.execute(processedMessage)).rejects.toThrow('Database connection failed');

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith(`SaveMessage: ${JSON.stringify(processedMessage)}`);
        });

        it('should throw error when EventBridge publish fails', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'test-message-123',
                data: { test: 'data' },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T17:30:00.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            
            const eventBridgeError = new Error('EventBridge publish failed');
            mockEventPublisher.publishSuccess.mockRejectedValue(eventBridgeError);

            await expect(saveMessageUseCase.execute(processedMessage)).rejects.toThrow('EventBridge publish failed');

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
        });

        it('should handle concurrent failures in DB and EventBridge', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'test-message-123',
                data: { test: 'data' },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T17:30:00.000Z'
            };

            // First call fails at DB, so EventBridge is never called
            const dbError = new Error('Database not found');
            mockDBRepository.save.mockRejectedValue(dbError);

            await expect(saveMessageUseCase.execute(processedMessage)).rejects.toThrow('Database not found');

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).not.toHaveBeenCalled();
        });
    });

    describe('Integration workflow', () => {
        it('should execute complete workflow: log -> save -> publish', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'workflow-test-123',
                data: {
                    insuredId: '11111',
                    scheduleId: '99999',
                    countryISO: 'PE'
                },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T12:00:00.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            // Verify the exact order and content of operations
            expect(mockLogger.info).toHaveBeenCalledWith(`SaveMessage: ${JSON.stringify(processedMessage)}`);
            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);

            // Verify call order
            const loggerCalls = (mockLogger.info as jest.Mock).mock.calls;
            const dbSaveCall = (mockDBRepository.save as jest.Mock).mock.calls[0];
            const eventPublishCall = (mockEventPublisher.publishSuccess as jest.Mock).mock.calls[0];

            expect(loggerCalls).toHaveLength(1);
            expect(dbSaveCall).toBeDefined();
            expect(eventPublishCall).toBeDefined();
        });

        it('should handle empty message data', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'empty-message-123',
                data: {},
                queueSource: 'queue-CL',
                timestamp: '2023-11-01T12:00:00.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
        });

        it('should handle messages with null or undefined data fields', async () => {
            const processedMessage: ProcessedMessage = {
                id: 'null-data-123',
                data: {
                    insuredId: null,
                    scheduleId: undefined,
                    countryISO: 'PE'
                },
                queueSource: 'queue-PE',
                timestamp: '2023-11-01T12:00:00.000Z'
            };

            mockDBRepository.save.mockResolvedValue('saved-successfully');
            mockEventPublisher.publishSuccess.mockResolvedValue();

            await saveMessageUseCase.execute(processedMessage);

            expect(mockDBRepository.save).toHaveBeenCalledWith(processedMessage);
            expect(mockEventPublisher.publishSuccess).toHaveBeenCalledWith(processedMessage);
        });
    });
});