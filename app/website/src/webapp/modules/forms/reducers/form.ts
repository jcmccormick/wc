import { Reducer } from 'redux';
import {
  IFormState,
  IFormActions,
  IFormActionTypes,
  IForm
} from 'awayto';

const initialFormState = {
  forms: new Map()
} as IFormState;

const formReducer: Reducer<IFormState, IFormActions> = (state = initialFormState, action) => {
  switch (action.type) {
    case IFormActionTypes.DELETE_FORM:
      action.payload.forEach(form => {
        state.forms.delete(form.id);
      });
      return state;
    case IFormActionTypes.PUT_FORM:
    case IFormActionTypes.GET_FORM_BY_ID:
    case IFormActionTypes.POST_FORM:
    case IFormActionTypes.DISABLE_FORM:
    case IFormActionTypes.GET_FORMS:
      state.forms = new Map([ ...state.forms ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IForm][] ));
      return state;
    default:
      return state;
  }
};

export default formReducer;