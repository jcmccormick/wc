import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import CreateIcon from '@mui/icons-material/Create';

import { IManageRolesActionTypes, IRole } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import ManageRoleModal from './ManageRoleModal';

const { GET_MANAGE_ROLES } = IManageRolesActionTypes;

export function ManageRoles (props: IProps): JSX.Element {
  const api = useApi();
  const util = useRedux(state => state.util);
  const { roles } = useRedux(state => state.manageRoles);
  const [role, setRole] = useState<IRole>();
  const [selected, setSelected] = useState<IRole[]>([]);
  const [toggle, setToggle] = useState(false);
  const [dialog, setDialog] = useState('');

  const updateState = useCallback((state: { selectedRows: IRole[] }) => setSelected(state.selectedRows), [setSelected]);

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name }
  ] as TableColumn<IRole>[], [])

  const actions = useMemo(() => {
    const { length } = selected;
    return length == 1 ? [
      <IconButton key={'manage_role'} onClick={() => {
        setRole(selected.pop());
        setDialog('manage_role');
        setToggle(!toggle);
      }}>
        <CreateIcon />
      </IconButton>
    ] : [];
  }, [selected])

  useEffect(() => {
    void api(GET_MANAGE_ROLES, true);
  }, []);

  return <>
    <Dialog open={dialog === 'manage_role'} fullWidth maxWidth="sm">
      <ManageRoleModal {...props} editRole={role} closeModal={() => setDialog('')} />
    </Dialog>

    <DataTable
      title="Roles"
      actions={<Button onClick={() => { setRole(undefined); setDialog('manage_role') }}>New</Button>}
      contextActions={actions}
      data={roles ? roles : []}
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
      noDataComponent={<CircularProgress />}
    />
  </>
}

export default ManageRoles;