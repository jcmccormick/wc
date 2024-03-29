import { IFormVersion, IGroupForm, IUserProfile, asyncForEach, createHandlers } from 'awayto/core';
import formApiHandler from './form';

export default createHandlers({
  postGroupForm: async props => {

    const { sub: groupSub } = await props.tx.one<IUserProfile>(`
      SELECT sub
      FROM dbtable_schema.users
      WHERE username = $1
    `, ['system_group_' + props.event.group.id]);

    const form = await formApiHandler.postForm({
      ...props,
      event: {
        ...props.event,
        userSub: groupSub
      }
    }) as IGroupForm;

    form.groupId = props.event.group.id || '';

    const formVersion = await formApiHandler.postFormVersion({
      ...props,
      event: {
        ...props.event,
        pathParameters: {
          formId: form.id
        }
      }
    }) as IFormVersion;

    formVersion.formId = form.id;
    form.version = formVersion;

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_forms (group_id, form_id, created_sub)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (group_id, form_id) DO NOTHING
    `, [props.event.group.id, form.id, groupSub]);

    await props.redis.del(`${props.event.userSub}group/forms`);

    return [form];
  },
  postGroupFormVersion: async props => {
    const { formId } = props.event.pathParameters;
    const form = props.event.body;

    form.version = await formApiHandler.postFormVersion(props) as IFormVersion;

    await props.redis.del(`${props.event.userSub}group/forms`);
    await props.redis.del(`${props.event.userSub}group/forms/${formId}`);

    return [form];
  },
  putGroupForm: async props => {
    const form = await formApiHandler.putForm(props) as IGroupForm;

    await props.redis.del(`${props.event.userSub}group/forms`);
    await props.redis.del(`${props.event.userSub}group/forms/${form.id}`);

    return form;
  },
  getGroupForms: async props => {
    const forms = await props.db.manyOrNone<IGroupForm>(`
      SELECT es.*
      FROM dbview_schema.enabled_group_forms eus
      LEFT JOIN dbview_schema.enabled_forms es ON es.id = eus."formId"
      WHERE eus."groupId" = $1
    `, [props.event.group.id]);

    return forms;
  },
  getGroupFormById: async props => {
    const { formId } = props.event.pathParameters;

    const form = await props.db.one<IGroupForm>(`
      SELECT egfe.*
      FROM dbview_schema.enabled_group_forms_ext egfe
      WHERE egfe."groupId" = $1 and egfe."formId" = $2
    `, [props.event.group.id, formId]);

    return form;
  },
  deleteGroupForm: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async formId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_forms
        WHERE form_id = $1
      `, [formId]);
      await props.tx.none(`
        DELETE FROM dbtable_schema.form_versions
        WHERE form_id = $1
      `, [formId]);
      await props.tx.none(`
        DELETE FROM dbtable_schema.forms
        WHERE id = $1
      `, [formId]);
    });

    await props.redis.del(`${props.event.userSub}group/forms`);

    return idsSplit.map(id => ({ id }));
  }
});