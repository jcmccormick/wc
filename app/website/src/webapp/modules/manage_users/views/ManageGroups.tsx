import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';

import { IGroup, IActionTypes, IRole } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageGroupModal from './ManageGroupModal';

export type ManageGroupsActions = {
  getAction?: IActionTypes;
  deleteAction?: IActionTypes;
  putAction?: IActionTypes;
  postAction?: IActionTypes;
  getRolesAction?: IActionTypes;
  checkNameAction?: IActionTypes;
  postRoleAction?: IActionTypes;
  deleteRoleAction?: IActionTypes;
  groups?: IGroup[];
  roles?: IRole[];
};

declare global {
  interface IProps extends ManageGroupsActions {}
}

export function ManageGroups (props: IProps): JSX.Element {
  const { getAction, deleteAction, groups } = props as Required<ManageGroupsActions>;

  const api = useApi();
  const util = useRedux(state => state.util);
  const [group, setGroup] = useState<IGroup>();
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');
  const [selected, setSelected] = useState<IGroup[]>([]);
  
  const updateState = useCallback((state: { selectedRows: IGroup[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name },
    { name: 'Users', cell: (group: IGroup) => group.users || 0 },
    { name: 'Roles', cell: (group: IGroup) => group.roles ? group.roles.map(r => r.name).join(', ') : '' },
  ] as TableColumn<IGroup>[], undefined);
  
  const actions = useMemo(() => {
    const { length } = selected;
    const actions = length == 1 ? [
      <IconButton key={'manage_group'} onClick={() => {
        setGroup(selected.pop());
        setDialog('manage_group');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];

    return [
      ...actions,
      <IconButton key={'delete_group'} onClick={async () => {
        await api(deleteAction, true, { ids: selected.map(s => s.id).join(',') })
        setToggle(!toggle);
        void api(getAction, true);
      }}><DeleteIcon /></IconButton>
    ];
  }, [selected]);

  useEffect(() => {
    void api(getAction);
  }, []);

  return <>
    <Dialog open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <ManageGroupModal {...props} editGroup={group} closeModal={() => {
        setDialog('');
        void api(getAction);
      }} />
    </Dialog>



    <DataTable
      title="Groups"
      actions={[
        <Button key={'join_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('join_group');
        }}>Join</Button>,
        <Button key={'create_group_button'} onClick={() => {
          setGroup(undefined);
          setDialog('create_group');
        }}>Create</Button>
      ]}
      contextActions={actions}
      data={groups ? groups : []}
      theme={util.theme}
      columns={columns}
      selectableRows
      selectableRowsHighlight={true}
      // selectableRowsComponent={<Checkbox />}
      onSelectedRowsChange={updateState}
      clearSelectedRows={toggle}
      pagination={true}
      paginationPerPage={5}
      paginationRowsPerPageOptions={[5, 10, 25]}
    />
  </>
}

export default ManageGroups;