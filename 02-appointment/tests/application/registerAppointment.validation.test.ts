import { RegisterAppointment, ScheduleAppointmentInput } from '@application/registerAppointment';
import { IAppointmentRepository } from '@domain/repository/IAppointmentRepository';
import { INotificationService } from '@domain/repository/INotificationService';
import { IDateValidator } from '@domain/dto/IDateValidator';
import { ILogger } from '@domain/dto/Logger';
import { PinoLoggerAdapter } from '@infrastructure/utils/Logger';
import { InvalidInsuredIdError, InvalidScheduleIdError, InvalidCenterIdError, InvalidSpecialtyIdError, InvalidMedicIdError, InvalidCountryError, InvalidDateError } from '@domain/errors/DomainErrors';

describe('RegisterAppointment - Error Handling & Validation', () => {
    let registerAppointment: RegisterAppointment;
    let mockRepository: jest.Mocked<IAppointmentRepository>;
    let mockNotificationService: jest.Mocked<INotificationService>;
    let mockDateValidator: jest.Mocked<IDateValidator>;
    let logger: ILogger;

    const validAppointmentData: ScheduleAppointmentInput = {
        insuredId: '12345',
        scheduleId: 98701,
        countryISO: 'PE',
        centerId: 101,
        specialtyId: 105,
        medicId: 201,
        date: '2025-12-25T10:00:00Z'
    };

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
        };

        mockNotificationService = {
            sendAppointmentScheduled: jest.fn()
        };

        mockDateValidator = {
            isValid: jest.fn()
        };

        logger = new PinoLoggerAdapter();
        jest.spyOn(logger, 'info').mockImplementation();

        registerAppointment = new RegisterAppointment(
            mockRepository,
            mockDateValidator,
            logger,
            mockNotificationService
        );
    });

    describe('Country validation errors', () => {
        it('should throw InvalidCountryError for unsupported country', async () => {
            const invalidCountryData = { ...validAppointmentData, countryISO: 'US' };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidCountryData)).rejects.toThrow(InvalidCountryError);
            await expect(registerAppointment.execute(invalidCountryData)).rejects.toThrow("no está soportado");
        });

        it('should throw InvalidCountryError for empty country', async () => {
            const invalidCountryData = { ...validAppointmentData, countryISO: '' };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidCountryData)).rejects.toThrow(InvalidCountryError);
        });

        it('should accept valid countries in lowercase', async () => {
            const lowerCaseCountryData = { ...validAppointmentData, countryISO: 'pe' };
            mockDateValidator.isValid.mockReturnValue(true);
            mockRepository.save.mockResolvedValue({} as any);
            mockNotificationService.sendAppointmentScheduled.mockResolvedValue();

            const result = await registerAppointment.execute(lowerCaseCountryData);

            expect(result.message).toContain('PE');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('Date validation errors', () => {
        it('should throw InvalidDateError for invalid date format', async () => {
            const invalidDateData = { ...validAppointmentData, date: 'invalid-date' };
            mockDateValidator.isValid.mockReturnValue(false);

            await expect(registerAppointment.execute(invalidDateData)).rejects.toThrow(InvalidDateError);
            await expect(registerAppointment.execute(invalidDateData)).rejects.toThrow("no tiene un formato válido");
        });

        it('should throw error for empty date', async () => {
            const invalidDateData = { ...validAppointmentData, date: '' };
            mockDateValidator.isValid.mockReturnValue(false);

            await expect(registerAppointment.execute(invalidDateData)).rejects.toThrow(InvalidDateError);
        });
    });

    describe('InsuredId validation errors', () => {
        it('should throw error when insuredId is empty', async () => {
            const invalidData = { ...validAppointmentData, insuredId: '' };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidInsuredIdError);
        });

        it('should throw error when insuredId has less than 5 characters', async () => {
            const invalidData = { ...validAppointmentData, insuredId: '1234' };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidInsuredIdError);
            await expect(registerAppointment.execute(invalidData)).rejects.toThrow("exactamente 5 caracteres");
        });

        it('should throw error when insuredId has more than 5 characters', async () => {
            const invalidData = { ...validAppointmentData, insuredId: '123456' };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidInsuredIdError);
            await expect(registerAppointment.execute(invalidData)).rejects.toThrow("exactamente 5 caracteres");
        });
    });

    describe('Required field validation errors', () => {
        it('should throw error when scheduleId is 0', async () => {
            const invalidData = { ...validAppointmentData, scheduleId: 0 };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidScheduleIdError);
        });

        it('should throw error when centerId is 0', async () => {
            const invalidData = { ...validAppointmentData, centerId: 0 };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidCenterIdError);
        });

        it('should throw error when specialtyId is 0', async () => {
            const invalidData = { ...validAppointmentData, specialtyId: 0 };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidSpecialtyIdError);
        });

        it('should throw error when medicId is 0', async () => {
            const invalidData = { ...validAppointmentData, medicId: 0 };
            mockDateValidator.isValid.mockReturnValue(true);

            await expect(registerAppointment.execute(invalidData)).rejects.toThrow(InvalidMedicIdError);
        });
    });

    describe('Repository and notification service errors', () => {
        it('should handle repository save errors', async () => {
            mockDateValidator.isValid.mockReturnValue(true);
            mockRepository.save.mockRejectedValue(new Error('Database save failed'));

            await expect(registerAppointment.execute(validAppointmentData)).rejects.toThrow('Database save failed');

            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockNotificationService.sendAppointmentScheduled).not.toHaveBeenCalled();
        });

        it('should handle notification service errors', async () => {
            mockDateValidator.isValid.mockReturnValue(true);
            mockRepository.save.mockResolvedValue({} as any);
            mockNotificationService.sendAppointmentScheduled.mockRejectedValue(new Error('Notification failed'));

            await expect(registerAppointment.execute(validAppointmentData)).rejects.toThrow('Notification failed');

            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockNotificationService.sendAppointmentScheduled).toHaveBeenCalled();
        });
    });

    describe('Multiple validation errors', () => {
        it('should prioritize country validation before other validations', async () => {
            const multipleErrorsData = {
                insuredId: '12345',
                scheduleId: 81818,
                countryISO: 'INVALID',
                centerId: 0,
                specialtyId: 0,
                medicId: 0,
                date: 'invalid-date'
            };
            mockDateValidator.isValid.mockReturnValue(false);

            await expect(registerAppointment.execute(multipleErrorsData)).rejects.toThrow(InvalidCountryError);
        });

        it('should prioritize InsuredId validation after country validation', async () => {
            const multipleErrorsData = {
                insuredId: '',
                scheduleId: 0,
                countryISO: 'PE',
                centerId: 0,
                specialtyId: 0,
                medicId: 0,
                date: 'invalid-date'
            };
            mockDateValidator.isValid.mockReturnValue(false);

            await expect(registerAppointment.execute(multipleErrorsData)).rejects.toThrow(InvalidInsuredIdError);
        });
    });

    describe('Successful registration', () => {
        it('should successfully register an appointment with valid data', async () => {
            mockDateValidator.isValid.mockReturnValue(true);
            mockRepository.save.mockResolvedValue({} as any);
            mockNotificationService.sendAppointmentScheduled.mockResolvedValue();

            const result = await registerAppointment.execute(validAppointmentData);

            expect(result.message).toContain('PE');
            expect(result.id).toBe('98701');
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockNotificationService.sendAppointmentScheduled).toHaveBeenCalled();
        });
    });
});
