import { v4 as uuid } from 'uuid';

import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IFile, IFileActionTypes, utcNowString } from 'awayto';

const files: ApiModule = [

  {
    action: IFileActionTypes.POST_FILE,
    cmnd : async (props) => {
      try {
        const newUuid = uuid();
        const { name, fileTypeId: file_type_id, location } = props.event.body;

        const response = await props.db.query<{ id: string }>(`
          INSERT INTO dbtable_schema.files (uuid, name, file_type_id, location, created_on, created_sub)
          VALUES ($1, $2, $3, $4, $5, $6::uuid)
          RETURNING id
        `, [newUuid, name, file_type_id, location, utcNowString(), props.event.userSub]);
        
        return { id: response.rows[0].id, newUuid };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IFileActionTypes.PUT_FILE,
    cmnd : async (props) => {
      try {
        const { id, name, fileTypeId: file_type_id, location } = props.event.body;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({
          id,
          name,
          file_type_id,
          location,
          updated_on: utcNowString(),
          updated_sub: props.event.userSub
        });

        await props.db.query(`
          UPDATE dbtable_schema.files
          SET ${updateProps.string}
          WHERE id = $1
        `, updateProps.array);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFileActionTypes.GET_FILES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IFile>(`
          SELECT * FROM dbview_schema.enabled_files
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFileActionTypes.GET_FILE_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IFile>(`
          SELECT * FROM dbview_schema.enabled_files
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFileActionTypes.DELETE_FILE,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IFile>(`
          DELETE FROM dbtable_schema.files
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFileActionTypes.DISABLE_FILE,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.files
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default files;