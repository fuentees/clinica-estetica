import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ====================================================================
// ⚠️ ATENÇÃO: SUBSTITUA PELO SEU ID REAL DO SUPABASE (MENU AUTH > USERS)
// ====================================================================
const SUPABASE_USER_ID = 'd551add1-3a2b-4f52-bc64-07ed574aeb9b'; 
const MY_EMAIL = 'fuentes_tti@hotmail.com';

async function main() {
  console.log('🌱 Iniciando seed definitivo...')

  // ======================================================
  // 1. CLÍNICA
  // ======================================================
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'vf-estetica' },
    update: { isActive: true },
    create: {
      name: 'VF Estética Avançada',
      slug: 'vf-estetica',
      primaryColor: '#B43250',
      isActive: true,
    },
  })

  // ======================================================
  // 2. ROLE ADMIN
  // ======================================================
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Acesso total ao sistema' },
  })

  // ======================================================
  // 3. PERMISSÕES (Tipagem corrigida para evitar erro de aritmética)
  // ======================================================
  const permissions: [string, string][] = [
    ['calendar', 'read'], 
    ['calendar', 'write'],
    ['patient', 'read'], 
    ['patient', 'write'],
    ['settings', 'write'],
  ]

  for (const [resource, action] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    })

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: permission.id } },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: permission.id },
    })
  }

  // ======================================================
  // 4. PERFIL ADMIN
  // ======================================================
  const adminProfile = await prisma.profile.upsert({
    where: { id: SUPABASE_USER_ID },
    update: {
      email: MY_EMAIL,
      roleLegacy: 'admin',
      clinicId: clinic.id,
      roleId: roleAdmin.id,
      isActive: true,
    },
    create: {
      id: SUPABASE_USER_ID,
      email: MY_EMAIL,
      fullName: 'Victor Fuentes',
      firstName: 'Victor',
      lastName: 'Fuentes',
      roleLegacy: 'admin',
      isActive: true,
      clinicId: clinic.id,
      roleId: roleAdmin.id,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:00',
      endTime: '19:00',
      agendaColor: '#db2777'
    },
  });

  // ======================================================
  // 5. SERVIÇOS (Tipagem explícita para evitar erro string | number)
  // ======================================================
  const services: { name: string; category: string; price: number; duration: number }[] = [
    { name: 'Toxina Botulínica (Botox)', category: 'INJETAVEL', price: 1200, duration: 30 },
    { name: 'Bioestimulador Sculptra', category: 'INJETAVEL', price: 2400, duration: 45 },
    { name: 'Peeling Químico Renovador', category: 'ESTETICA', price: 350, duration: 60 },
  ]

  for (const s of services) {
    const service = await prisma.service.upsert({
      where: { clinicId_name: { clinicId: clinic.id, name: s.name } },
      update: {},
      create: {
        clinicId: clinic.id,
        name: s.name,
        category: s.category,
        price: s.price,
        duration: s.duration,
        isActive: true,
      },
    })
    
    // Vincula ao profissional se ele existir
    if(adminProfile) {
        await prisma.serviceProfessional.upsert({
            where: { serviceId_profileId: { serviceId: service.id, profileId: adminProfile.id } },
            update: {},
            create: { serviceId: service.id, profileId: adminProfile.id, commissionRate: 15 }
        });
    }
  }

  // ======================================================
  // 6. CONFIGURAÇÕES
  // ======================================================
  await prisma.systemSetting.createMany({
    data: [
      { clinicId: clinic.id, key: 'system_status', value: 'active' },
      { clinicId: clinic.id, key: 'ai_engine', value: 'enabled' },
      { clinicId: clinic.id, key: 'calendar_start', value: '08:00' },
      { clinicId: clinic.id, key: 'calendar_end', value: '20:00' },
    ],
    skipDuplicates: true,
  })

  // ======================================================
  // 7. 🔥 CORREÇÃO DE PERMISSÕES E CACHE 🔥
  // ======================================================
  console.log('🔓 Restaurando permissões e limpando cache do Supabase...')
  
  const sqlCommands: string[] = [
    `GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role`,
    `GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role`,
    `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role`,
    `GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role`,
    
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role`,

    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE roles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE clinics ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE patients ENABLE ROW LEVEL SECURITY`,
    
    // Profiles
    `DROP POLICY IF EXISTS "Seed Read Profiles" ON profiles`,
    `DROP POLICY IF EXISTS "Liberar geral profiles" ON profiles`,
    `DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON profiles`,
    `CREATE POLICY "Seed Read Profiles" ON profiles FOR SELECT USING (true)`,
    `CREATE POLICY "Seed Update Profiles" ON profiles FOR UPDATE USING (true)`,
    
    // Roles
    `DROP POLICY IF EXISTS "Seed Read Roles" ON roles`,
    `DROP POLICY IF EXISTS "Liberar geral roles" ON roles`,
    `CREATE POLICY "Seed Read Roles" ON roles FOR SELECT USING (true)`,

    // Clinics
    `DROP POLICY IF EXISTS "Seed Read Clinics" ON clinics`,
    `CREATE POLICY "Seed Read Clinics" ON clinics FOR SELECT USING (true)`,

    // Patients
    `DROP POLICY IF EXISTS "Seed Read Patients" ON patients`,
    `CREATE POLICY "Seed Read Patients" ON patients FOR SELECT USING (true)`,
    `CREATE POLICY "Seed Write Patients" ON patients FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Seed Update Patients" ON patients FOR UPDATE USING (true)`,

    // Cache reload
    `NOTIFY pgrst, 'reload'` 
  ];

  for (const command of sqlCommands) {
    try {
        await prisma.$executeRawUnsafe(command);
    } catch (error) {
        console.warn(`⚠️ Aviso SQL: ${command.substring(0, 40)}...`);
    }
  }

  console.log('🚀 Seed concluído! Login liberado e cache atualizado.')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })