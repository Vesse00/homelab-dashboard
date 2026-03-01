import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

const locales = ['en', 'pl'];

export default getRequestConfig(async ({requestLocale}) => {
  // W Next.js 15 język przychodzi jako Promise pod nazwą requestLocale
  const locale = await requestLocale;

  // Jeśli z jakiegoś powodu język jest zły, wyrzuć 404
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale, // Musimy też wyraźnie zwrócić locale
    messages: (await import(`../messages/${locale}.json`)).default
  };
});