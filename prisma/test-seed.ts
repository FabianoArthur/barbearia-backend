import 'dotenv/config';
import {
  AppointmentStatus,
  ExpenseCategory,
  FeeType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { encrypt, encryptDeterministic } from '../src/common/utils/encryption.util';
import { requireSeedPassword } from './seed-env';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface WeightedItem {
  id: string;
  weight: number;
}

function pickWeighted(items: readonly WeightedItem[]): WeightedItem {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function assignFrequencyWeight(): number {
  const roll = Math.random();
  if (roll < 0.15) return randomBetween(8, 10); // VIP regulars
  if (roll < 0.5) return randomBetween(4, 7); // regulars
  return randomBetween(1, 3); // occasional
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

function generateCPF(index: number): string {
  return String(10000000000 + index);
}

function generatePhone(index: number): string {
  return `+5511${String(900000000 + index)}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// ──────────────────────────────────────────────────────────────
// Static data
// ──────────────────────────────────────────────────────────────

const ESTABLISHMENTS = [
  { name: 'Barbearia Central', lat: -23.5505, lng: -46.6333, monthlyCost: 3500 },
  { name: 'Corte & Estilo Premium', lat: -23.5631, lng: -46.6544, monthlyCost: 5200 },
  { name: 'Navalha Dourada', lat: -22.9068, lng: -43.1729, monthlyCost: 4100 },
] as const;

const BARBER_NAMES = [
  'Carlos Silva',
  'Rafael Oliveira',
  'João Santos',
  'Pedro Almeida',
  'Lucas Ferreira',
  'Matheus Costa',
  'André Souza',
  'Diego Lima',
  'Fernando Martins',
  'Gustavo Ribeiro',
  'Bruno Pereira',
  'Thiago Rocha',
] as const;

const FIRST_NAMES = [
  'Marcos',
  'Roberto',
  'Antônio',
  'Paulo',
  'Fábio',
  'Eduardo',
  'Ricardo',
  'Henrique',
  'Sérgio',
  'Adriano',
  'Leandro',
  'Daniel',
  'Alexandre',
  'Felipe',
  'Vinícius',
  'Gabriel',
  'Caio',
  'Leonardo',
  'Renato',
  'Rogério',
  'Márcio',
  'Anderson',
  'Luciano',
  'Cláudio',
  'Marcelo',
  'José',
  'Luís',
  'Otávio',
  'Raul',
  'Nelson',
  'Thiago',
  'Rodrigo',
  'Gustavo',
  'Matheus',
  'Bruno',
  'Diego',
  'Renan',
  'Igor',
  'William',
  'Victor',
  'Samuel',
  'Bernardo',
  'Enzo',
  'Pietro',
  'Lorenzo',
] as const;

const LAST_NAMES = [
  'Silva',
  'Oliveira',
  'Santos',
  'Souza',
  'Ferreira',
  'Pereira',
  'Almeida',
  'Costa',
  'Lima',
  'Ribeiro',
  'Gomes',
  'Martins',
  'Rocha',
  'Araújo',
  'Barbosa',
  'Nascimento',
  'Cardoso',
  'Pinto',
  'Correia',
  'Monteiro',
  'Teixeira',
  'Freitas',
  'Machado',
  'Dias',
  'Azevedo',
  'Campos',
  'Cunha',
  'Tavares',
  'Duarte',
  'Ramos',
  'Barros',
  'Moreira',
  'Neves',
  'Mendes',
  'Lopes',
  'Castro',
] as const;

const CLIENTS_PER_ESTABLISHMENT = 70;

function generateClientNames(count: number): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const first of FIRST_NAMES) {
    for (const last of LAST_NAMES) {
      const full = `${first} ${last}`;
      if (!seen.has(full)) {
        seen.add(full);
        names.push(full);
        if (names.length >= count) return names;
      }
    }
  }
  return names;
}

const SERVICE_CATALOG: { name: string; basePrice: number; durationMinutes: number }[] = [
  { name: 'Corte Masculino', basePrice: 45, durationMinutes: 30 },
  { name: 'Barba', basePrice: 30, durationMinutes: 20 },
  { name: 'Corte + Barba', basePrice: 65, durationMinutes: 45 },
  { name: 'Sobrancelha', basePrice: 15, durationMinutes: 10 },
  { name: 'Hidratação Capilar', basePrice: 50, durationMinutes: 40 },
  { name: 'Corte Infantil', basePrice: 35, durationMinutes: 25 },
  { name: 'Corte Premium', basePrice: 80, durationMinutes: 40 },
  { name: 'Barba Premium', basePrice: 55, durationMinutes: 30 },
  { name: 'Combo Premium (Corte + Barba)', basePrice: 120, durationMinutes: 60 },
  { name: 'Tratamento Capilar', basePrice: 90, durationMinutes: 50 },
  { name: 'Pigmentação', basePrice: 150, durationMinutes: 60 },
  { name: 'Relaxamento', basePrice: 70, durationMinutes: 35 },
  { name: 'Platinado', basePrice: 200, durationMinutes: 90 },
  { name: 'Corte Clássico', basePrice: 50, durationMinutes: 30 },
  { name: 'Barba Navalha', basePrice: 40, durationMinutes: 25 },
  { name: 'Corte + Barba Navalha', basePrice: 80, durationMinutes: 50 },
  { name: 'Design de Barba', basePrice: 35, durationMinutes: 20 },
  { name: 'Luzes', basePrice: 120, durationMinutes: 70 },
];

const WEEKDAY_SCHEDULES: { startTime: string; endTime: string }[][] = [
  [
    { startTime: '09:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '18:00' },
  ],
  [
    { startTime: '12:00', endTime: '15:00' },
    { startTime: '15:30', endTime: '21:00' },
  ],
  [{ startTime: '08:00', endTime: '14:00' }],
  [
    { startTime: '08:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '20:00' },
  ],
];

const TIME_OFF_REASONS = [
  'Consulta médica',
  'Férias',
  'Dia pessoal',
  'Curso de atualização',
  'Evento familiar',
  'Manutenção de equipamento',
];

const PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.PIX,
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.DEBIT_CARD,
] as const;

const EXPENSE_DESCRIPTIONS: Record<ExpenseCategory, string[]> = {
  [ExpenseCategory.RENT]: ['Aluguel mensal'],
  [ExpenseCategory.SUPPLIES]: [
    'Lâminas de barbear',
    'Creme pós-barba',
    'Shampoo profissional',
    'Gel fixador',
    'Toalhas descartáveis',
    'Capa de corte',
    'Desinfetante para equipamentos',
    'Óleo para máquina',
    'Pomada modeladora',
    'Talco profissional',
    'Pente descartável',
    'Luvas descartáveis',
    'Papel alumínio para luzes',
    'Tinta capilar',
  ],
  [ExpenseCategory.UTILITIES]: ['Conta de luz', 'Conta de água', 'Internet', 'Telefone'],
  [ExpenseCategory.MAINTENANCE]: [
    'Manutenção ar-condicionado',
    'Reparo cadeira',
    'Conserto máquina de corte',
    'Pintura da loja',
    'Troca de espelho',
    'Reforma do banheiro',
    'Dedetização',
    'Limpeza de fachada',
    'Conserto de encanamento',
    'Troca de lâmpadas',
    'Manutenção elétrica',
  ],
  [ExpenseCategory.SALARY]: [
    'Salário recepcionista',
    'Salário auxiliar de limpeza',
    'Pró-labore sócio',
    'Vale-transporte funcionários',
  ],
  [ExpenseCategory.OTHER]: [
    'Material de marketing',
    'Assinatura software',
    'Taxa de cartão',
    'Material de escritório',
    'Decoração',
    'Uniforme funcionários',
    'Café e água para clientes',
    'Seguro equipamentos',
  ],
};

const TAX_DESCRIPTIONS = {
  monthly: [
    { description: 'ISS - Imposto Sobre Serviços', minAmount: 400, maxAmount: 1800 },
    { description: 'DAS - SIMPLES Nacional', minAmount: 800, maxAmount: 2500 },
    { description: 'INSS - Contribuição Previdenciária', minAmount: 500, maxAmount: 1500 },
  ],
  quarterly: [
    { description: 'FGTS - Fundo de Garantia', minAmount: 600, maxAmount: 2000 },
    { description: 'PIS/COFINS', minAmount: 300, maxAmount: 1200 },
    { description: 'CSLL - Contribuição Social', minAmount: 200, maxAmount: 800 },
  ],
  annual: [
    { description: 'IPTU - Imposto Predial', minAmount: 2000, maxAmount: 8000 },
    { description: 'Alvará de Funcionamento', minAmount: 500, maxAmount: 1500 },
    { description: 'Seguro do Estabelecimento', minAmount: 1500, maxAmount: 5000 },
    { description: 'Taxa de Bombeiros', minAmount: 300, maxAmount: 900 },
    { description: 'Renovação CRC - Conselho Regional', minAmount: 200, maxAmount: 600 },
  ],
};

const EQUIPMENT_PURCHASES = [
  { description: 'Máquina de corte profissional', minAmount: 400, maxAmount: 1200 },
  { description: 'Cadeira de barbeiro nova', minAmount: 1500, maxAmount: 4000 },
  { description: 'Esterilizador UV', minAmount: 300, maxAmount: 800 },
  { description: 'Secador profissional', minAmount: 200, maxAmount: 600 },
  { description: 'Lavatório novo', minAmount: 800, maxAmount: 2500 },
  { description: 'Kit navalhas premium', minAmount: 150, maxAmount: 500 },
  { description: 'Espelho iluminado LED', minAmount: 300, maxAmount: 1000 },
];

const TRAINING_COURSES = [
  { description: 'Curso corte degradê avançado', minAmount: 200, maxAmount: 800 },
  { description: 'Workshop colorimetria', minAmount: 300, maxAmount: 1000 },
  { description: 'Curso barbeiro profissional', minAmount: 500, maxAmount: 2000 },
  { description: 'Treinamento atendimento ao cliente', minAmount: 150, maxAmount: 500 },
  { description: 'Curso gestão de barbearia', minAmount: 400, maxAmount: 1500 },
];

// ──────────────────────────────────────────────────────────────
// Main seed
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting test seed...\n');

  // ─── Cleanup (delete in FK-safe order) ─────────────────────
  console.log('🗑  Cleaning existing data...');
  await prisma.appointmentAuditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.barberTimeOff.deleteMany();
  await prisma.barberScheduleOverride.deleteMany();
  await prisma.barberWorkingHour.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.platformFeeConfig.deleteMany();
  await prisma.client.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.auditLog.deleteMany();
  console.log('✓ Database cleaned\n');

  const passwordHash = await bcrypt.hash(requireSeedPassword('SEED_USER_PASSWORD'), 10);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // ─── Super Admin ───────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@barbearia.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@barbearia.com',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✓ Super Admin: ${superAdmin.email}`);

  // ─── Establishments ────────────────────────────────────────
  const establishments: { id: string; name: string }[] = [];
  for (const est of ESTABLISHMENTS) {
    const record = await prisma.establishment.create({
      data: {
        name: est.name,
        lat: est.lat,
        lng: est.lng,
        monthlyCost: est.monthlyCost,
      },
    });
    establishments.push(record);
    console.log(`✓ Establishment: ${record.name} (${record.id})`);
  }

  // ─── Managers ──────────────────────────────────────────────
  for (let i = 0; i < establishments.length; i++) {
    const manager = await prisma.user.create({
      data: {
        name: `Gerente ${establishments[i].name}`,
        email: `manager${i + 1}@barbearia.com`,
        passwordHash,
        role: Role.MANAGER,
        establishmentId: establishments[i].id,
      },
    });
    console.log(`✓ Manager: ${manager.email} → ${establishments[i].name}`);
  }

  // ─── Services per establishment ──────────────────────────
  const servicesByEstablishment: Record<
    string,
    { id: string; price: number; durationMinutes: number }[]
  > = {};
  for (const est of establishments) {
    servicesByEstablishment[est.id] = [];
    for (const svc of SERVICE_CATALOG) {
      const priceVariance = 1 + (Math.random() * 0.2 - 0.1);
      const price = Math.round(svc.basePrice * priceVariance * 100) / 100;
      const record = await prisma.service.create({
        data: {
          establishmentId: est.id,
          name: svc.name,
          price,
          durationMinutes: svc.durationMinutes,
        },
      });
      servicesByEstablishment[est.id].push({
        id: record.id,
        price,
        durationMinutes: svc.durationMinutes,
      });
    }
  }
  console.log(`✓ Services created for all establishments`);

  // ─── Barbers (4 per establishment = 12 total) ─────────────
  const allBarbers: {
    id: string;
    userId: string;
    establishmentId: string;
    commissionPercent: number;
  }[] = [];
  const servicesByBarber: Record<string, { id: string; price: number; durationMinutes: number }[]> =
    {};
  let barberIndex = 0;
  for (let estIdx = 0; estIdx < establishments.length; estIdx++) {
    const estServices = servicesByEstablishment[establishments[estIdx].id];
    for (let b = 0; b < 4; b++) {
      const name = BARBER_NAMES[barberIndex];
      const email = `barber.${name.toLowerCase().replace(/\s/g, '.')}@barbearia.com`;
      const commission = pickRandom([40, 45, 50, 55, 60]);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.BARBER,
          establishmentId: establishments[estIdx].id,
        },
      });

      const shuffled = [...estServices].sort(() => Math.random() - 0.5);
      const numServices = randomBetween(3, Math.min(5, shuffled.length));
      const barberServiceSlice = shuffled.slice(0, numServices);

      const barber = await prisma.barber.create({
        data: {
          userId: user.id,
          establishmentId: establishments[estIdx].id,
          commissionPercent: commission,
          services: { connect: barberServiceSlice.map((s) => ({ id: s.id })) },
        },
      });

      allBarbers.push(barber);
      servicesByBarber[barber.id] = barberServiceSlice;

      barberIndex++;
    }
    console.log(`✓ 4 barbers + services created for ${establishments[estIdx].name}`);
  }

  // ─── Working Hours ─────────────────────────────────────────
  for (let i = 0; i < allBarbers.length; i++) {
    const scheduleType = i % WEEKDAY_SCHEDULES.length;
    const blocks = WEEKDAY_SCHEDULES[scheduleType];
    const workDays = scheduleType === 2 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];

    for (const weekday of workDays) {
      for (const block of blocks) {
        await prisma.barberWorkingHour.create({
          data: {
            barberId: allBarbers[i].id,
            weekday,
            startTime: block.startTime,
            endTime: block.endTime,
          },
        });
      }
    }
  }
  console.log(`✓ Working hours set for all barbers`);

  // ─── Time Offs (sprinkled across the year) ─────────────────
  for (const barber of allBarbers) {
    const numTimeOffs = randomBetween(3, 8);
    for (let t = 0; t < numTimeOffs; t++) {
      const daysFromNow = randomBetween(-365, 30);
      const offDate = new Date(now.getTime() + daysFromNow * 86_400_000);
      await prisma.barberTimeOff.create({
        data: {
          barberId: barber.id,
          date: dateOnly(offDate),
          reason: pickRandom(TIME_OFF_REASONS),
        },
      });
    }
  }
  console.log(`✓ Time-offs created`);

  // ─── Clients (70 per establishment = 210 total) ────────────
  const totalClients = CLIENTS_PER_ESTABLISHMENT * establishments.length;
  const allClientNames = generateClientNames(totalClients);
  const clientsByEst: Record<string, WeightedItem[]> = {};
  let clientIndex = 0;

  for (let estIdx = 0; estIdx < establishments.length; estIdx++) {
    const estId = establishments[estIdx].id;
    clientsByEst[estId] = [];

    for (let c = 0; c < CLIENTS_PER_ESTABLISHMENT; c++) {
      const clientName = allClientNames[clientIndex];
      const client = await prisma.client.create({
        data: {
          establishmentId: estId,
          name: clientName,
          cpf: encryptDeterministic(generateCPF(clientIndex)),
          phone: encrypt(generatePhone(clientIndex)),
        },
      });
      clientsByEst[estId].push({ id: client.id, weight: assignFrequencyWeight() });
      clientIndex++;
    }
    console.log(`✓ ${CLIENTS_PER_ESTABLISHMENT} clients for ${establishments[estIdx].name}`);
  }
  console.log(`✓ ${totalClients} total clients created with weighted frequency`);

  // ─── Platform Fee Configs ──────────────────────────────────
  const platformFeeRateByEst: Record<string, number> = {};
  for (const est of establishments) {
    const rate = pickRandom([0.03, 0.05, 0.07, 0.1]);
    platformFeeRateByEst[est.id] = rate;
    await prisma.platformFeeConfig.create({
      data: {
        establishmentId: est.id,
        feeType: FeeType.PERCENTAGE,
        percentageRate: rate,
        includesTips: false,
        effectiveFrom: oneYearAgo,
        isActive: true,
      },
    });
  }
  console.log(`✓ Platform fee configs created`);

  // ─── Appointments + Payments ───────────────────────────────
  let appointmentCount = 0;
  let paymentCount = 0;
  const endDate = new Date(now.getTime() + 14 * 86_400_000);

  for (let estIdx = 0; estIdx < establishments.length; estIdx++) {
    const estId = establishments[estIdx].id;
    const estBarbers = allBarbers.filter((b) => b.establishmentId === estId);
    const estClients = clientsByEst[estId];
    const feeRate = platformFeeRateByEst[estId];

    const cursor = new Date(oneYearAgo);
    while (cursor <= endDate) {
      const dayOfWeek = cursor.getDay();
      if (dayOfWeek === 0) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      for (const barber of estBarbers) {
        const barberServices = servicesByBarber[barber.id];
        const numAppointments = randomBetween(2, 6);
        let slotHour = randomBetween(8, 10);
        let slotMinute = pickRandom([0, 15, 30, 45]);

        for (let a = 0; a < numAppointments; a++) {
          const service = pickRandom(barberServices);
          const client = pickWeighted(estClients);
          const startsAt = setTime(cursor, slotHour, slotMinute);
          const endsAt = addMinutes(startsAt, service.durationMinutes);

          const barberAmount =
            Math.round(service.price * (barber.commissionPercent / 100) * 100) / 100;
          const establishmentAmount = Math.round((service.price - barberAmount) * 100) / 100;

          let status: AppointmentStatus;
          let tipAmount = 0;
          let cancellationFeeCharged = false;
          let cancellationFeeAmount = 0;
          const isPast = startsAt < now;

          if (!isPast) {
            status = pickRandom([
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.CONFIRMATION_PENDING,
            ]);
          } else {
            const roll = Math.random();
            if (roll < 0.6) {
              status = AppointmentStatus.DONE;
              tipAmount = Math.random() < 0.3 ? pickRandom([5, 10, 15, 20]) : 0;
            } else if (roll < 0.75) {
              status = AppointmentStatus.CANCELED;
              if (Math.random() < 0.4) {
                cancellationFeeCharged = true;
                cancellationFeeAmount = Math.round(service.price * 0.2 * 100) / 100;
              }
            } else if (roll < 0.85) {
              status = AppointmentStatus.NO_SHOW;
            } else if (roll < 0.92) {
              status = AppointmentStatus.IN_PROGRESS;
            } else {
              status = AppointmentStatus.CONFIRMED;
            }
          }

          const code = generateCode();
          appointmentCount++;

          const confirmationSentAt =
            status !== AppointmentStatus.SCHEDULED ? addMinutes(startsAt, -120) : null;
          const confirmedAt =
            status === AppointmentStatus.CONFIRMED ||
            status === AppointmentStatus.IN_PROGRESS ||
            status === AppointmentStatus.DONE
              ? addMinutes(startsAt, -60)
              : null;
          const reminderSentAt =
            status === AppointmentStatus.CONFIRMED ||
            status === AppointmentStatus.IN_PROGRESS ||
            status === AppointmentStatus.DONE
              ? addMinutes(startsAt, -30)
              : null;
          const startedAt =
            status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.DONE
              ? startsAt
              : null;
          const finishedAt = status === AppointmentStatus.DONE ? endsAt : null;

          const appointment = await prisma.appointment.create({
            data: {
              code,
              establishmentId: estId,
              barberId: barber.id,
              clientId: client.id,
              serviceId: service.id,
              startsAt,
              endsAt,
              status,
              priceSnapshot: service.price,
              barberAmountSnapshot: barberAmount,
              establishmentAmountSnapshot: establishmentAmount,
              tipAmount,
              cancellationFeeCharged,
              cancellationFeeAmount,
              confirmationSentAt,
              confirmedAt,
              reminderSentAt,
              startedAt,
              finishedAt,
              createdAt: addMinutes(startsAt, -randomBetween(60, 4320)),
            },
          });

          // ── Audit logs ───────────────────────────────
          const auditTrail: { from: AppointmentStatus; to: AppointmentStatus; at: Date }[] = [];

          if (status === AppointmentStatus.CONFIRMATION_PENDING) {
            auditTrail.push({
              from: AppointmentStatus.SCHEDULED,
              to: AppointmentStatus.CONFIRMATION_PENDING,
              at: confirmationSentAt ?? startsAt,
            });
          }
          if (status === AppointmentStatus.CONFIRMED) {
            auditTrail.push(
              {
                from: AppointmentStatus.SCHEDULED,
                to: AppointmentStatus.CONFIRMATION_PENDING,
                at: addMinutes(startsAt, -120),
              },
              {
                from: AppointmentStatus.CONFIRMATION_PENDING,
                to: AppointmentStatus.CONFIRMED,
                at: confirmedAt ?? startsAt,
              },
            );
          }
          if (status === AppointmentStatus.IN_PROGRESS) {
            auditTrail.push(
              {
                from: AppointmentStatus.SCHEDULED,
                to: AppointmentStatus.CONFIRMATION_PENDING,
                at: addMinutes(startsAt, -120),
              },
              {
                from: AppointmentStatus.CONFIRMATION_PENDING,
                to: AppointmentStatus.CONFIRMED,
                at: addMinutes(startsAt, -60),
              },
              {
                from: AppointmentStatus.CONFIRMED,
                to: AppointmentStatus.IN_PROGRESS,
                at: startsAt,
              },
            );
          }
          if (status === AppointmentStatus.DONE) {
            auditTrail.push(
              {
                from: AppointmentStatus.SCHEDULED,
                to: AppointmentStatus.CONFIRMATION_PENDING,
                at: addMinutes(startsAt, -120),
              },
              {
                from: AppointmentStatus.CONFIRMATION_PENDING,
                to: AppointmentStatus.CONFIRMED,
                at: addMinutes(startsAt, -60),
              },
              {
                from: AppointmentStatus.CONFIRMED,
                to: AppointmentStatus.IN_PROGRESS,
                at: startsAt,
              },
              { from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.DONE, at: endsAt },
            );
          }
          if (status === AppointmentStatus.CANCELED) {
            auditTrail.push({
              from: AppointmentStatus.SCHEDULED,
              to: AppointmentStatus.CANCELED,
              at: addMinutes(startsAt, -randomBetween(30, 180)),
            });
          }
          if (status === AppointmentStatus.NO_SHOW) {
            auditTrail.push(
              {
                from: AppointmentStatus.SCHEDULED,
                to: AppointmentStatus.CONFIRMATION_PENDING,
                at: addMinutes(startsAt, -120),
              },
              {
                from: AppointmentStatus.CONFIRMATION_PENDING,
                to: AppointmentStatus.NO_SHOW,
                at: addMinutes(startsAt, 15),
              },
            );
          }

          if (auditTrail.length > 0) {
            await prisma.appointmentAuditLog.createMany({
              data: auditTrail.map((a) => ({
                appointmentId: appointment.id,
                fromStatus: a.from,
                toStatus: a.to,
                changedAt: a.at,
                changedBy: 'system',
              })),
            });
          }

          // ── Payment (for DONE, or cancellation-fee scenarios) ──
          if (status === AppointmentStatus.DONE) {
            const platformFeeAmount = Math.round(service.price * feeRate * 100) / 100;
            await prisma.payment.create({
              data: {
                appointmentId: appointment.id,
                establishmentId: estId,
                amount: service.price,
                tipAmount,
                platformFeeAmount,
                method: pickRandom(PAYMENT_METHODS),
                status: PaymentStatus.COMPLETED,
                paidAt: endsAt,
              },
            });
            paymentCount++;
          } else if (status === AppointmentStatus.CANCELED && cancellationFeeCharged) {
            const platformFeeAmount = Math.round(cancellationFeeAmount * feeRate * 100) / 100;
            await prisma.payment.create({
              data: {
                appointmentId: appointment.id,
                establishmentId: estId,
                amount: cancellationFeeAmount,
                tipAmount: 0,
                platformFeeAmount,
                method: pickRandom([PaymentMethod.PIX, PaymentMethod.CREDIT_CARD]),
                status: PaymentStatus.COMPLETED,
                paidAt: startsAt,
                notes: 'Taxa de cancelamento',
              },
            });
            paymentCount++;
          } else if (status === AppointmentStatus.IN_PROGRESS) {
            await prisma.payment.create({
              data: {
                appointmentId: appointment.id,
                establishmentId: estId,
                amount: service.price,
                tipAmount: 0,
                platformFeeAmount: 0,
                status: PaymentStatus.PENDING,
              },
            });
            paymentCount++;
          }

          if (status === AppointmentStatus.DONE && Math.random() < 0.03) {
            await prisma.payment.update({
              where: { appointmentId: appointment.id },
              data: {
                status: PaymentStatus.REFUNDED,
                refundedAt: addMinutes(endsAt, randomBetween(60, 1440)),
                refundAmount: service.price,
                refundReason: pickRandom([
                  'Cliente insatisfeito',
                  'Serviço incorreto',
                  'Erro de cobrança',
                ]),
              },
            });
          }

          slotMinute += service.durationMinutes + pickRandom([5, 10, 15, 30]);
          while (slotMinute >= 60) {
            slotMinute -= 60;
            slotHour++;
          }
          if (slotHour >= 21) break;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  console.log(`\n✓ ${appointmentCount} appointments created with audit logs`);
  console.log(`✓ ${paymentCount} payments created`);

  // ─── Expenses (monthly recurring + taxes + one-offs) ───────
  let expenseCount = 0;

  for (const est of establishments) {
    const estBarbers = allBarbers.filter((b) => b.establishmentId === est.id);

    const monthCursor = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    while (monthCursor <= lastMonth) {
      const monthDate = new Date(monthCursor);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // ── Rent ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.RENT,
          description: 'Aluguel mensal',
          amount: ESTABLISHMENTS.find((e) => e.name === est.name)?.monthlyCost ?? 4000,
          date: new Date(year, month, 5),
        },
      });
      expenseCount++;

      // ── Utilities ──
      for (const desc of ['Conta de luz', 'Conta de água', 'Internet', 'Telefone']) {
        await prisma.expense.create({
          data: {
            establishmentId: est.id,
            category: ExpenseCategory.UTILITIES,
            description: desc,
            amount: randomBetween(80, 450),
            date: new Date(year, month, randomBetween(8, 15)),
          },
        });
        expenseCount++;
      }

      // ── Salaries ──
      for (const desc of [
        'Salário recepcionista',
        'Salário auxiliar de limpeza',
        'Pró-labore sócio',
      ]) {
        await prisma.expense.create({
          data: {
            establishmentId: est.id,
            category: ExpenseCategory.SALARY,
            description: desc,
            amount:
              desc === 'Pró-labore sócio' ? randomBetween(3000, 6000) : randomBetween(1200, 2200),
            date: new Date(year, month, 5),
          },
        });
        expenseCount++;
      }

      // ── Vale-transporte ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.SALARY,
          description: 'Vale-transporte funcionários',
          amount: randomBetween(200, 500),
          date: new Date(year, month, 1),
        },
      });
      expenseCount++;

      // ── 13o salário in December ──
      if (month === 11) {
        for (const desc of ['13º salário recepcionista', '13º salário auxiliar de limpeza']) {
          await prisma.expense.create({
            data: {
              establishmentId: est.id,
              category: ExpenseCategory.SALARY,
              description: desc,
              amount: randomBetween(1200, 2200),
              date: new Date(year, month, 20),
            },
          });
          expenseCount++;
        }
      }

      // ── Supplies (4-8 per month) ──
      const supplyCount = randomBetween(4, 8);
      for (let s = 0; s < supplyCount; s++) {
        await prisma.expense.create({
          data: {
            establishmentId: est.id,
            barberId: pickRandom(estBarbers).id,
            category: ExpenseCategory.SUPPLIES,
            description: pickRandom(EXPENSE_DESCRIPTIONS[ExpenseCategory.SUPPLIES]),
            amount: randomBetween(15, 350),
            date: new Date(year, month, randomBetween(1, 28)),
          },
        });
        expenseCount++;
      }

      // ── Maintenance (50% chance, 1-2 per month) ──
      if (Math.random() < 0.5) {
        const maintenanceCount = randomBetween(1, 2);
        for (let m = 0; m < maintenanceCount; m++) {
          await prisma.expense.create({
            data: {
              establishmentId: est.id,
              category: ExpenseCategory.MAINTENANCE,
              description: pickRandom(EXPENSE_DESCRIPTIONS[ExpenseCategory.MAINTENANCE]),
              amount: randomBetween(100, 1500),
              date: new Date(year, month, randomBetween(1, 28)),
            },
          });
          expenseCount++;
        }
      }

      // ── Marketing (monthly) ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.OTHER,
          description: pickRandom([
            'Anúncios Instagram/Facebook',
            'Material de marketing impresso',
            'Cartões de visita',
            'Banner promocional',
          ]),
          amount: randomBetween(100, 800),
          date: new Date(year, month, randomBetween(1, 15)),
        },
      });
      expenseCount++;

      // ── Café e água para clientes ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.OTHER,
          description: 'Café e água para clientes',
          amount: randomBetween(50, 200),
          date: new Date(year, month, randomBetween(1, 10)),
        },
      });
      expenseCount++;

      // ── Software subscriptions ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.OTHER,
          description: pickRandom([
            'Assinatura software agendamento',
            'Assinatura contabilidade online',
            'Plano Google Workspace',
          ]),
          amount: randomBetween(50, 300),
          date: new Date(year, month, 1),
        },
      });
      expenseCount++;

      // ── Card processing fees ──
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.OTHER,
          description: 'Taxa de maquininha de cartão',
          amount: randomBetween(80, 400),
          date: new Date(year, month, randomBetween(25, 28)),
        },
      });
      expenseCount++;

      // ── Other random expenses (60% chance) ──
      if (Math.random() < 0.6) {
        await prisma.expense.create({
          data: {
            establishmentId: est.id,
            category: ExpenseCategory.OTHER,
            description: pickRandom(EXPENSE_DESCRIPTIONS[ExpenseCategory.OTHER]),
            amount: randomBetween(30, 500),
            date: new Date(year, month, randomBetween(1, 28)),
          },
        });
        expenseCount++;
      }

      // ══════════════════════════════════════════════
      // TAXES
      // ══════════════════════════════════════════════

      // ── Monthly taxes ──
      for (const tax of TAX_DESCRIPTIONS.monthly) {
        await prisma.expense.create({
          data: {
            establishmentId: est.id,
            category: ExpenseCategory.OTHER,
            description: tax.description,
            amount: randomBetween(tax.minAmount, tax.maxAmount),
            date: new Date(year, month, randomBetween(15, 20)),
          },
        });
        expenseCount++;
      }

      // ── Quarterly taxes (Jan, Apr, Jul, Oct) ──
      if (month % 3 === 0) {
        for (const tax of TAX_DESCRIPTIONS.quarterly) {
          await prisma.expense.create({
            data: {
              establishmentId: est.id,
              category: ExpenseCategory.OTHER,
              description: tax.description,
              amount: randomBetween(tax.minAmount, tax.maxAmount),
              date: new Date(year, month, randomBetween(10, 20)),
            },
          });
          expenseCount++;
        }
      }

      // ── Annual taxes (January) ──
      if (month === 0) {
        for (const tax of TAX_DESCRIPTIONS.annual) {
          await prisma.expense.create({
            data: {
              establishmentId: est.id,
              category: ExpenseCategory.OTHER,
              description: tax.description,
              amount: randomBetween(tax.minAmount, tax.maxAmount),
              date: new Date(year, month, randomBetween(5, 25)),
            },
          });
          expenseCount++;
        }
      }

      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }

    // ── Equipment purchases (2-3 per year) ──
    const equipmentPurchases = randomBetween(2, 3);
    for (let e = 0; e < equipmentPurchases; e++) {
      const purchaseMonth = randomBetween(0, 11);
      const item = pickRandom(EQUIPMENT_PURCHASES);
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          barberId: pickRandom(estBarbers).id,
          category: ExpenseCategory.OTHER,
          description: item.description,
          amount: randomBetween(item.minAmount, item.maxAmount),
          date: new Date(
            oneYearAgo.getFullYear(),
            oneYearAgo.getMonth() + purchaseMonth,
            randomBetween(1, 28),
          ),
        },
      });
      expenseCount++;
    }

    // ── Renovation (1 per year, large cost) ──
    await prisma.expense.create({
      data: {
        establishmentId: est.id,
        category: ExpenseCategory.MAINTENANCE,
        description: pickRandom([
          'Reforma geral do salão',
          'Ampliação do espaço',
          'Troca de piso',
          'Renovação da fachada',
        ]),
        amount: randomBetween(3000, 15000),
        date: new Date(
          oneYearAgo.getFullYear(),
          oneYearAgo.getMonth() + randomBetween(2, 10),
          randomBetween(1, 28),
        ),
      },
    });
    expenseCount++;

    // ── Training courses for barbers (3-5 per year) ──
    const trainingCount = randomBetween(3, 5);
    for (let t = 0; t < trainingCount; t++) {
      const course = pickRandom(TRAINING_COURSES);
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          barberId: pickRandom(estBarbers).id,
          category: ExpenseCategory.OTHER,
          description: course.description,
          amount: randomBetween(course.minAmount, course.maxAmount),
          date: new Date(
            oneYearAgo.getFullYear(),
            oneYearAgo.getMonth() + randomBetween(0, 11),
            randomBetween(1, 28),
          ),
        },
      });
      expenseCount++;
    }

    // ── Uniform purchases (2x per year) ──
    for (const uniformMonth of [2, 8]) {
      await prisma.expense.create({
        data: {
          establishmentId: est.id,
          category: ExpenseCategory.OTHER,
          description: 'Uniforme funcionários',
          amount: randomBetween(300, 800),
          date: new Date(
            oneYearAgo.getFullYear(),
            oneYearAgo.getMonth() + uniformMonth,
            randomBetween(1, 28),
          ),
        },
      });
      expenseCount++;
    }
  }

  console.log(`✓ ${expenseCount} expenses created (includes taxes, equipment, training)`);

  // ─── Schedule Overrides (holiday hours, special events) ────
  for (const barber of allBarbers) {
    await prisma.barberScheduleOverride.create({
      data: {
        barberId: barber.id,
        startDate: new Date(now.getFullYear(), 11, 23),
        endDate: new Date(now.getFullYear(), 11, 26),
        startTime: '09:00',
        endTime: '13:00',
        reason: 'Horário especial de Natal',
      },
    });

    await prisma.barberScheduleOverride.create({
      data: {
        barberId: barber.id,
        startDate: new Date(now.getFullYear(), 11, 30),
        endDate: new Date(now.getFullYear() + 1, 0, 2),
        startTime: '10:00',
        endTime: '14:00',
        reason: 'Horário especial de Ano Novo',
      },
    });

    await prisma.barberScheduleOverride.create({
      data: {
        barberId: barber.id,
        startDate: new Date(now.getFullYear(), 1, 14),
        endDate: new Date(now.getFullYear(), 1, 18),
        startTime: '10:00',
        endTime: '15:00',
        reason: 'Horário de Carnaval',
      },
    });
  }
  console.log(`✓ Schedule overrides created`);

  // ─── Summary ───────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.establishment.count(),
    prisma.user.count(),
    prisma.barber.count(),
    prisma.client.count(),
    prisma.service.count(),
    prisma.appointment.count(),
    prisma.payment.count(),
    prisma.expense.count(),
    prisma.barberWorkingHour.count(),
    prisma.barberTimeOff.count(),
    prisma.barberScheduleOverride.count(),
    prisma.appointmentAuditLog.count(),
    prisma.platformFeeConfig.count(),
  ]);

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        TEST SEED SUMMARY             ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Establishments:       ${String(counts[0]).padStart(8)}  ║`);
  console.log(`║  Users:                ${String(counts[1]).padStart(8)}  ║`);
  console.log(`║  Barbers:              ${String(counts[2]).padStart(8)}  ║`);
  console.log(`║  Clients:              ${String(counts[3]).padStart(8)}  ║`);
  console.log(`║  Services:             ${String(counts[4]).padStart(8)}  ║`);
  console.log(`║  Appointments:         ${String(counts[5]).padStart(8)}  ║`);
  console.log(`║  Payments:             ${String(counts[6]).padStart(8)}  ║`);
  console.log(`║  Expenses:             ${String(counts[7]).padStart(8)}  ║`);
  console.log(`║  Working Hours:        ${String(counts[8]).padStart(8)}  ║`);
  console.log(`║  Time Offs:            ${String(counts[9]).padStart(8)}  ║`);
  console.log(`║  Schedule Overrides:   ${String(counts[10]).padStart(8)}  ║`);
  console.log(`║  Audit Logs:           ${String(counts[11]).padStart(8)}  ║`);
  console.log(`║  Platform Fee Configs: ${String(counts[12]).padStart(8)}  ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('\n🔑 All users share the password from SEED_USER_PASSWORD');
  console.log('📧 Super Admin: superadmin@barbearia.com');
  console.log(
    '📧 Managers: manager1@barbearia.com, manager2@barbearia.com, manager3@barbearia.com',
  );
  console.log('📧 Barbers: barber.<first.last>@barbearia.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
