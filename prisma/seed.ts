import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  // DADOS REAIS DO SEU SUPABASE
  const SUPABASE_USER_ID = 'dc9ad8d8-b940-4865-9fff-d921d7ab7d05'
  const USER_EMAIL = 'fuentes_tti@hotmail.com' // Email do login

  console.log('🌱 Iniciando seed SINCRONIZADO...')
  console.log(`🎯 Alvo: ${USER_EMAIL} (UID: ${SUPABASE_USER_ID})`)

  // 1. LIMPEZA DE CONFLITOS (Remove perfis antigos com emails/IDs conflitantes)
  // Remove qualquer perfil com esse email que tenha ID errado
  await prisma.serviceProfessional.deleteMany({ where: { profile: { email: USER_EMAIL, id: { not: SUPABASE_USER_ID } } } })
  await prisma.profile.deleteMany({ 
    where: { 
        email: USER_EMAIL, 
        id: { not: SUPABASE_USER_ID } 
    } 
  })
  
  // 2. CRIAR CLÍNICA
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'vf-estetica' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'VF Estética Avançada',
      slug: 'vf-estetica',
    },
  })
  console.log(`🏥 Clínica: ${clinic.name}`)

  // 3. CRIAR ROLES (Cargos)
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Acesso total ao sistema' }
  })

  // 4. CRIAR PERMISSÕES
  const permissionsData = [
    { resource: 'calendar', action: 'read' },
    { resource: 'calendar', action: 'write' },
    { resource: 'patient', action: 'read' },
    { resource: 'patient', action: 'write' },
    { resource: 'financial', action: 'read' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'write' },
  ]

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: { resource: p.resource, action: p.action }
    })

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: perm.id }
    })
  }

  // 5. CRIAR/ATUALIZAR SEU PERFIL COM O ID DO SUPABASE
  const user = await prisma.profile.upsert({
    where: { id: SUPABASE_USER_ID }, // A busca é feita pelo ID Exato
    update: {
        roleId: roleAdmin.id,
        clinicId: clinic.id,
        email: USER_EMAIL, // Garante que o email no banco bate com o login
        isActive: true
    },
    create: {
      id: SUPABASE_USER_ID, // Insere o ID exato do Supabase
      email: USER_EMAIL,
      fullName: 'Victor Fuentes',
      roleId: roleAdmin.id,
      clinicId: clinic.id,
      isActive: true,
      avatarUrl: 'https://github.com/shadcn.png',
    },
  })
  console.log(`👤 Usuário SINCRONIZADO: ${user.fullName}`)

  // 6. CRIAR SERVIÇOS
  const serviceBotox = await prisma.service.create({
    data: {
        clinicId: clinic.id,
        name: 'Aplicação de Toxina Botulínica',
        category: 'INJETAVEL',
        price: 1200.00,
        duration: 30,
        isActive: true
    }
  })

  // 7. VINCULAR VOCÊ AO SERVIÇO (Agenda funcionar)
  // Primeiro limpa vínculos antigos desse serviço/perfil para evitar duplicidade
  await prisma.serviceProfessional.deleteMany({
      where: { profileId: user.id }
  })
  
  await prisma.serviceProfessional.create({
    data: {
        serviceId: serviceBotox.id,
        profileId: user.id, // ID correto
        commissionRate: 10.0
    }
  })
  console.log(`🔗 Vínculo criado: Agenda habilitada para ${serviceBotox.name}`)

  // 8. SETTINGS DO SISTEMA
  await prisma.systemSetting.createMany({
    skipDuplicates: true,
    data: [
        { clinicId: clinic.id, key: 'theme', value: 'light', category: 'appearance', dataType: 'string' },
        { clinicId: clinic.id, key: 'calendar_start', value: '08:00', category: 'calendar', dataType: 'time' },
        { clinicId: clinic.id, key: 'calendar_end', value: '18:00', category: 'calendar', dataType: 'time' },
    ]
  })
  
  console.log('🚀 SEED FINALIZADO! Pode logar agora.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })