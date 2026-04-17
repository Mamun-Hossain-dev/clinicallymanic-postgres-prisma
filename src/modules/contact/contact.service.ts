import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import pagination from '../../utils/pagination'
import { contactSearchableFields } from './contact.constants'
import { ContactFilterOptions, ContactPaginationOptions } from './contact.interface'
import { contactRepository } from './contact.repository'

const createContact = async (payload: Prisma.ContactCreateInput) => {
  return contactRepository.create(payload)
}

const getContactById = async (id: string) => {
  const contact = await contactRepository.findById(id)
  if (!contact) {
    throw new AppError(404, 'Contact not found')
  }

  if (!contact.isRead) {
    return contactRepository.update(id, { isRead: true })
  }

  return contact
}

const getAllContacts = async (
  filterOptions: ContactFilterOptions,
  paginationOptions: ContactPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.ContactWhereInput[] = []

  // Search term condition
  if (searchTerm) {
    andConditions.push({
      OR: contactSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  // Filter conditions
  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.ContactWhereInput[]>(
      (acc, [field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc.push({ [field]: value })
        }
        return acc
      },
      []
    )
    if (filterConditions.length > 0) {
      andConditions.push(...filterConditions)
    }
  }

  const whereCondition: Prisma.ContactWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.ContactOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [contacts, total] = await Promise.all([
    contactRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    contactRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data: contacts,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateContactById = async (id: string, updateData: Prisma.ContactUpdateInput) => {
  const existingContact = await contactRepository.findById(id)
  if (!existingContact) {
    throw new AppError(404, 'Contact not found')
  }

  return contactRepository.update(id, updateData)
}

const deleteContactById = async (id: string) => {
  const existingContact = await contactRepository.findById(id)
  if (!existingContact) {
    throw new AppError(404, 'Contact not found')
  }

  return contactRepository.remove(id)
}

export const contactService = {
  createContact,
  getContactById,
  getAllContacts,
  updateContactById,
  deleteContactById,
}
