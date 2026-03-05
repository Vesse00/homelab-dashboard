import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Używamy zmiennej z .env, a jeśli jej brak - bezpiecznego fallbacku dla dev środowiska
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'homelab_default_secret_key_32b!!';
  // Tworzymy z tego dokładnie 32-bajtowy bufor (wymóg dla AES-256)
  return crypto.createHash('sha256').update(secret).digest();
};

export function encrypt(text: string | null | undefined): string {
  if (!text) return '';
  // Zabezpieczenie przed podwójnym szyfrowaniem (np. gdy Admin zapisuje formularz bez zmiany hasła)
  if (text.startsWith('ENC:')) return text; 

  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Zwracamy spakowany ciąg z wektorem inicjującym (IV), Tagiem Autoryzacji i Hashem
    return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error('[Encryption] Błąd szyfrowania:', e);
    return text;
  }
}

export function decrypt(encryptedText: string | null | undefined): string {
  if (!encryptedText) return '';
  // Jeśli w bazie były stare wpisy bez szyfrowania, po prostu je zwracamy
  if (!encryptedText.startsWith('ENC:')) return encryptedText; 

  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const content = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (e) {
    console.error('[Encryption] Błąd deszyfrowania (niepoprawny klucz lub uszkodzony hash?):', e);
    return ''; // Zwracamy puste, żeby nie wywalić całej aplikacji
  }
}