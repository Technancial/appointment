import { FindAppointment } from '@application/findAppointment';
import { IAppointmentRepository } from '@domain/repository/IAppointmentRepository';
import { ILogger } from '@domain/dto/Logger';
import { Appointment } from '@domain/entities/appointment';
import { PinoLoggerAdapter } from '@infrastructure/utils/Logger';

describe('FindAppointment', () => {
    let findAppointment: FindAppointment;
    let mockRepository: jest.Mocked<IAppointmentRepository>;
    let logger: ILogger;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
        };

        logger = new PinoLoggerAdapter();
        jest.spyOn(logger, 'info').mockImplementation();

        findAppointment = new FindAppointment(mockRepository, logger);
    });

    describe('execute', () => {
        it('should successfully find appointments by insuredId', async () => {
            const insuredId = '12345';
            const mockAppointments = [
                new Appointment(
                    98701,
                    101,
                    105,
                    201,
                    '2025-12-25T10:00:00Z',
                    '12345',
                    'PE'
                ),
                new Appointment(
                    98702,
                    102,
                    106,
                    202,
                    '2025-12-26T14:00:00Z',
                    '12345',
                    'CL'
                )
            ];

            mockRepository.findById.mockResolvedValue(mockAppointments);

            const result = await findAppointment.execute(insuredId);

            expect(mockRepository.findById).toHaveBeenCalledWith(insuredId);
            expect(logger.info).toHaveBeenCalledWith(`CasoUso findById: ${insuredId}`);
            expect(result).toEqual(mockAppointments);
            expect(result).toHaveLength(2);
            expect(result[0].insuredId).toBe('12345');
            expect(result[1].insuredId).toBe('12345');
        });

        it('should return empty array when no appointments found', async () => {
            const insuredId = '99999';
            const emptyResult: Appointment[] = [];

            mockRepository.findById.mockResolvedValue(emptyResult);

            const result = await findAppointment.execute(insuredId);

            expect(mockRepository.findById).toHaveBeenCalledWith(insuredId);
            expect(logger.info).toHaveBeenCalledWith(`CasoUso findById: ${insuredId}`);
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should throw error when insuredId is empty', async () => {
            const insuredId = '';

            await expect(findAppointment.execute(insuredId)).rejects.toThrow('Falta InsuredId');

            expect(mockRepository.findById).not.toHaveBeenCalled();
        });

        it('should throw error when insuredId is whitespace only', async () => {
            const insuredId = '   ';

            await expect(findAppointment.execute(insuredId.trim())).rejects.toThrow('Falta InsuredId');

            expect(mockRepository.findById).not.toHaveBeenCalled();
        });

        it('should handle repository errors', async () => {
            const insuredId = '12345';
            const repositoryError = new Error('Database connection failed');

            mockRepository.findById.mockRejectedValue(repositoryError);

            await expect(findAppointment.execute(insuredId)).rejects.toThrow('Database connection failed');

            expect(mockRepository.findById).toHaveBeenCalledWith(insuredId);
            expect(logger.info).toHaveBeenCalledWith(`CasoUso findById: ${insuredId}`);
        });

        it('should work with valid 5-character insuredId', async () => {
            const insuredId = '12345';
            const mockAppointments = [
                new Appointment(
                    98701,
                    101,
                    105,
                    201,
                    '2025-12-25T10:00:00Z',
                    '12345',
                    'PE'
                )
            ];

            mockRepository.findById.mockResolvedValue(mockAppointments);

            const result = await findAppointment.execute(insuredId);

            expect(result).toEqual(mockAppointments);
            expect(result[0].insuredId).toBe('12345');
        });
    });
});