import React, { useState, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IRole } from 'awayto/core';
import { useUtil, sh } from 'awayto/hooks';

declare global {
  interface IProps {
    editRole?: IRole;
  }
}

export function ManageRoleModal ({ editRole, closeModal }: IProps): React.JSX.Element {
  const { setSnack } = useUtil();
  const [putRole] = sh.usePutRoleMutation();
  const [postRole] = sh.usePostRoleMutation();
  const [postGroupRole] = sh.usePostGroupRoleMutation();

  const [role, setRole] = useState<Partial<IRole>>({
    name: '',
    ...editRole
  });
  
  const handleSubmit = useCallback(async () => {
    const { id, name } = role;

    if (!name) {
      setSnack({snackType: 'error', snackOn: 'Roles must have a name.' });
      return;
    }
    const newRole = await (id ? putRole : postRole)({ name, id } as IRole).unwrap();

    !id && await postGroupRole({ role: newRole });

    if (closeModal)
      closeModal();
  }, [role]);

  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage role</Typography>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Role</Typography>
              </Grid>
              <Grid item>
                <TextField
                  fullWidth
                  autoFocus
                  id="name"
                  label="Name"
                  name="name"
                  value={role.name}
                  onKeyDown={e => {
                    if ('Enter' === e.key) {
                      void handleSubmit();
                    }
                  }}
                  onChange={e => setRole({ ...role, name: e.target.value })} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={() => void handleSubmit()}>Submit</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageRoleModal;