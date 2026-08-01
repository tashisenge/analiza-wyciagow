/**
 * Reads the category id from the transaction category form.
 *
 * The "Usuń kategorię" control must not reuse name="categoryId": browsers submit
 * the select value first, so FormData.get("categoryId") would keep the old id
 * and silently re-apply / fan-out via applyToSimilar instead of clearing.
 */
export function resolveCategoryIdFromCategoryForm(formData: FormData): string {
  if (formData.get("clearCategory") === "1") {
    return "";
  }
  const raw = formData.get("categoryId");
  return typeof raw === "string" ? raw : "";
}
