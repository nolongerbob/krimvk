import { Onest } from 'next/font/google';

/**
 * Близкая бесплатная альтернатива VK Sans Text / Display (SIL OFL).
 * Оригинал на vk.company — проприетарные VK Sans Display + VK Sans Text.
 */
export const onest = Onest({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
});
