import React, { useMemo, useState, } from 'react';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import ThreePIcon from '@mui/icons-material/ThreeP';
import LogoutIcon from '@mui/icons-material/Logout';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import MoreIcon from '@mui/icons-material/More';
import ApprovalIcon from '@mui/icons-material/Approval';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import Icon from '../../../img/kbt-icon.png';
import keycloak from '../../../keycloak';

import { useLocation, useNavigate } from 'react-router';
import { SiteRoles, IUtilActionTypes, PaletteMode } from 'awayto';
import { useAct, useSecure, useRedux, useComponents } from 'awayto-hooks';

const { SET_THEME } = IUtilActionTypes;

export function Topbar(props: IProps): JSX.Element {

  const act = useAct();
  const navigate = useNavigate();
  const hasRole = useSecure();
  const { PendingQuotesMenu, PendingQuotesProvider, UpcomingBookingsMenu } = useComponents();
  const location = useLocation();

  const { theme } = useRedux(state => state.util);
  const { quotes, bookings } = useRedux(state => state.profile);

  const pendingQuotes = useMemo(() => Array.from(quotes.values()), [quotes]);
  const upcomingBookings = useMemo(() => Array.from(bookings.values()), [bookings]);

  const mobileMenuId = 'mobile-app-bar-menu';
  const pendingQuotesMenuId = 'pending-requests-menu';
  const upcomingBookingsMenuId = 'upcoming-bookings-menu';

  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [pendingQuotesAnchorEl, setPendingQuotesAnchorEl] = useState<null | HTMLElement>(null);
  const [upcomingBookingsAnchorEl, setUpcomingBookingsAnchorEl] = useState<null | HTMLElement>(null);

  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isPendingQuotesOpen = Boolean(pendingQuotesAnchorEl);
  const isUpcomingBookingsOpen = Boolean(upcomingBookingsAnchorEl);

  const handleMenuClose = () => {
    setUpcomingBookingsAnchorEl(null);
    setPendingQuotesAnchorEl(null);
    setMobileMoreAnchorEl(null)
  };

  const handleNavAndClose = (path: string) => {
    handleMenuClose();
    navigate(path);
  };

  return <>
    <AppBar color="secondary">
      <Toolbar>
        <Box>
          <Button onClick={() => navigate('/')}>
            <img src={Icon} alt="kbt-icon" width={48} />
          </Button>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box>
          <Tooltip title="Upcoming Appointments">
            <IconButton
              aria-label={`show ${upcomingBookings.length} upcoming appointments`}
              aria-controls={upcomingBookingsMenuId}
              aria-haspopup="true"
              onClick={e => setUpcomingBookingsAnchorEl(e.currentTarget)}
            >
              <Badge badgeContent={upcomingBookings.length} color="error">
                <ThreePIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Pending Requests">
            <IconButton
              aria-label={`show ${pendingQuotes.length} pending requests`}
              aria-controls={pendingQuotesMenuId}
              aria-haspopup="true"
              onClick={e => setPendingQuotesAnchorEl(e.currentTarget)}
            >
              <Badge badgeContent={pendingQuotes.length} color="error">
                <ApprovalIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            aria-label="show mobile main menu"
            aria-controls={mobileMenuId}
            aria-haspopup="true"
            onClick={e => setMobileMoreAnchorEl(e.currentTarget)}
          >
            <MoreIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>

    {/** MOBILE MENU */}
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={() => setMobileMoreAnchorEl(null)}
    >
      <Box sx={{ width: 250 }}>
        <MenuList>

          <MenuItem aria-label="navigate to home" onClick={() => handleNavAndClose('/')}>
            <ListItemIcon><GroupIcon color={location.pathname === '/' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Home</ListItemText>
          </MenuItem>

          <MenuItem aria-label="navigate to profile" onClick={() => handleNavAndClose('/profile')}>
            <ListItemIcon><AccountCircleIcon color={location.pathname === '/profile' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>

          <MenuItem aria-label="switch between dark and light theme">
            <ListItemText>
              Dark
              <Switch
                value={theme !== 'dark'}
                onChange={e => act(SET_THEME, { theme: (e.target.checked ? 'light' : 'dark') as PaletteMode })}
              />
              Light
            </ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_SERVICES])} aria-label="navigate to create service" onClick={() => handleNavAndClose('/service')}>
            <ListItemIcon><BusinessIcon color={location.pathname === '/service' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Service</ListItemText>
          </MenuItem>

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_SCHEDULES])} aria-label="navigate to create schedule" onClick={() => handleNavAndClose('/schedule')}>
            <ListItemIcon><EventNoteIcon color={location.pathname === '/schedule' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Schedule</ListItemText>
          </MenuItem>

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_BOOKINGS])} aria-label="navigate to create request" onClick={() => handleNavAndClose('/quote/request')}>
            <ListItemIcon><MoreTimeIcon color={location.pathname === '/quote/request' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Request</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem aria-label="logout of the application" onClick={async () => {
            await keycloak.logout({
              redirectUri: `https://${process.env.REACT_APP_LAND_HOSTNAME as string}/`
            });
          }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>

        </MenuList>
      </Box>
    </Menu>

    <UpcomingBookingsMenu
      {...props}
      upcomingBookingsAnchorEl={upcomingBookingsAnchorEl}
      upcomingBookingsMenuId={upcomingBookingsMenuId}
      isUpcomingBookingsOpen={isUpcomingBookingsOpen}
      handleMenuClose={handleMenuClose}
    />

    {/** PENDING REQUESTS MENU */}
    <PendingQuotesProvider>
      <PendingQuotesMenu
        {...props}
        pendingQuotesAnchorEl={pendingQuotesAnchorEl}
        pendingQuotesMenuId={pendingQuotesMenuId}
        isPendingQuotesOpen={isPendingQuotesOpen}
        handleMenuClose={handleMenuClose}
      />
    </PendingQuotesProvider>

  </>;
}

export default Topbar;