import type { IGroup, IUuidRoles, DbError, IUserProfile, IGroupState, IRole } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

import { keycloak, appClient, appRoles } from '../util/keycloak';

const groups: ApiModule = [

  {
    method: 'POST',
    path : 'groups',
    cmnd : async (props) => {

      try {

        const { name, roles, roleId } = props.event.body as IGroup;
        let primaryRoleSubgroupId = '';

        // Create a group in app db if user has no groups and name is unique
        const { rows: [ group ] } = await props.client.query<IGroup>(`
          INSERT INTO groups (external_id, code, role_id, name, created_sub)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name, created_sub
        `, [props.event.userSub, props.event.userSub, roleId, name, props.event.userSub]);

        // Create a keycloak group if the previous operation was allowed
        const { id: externalId } = await keycloak.groups.create({ name });

        // Update the group with keycloak reference id
        await props.client.query(`UPDATE groups SET external_id = $1 WHERE id = $2`, [externalId, group.id]);

        // For each group role, create a keycloak subgroup and attach to group uuid
        await asyncForEach(roles, async ({ id: subgroupId, name }) => {

          const { id: kcSubgroupId } = await keycloak.groups.setOrCreateChild({ id: externalId }, { name });

          // If this is the admin role, attach the core roles
          if (subgroupId === roleId) {
            primaryRoleSubgroupId = kcSubgroupId;

            await keycloak.groups.addClientRoleMappings({ 
              clientUniqueId: appClient.id!,
              id: primaryRoleSubgroupId,
              roles: appRoles as { id: string, name: string }[]
             });
          }

          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, external_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, subgroupId, kcSubgroupId, new Date(), props.event.userSub])
        });
        
        // Get the user uuid from the sub
        const { rows: [{ id: userId }] } = await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub]);

        // Attach the user to the group in the app db
        await props.client.query(`
          INSERT INTO uuid_groups (parent_uuid, group_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, group_id) DO NOTHING
          RETURNING id
        `, [userId, group.id, props.event.userSub]);

        // Attach the user to the primary role subgroup
        await keycloak.users.addToGroup({
          id: props.event.userSub as string,
          groupId: primaryRoleSubgroupId
        });

        group.roles = roles;
        
        return [group];

      } catch (error) {
        const { constraint } = error as DbError;
        
        if ('unique_group_owner' === constraint) {
          throw { reason: 'Only 1 group can be managed at a time.'}
        }

        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'groups',
    cmnd : async (props) => {
      try {
        const { id, name, roles } = props.event.body as IGroup;

        const updateProps = buildUpdate({ id, name });

        const { rows: [ group ] } = await props.client.query<IGroup>(`
          UPDATE groups
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, external_id as "externalId"
        `, updateProps.array);

        const roleIds = roles.map(r => r.id);
        const diffs = (await props.client.query<IUuidRoles>(`
          SELECT id, role_id as "roleId" 
          FROM uuid_roles 
          WHERE parent_uuid = $1
        `, [group.id])).rows.filter(r => !roleIds.includes(r.roleId));

        if (diffs.length) {
          await asyncForEach(diffs.map(d => d.id), async diff => {
            if (diff) {
              await props.client.query('DELETE FROM uuid_roles WHERE id = $1', [diff]);
            }
          });
          
          const externalGroup = await keycloak.groups.findOne({ id: group.externalId });
          if (externalGroup?.subGroups) {
            const roleNames = (await props.client.query<IRole>(`SELECT name FROM roles WHERE id = ANY($1::uuid[])`, [diffs.map(r => r.roleId)])).rows.map(r => r.name);
            await asyncForEach(externalGroup?.subGroups.filter(sg => roleNames.indexOf(sg.name as string) > -1 ), async subGroup => {
              if (subGroup.id) {
                await keycloak.groups.del({ id: subGroup.id });
              }
            });
          }
        }

        await asyncForEach(roles, async role => {
          try {
            await keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });
          } catch (error) { }

          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        });

        group.roles = roles;

        return [group];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'groups',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IGroup>(`
          SELECT * FROM enabled_groups_ext
          WHERE "createdSub" = $1
        `, [props.event.userSub]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'groups/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IGroup>(`
          SELECT * FROM enabled_groups_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'groups/:ids',
    cmnd : async (props) => {
      try {

        const { ids } = props.event.pathParameters;

        await asyncForEach(ids.split(','), async id => {

          const { rows :[{ externalId }] } = await props.client.query<IGroup>(`
            SELECT external_id as "externalId"
            FROM groups
            WHERE id = $1 
          `, [id]);
      
          await keycloak.groups.del({
            id: externalId
          });

          // Delete roles assigned to the group
          await props.client.query(`
            DELETE FROM uuid_roles
            WHERE parent_uuid = $1
          `, [id]);

          // Delete group
          await props.client.query(`
            DELETE FROM groups
            WHERE id = $1
          `, [id]);
        })

        return ids.split(',').map<Partial<IGroup>>(id => ({ id }));
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'groups/disable',
    cmnd : async (props) => {
      try {
        const groups = props.event.body as IGroup[];

        await asyncForEach(groups, async group => {
          await props.client.query(`
            UPDATE groups
            SET enabled = false
            WHERE id = $1
          `, [group.id]);
        });

        return groups;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'groups/valid/:name',
    cmnd : async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const { rows: [{ count }] } = await props.client.query<{count: number}>(`
          SELECT COUNT(*) as count
          FROM groups
          WHERE name = $1
        `, [name]);

        return { checkingName: false, isValid: count == 0 };
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    
    method: 'POST',
    path : 'groups/users/invite',
    cmnd : async (props) => {
      const { users } = props.event.body as IGroupState;

      await asyncForEach(users, async ({ email }) => {
        try {
          
          const { id: userId } = await keycloak.users.create({
            email,
            username: email,
            enabled: true,
            requiredActions: ['UPDATE_PASSWORD', 'UPDATE_PROFILE', 'VERIFY_EMAIL']
          });

          await keycloak.users.sendVerifyEmail({ id: userId });
        } catch (error) {
          console.log('Invite Failure', error);
        }
      })

      return users;
    }
  },

  {
    method: 'POST',
    path : 'groups/user/role',
    cmnd : async (props) => {
      try {

        // manipulate group user roles association

        return true;

        // const { name } = props.event.body;

        // const { rows: [{ count }] } = await props.client.query<{count: number}>(`
        //   SELECT COUNT(*) as count
        //   FROM groups
        //   WHERE name = $1
        // `, [name]);

        // return { checkingName: false, isValid: count == 0 };
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'POST',
    path : 'groups/join/:code',
    cmnd : async (props) => {
      try {
        const { code } = props.event.body as IGroup;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id FROM groups WHERE code = $1
        `, [code])).rows;

        const [{ id: userId }] = (await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub])).rows;

        await props.client.query(`
          INSERT INTO uuid_groups (parent_uuid, group_id)
          VALUES ($1, $2);
        `, [userId, groupId]);

        return true;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'POST',
    path : 'groups/leave/:code',
    cmnd : async (props) => {
      try {
        const { code } = props.event.body as IGroup;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id FROM groups WHERE code = $1
        `, [code])).rows;

        const [{ id: userId }] = (await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub])).rows;

        await props.client.query(`
          DELETE FROM uuid_groups
          WHERE parent_uuid = $1 AND group_id = $2;
        `, [userId, groupId]);

        return true;
      } catch (error) {
        throw error;
      }

    }
  }

];

export default groups;