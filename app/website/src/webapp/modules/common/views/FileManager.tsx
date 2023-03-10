import React, { useRef, useMemo, useState, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { IFile } from 'awayto';
import { useRedux, } from 'awayto-hooks';

declare global {
  interface IProps {
    parentUuid?: string;
  }
}

export function FileManager(): JSX.Element {
  // const api = useApi();
  const fileSelectRef = useRef<HTMLInputElement>(null);
  const { files } = useRedux(state => state.file);
  const util = useRedux(state => state.util);
  // const fileStore = useFileStore();
  const [toggle, setToggle] = useState(false);
  // const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<IFile[]>([]);
  const updateSelection = useCallback((state: { selectedRows: IFile[] }) => setSelected(state.selectedRows), [setSelected]);

  function addFiles() {
    if (fileSelectRef.current) {
      fileSelectRef.current.click();
    }
  }

  function deleteFiles() {
    if (selected.length) {
      // void api(DELETE_FILE, true, selected);
      setToggle(!toggle);
    }
  }

  // useEffect(() => {
  //   if (newFiles.length) {
  //     async function go() {
  //       const postFiles: IFile[] = [];
  //       for (let i = 0, v = newFiles.length; i < v; i++) {
  //         const file = newFiles[i];
  //         const location = await fileStore.post(file);
  //         postFiles.push({ location, name: file.name, fileTypeName: FileStoreStrategies.FILE_SYSTEM })
  //       }
  //       void api(POST_FILE, true, postFiles);
  //     }
  //     void go();
  //   }
  // }, [newFiles])

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.name },
  ] as TableColumn<IFile>[], undefined)

  const actions = useMemo(() => {
    return [
      <Button key={'delete_selected_files'} onClick={deleteFiles}>Delete</Button>,
    ];
  }, [selected])

  return <>
    {/* <input type="file" multiple id="new-file" onChange={e => e.target.files && setNewFiles(Array.from(e.target.files))} ref={fileSelectRef} style={{ display: 'none' }} /> */}

    <Card>
      <CardContent>
        <DataTable
          style={{ maxHeight: '150px', overflow: 'auto' }}
          title="Files"
          actions={<Button onClick={addFiles}>Add</Button>}
          contextActions={actions}
          data={Array.from(files.values())}
          theme={util.theme}
          columns={columns}
          selectableRows
          selectableRowsHighlight={true}
          // selectableRowsComponent={<Checkbox />}
          onSelectedRowsChange={updateSelection}
          clearSelectedRows={toggle}
        />
      </CardContent>
    </Card>
  </>
}

export default FileManager;