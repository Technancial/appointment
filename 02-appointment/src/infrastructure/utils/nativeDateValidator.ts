import { IDateValidator } from "@domain/dto/IDateValidator";

export class NativeDateValidator implements IDateValidator {
    isValid(dateString: string): boolean {
        // La validación nativa comprueba si new Date() resulta en 'Invalid Date'.
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
}