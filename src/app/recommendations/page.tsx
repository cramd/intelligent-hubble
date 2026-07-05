import { cookies } from 'next/headers';
import { PasscodeGate } from '@/components/PasscodeGate';
import { RecommendationsDashboard } from '@/components/RecommendationsDashboard';

export default async function RecommendationsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('recommendations_auth')?.value === 'authenticated';

  if (!isAuthenticated) {
    return <PasscodeGate />;
  }

  return <RecommendationsDashboard />;
}
