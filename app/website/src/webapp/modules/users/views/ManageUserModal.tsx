import React, { useCallback, useMemo, useEffect, useState } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Input from '@mui/material/Input';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { IGroup, IUserProfile, IManageUsersActionTypes, IManageGroupsActionTypes, passwordGen } from "awayto";
import { useApi, useRedux } from 'awayto-hooks';

const { GET_MANAGE_USERS_BY_ID } = IManageUsersActionTypes;
const { GET_MANAGE_GROUPS } = IManageGroupsActionTypes;

declare global {
  interface IProps {
    editUser?: IUserProfile;
  }
}

export function ManageUserModal({ editUser, closeModal }: IProps): JSX.Element {
  const api = useApi();
  const { groups } = useRedux(state => state.manageGroups);
  const [password, setPassword] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<IGroup[]>([]);
  const [userGroupRoles, setUserGroupRoles] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<Partial<IUserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    ...editUser
  });

  useEffect(() => {
    const [abort, res] = api(GET_MANAGE_GROUPS);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  useEffect(() => {
    if (editUser?.id) {
      const [abort, res] = api(GET_MANAGE_USERS_BY_ID, { id: editUser.id });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [editUser]);

  useEffect(() => {
    const { groups: userGroups } = editUser || {};
    if (userGroups) {
      const userGroupValues = Array.from(userGroups.values());
      if (userGroupValues?.length && groups.size) {
        setUserGroups(Array.from(groups.values()).filter(g => userGroupValues.map(ug => ug.name).includes(g.name)));
        setUserGroupRoles({ ...userGroupRoles, ...userGroupValues.map(g => ({ [g.name]: Array.from(g.roles.values()).map(r => r.name) })).reduce((a, b) => ({ ...a, ...b }), {}) });
      }
    }
  }, [editUser, groups]);

  const handlePassword = useCallback(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => setPassword(value), [])
  const handleProfile = useCallback(({ target: { name, value } }: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, [name]: value }), [profile])

  const handleSubmit = useCallback(() => {
    // async function submitUser() {
    //   let user = profile as IUserProfile;
    //   const { id, sub } = user;

    //   const groupRoleKeys = Object.keys(userGroupRoles);

    //   if (!groupRoleKeys.length)
    //     return act(SET_SNACK, { snackType: 'error', snackOn: 'Group roles must be assigned.' });

    //   user.groups = groupRoleKeys // { "g1": [...], "g2": [...] } => ["g1", "g2"];
    //     .reduce((memo, key) => {
    //       if (userGroupRoles[key].length) { // [...].length
    //         const group = { ...groups?.find(g => g.name == key) } as IGroup; // Get a copy from repository
    //         if (group.roles) {
    //           group.roles = group.roles.filter(r => userGroupRoles[key].includes(r.name)) // Filter roles
    //           memo.push(group);
    //         }
    //       }
    //       return memo;
    //     }, [] as IGroup[]);

    //   // User Update - 3 Scenarios
    //   // User-Originated - A user signed up in the wild, created a cognito account, has not done anything to 
    //   //                  generate an application account, and now an admin is generating one
    //   // Admin-Originated - A user being created by an admin in the manage area
    //   // Admin-Updated - A user being updated by an admin in the manage area

    //   // If there's already a sub, PUT/manage/users will update the sub in cognito;
    //   // else we'll POST/manage/users/sub for a new sub
    //   user = await api(sub ? PUT_MANAGE_USERS : POST_MANAGE_USERS_SUB, true, sub ? user : { ...user, password }) as IUserProfile;

    //   // Add user to application db if needed no user.id
    //   if (!id)
    //     user = await api(sub ? POST_MANAGE_USERS_APP_ACCT : POST_MANAGE_USERS, true, user) as IUserProfile;

    //   if (closeModal)
    //     closeModal();
    // }

    // void submitUser();
  }, [profile, password, groups, userGroupRoles]);

  const passwordGenerator = useCallback(() => {
    setPassword(passwordGen());
  }, []);

  const groupSelectComp = useMemo(() => {
    return <Grid item xs={12}>
      <Grid container justifyContent="flex-end">

        <FormControl fullWidth variant="outlined">
          <InputLabel id="group-selection-label">Groups</InputLabel>
          <Select
            labelId="add-group-selection-label"
            id="add-group-selection"
            name="add-groupIds"
            value={groupIds}
            onChange={e => e.target.value && setGroupIds(e.target.value as string[])}
            label="Groups"
            multiple
          >
            {Array.from(groups.values())?.filter(g => g.roles && !userGroups.map(ug => ug.id).includes(g.id)).map((g, i) => <MenuItem key={i} value={g.id}>{g.name}</MenuItem>) ?? <MenuItem />}
          </Select>
        </FormControl>
        <Button variant="text" onClick={() => {
          const group = Array.from(groups.values())?.filter(g => groupIds.includes(g.id));
          if (group) {
            setUserGroups([...userGroups, ...group]);
            setGroupIds([]);
          }
        }}>Add Group +</Button>
      </Grid>
    </Grid>
  }, [groups, groupIds, setGroupIds, userGroups, setUserGroups])

  const userGroupsComp = useMemo(() => {
    return !userGroups.length ?
      <></> :
      <Grid item xs={12}>
        <Grid container spacing={1}>
          {userGroups.map((g, i) => {
            const roleValues = Array.from(g.roles.values());
            return <Grid key={i} item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="role-selection-label">{g.name} roles</InputLabel>
                <Select
                  labelId={`${g.id}-role-selection-label`}
                  id={`${g.id}-role-selection`}
                  name={`${g.id}-roleIds`}
                  value={userGroupRoles[g.name] || []}
                  onChange={e => {
                    const rolesChangeValue = e.target.value as string[];
                    if (rolesChangeValue.length) {
                      setUserGroupRoles({ ...userGroupRoles, [g.name]: rolesChangeValue })
                    } else {
                      const ugr = { ...userGroupRoles };
                      delete ugr[g.name];
                      setUserGroupRoles(ugr || {});
                    }
                  }}
                  label="Roles"
                  multiple
                >
                  {roleValues.length ? roleValues.map((r, i) => <MenuItem key={i} value={r.name}>{r.name}</MenuItem>) : <MenuItem />}
                </Select>
              </FormControl>
            </Grid>
          })}
        </Grid>
      </Grid>
  }, [userGroups, userGroupRoles, setUserGroupRoles])

  return <>
    <DialogTitle>{profile.username ? `Manage ${profile.username}` : 'CREATE USER'}</DialogTitle>
    <DialogContent>
      <Grid container direction="row" spacing={2} justifyContent="space-evenly">

        {!editUser && (
          <Grid item xs>
            <Grid container direction="column" justifyContent="space-evenly" spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6">Account</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth id="username" label="Username" value={profile.username} name="username" onChange={handleProfile} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="password">Password</InputLabel>
                  <Input type="text" id="password" aria-describedby="password" value={password} onChange={handlePassword}
                    endAdornment={
                      <InputAdornment position="end">
                        <Button onClick={passwordGenerator} style={{ backgroundColor: 'transparent' }}>Generate</Button>
                      </InputAdornment>
                    }
                  />
                  <FormHelperText>Password must be at least 8 characters and contain 1 uppercase, lowercase, number, and special (e.g. @^$!*) character. The user must change this passowrd upon logging in for the first time.</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        )}

        <Grid item xs>
          <Grid container direction="column" justifyContent="space-evenly" spacing={4}>
            <Grid item>
              <Typography variant="h6">Profile</Typography>
            </Grid>
            <Grid item>
              <TextField fullWidth id="firstName" label="First Name" value={profile.firstName} name="firstName" onChange={handleProfile} />
            </Grid>
            <Grid item>
              <TextField fullWidth id="lastName" label="Last Name" value={profile.lastName} name="lastName" onChange={handleProfile} />
            </Grid>
            <Grid item>
              <TextField fullWidth id="email" label="Email" value={profile.email} name="email" onChange={handleProfile} />
            </Grid>
          </Grid>
        </Grid>

        {groups ?
          <Grid item xs>
            <Grid container direction="column" justifyContent="space-evenly" spacing={4}>
              <Grid item>
                <Typography variant="h6">Groups</Typography>
              </Grid>
              {groupSelectComp}

              <Grid item>
                <Typography variant="h6">User Groups</Typography>
              </Grid>
              {userGroupsComp}
            </Grid>
          </Grid> :
          <Grid item xs={12}>
            <Grid container justifyContent="center">
              <CircularProgress />
            </Grid>
          </Grid>
        }

      </Grid>
    </DialogContent>
    <DialogActions>
      <Grid container justifyContent="space-between">
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSubmit}>{profile.sub ? 'update' : 'create'}</Button>
      </Grid>
    </DialogActions>
  </>
}

export default ManageUserModal;