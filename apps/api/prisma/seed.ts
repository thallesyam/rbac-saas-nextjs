import { PrismaClient } from '../src/generated/prisma'
import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('123456', 1)

  const [user1, user2, user3] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        avatarUrl: 'https://github.com/thallesyam.png',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
    }),
  ])

  for (const [orgName, orgSlug, memberRoles] of [
    ['Acme Inc (Admin)', 'acme-admin', [{ userId: user1.id, role: 'ADMIN' }, { userId: user2.id, role: 'MEMBER' }, { userId: user3.id, role: 'MEMBER' }]],
    ['Acme Inc (Member)', 'acme-member', [{ userId: user1.id, role: 'MEMBER' }, { userId: user2.id, role: 'ADMIN' }, { userId: user3.id, role: 'MEMBER' }]],
    ['Acme Inc (Billing)', 'acme-billing', [{ userId: user1.id, role: 'BILLING' }, { userId: user2.id, role: 'MEMBER' }, { userId: user3.id, role: 'ADMIN' }]],
  ] as const) {
    await prisma.organization.create({
      data: {
        name: orgName,
        domain: 'acme.com',
        slug: orgSlug,
        avatarUrl: faker.image.avatarGitHub(),
        shouldAttachUsersByDomain: true,
        ownerId: user1.id,
        projects: {
          createMany: {
            data: Array.from({ length: 3 }, () => ({
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([user1.id, user2.id, user3.id]),
            })),
          },
        },
        members: {
          createMany: {
            data: memberRoles,
          },
        },
      },
    })
  }
}

seed()
  .then(() => console.log('Seed completed'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
