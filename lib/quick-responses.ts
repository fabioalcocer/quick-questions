export interface Topic {
  id: string
  title: string
  description: string
}

export interface Category {
  id: string
  title: string
  description: string
  responseCount?: number
  topic_id?: string
}

export interface QuickResponse {
  id: string
  text: string
  language: string
  category_id: string
}
