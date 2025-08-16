import { IconReport } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@mantine/core';

export default function ReportLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const location = useLocation();

  return (
    <NavLink href="#" label="Reports" leftSection={<IconReport />} defaultOpened>
      <NavLink
        label="Due"
        onClick={() => handleNavLinkClick('/reports/due')}
        active={location.pathname === '/reports/due'}
      />
      <NavLink
        label="In progress"
        onClick={() => handleNavLinkClick('/reports/in-progress')}
        active={location.pathname === '/reports/in-progress'}
      />
      <NavLink
        label="Open projects"
        onClick={() => handleNavLinkClick('/reports/open-projects')}
        active={location.pathname === '/reports/open-projects'}
      />
    </NavLink>
  );
}
