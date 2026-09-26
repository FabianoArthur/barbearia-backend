import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmAppointmentDto {
  @ApiProperty({
    example: 'A3B7K9',
    description: 'The appointment code to confirm',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: '12345678900',
    description: 'Client CPF (digits only) for validation',
  })
  @IsString()
  @IsNotEmpty()
  cpf!: string;
}
