import { maskCpf } from '../../../../common/utils/cpf-mask.util';
import { safeDecrypt } from '../../../../common/utils/encryption.util';
import { maskPhone } from '../../../../common/utils/phone-mask.util';
import type { AppointmentWithRelations } from '../../domain/interfaces/appointment-repository.interface';

/**
 * Strips sensitive client fields (cpf, phone) from appointment responses
 * and replaces them with masked versions.
 */
export function sanitizeAppointment(appointment: AppointmentWithRelations) {
  const { client, ...rest } = appointment;
  return {
    ...rest,
    client: {
      id: client.id,
      name: client.name,
      cpf: maskCpf(safeDecrypt(client.cpf)),
      phone: client.phone ? maskPhone(safeDecrypt(client.phone)) : null,
    },
  };
}

export function sanitizeAppointments(appointments: AppointmentWithRelations[]) {
  return appointments.map(sanitizeAppointment);
}
