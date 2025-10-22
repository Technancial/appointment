import { Appointment } from '@domain/entities/appointment';
import { InsuredId } from '@domain/valueobjects/InsuredId';
import { ScheduleId } from '@domain/valueobjects/ScheduleId';
import { CountryISO } from '@domain/valueobjects/CountryISO';
import { CenterId } from '@domain/valueobjects/CenterId';
import { SpecialtyId } from '@domain/valueobjects/SpecialtyId';
import { MedicId } from '@domain/valueobjects/MedicId';
import { AppointmentDate } from '@domain/valueobjects/AppointmentDate';
import { AppointmentStatus } from '@domain/valueobjects/AppointmentStatus';
import { NativeDateValidator } from '@infrastructure/utils/nativeDateValidator';

describe('Appointment Entity', () => {
    let dateValidator: NativeDateValidator;

    beforeEach(() => {
        dateValidator = new NativeDateValidator();
    });

    describe('Creation and initialization', () => {
        it('should create an appointment with all required fields', () => {
            const appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE')
            );

            expect(appointment.scheduleId).toBe(98701);
            expect(appointment.centerId).toBe(101);
            expect(appointment.specialtyId).toBe(105);
            expect(appointment.medicId).toBe(201);
            expect(appointment.date).toBe('2025-10-22T10:00:00Z');
            expect(appointment.insuredId).toBe('12345');
            expect(appointment.countryId).toBe('PE');
            expect(appointment.estado).toBe('pending');
        });

        it('should initialize with pending status by default', () => {
            const appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE')
            );

            expect(appointment.isPending()).toBe(true);
            expect(appointment.isConfirmed()).toBe(false);
            expect(appointment.isCancelled()).toBe(false);
            expect(appointment.isCompleted()).toBe(false);
        });

        it('should allow custom status on creation', () => {
            const appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE'),
                AppointmentStatus.confirmed()
            );

            expect(appointment.isConfirmed()).toBe(true);
            expect(appointment.estado).toBe('confirmed');
        });
    });

    describe('Status transitions', () => {
        let appointment: Appointment;

        beforeEach(() => {
            appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE')
            );
        });

        it('should transition from pending to confirmed', () => {
            expect(appointment.isPending()).toBe(true);

            appointment.confirm();

            expect(appointment.isConfirmed()).toBe(true);
            expect(appointment.isPending()).toBe(false);
            expect(appointment.estado).toBe('confirmed');
        });

        it('should transition from pending to cancelled', () => {
            expect(appointment.isPending()).toBe(true);

            appointment.cancel();

            expect(appointment.isCancelled()).toBe(true);
            expect(appointment.isPending()).toBe(false);
            expect(appointment.estado).toBe('cancelled');
        });

        it('should transition to completed', () => {
            appointment.complete();

            expect(appointment.isCompleted()).toBe(true);
            expect(appointment.estado).toBe('completed');
        });

        it('should allow manual status assignment', () => {
            appointment.assignEstado('confirmed');

            expect(appointment.estado).toBe('confirmed');
            expect(appointment.isConfirmed()).toBe(true);
        });
    });

    describe('JSON Serialization', () => {
        it('should serialize to plain JSON object without Value Objects', () => {
            const appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE')
            );

            const json = JSON.parse(JSON.stringify(appointment));

            // Verificar que no contiene propiedades privadas ni Value Objects
            expect(json).toEqual({
                insuredId: '12345',
                countryId: 'PE',
                scheduleId: 98701,
                centerId: 101,
                specialtyId: 105,
                medicId: 201,
                date: '2025-10-22T10:00:00Z',
                estado: 'pending'
            });

            // Verificar que NO contiene propiedades privadas con _
            expect(json._insuredId).toBeUndefined();
            expect(json._scheduleId).toBeUndefined();
            expect(json._status).toBeUndefined();
        });

        it('should serialize array of appointments correctly', () => {
            const appointments = [
                new Appointment(
                    new ScheduleId(98701),
                    new CenterId(101),
                    new SpecialtyId(105),
                    new MedicId(201),
                    new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                    new InsuredId('12345'),
                    new CountryISO('PE')
                ),
                new Appointment(
                    new ScheduleId(98702),
                    new CenterId(102),
                    new SpecialtyId(106),
                    new MedicId(202),
                    new AppointmentDate('2025-10-23T14:00:00Z', dateValidator),
                    new InsuredId('12345'),
                    new CountryISO('CL')
                )
            ];

            const json = JSON.parse(JSON.stringify(appointments));

            expect(json).toHaveLength(2);
            expect(json[0]).toEqual({
                insuredId: '12345',
                countryId: 'PE',
                scheduleId: 98701,
                centerId: 101,
                specialtyId: 105,
                medicId: 201,
                date: '2025-10-22T10:00:00Z',
                estado: 'pending'
            });
            expect(json[1]).toEqual({
                insuredId: '12345',
                countryId: 'CL',
                scheduleId: 98702,
                centerId: 102,
                specialtyId: 106,
                medicId: 202,
                date: '2025-10-23T14:00:00Z',
                estado: 'pending'
            });
        });

        it('should serialize with different statuses', () => {
            const confirmedAppointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE'),
                AppointmentStatus.confirmed()
            );

            const json = JSON.parse(JSON.stringify(confirmedAppointment));

            expect(json.estado).toBe('confirmed');
        });
    });

    describe('Value Object getters', () => {
        it('should provide access to Value Objects', () => {
            const appointment = new Appointment(
                new ScheduleId(98701),
                new CenterId(101),
                new SpecialtyId(105),
                new MedicId(201),
                new AppointmentDate('2025-10-22T10:00:00Z', dateValidator),
                new InsuredId('12345'),
                new CountryISO('PE')
            );

            expect(appointment.insuredIdVO).toBeInstanceOf(InsuredId);
            expect(appointment.scheduleIdVO).toBeInstanceOf(ScheduleId);
            expect(appointment.countryIdVO).toBeInstanceOf(CountryISO);
            expect(appointment.centerIdVO).toBeInstanceOf(CenterId);
            expect(appointment.specialtyIdVO).toBeInstanceOf(SpecialtyId);
            expect(appointment.medicIdVO).toBeInstanceOf(MedicId);
            expect(appointment.dateVO).toBeInstanceOf(AppointmentDate);
            expect(appointment.statusVO).toBeInstanceOf(AppointmentStatus);
        });
    });
});
