import { useRouter } from 'next/router';
import { IconReport } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

export default function ReportLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const router = useRouter();

  return (
    <NavLink href="#" label="Reports" leftSection={<IconReport />} defaultOpened>
      <NavLink
        label="Due"
        onClick={() => handleNavLinkClick('/reports/due')}
        active={router.pathname === '/reports/due'}
      />
      <NavLink
        label="In progress"
        onClick={() => handleNavLinkClick('/reports/in-progress')}
        active={router.pathname === '/reports/in-progress'}
      />
      <NavLink
        label="Open projects"
        onClick={() => handleNavLinkClick('/reports/open-projects')}
        active={router.pathname === '/reports/open-projects'}
      />
    </NavLink>
  );
}
