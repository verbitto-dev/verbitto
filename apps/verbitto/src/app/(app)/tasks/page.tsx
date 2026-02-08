import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { TaskList } from '@/components/task-list';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Browse and create tasks on VERBITTO.',
};

export default function TasksPage() {
  return (
    <>
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            Tasks
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Task Board
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Browse available tasks or create your own with SOL bounties.
          </p>
        </div>

        <TaskList />
      </div>

      <SiteFooter />
    </>
  );
}
