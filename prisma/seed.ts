import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  // ==========================================
  // 1. CONFIGURAÇÕES DE IDENTIDADE (FIXO SUPABASE)
  // ==========================================
  const SUPABASE_USER_ID = 'dc9ad8d8-b940-4865-9fff-d921d7ab7d05'
  const USER_EMAIL = 'fuentes_tti@hotmail.com'

  console.log('🌱 Iniciando Seed Estrutural Premium...')

  // ==========================================
  // 2. LIMPEZA DE SEGURANÇA (Previne erros de duplicidade)
  // ==========================================
  // Remove vínculos de profissionais antes de recriar
  await prisma.serviceProfessional.deleteMany({})
  // Remove configurações antigas para garantir as novas
  await prisma.systemSetting.deleteMany({})

  // ==========================================
  // 3. CRIAR CLÍNICA (Identidade Visual Integrada)
  // ==========================================
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'vf-estetica' },
    update: {
      primaryColor: '#B43250', // Rosa/Vinho para o PDF
    },
    create: {
      id: uuidv4(),
      name: 'VF Estética Avançada',
      slug: 'vf-estetica',
      primaryColor: '#B43250',
      isActive: true,
    },
  })
  console.log(`🏥 Clínica: ${clinic.name}`)

  // ==========================================
  // 4. ESTRUTURA DE CARGOS (Roles)
  // ==========================================
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { 
      name: 'ADMIN', 
      description: 'Acesso total, Auditoria e Inteligência Clínica' 
    }
  })

  // ==========================================
  // 5. MATRIZ DE PERMISSÕES (Segurança & IA)
  // ==========================================
  const permissionsData = [
    { resource: 'calendar', action: 'read' },
    { resource: 'calendar', action: 'write' },
    { resource: 'patient', action: 'read' },
    { resource: 'patient', action: 'write' },
    { resource: 'clinical_ia', action: 'read' },     // ✅ Essencial para o motor de IA
    { resource: 'legal_terms', action: 'write' },    // ✅ Essencial para Assinatura Digital
    { resource: 'financial', action: 'read' },
    { resource: 'inventory', action: 'write' },
    { resource: 'settings', action: 'write' },
  ]

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: { resource: p.resource, action: p.action }
    })

    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: { roleId: roleAdmin.id, permissionId: perm.id } 
      },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: perm.id }
    })
  }

  // ==========================================
  // 6. SINCRONIZAR PERFIL DO USUÁRIO (Admin)
  // ==========================================
  const user = await prisma.profile.upsert({
    where: { id: SUPABASE_USER_ID },
    update: {
      email: USER_EMAIL,
      roleId: roleAdmin.id,
      clinicId: clinic.id,
      isActive: true
    },
    create: {
      id: SUPABASE_USER_ID,
      email: USER_EMAIL,
      fullName: 'Victor Fuentes',
      firstName: 'Victor',
      lastName: 'Fuentes',
      roleId: roleAdmin.id,
      clinicId: clinic.id,
      isActive: true,
      avatarUrl: 'https://github.com/shadcn.png',
    },
  })
  console.log(`👤 Perfil Sincronizado: ${user.fullName}`)

  // ==========================================
  // 7. CATÁLOGO DE SERVIÇOS TÉCNICOS
  // ==========================================
  const services = [
    { name: 'Toxina Botulínica (Botox)', cat: 'INJETAVEL', price: 1200, dur: 30 },
    { name: 'Bioestimulador Sculptra', cat: 'INJETAVEL', price: 2400, dur: 45 },
    { name: 'Peeling Químico Renovador', cat: 'ESTETICA', price: 350, dur: 60 },
  ]

  for (const s of services) {
    const service = await prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: s.name,
        category: s.cat,
        price: s.price,
        duration: s.dur,
        isActive: true
      }
    })

    // Vincula o profissional ao serviço para habilitar a agenda
    await prisma.serviceProfessional.create({
      data: {
        serviceId: service.id,
        profileId: user.id,
        commissionRate: 15.0
      }
    })
  }

  // ==========================================
  // 8. CONFIGURAÇÕES GLOBAIS DO SAAS (Novos Módulos)
  // ==========================================
  await prisma.systemSetting.createMany({
    data: [
      { clinicId: clinic.id, key: 'ai_engine', value: 'enabled', category: 'ai', dataType: 'string' },
      { clinicId: clinic.id, key: 'digital_signature', value: 'required', category: 'legal', dataType: 'string' },
      { clinicId: clinic.id, key: 'whatsapp_reminders', value: 'active', category: 'notifications', dataType: 'string' },
      { clinicId: clinic.id, key: 'calendar_start', value: '08:00', category: 'calendar', dataType: 'time' },
      { clinicId: clinic.id, key: 'calendar_end', value: '20:00', category: 'calendar', dataType: 'time' },
    ]
  })

  console.log('🚀 SEED COMPLETO: Sistema pronto para operação clínica de alto nível.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })