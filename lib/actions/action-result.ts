export type ActionResult<T = undefined> =
  | {
      success: true
      data?: T
    }
  | {
      success: false
      error: string
      fieldErrors?: Record<string, string[]>
    }

export function actionSuccess<T = undefined>(data?: T): ActionResult<T> {
  return data === undefined ? { success: true } : { success: true, data }
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return fieldErrors ? { success: false, error, fieldErrors } : { success: false, error }
}
