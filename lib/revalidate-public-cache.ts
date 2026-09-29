import { revalidatePath } from 'next/cache';

export function revalidateCmsSlug(slug: string) {
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  revalidatePath(path);
}

export function revalidateDisclosurePaths(category?: string) {
  revalidatePath('/o-kompanii/raskrytie-informatsii');
  revalidatePath('/api/disclosure');
  if (category) {
    revalidatePath(`/o-kompanii/raskrytie/${category}`);
  }
}

export function revalidateWaterQualityPaths() {
  revalidatePath('/o-kompanii/kachestvo-vody');
  revalidatePath('/api/water-quality');
}

export function revalidateServicesPaths() {
  revalidatePath('/services');
  revalidatePath('/api/services');
}

export function revalidateNewsPaths(newsId?: string) {
  revalidatePath('/');
  revalidatePath('/news');
  if (newsId) {
    revalidatePath(`/news/${newsId}`);
  }
}
