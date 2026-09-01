import {
  MAX_LIBRARY_FILE_SIZE,
  libraryExportSchema,
  libraryImportResultSchema,
} from '@/lib/library-transfer'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function errorResponse(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status })
}

export async function POST(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode')
  if (mode !== 'preview' && mode !== 'apply') {
    return errorResponse(
      'invalid_mode',
      'Import mode must be preview or apply.',
      400,
    )
  }

  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_LIBRARY_FILE_SIZE) {
    return errorResponse(
      'file_too_large',
      'The library file must be 5 MB or smaller.',
      413,
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse(
      'unauthorized',
      'Your session expired. Please sign in again.',
      401,
    )
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return errorResponse(
      'invalid_json',
      'The library file could not be read.',
      400,
    )
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_LIBRARY_FILE_SIZE) {
    return errorResponse(
      'file_too_large',
      'The library file must be 5 MB or smaller.',
      413,
    )
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return errorResponse(
      'invalid_json',
      'The library file is not valid JSON.',
      400,
    )
  }

  const parsedLibrary = libraryExportSchema.safeParse(parsedBody)
  if (!parsedLibrary.success) {
    return NextResponse.json(
      {
        error: 'invalid_library',
        message: 'The library file has an invalid format or broken references.',
        details: parsedLibrary.error.flatten(),
      },
      { status: 422 },
    )
  }

  const { data, error } = await supabase.rpc('import_library_v1', {
    library_payload: parsedLibrary.data,
    preview_only: mode === 'preview',
  })

  if (error) {
    console.error('Library import API error:', error)
    return errorResponse(
      'import_failed',
      'Unable to import this library. Please retry.',
      500,
    )
  }

  const parsedResult = libraryImportResultSchema.safeParse(data)
  if (!parsedResult.success) {
    console.error('Library import returned an invalid result:', data)
    return errorResponse(
      'import_failed',
      'Unable to import this library. Please retry.',
      500,
    )
  }

  return NextResponse.json(parsedResult.data)
}
