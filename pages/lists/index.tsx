import { useRouter } from 'next/router';
import ListPage from '@/components/Lists/ListPage';
import ListSummaryCard from '@/components/Lists/ListSummaryCard';

export default function Page() {
  const router = useRouter();
  const query = router.query;

  if (query.list) {
    const listName = query.list;
    return <ListPage listName={listName as string} />;
  }

  const lists = ['grocery-store', 'hardware-store'];

  return (
    <>
      <h1>Lists</h1>
      <p>Lists are simple lists of checkbox items that can be used for things like shopping</p>
      {lists.map((list) => (
        <ListSummaryCard listName={list} key={list} />
      ))}
    </>
  );
}
