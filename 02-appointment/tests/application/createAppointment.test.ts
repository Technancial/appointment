import { RegisterAppointment, ScheduleAppointmentInput } from "@application/registerAppointment"
import { IDateValidator } from "@domain/dto/IDateValidator";
import { ILogger } from "@domain/dto/Logger";
import { Appointment } from "@domain/entities/appointment";
import { IAppointmentRepository } from "@domain/repository/IAppointmentRepository";
import { INotificationService } from "@domain/repository/INotificationService";
import { AppointmentDate } from "@domain/valueobjects/AppointmentDate";
import { CenterId } from "@domain/valueobjects/CenterId";
import { CountryISO } from "@domain/valueobjects/CountryISO";
import { InsuredId } from "@domain/valueobjects/InsuredId";
import { MedicId } from "@domain/valueobjects/MedicId";
import { ScheduleId } from "@domain/valueobjects/ScheduleId";
import { SpecialtyId } from "@domain/valueobjects/SpecialtyId";
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

        const insuredId = new InsuredId(appointmentData.insuredId);
        const scheduleId = new ScheduleId(appointmentData.scheduleId);
        const countryISO = new CountryISO(appointmentData.countryISO);
        const centerId = new CenterId(appointmentData.centerId);
        const specialtyId = new SpecialtyId(appointmentData.specialtyId);
        const medicId = new MedicId(appointmentData.medicId);
        const appointmentDate = new AppointmentDate(appointmentData.date, dateValidator);

        const appointmentEntity = new Appointment(
            scheduleId,
            centerId,
            specialtyId,
            medicId,
            appointmentDate,
            insuredId,
            countryISO,
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