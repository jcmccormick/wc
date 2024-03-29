import React from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { PaletteMode } from 'awayto/core';
import { useStyles, useUtil } from 'awayto/hooks';
declare global {
  interface IProps {
    showTitle?: boolean;
  }
}

export function PickTheme (props: IProps): React.JSX.Element {
  const { showTitle } = props;

  const classes = useStyles();

  const { setTheme } = useUtil();

  const edit = (e: React.SyntheticEvent) => {
    localStorage.setItem('site_theme', e.currentTarget.id);
    setTheme({ theme: e.currentTarget.id as PaletteMode });
  };

  return <>
    <Grid container alignItems="center">
      {showTitle ? <Grid item><Typography>Theme</Typography></Grid> : <></>}
      <Grid item onClick={edit} id="dark"><Box bgcolor="gray" sx={classes.colorBox} /></Grid>
      <Grid item onClick={edit} id="light"><Box bgcolor="white" sx={classes.colorBox} /></Grid>
      {/* <Grid item onClick={edit} id="blue"><Box bgcolor="deepskyblue" sx={classes.colorBox} /></Grid> */}
    </Grid>
  </>
}

export default PickTheme;
