import { Construction } from 'lucide-react';

export function ComingSoonPlaceholder({ title = 'Coming Soon' }: { title?: string }) {
  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-gray-200/80 dark:border-slate-700/50 p-12 text-center max-w-lg mx-auto shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          We are currently working hard to bring you this feature. It is under development and will be available in an upcoming update.
        </p>
      </div>
    </div>
  );
}
