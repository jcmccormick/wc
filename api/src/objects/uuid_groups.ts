import { IUuidGroups } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';

const uuidGroups: ApiModule = [

  {
    method: 'POST',
    path : 'uuid_groups',
    cmnd : async (props) => {
      try {

        const { parentUuid, groupId } = props.event.body as IUuidGroups;

        const response = await props.client.query<IUuidGroups>(`
          INSERT INTO uuid_groups (parent_uuid, group_id, created_on, created_sub)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (parent_uuid, group_id) DO NOTHING
          RETURNING id
        `, [parentUuid, groupId, new Date(), props.event.userSub]);
        
        return { id: response.rows[0].id };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'uuid_groups',
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, groupId: group_id } = props.event.body as IUuidGroups;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, parent_uuid, group_id, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.client.query(`
          UPDATE uuid_groups
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
    method: 'GET',
    path : 'uuid_groups',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IUuidGroups>(`
          SELECT * FROM dbview_schema.enabled_uuid_groups
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'uuid_groups/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IUuidGroups>(`
          SELECT * FROM dbview_schema.enabled_uuid_groups
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'uuid_groups/parent/:parentUuid',
    cmnd : async (props) => {
      try {
        const { parentUuid } = props.event.pathParameters;

        const response = await props.client.query<IUuidGroups>(`
          SELECT * FROM dbview_schema.enabled_uuid_groups
          WHERE "parentUuid" = $1
        `, [parentUuid]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'uuid_groups/group/:groupId',
    cmnd : async (props) => {
      try {
        const { groupId } = props.event.pathParameters;

        const response = await props.client.query<IUuidGroups>(`
          SELECT * FROM dbview_schema.enabled_uuid_groups
          WHERE "groupId" = $1
        `, [groupId]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'uuid_groups/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;
        
        const response = await props.client.query<IUuidGroups>(`
          DELETE FROM uuid_groups
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default uuidGroups;