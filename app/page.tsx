import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import TableTalk from '@/components/tabletalk';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <TableTalk />
      <SiteFooter />
    </>
  );
}
