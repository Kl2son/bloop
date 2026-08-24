import type { ReactNode } from 'react';
import { NoticeBanner, Sidebar } from './Sidebar';
import { PlayerBar } from '../player/PlayerBar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto pb-28">
          <div className="px-5 pt-6 md:px-8">
            <NoticeBanner />
          </div>
          {children}
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
