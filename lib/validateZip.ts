export async function validateZipMatchesState(zip: string, state: string) {
  if (!/^\d{5}$/.test(zip) || !state) return false;

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data?.places?.[0]?.["state abbreviation"] === state;
  } catch {
    return false;
  }
}
