const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  const pinHash = await bcrypt.hash('1234', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', pinHash, role: 'ADMIN' },
  })
  console.log('✅ Admin user:', admin.username, '(PIN: 1234)')

  const posts = [
    { category: 'love', author: 'My Diary Editor', text: 'You make ordinary moments feel like the best part of the day.' },
    { category: 'shayari', author: 'My Diary Editor', text: 'In the hush between two heartbeats, some feelings find their voice.' },
    { category: 'motivation', author: 'A. P. J. Abdul Kalam', title: 'Dream Big', text: 'Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.' },
    { category: 'legends', author: 'Swami Vivekananda', text: 'Arise, awake, and stop not till the goal is reached.' },
    { category: 'thoughts', author: 'My Diary Editor', text: 'Protect your peace without apologizing for needing it.' },
  ]

  for (const post of posts) {
    const exists = await prisma.adminPost.findFirst({ where: { text: post.text } })
    if (!exists) {
      await prisma.adminPost.create({ data: post })
      console.log('✅ Post:', post.category)
    }
  }
  console.log('🎉 Done!')
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())