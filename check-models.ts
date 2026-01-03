// check-models.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Isso vai listar todas as chaves do objeto prisma que começam com letra minúscula (os models)
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && key[0] === key[0].toLowerCase())
  console.log('📋 Modelos disponíveis no Prisma Client:', models)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect() })