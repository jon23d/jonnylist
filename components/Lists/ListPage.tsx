export default function ListPage({ listName }: { listName: string }) {
  return (
    <>
      <h1>{listName}</h1>
      <p>List page for {listName}</p>
    </>
  );
}
