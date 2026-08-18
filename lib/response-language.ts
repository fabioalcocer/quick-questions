export function getLanguageBadgeClassName(language: string) {
  switch (language.toLowerCase()) {
    case 'spanish':
      return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-600 dark:text-white'
    case 'english':
      return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-500 dark:text-white'
    case 'portuguese':
      return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-700 dark:text-white'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}
