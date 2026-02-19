import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-20 px-4">
      <main className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 text-center mb-8">
          {t('subtitle')}
        </p>
        <div className="text-center">
          <p className="text-lg font-medium">{t('skills')}</p>
        </div>
      </main>
    </div>
  );
}
