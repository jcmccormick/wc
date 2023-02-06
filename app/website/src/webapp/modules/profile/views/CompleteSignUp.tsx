import React, { useState } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IUtilActionTypes, IUserProfileActionTypes } from 'awayto';
import { useAct, useRedux } from 'awayto-hooks';

const { SET_SNACK } = IUtilActionTypes;
const { HAS_CODE } = IUserProfileActionTypes;

export function CompleteSignUp (props: IProps): JSX.Element {

  const act = useAct();
  const user = useRedux(state => state.profile);

  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');

  return <>
    <form onSubmit={(e: React.FormEvent) => {
      e.preventDefault();

      if (code.length != 6 || user.signedUp && !username) return;

      // If need to handle confirm
      // const cognitoUser = new CognitoUser({
      //   Username: username,
      //   Pool: getUserPool()
      // });

      // cognitoUser.confirmSignUp(code, false)
      //   .then(() => {
      //     act(SET_SNACK, { snackType: 'success', snackOn: 'User confirmed! You may now log in.' });
      //     act(HAS_CODE, { hasSignUpCode: false });
      //     props.history.push('/');
      //   }).catch(err => {
      //     act(SET_SNACK, { snackType: 'info', snackOn: err as string });
      //   });
    }}>
      <Grid container direction="column" alignItems="center" spacing={5}>

        <Grid item xs={12}>
          {user.signedUp ?
            <Typography>A code has been sent to your email. Retrieve the code and enter it below to confirm your account.</Typography> :
            <TextField helperText="Enter the username you used when signing up." fullWidth id="username" label="Username" value={username} name="username" onChange={e => setUsername(e.target.value)} />
          }
        </Grid>

        <Grid item xs={12}>
          <TextField helperText="Enter the 6 digit code you received in your email." fullWidth id="code" label="Code" value={code} name="code" onChange={e => setCode(e.target.value)} />
        </Grid>

        <Grid item style={{ width: '100%' }} xs={user.signedUp ? 6 : 12}>
          <Grid container justifyContent="space-between">
            <Button onClick={() => act(HAS_CODE, { hasSignUpCode: false })} color="primary">Back</Button>
            <Button type="submit" color="primary">Submit Code</Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  </>
}

export default CompleteSignUp;