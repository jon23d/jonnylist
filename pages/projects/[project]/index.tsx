import { useRouter } from 'next/router';

export default function Page() {
  const router = useRouter();
  const project = router.query.project;

  return (
    <>
      <h1>Projects</h1>
      You are in the {project} project.
    </>
  );
}
