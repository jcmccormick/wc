import React, { useContext, useMemo, useState } from 'react';

import { IForm, deepClone } from 'awayto/core';
import { useComponents } from './useComponents';
import { sh } from './store';
import { useContexts } from './useContexts';

type UseGroupFormResponse = {
  form: IForm,
  comp: () => JSX.Element,
  valid: boolean
};

export function useGroupForm(id = ''): UseGroupFormResponse {

  const { group } = useContext(useContexts().GroupContext) as GroupContextType;

  const { FormDisplay } = useComponents();

  const { data: formTemplate } = sh.useGetGroupFormByIdQuery({ groupName: group.name, formId: id }, { skip: !group.name || !id });
  
  const [form, setForm] = useState({} as IForm);

  const hasForm = Object.keys(form).length;

  if (formTemplate && !hasForm) {
    setForm(deepClone(formTemplate));
  }

  const valid = useMemo(() => {
    let v = true;
    for (const rowId of Object.keys(form.version?.form || {})) {
      form.version.form[rowId].forEach((field, i, arr) => {
        if (field.r && [undefined, ''].includes(form.version.submission[rowId][i])) {
          v = false;
          arr.length = i + 1;
        }
      })
    }
    return v;
  }, [form]);

  return {
    form,
    comp: !hasForm ? (() => <></>) : () => <FormDisplay form={form} setForm={setForm} />,
    valid
  }
}