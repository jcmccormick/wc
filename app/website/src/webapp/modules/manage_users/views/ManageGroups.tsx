import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Dialog, IconButton, Button, CircularProgress, Checkbox } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import DeleteIcon from '@material-ui/icons/Delete';

import { IGroup, IManageGroupsActionTypes } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageGroupModal from './ManageGroupModal';

type ManageActions = {
  getAction?: IManageGroupsActionTypes;
  deleteAction?: IManageGroupsActionTypes;
};

declare global {
  interface IProps extends ManageActions {}
}

export function ManageGroups (props: IProps): JSX.Element {
  const { getAction, deleteAction } = props as Required<ManageActions>;

  const api = useApi();
  const util = useRedux(state => state.util);
  const { groups } = useRedux(state => state.manageGroups);
  const [group, setGroup] = useState<IGroup>();
  const [selected, setSelected] = useState<IGroup[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');
  
  const updateState = useCallback((state: { selectedRows: IGroup[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { name: 'Name', selector: 'name' },
    { name: 'Users', cell: (group: IGroup) => group.users || 0 },
    { name: 'Roles', cell: (group: IGroup) => group.roles ? group.roles.map(r => r.name).join(', ') : '' },
  ], undefined);
  
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
      <IconButton key={'delete_group'} onClick={() => {
        void api(deleteAction, true, { ids: selected.map(s => s.id).join(',') })
        setToggle(!toggle);
      }}><DeleteIcon /></IconButton>
    ];
  }, [selected]);

  useEffect(() => {
    void api(getAction);
  }, []);

  return <>
    <Dialog open={dialog === 'manage_group'} fullWidth maxWidth="sm">
      <ManageGroupModal {...props} editGroup={group} closeModal={() => setDialog('')} />
    </Dialog>

    <DataTable
      title="Groups"
      actions={<Button onClick={() => { setGroup(undefined); setDialog('manage_group') }}>New</Button>}
      contextActions={actions}
      data={groups ? groups : []}
      theme={util.theme}
      columns={columns}
      selectableRows
      selectableRowsHighlight={true}
      selectableRowsComponent={Checkbox}
      onSelectedRowsChange={updateState}
      clearSelectedRows={toggle}
      pagination={true}
      paginationPerPage={5}
      paginationRowsPerPageOptions={[5, 10, 25]}
      noDataComponent={<CircularProgress />}
    />
  </>
}

export default ManageGroups;