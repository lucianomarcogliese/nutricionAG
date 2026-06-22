import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true, name: true, role: true },
    orderBy: { email: 'asc' }
  })
  console.log('\n=== TODOS LOS USUARIOS ===')
  for (const u of users) {
    console.log(`  id=${u.id}  email=${u.email}  role=${u.role}  hasPassword=${!!u.passwordHash}  name=${u.name}`)
  }

  const accounts = await prisma.account.findMany({
    select: { id: true, provider: true, userId: true, providerAccountId: true }
  })
  console.log('\n=== TODAS LAS ACCOUNTS ===')
  for (const a of accounts) {
    console.log(`  provider=${a.provider}  providerAccountId=${a.providerAccountId}  userId=${a.userId}`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
