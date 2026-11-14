// Formatting for running totals and records, shared by Activity and runner profiles.
export const km = (meters: number) => (meters / 1000).toLocaleString('en', { maximumFractionDigits: 2 })
export const minutes = (seconds: number) => {
  const total = Math.round(seconds / 60)
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)} h ${total % 60} min`
}
// Minutes per kilometre as m:ss, rounded to whole seconds first so 5:59.6 reads 6:00, not 5:60.
export const pace = (meters: number, seconds: number) => {
  const perKm = Math.round(seconds / (meters / 1000))
  return `${Math.floor(perKm / 60)}:${String(perKm % 60).padStart(2, '0')}`
}
