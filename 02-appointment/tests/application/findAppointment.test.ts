import { FindAppointment } from '@application/findAppointment';
import { IAppointmentRepository } from '@domain/repository/IAppointmentRepository';
import { ILogger } from '@domain/dto/Logger';
import { PinoLoggerAdapter } from '@infrastructure/utils/Logger';
import { InvalidInsuredIdError } from '@domain/errors/DomainErrors';
import { InsuredId } from '@domain/valueobjects/InsuredId';
import { ScheduleId } from '@domain/valueobjects/ScheduleId';
import { CountryISO } from '@domain/valueobjects/CountryISO';
import { CenterId } from '@domain/valueobjects/CenterId';
import { SpecialtyId } from '@domain/valueobjects/SpecialtyId';
import { MedicId } from '@domain/valueobjects/MedicId';
import { AppointmentDate } from '@domain/valueobjects/AppointmentDate';
import { Appointment } from '@domain/entities/appointment';
import { NativeDateValidator } from '@infrastructure/utils/nativeDateValidator';

describe('FindAppointment', () => {
    let findAppointment: FindAppointment;
    let mockRepository: jest.Mocked<IAppointmentRepository>;
    let logger: ILogger;
    let dateValidator: NativeDateValidator;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
        };

        logger = new PinoLoggerAdapter();
        jest.spyOn(logger, 'info').mockImplementation();
        dateValidator = new NativeDateValidator();

        findAppointment = new FindAppointment(mockRepository, logger);
    });

    describe('execute', () => {
        it('should successfully find appointments by insuredId', async () => {
            const insuredId = '12345';
            const mockAppointments = [
                new Appointment(
                    new ScheduleId(98701),
                    new CenterId(101),
                    new SpecialtyId(105),
                    new MedicId(201),
                    new AppointmentDate('2025-12-25T10:00:00Z', dateValidator),
                    new InsuredId('12345'),
                    new CountryISO('PE')
                ),
                new Appointment(
                    new ScheduleId(98702),
                    new CenterId(102),
                    new SpecialtyId(106),
                    new MedicId(202),
                    new AppointmentDate('2025-12-26T14:00:00Z', dateValidator),
                    new InsuredId('12345'),
                    new CountryISO('CL')
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

            await expect(findAppointment.execute(insuredId)).rejects.toThrow(InvalidInsuredIdError);

            expect(mockRepository.findById).not.toHaveBeenCalled();
        });

        it('should throw error when insuredId is whitespace only', async () => {
            const insuredId = '   ';

            await expect(findAppointment.execute(insuredId.trim())).rejects.toThrow(InvalidInsuredIdError);

            expect(mockRepository.findById).not.toHaveBeenCalled();
        });

        it('should throw error when insuredId has invalid length', async () => {
            const insuredId = '1234'; // Less than 5 characters

            await expect(findAppointment.execute(insuredId)).rejects.toThrow(InvalidInsuredIdError);

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
                    new ScheduleId(98701),
                    new CenterId(101),
                    new SpecialtyId(105),
                    new MedicId(201),
                    new AppointmentDate('2025-12-25T10:00:00Z', dateValidator),
                    new InsuredId('12345'),
                    new CountryISO('PE')
                )
            ];

            mockRepository.findById.mockResolvedValue(mockAppointments);

            const result = await findAppointment.execute(insuredId);

            expect(result).toEqual(mockAppointments);
            expect(result[0].insuredId).toBe('12345');
        });
    });
});
