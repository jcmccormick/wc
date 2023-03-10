import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import Logout from '@mui/icons-material/Logout';

import { IUtilActionTypes, IGroup, IActionTypes, IGroupActionTypes, IRole, SiteRoles } from 'awayto';
import { useRedux, useApi, useAct, useSecure } from 'awayto-hooks';

import ManageGroupModal from './ManageGroupModal';
import JoinGroupModal from './JoinGroupModal';
import { useNavigate } from 'react-router';

import keycloak from '../../../keycloak';

const { OPEN_CONFIRM, SET_LOADING } = IUtilActionTypes;
const { GROUPS_LEAVE } = IGroupActionTypes;

export type ManageGroupsActions = {
  getGroupsAction?: IActionTypes;
  deleteGroupsAction?: IActionTypes;
  putGroupsAction?: IActionTypes;
  postGroupsAction?: IActionTypes;
  getRolesAction?: IActionTypes;
  checkNameAction?: IActionTypes;
  postRolesAction?: IActionTypes;
  deleteRolesAction?: IActionTypes;
  groups?: Map<string, IGroup>;
  roles?: Map<string, IRole>;
};

declare global {
  interface IProps extends ManageGroupsActions { }
}

export function ManageGroups(props: IProps): JSX.Element {
  const { getGroupsAction, deleteGroupsAction, groups } = props as Required<ManageGroupsActions>;

  const act = useAct();
  const api = useApi();
  const hasRole = useSecure();
  const navigate = useNavigate();
  const util = useRedux(state => state.util);
  const profile = useRedux(state => state.profile);
  const [group, setGroup] = useState<IGroup>();
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');
  const [selected, setSelected] = useState<IGroup[]>([]);

  const updateState = useCallback((state: { selectedRows: IGroup[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { id: 'createdOn', selector: row => row.createdOn, omit: true },
    hasRole([SiteRoles.APP_GROUP_ADMIN]) && { cell: row => <Button key={`group_manage_selection_${row.name}`} onClick={() => navigate(`/group/${row.name}/manage/users`)} >Manage</Button> },
    { name: 'Name', selector: row => row.name },
    { name: 'Code', selector: row => row.code },
    { name: 'Users', cell: (group: IGroup) => group.usersCount || 0 },
    { name: 'Created', selector: row => row.createdOn }
  ] as TableColumn<IGroup>[], undefined);

  const actions = useMemo(() => {
    const { length } = selected;
    const isOwner = selected[0]?.createdSub === profile.sub;
    const acts = length == 1 ? [
      // <IconButton key={'groups_users_invite'} onClick={() => {
      //   setGroup(selected.pop());
      //   setDialog('groups_users_invite');
      //   setToggle(!toggle);
      // }}>
      //   <GroupAdd />
      // </IconButton>,
      !isOwner && <Tooltip key={'groups_leave'} title="Leave"><IconButton onClick={() => {
        void act(OPEN_CONFIRM, {
          isConfirming: true,
          confirmEffect: 'Are you sure you want to leave this group?',
          confirmAction: () => {
            const [, res] = api(GROUPS_LEAVE, { code: selected.pop()?.code }, { load: true });
            res?.then(() => {
              api(getGroupsAction);
              setToggle(!toggle);
            }).catch(console.warn);
          }
        });
      }}>
        <Logout />
      </IconButton></Tooltip>,
      isOwner && <Tooltip key={'groups_manage'} title="Manage"><IconButton onClick={() => {
        setGroup(selected.pop());
        setDialog('groups_manage');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton></Tooltip>
    ] : [];

    return [
      ...acts,
      isOwner && <Tooltip key={'delete_group'} title="Delete"><IconButton onClick={() => {
        const [, res] = api(deleteGroupsAction, { ids: selected.map(s => s.id).join(',') }, { load: true });
        res?.then(() => {
          keycloak.clearToken();
        }).catch(console.warn);
      }}><DeleteIcon /></IconButton></Tooltip>
    ];
  }, [selected]);

  useEffect(() => {
    if (Object.keys(groups || {}).length === 1 && Object.keys(profile.availableUserGroupRoles || {}).length && util.isLoading) {
      act(SET_LOADING, { isLoading: false, loadingMessage: '' });
    }
  }, [groups, profile.availableUserGroupRoles, util.isLoading]);

  useEffect(() => {
    const [abort, res] = api(getGroupsAction);
    res?.catch(console.warn);
    return () => abort();
  }, []);

  return <>
    <Dialog open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          // api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    {/* <Dialog open={dialog === 'groups_users_invite'} fullWidth maxWidth="sm">
      <Suspense>
        <InviteUsersModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
        }} />
      </Suspense>
    </Dialog> */}

    <Dialog open={dialog === 'groups_join'} fullWidth maxWidth="sm">
      <Suspense>
        <JoinGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>

    <Dialog open={dialog === 'groups_manage'} fullWidth maxWidth="sm">
      <Suspense>
        <ManageGroupModal {...props} editGroup={group} closeModal={() => {
          setDialog('');
          api(getGroupsAction);
        }} />
      </Suspense>
    </Dialog>


    <Card>
      <CardContent>
        <DataTable
          title="Groups"
          actions={[
            <Button key={'join_group_button'} onClick={() => {
              setGroup(undefined);
              setDialog('groups_join');
            }}>Join</Button>,
            <Button key={'create_group_button'} onClick={() => {
              setGroup(undefined);
              setDialog('create_group');
            }}>Create</Button>
          ]}
          contextActions={actions}
          data={Array.from(groups.values())}
          theme={util.theme}
          columns={columns}
          defaultSortFieldId="createdOn"
          defaultSortAsc={false}
          selectableRows
          selectableRowsSingle
          selectableRowsHighlight={true}
          // selectableRowsComponent={<Checkbox />}
          onSelectedRowsChange={updateState}
          clearSelectedRows={toggle}
          pagination={true}
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  </>
}

export default ManageGroups;