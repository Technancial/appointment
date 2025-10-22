import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('AppointmentDetails')
export class AppointmentDetailsDB {

    @PrimaryGeneratedColumn()
    id!: number;

    // Campos de la cita
    @Column({ type: 'varchar', length: 255 })
    scheduleId!: string;

    @Column({ type: 'varchar', length: 255 })
    insuredId!: string;

    @Column({ type: 'varchar', length: 50 })
    status!: string;

    // Mapea a createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

}