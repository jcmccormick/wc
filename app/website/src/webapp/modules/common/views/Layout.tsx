import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import AppBar from '@mui/material/AppBar';
import Grid from '@mui/material/Unstable_Grid2';

import CssBaseline from '@mui/material/CssBaseline';

import { useComponents, useStyles } from 'awayto-hooks';

import Home from './Home';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const Layout = (props: IProps): JSX.Element => {

  const classes = useStyles();

  const { Exchange, ExchangeProvider, Profile, GroupPaths, ServiceHome, ScheduleHome, RequestQuote } = useComponents();

  return <>
    <CssBaseline />

    <Grid container direction="row">
      <Grid md={2} maxWidth={175} sx={{ bgcolor: 'primary.dark', display: { xs: 'none', md: 'flex' } }}>
        <Sidebar />
      </Grid>
      <Grid xs={12} md={10} container direction="column">
        <Grid px={1} sx={{ bgcolor: 'primary.dark' }}>
          <Topbar {...props} />
        </Grid>
        <Grid p={2} width="100%">
          <Routes>
            <Route path="/" element={<Suspense fallback={<></>}><Home {...props} /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<></>}><Profile {...props} /></Suspense>} />
            <Route path="/service" element={<Suspense fallback={<></>}><ServiceHome {...props} /></Suspense>} />
            <Route path="/quote/request" element={<Suspense fallback={<></>}><RequestQuote {...props} /></Suspense>} />
            <Route path="/schedule" element={<Suspense fallback={<></>}><ScheduleHome {...props} /></Suspense>} />
            <Route path="/group/:groupName/*" element={<Suspense fallback={<></>}><GroupPaths {...props} /></Suspense>} />
            <Route path="/exchange" element={
              <Suspense fallback={<></>}>
                <ExchangeProvider>
                  <Exchange {...props} />
                </ExchangeProvider>
              </Suspense>
            } />
          </Routes>
        </Grid>
      </Grid>
    </Grid>




  </>
}

export default Layout;
