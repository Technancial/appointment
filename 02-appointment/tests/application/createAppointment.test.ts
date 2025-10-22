import { RegisterAppointment, ScheduleAppointmentInput } from "@application/registerAppointment"
import { IDateValidator } from "@domain/dto/IDateValidator";
import { ILogger } from "@domain/dto/Logger";
import { Appointment, CountryISO } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { INotificationService } from "@domain/repository/INotificationService";
import { PinoLoggerAdapter } from "@infrastructure/utils/Logger";
import { NativeDateValidator } from "@infrastructure/utils/nativeDateValidator";

describe('CreateAppointment', () => {
    let createAppointment: RegisterAppointment;
    let mockRepository: jest.Mocked<IAppointmentRepository>;
    let mockPublisher: jest.Mocked<INotificationService>;
    const logger = new PinoLoggerAdapter();
    const dateValidator: IDateValidator = new NativeDateValidator();
    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
        };

        mockPublisher = {
            sendAppointmentScheduled: jest.fn()
        };

        createAppointment = new RegisterAppointment(mockRepository, dateValidator, logger, mockPublisher);

    });

    it('deberia crear una cita y publicar el evento', async () => {
        const appointmentData: ScheduleAppointmentInput = {
            insuredId: '12345',
            scheduleId: 98701,
            countryISO: 'PE',
            centerId: 101,
            specialtyId: 105,
            medicId: 201,
            date: '2025-12-25T10:00:00Z'
        };

        const appointmentEntity = new Appointment(
            appointmentData.scheduleId,
            appointmentData.centerId,
            appointmentData.specialtyId,
            appointmentData.medicId,
            appointmentData.date,
            appointmentData.insuredId,
            appointmentData.countryISO as CountryISO,
        );

        mockRepository.save.mockResolvedValue(appointmentEntity);

        const result = await createAppointment.execute(appointmentData);

        expect(mockRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                insuredId: '12345',
                countryId: 'PE'
            })
        );
    })
})