import { AudioLines } from 'lucide-react';
import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-18.25 max-w-344 items-center gap-6 px-5 md:h-22 md:px-7">
        <Link
          href="/"
          className="flex items-center gap-2.75 text-[23px] font-bold tracking-[-0.04em] text-primary md:text-[25px]"
        >
          <span className="grid size-9.75 place-items-center rounded-xl bg-primary text-accent">
            <AudioLines size={22} />
          </span>
          TableTalk
        </Link>
        <span className="ml-auto rounded-full border border-border px-2.75 py-1.75 text-[11px] text-muted-foreground md:ml-0 md:text-xs">
          Fictional restaurant demo
        </span>
        <span className="ml-auto hidden text-sm md:block">
          Lagos Kitchen <span className="mx-2 text-subtle-foreground">•</span> NGN
        </span>
      </div>
    </header>
  );
}
