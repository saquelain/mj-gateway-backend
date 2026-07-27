const SENSITIVE = ['aadhaar', 'aadhaar_number', 'account_number', 'card_number', 'otp', 'cvv'];

export function mask(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.includes(k.toLowerCase()) && typeof v === 'string') {
      out[k] = 'XXXX' + v.slice(-4);
    } else if (typeof v === 'object') {
      out[k] = mask(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}