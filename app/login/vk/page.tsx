import { notFound } from 'next/navigation';
import { VkLoginStart } from '@/components/auth/VkLoginStart';
import { isVkAuthEnabled, VK_SERVICES } from '@/lib/vk-auth';
export const dynamic = 'force-dynamic';
export default async function VkLoginPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const service = (await searchParams).service || 'vkid';
  if (!isVkAuthEnabled() || !(VK_SERVICES as readonly string[]).includes(service)) notFound();
  return <VkLoginStart service={service} />;
}
