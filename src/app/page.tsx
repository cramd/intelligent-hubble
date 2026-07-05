import { WallGrid } from '@/components/WallGrid';
import { getUserSets, UserSet } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';
import { cookies } from 'next/headers';
import { mockCollection } from '@/lib/mockData';
import { LoginModalWrapper } from '@/components/LoginModalWrapper';

async function getCollection(): Promise<{ data?: UserSet[]; apiError?: string; isMock?: boolean }> {
  // Await cookies for Next.js 15
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get('rebrickable_user_token')?.value;
  const userToken = tokenFromCookie || process.env.REBRICKABLE_USER_TOKEN;
  
  // If no token, user needs to log in
  if (!userToken || userToken === "your_user_token_here") {
    return { data: [], isMock: true };
  }

  const cacheKey = `user-collection-${userToken}`;
  const cached = await getCachedData<UserSet[]>(cacheKey);
  if (cached) return { data: cached, isMock: false };

  try {
    const data = await getUserSets(userToken);
    await setCachedData(cacheKey, data);
    return { data, isMock: false };
  } catch (error: any) {
    console.error('Failed to fetch collection:', error);
    // Return empty array and the error so the user knows they need to reconnect
    return { 
      data: [], 
      isMock: false, 
      apiError: "Could not sync with Rebrickable. Your User Token might be invalid or expired. Please connect your account again."
    };
  }
}

export default async function Home() {
  const result = await getCollection();

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Dynamic Video Background */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a]">
        <img 
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 blur-md scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/70 via-[#0f172a]/40 to-[#0f172a]/90" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      </div>

      <div className="relative z-10 container mx-auto pt-24 pb-12">
        {result.apiError && (
          <div className="max-w-3xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
            <p className="text-red-300 font-medium">
              ⚠️ {result.apiError}
            </p>
          </div>
        )}

        {result.isMock && (
          <div className="max-w-3xl mx-auto mb-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center backdrop-blur-md flex flex-col items-center">
            <p className="text-indigo-200 mb-4">
              <span className="font-semibold">Connect to Rebrickable:</span> Log in to sync your LEGO collection as the source of truth!
            </p>
            <LoginModalWrapper />
          </div>
        )}

        <header className="text-center mb-16 px-4">
          <div className="inline-block bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight mb-4 drop-shadow-sm">
              My Brick Showcase
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium max-w-2xl mx-auto">
              A premium gallery of your personal LEGO collection, beautifully rendered.
            </p>
          </div>
        </header>

        <WallGrid collection={result.data || []} />
      </div>
    </main>
  );
}
