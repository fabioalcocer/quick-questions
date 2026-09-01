import { z } from 'zod'

import type { Category, QuickResponse, Topic } from '@/lib/quick-responses'

export const LIBRARY_EXPORT_FORMAT = 'quick-responses-library'
export const LIBRARY_EXPORT_VERSION = 1
export const MAX_LIBRARY_FILE_SIZE = 5 * 1024 * 1024

const requiredString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .refine((value) => value.trim().length > 0, 'This field cannot be empty.')

const descriptionSchema = z.string().max(500)
const keySchema = requiredString(120)

const topicSchema = z
  .object({
    key: keySchema,
    title: requiredString(100),
    description: descriptionSchema,
  })
  .strict()

const categorySchema = z
  .object({
    key: keySchema,
    topicKey: keySchema.nullable(),
    title: requiredString(100),
    description: descriptionSchema,
  })
  .strict()

const responseSchema = z
  .object({
    categoryKey: keySchema,
    language: z.enum(['Spanish', 'English', 'Portuguese']),
    text: requiredString(2000),
  })
  .strict()

export const libraryExportSchema = z
  .object({
    format: z.literal(LIBRARY_EXPORT_FORMAT),
    version: z.literal(LIBRARY_EXPORT_VERSION),
    exportedAt: z.string().datetime(),
    topics: z.array(topicSchema),
    categories: z.array(categorySchema),
    responses: z.array(responseSchema),
  })
  .strict()
  .superRefine((library, context) => {
    const topicKeys = new Set<string>()
    const categoryKeys = new Set<string>()

    library.topics.forEach((topic, index) => {
      if (topicKeys.has(topic.key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Topic keys must be unique.',
          path: ['topics', index, 'key'],
        })
      }
      topicKeys.add(topic.key)
    })

    library.categories.forEach((category, index) => {
      if (categoryKeys.has(category.key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category keys must be unique.',
          path: ['categories', index, 'key'],
        })
      }
      categoryKeys.add(category.key)

      if (category.topicKey && !topicKeys.has(category.topicKey)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category references an unknown topic.',
          path: ['categories', index, 'topicKey'],
        })
      }
    })

    library.responses.forEach((response, index) => {
      if (!categoryKeys.has(response.categoryKey)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Response references an unknown category.',
          path: ['responses', index, 'categoryKey'],
        })
      }
    })
  })

export type LibraryExportV1 = z.infer<typeof libraryExportSchema>

export const libraryImportResultSchema = z
  .object({
    created: z.object({
      topics: z.number().int().nonnegative(),
      categories: z.number().int().nonnegative(),
      responses: z.number().int().nonnegative(),
    }),
    skipped: z.object({
      topics: z.number().int().nonnegative(),
      categories: z.number().int().nonnegative(),
      responses: z.number().int().nonnegative(),
    }),
  })
  .strict()

export type LibraryImportResult = z.infer<typeof libraryImportResultSchema>

const supportedLanguages = new Set(['Spanish', 'English', 'Portuguese'])

export function buildLibraryExport(
  topics: Topic[],
  categories: Category[],
  responses: QuickResponse[],
): LibraryExportV1 {
  const topicKeys = new Map(
    topics.map((topic, index) => [topic.id, `topic-${index + 1}`]),
  )
  const categoryKeys = new Map(
    categories.map((category, index) => [category.id, `category-${index + 1}`]),
  )

  const library = {
    format: LIBRARY_EXPORT_FORMAT,
    version: LIBRARY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    topics: topics.map((topic) => ({
      key: topicKeys.get(topic.id)!,
      title: topic.title,
      description: topic.description ?? '',
    })),
    categories: categories.map((category) => ({
      key: categoryKeys.get(category.id)!,
      topicKey: category.topic_id
        ? (topicKeys.get(category.topic_id) ?? null)
        : null,
      title: category.title,
      description: category.description ?? '',
    })),
    responses: responses.map((response) => {
      const categoryKey = categoryKeys.get(response.category_id)
      if (!categoryKey) {
        throw new Error(
          'A response references a category that is not available.',
        )
      }
      if (!supportedLanguages.has(response.language)) {
        throw new Error(`Unsupported response language: ${response.language}`)
      }

      return {
        categoryKey,
        language:
          response.language as LibraryExportV1['responses'][number]['language'],
        text: response.text,
      }
    }),
  }

  return libraryExportSchema.parse(library)
}

export function libraryExportFilename(date = new Date()) {
  return `quick-responses-${date.toISOString().slice(0, 10)}.json`
}
