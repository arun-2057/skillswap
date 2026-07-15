export function safeJsonParse<T = any>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

export function safeJsonStringify(obj: any, indent?: number): string {
  try {
    return JSON.stringify(obj, null, indent)
  } catch {
    return '{}'
  }
}

export function safeJsonArray<T = any>(jsonString: string, defaultValue: T[] = []): T[] {
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : defaultValue
  } catch {
    return defaultValue
  }
}

export function safeJsonObject<T = any>(jsonString: string, defaultValue: T = {} as T): T {
  try {
    const parsed = JSON.parse(jsonString)
    return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue
  } catch {
    return defaultValue
  }
}