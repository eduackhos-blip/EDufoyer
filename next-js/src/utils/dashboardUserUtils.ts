/** True when the logged-in user is an approved solver (peer tutor). */
export function isDashboardSolver(user: { isSolver?: boolean } | null | undefined): boolean {
  return Boolean(user?.isSolver);
}
