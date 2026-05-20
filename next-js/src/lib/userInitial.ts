/**
 * First-name initial for camera-off avatars (Google Meet style).
 * Never returns "?".
 */
export function getFirstNameInitial(
  username?: string | null,
  email?: string | null
): string {
  const name = username?.trim();
  if (name) {
    const firstName = name.split(/\s+/).filter(Boolean)[0];
    if (firstName) {
      const letter = firstName.match(/[a-zA-Z0-9]/)?.[0];
      if (letter) return letter.toUpperCase();
    }
  }

  const localPart = email?.trim().split("@")[0]?.trim();
  if (localPart) {
    const letter = localPart.match(/[a-zA-Z0-9]/)?.[0];
    if (letter) return letter.toUpperCase();
  }

  return "U";
}
