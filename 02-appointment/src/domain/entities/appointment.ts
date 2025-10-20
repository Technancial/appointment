export type CountryISO = 'PE' | 'CL';

export class Appointment {
    insuredId: string;
    countryId: CountryISO;
    scheduleId: number;
    centerId: number;
    specialtyId: number;
    medicId: number;
    date: string;
    estado!: string;
    constructor(scheduleId: number, centerId: number, specialtyId: number,
        medicId: number, date: string, insuredId: string, countryId: CountryISO) {
        this.scheduleId = scheduleId;
        this.centerId = centerId;
        this.specialtyId = specialtyId;
        this.medicId = medicId;
        this.date = date;
        this.insuredId = insuredId;
        this.countryId = countryId;
    }
    assignEstado(estado: string): void {
        if (!['pending', 'confirmed', 'cancelled'].includes(estado)) {
            throw new Error(`Estado '${estado}' no permitido.`);
        }
        this.estado = estado;
    }
}