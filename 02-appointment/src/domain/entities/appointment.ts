import { InsuredId } from "@domain/valueobjects/InsuredId";
import { ScheduleId } from "@domain/valueobjects/ScheduleId";
import { CountryISO } from "@domain/valueobjects/CountryISO";
import { CenterId } from "@domain/valueobjects/CenterId";
import { SpecialtyId } from "@domain/valueobjects/SpecialtyId";
import { MedicId } from "@domain/valueobjects/MedicId";
import { AppointmentDate } from "@domain/valueobjects/AppointmentDate";
import { AppointmentStatus } from "@domain/valueobjects/AppointmentStatus";

export class Appointment {
    private readonly _insuredId: InsuredId;
    private readonly _countryId: CountryISO;
    private readonly _scheduleId: ScheduleId;
    private readonly _centerId: CenterId;
    private readonly _specialtyId: SpecialtyId;
    private readonly _medicId: MedicId;
    private readonly _date: AppointmentDate;
    private _status: AppointmentStatus;

    constructor(
        scheduleId: ScheduleId,
        centerId: CenterId,
        specialtyId: SpecialtyId,
        medicId: MedicId,
        date: AppointmentDate,
        insuredId: InsuredId,
        countryId: CountryISO,
        status?: AppointmentStatus
    ) {
        this._scheduleId = scheduleId;
        this._centerId = centerId;
        this._specialtyId = specialtyId;
        this._medicId = medicId;
        this._date = date;
        this._insuredId = insuredId;
        this._countryId = countryId;
        this._status = status || AppointmentStatus.pending();
    }

    // Getters para compatibilidad
    get insuredId(): string {
        return this._insuredId.getValue();
    }

    get countryId(): string {
        return this._countryId.getValue();
    }

    get scheduleId(): number {
        return this._scheduleId.getValue();
    }

    get centerId(): number {
        return this._centerId.getValue();
    }

    get specialtyId(): number {
        return this._specialtyId.getValue();
    }

    get medicId(): number {
        return this._medicId.getValue();
    }

    get date(): string {
        return this._date.getValue();
    }

    get estado(): string {
        return this._status.getValue();
    }

    // Value Object getters
    get insuredIdVO(): InsuredId {
        return this._insuredId;
    }

    get countryIdVO(): CountryISO {
        return this._countryId;
    }

    get scheduleIdVO(): ScheduleId {
        return this._scheduleId;
    }

    get centerIdVO(): CenterId {
        return this._centerId;
    }

    get specialtyIdVO(): SpecialtyId {
        return this._specialtyId;
    }

    get medicIdVO(): MedicId {
        return this._medicId;
    }

    get dateVO(): AppointmentDate {
        return this._date;
    }

    get statusVO(): AppointmentStatus {
        return this._status;
    }

    assignEstado(estado: string): void {
        this._status = new AppointmentStatus(estado);
    }

    confirm(): void {
        this._status = AppointmentStatus.confirmed();
    }

    cancel(): void {
        this._status = AppointmentStatus.cancelled();
    }

    complete(): void {
        this._status = AppointmentStatus.completed();
    }

    isPending(): boolean {
        return this._status.isPending();
    }

    isConfirmed(): boolean {
        return this._status.isConfirmed();
    }

    isCancelled(): boolean {
        return this._status.isCancelled();
    }

    isCompleted(): boolean {
        return this._status.isCompleted();
    }

    // Método para serialización JSON
    toJSON() {
        return {
            insuredId: this.insuredId,
            countryId: this.countryId,
            scheduleId: this.scheduleId,
            centerId: this.centerId,
            specialtyId: this.specialtyId,
            medicId: this.medicId,
            date: this.date,
            estado: this.estado
        };
    }
}

// Mantener compatibilidad con código antiguo
//export type CountryISO as CountryISOLegacy = 'PE' | 'CL';
