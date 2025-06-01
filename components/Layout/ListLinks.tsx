import { useRouter } from 'next/router';
import { IconClipboardListFilled } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

export default function ListLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => Promise<void>;
}) {
  const router = useRouter();
  const query = router.query;

  const listLinks = ['grocery-store', 'hardware-store'].map((list) => (
    <NavLink
      key={list}
      label={list}
      active={query?.list === list}
      pl={40}
      onClick={() => handleNavLinkClick(`/lists/?list=${list}`)}
    />
  ));

  return (
    <>
      <NavLink
        onClick={() => handleNavLinkClick('/lists')}
        label="Lists"
        active={router.pathname === '/lists' && !query?.list}
        leftSection={<IconClipboardListFilled />}
      />
      {listLinks}
    </>
  );
}
