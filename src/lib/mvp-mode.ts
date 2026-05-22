export function isMvpMode() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.NEXT_PUBLIC_MVP_MODE === "true";
}


