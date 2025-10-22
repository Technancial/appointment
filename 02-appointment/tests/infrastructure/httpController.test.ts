import { httpController } from '@infrastructure/controller/httpController';
import { RegisterAppointment } from '@application/registerAppointment';
import { FindAppointment } from '@application/findAppointment';
import { ILogger } from '@domain/dto/Logger';
import { Appointment } from '@domain/entities/appointment';
import { payloadGenericRequestDTO } from '@infrastructure/controller/dtos';
import { ScheduleId } from '@domain/valueobjects/ScheduleId';
import { CenterId } from '@domain/valueobjects/CenterId';
import { SpecialtyId } from '@domain/valueobjects/SpecialtyId';
import { MedicId } from '@domain/valueobjects/MedicId';
import { AppointmentDate } from '@domain/valueobjects/AppointmentDate';
import { IDateValidator } from '@domain/dto/IDateValidator';
import { NativeDateValidator } from '@infrastructure/utils/nativeDateValidator';
import { InsuredId } from '@domain/valueobjects/InsuredId';
import { CountryISO } from '@domain/valueobjects/CountryISO';

describe('httpController', () => {
    let mockRegisterAppointment: jest.Mocked<RegisterAppointment>;
    let mockFindAppointment: jest.Mocked<FindAppointment>;
    let mockLogger: jest.Mocked<ILogger>;
    let controller: any;
    const dateValidator: IDateValidator = new NativeDateValidator();

    beforeEach(() => {
        mockRegisterAppointment = {
            execute: jest.fn()
        } as any;

        mockFindAppointment = {
            execute: jest.fn()
        } as any;

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        };

        controller = httpController(mockRegisterAppointment, mockFindAppointment, mockLogger);
    });

    describe('POST /appointments (register action)', () => {
        it('should successfully register an appointment', async () => {
            const mockAppointmentData = {
                insuredId: '12345',
                scheduleId: 98701,
                countryISO: 'PE',
                centerId: 101,
                specialtyId: 105,
                medicId: 201,
                date: '2025-12-25T10:00:00Z'
            };

            const expectedResponse = {
                message: 'cita para PE recibido y en proceso.',
                id: '98701'
            };

            const event: payloadGenericRequestDTO = {
                action: 'register',
                data: mockAppointmentData
            };

            mockRegisterAppointment.execute.mockResolvedValue(expectedResponse);

            const result = await controller(event);
            expect(mockRegisterAppointment.execute).toHaveBeenCalledWith(mockAppointmentData);
            //expect(mockLogger.info).toHaveBeenCalledWith(`Ejecución opereación: register con data: ${JSON.stringify(mockAppointmentData)}`);
            //expect(mockLogger.info).toHaveBeenCalledWith(`Registro cita: ${JSON.stringify(expectedResponse)}`);
            expect(result).toEqual(expectedResponse);
        });

        it('should handle registration errors', async () => {
            const mockAppointmentData = {
                insuredId: '',
                scheduleId: 98701,
                countryISO: 'PE',
                centerId: 101,
                specialtyId: 105,
                medicId: 201,
                date: '2025-12-25T10:00:00Z'
            };

            const event: payloadGenericRequestDTO = {
                action: 'register',
                data: mockAppointmentData
            };

            const mockError = new Error('Código Asegurado requerido');
            mockRegisterAppointment.execute.mockRejectedValue(mockError);

            await expect(controller(event)).rejects.toThrow(
                JSON.stringify({
                    error: 'Error',
                    message: 'Código Asegurado requerido',
                    errorCode: 'UNKNOWN_ERROR'
                })
            );

            expect(mockRegisterAppointment.execute).toHaveBeenCalledWith(mockAppointmentData);
        });
    });

    describe('GET /appointments (find action)', () => {
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
                )
            ];

            const event: payloadGenericRequestDTO = {
                action: 'find',
                data: insuredId
            };

            mockFindAppointment.execute.mockResolvedValue(mockAppointments);

            const result = await controller(event);

            expect(mockFindAppointment.execute).toHaveBeenCalledWith(insuredId);
            //expect(mockLogger.info).toHaveBeenCalledWith(`Ejecución opereación: find con data: ${insuredId}`);
            //expect(mockLogger.info).toHaveBeenCalledWith(`Busqueda cita: ${JSON.stringify(mockAppointments)}`);
            expect(result).toEqual(mockAppointments);
        });

        it('should handle find errors when insuredId is empty', async () => {
            const insuredId = '';
            const event: payloadGenericRequestDTO = {
                action: 'find',
                data: insuredId
            };

            const mockError = new Error('Falta InsuredId');
            mockFindAppointment.execute.mockRejectedValue(mockError);

            await expect(controller(event)).rejects.toThrow(
                JSON.stringify({
                    error: 'Error',
                    message: 'Falta InsuredId',
                    errorCode: 'UNKNOWN_ERROR'
                })
            );

            expect(mockFindAppointment.execute).toHaveBeenCalledWith(insuredId);
        });
    });

    describe('Error handling', () => {
        it('should format and throw errors correctly', async () => {
            const event: payloadGenericRequestDTO = {
                action: 'register',
                data: {}
            };

            const customError = new Error('Custom error message');
            customError.name = 'CustomError';
            mockRegisterAppointment.execute.mockRejectedValue(customError);

            await expect(controller(event)).rejects.toThrow(
                JSON.stringify({
                    error: 'CustomError',
                    message: 'Custom error message',
                    errorCode: 'UNKNOWN_ERROR'
                })
            );
        });
    });
});