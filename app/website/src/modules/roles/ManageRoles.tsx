import React, { useState, useMemo, Suspense } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';

import CreateIcon from '@mui/icons-material/Create';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete';

import { DataGrid } from '@mui/x-data-grid';

import { dayjs, IRole } from 'awayto/core';
import { sh, useComponents, useGrid, useStyles } from 'awayto/hooks';

export function ManageRoles(): React.JSX.Element {

  const classes = useStyles();

  const { ManageRoleModal } = useComponents();

  const { data: groupRoles, refetch: getGroupRoles } = sh.useGetGroupRolesQuery(); 
  const { data: profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();

  const roleSet = useMemo(() => groupRoles?.length ? groupRoles : profile && Object.keys(profile.roles || {}).length ? Object.values(profile.roles) : [], [groupRoles, profile]);

  const [deleteRole] = sh.useDeleteRoleMutation();
  const [deleteGroupRole] = sh.useDeleteGroupRoleMutation();

  const [editRole, setEditRole] = useState<IRole>();
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const actions = useMemo(() => {
    const { length } = selected;
    const acts = length == 1 ? [
      <Tooltip key={'manage_role'} title="Edit">
        <Button onClick={() => {
          const role = roleSet.find(r => r.id === selected[0]);
          setEditRole(role);
          if (role) {
            const userRole = Object.values(profile?.roles || {}).find(r => r.name === role.name);
            if (userRole) {
              setEditRole({ ...role, id: userRole.id });
            }
          }
          setDialog('manage_role');
          setSelected([]);
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Edit</Typography>
          <CreateIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ] : [];

    return [
      ...acts,
      <Tooltip key={'delete_role'} title="Delete">
        <Button onClick={() => {
          async function go() {
            await deleteGroupRole({ ids: selected.join(',') }).unwrap();
            await deleteRole({ ids: selected.join(',') }).unwrap();
            void getUserProfileDetails();
            void getGroupRoles();
            setSelected([]);
          }
          void go();
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Delete</Typography>
          <DeleteIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
    ]
  }, [selected]);

  const roleGridProps = useGrid({
    rows: roleSet,
    columns: [
      { flex: 1, headerName: 'Name', field: 'name' },
      { flex: 1, headerName: 'Created', field: 'createdOn', renderCell: ({ row }) => dayjs().to(dayjs.utc(row.createdOn)) }
    ],
    selected,
    onSelected: selection => setSelected(selection as string[]),
    toolbar: () => <>
      <Typography variant="button">Roles:</Typography>
      <Tooltip key={'manage_role'} title="Create">
        <Button onClick={() => {
          setEditRole(undefined);
          setDialog('manage_role')
        }}>
          <Typography variant="button" sx={{ display: { xs: 'none', md: 'flex' } }}>Create</Typography>
          <GroupAddIcon sx={classes.variableButtonIcon} />
        </Button>
      </Tooltip>
      {!!selected.length && <Box sx={{ flexGrow: 1, textAlign: 'right' }}>{actions}</Box>}
    </>
  })

  return <>
    <Dialog open={dialog === 'manage_role'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageRoleModal editRole={editRole} closeModal={() => {
          setDialog('');
          groupRoles?.length ? void getGroupRoles() : void getUserProfileDetails();
        }} />
      </Suspense>
    </Dialog>

    <DataGrid {...roleGridProps} />
  </>
}

export default ManageRoles;
