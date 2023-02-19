import { IPayment, IPaymentActionTypes } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const payments: ApiModule = [

  {
    action: IPaymentActionTypes.POST_PAYMENT,
    cmnd : async (props) => {
      try {

        const { contactId, details } = props.event.body as IPayment;

        const response = await props.db.query<IPayment>(`
          INSERT INTO payments (contact_id, details)
          VALUES ($1, $2)
          RETURNING id, contact_id as "contactId", details
        `, [contactId, details]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IPaymentActionTypes.PUT_PAYMENT,
    cmnd : async (props) => {
      try {
        const { id, contactId, details } = props.event.body as IPayment;

        const updateProps = buildUpdate({ id, contactId, details: JSON.stringify(details) });

        const response = await props.db.query<IPayment>(`
          UPDATE payments
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, contact_id as "contactId", details
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IPaymentActionTypes.GET_PAYMENTS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IPayment>(`
          SELECT * FROM dbview_schema.enabled_payments
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IPaymentActionTypes.GET_PAYMENT_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IPayment>(`
          SELECT * FROM dbview_schema.enabled_payments
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IPaymentActionTypes.DELETE_PAYMENT,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IPayment>(`
          DELETE FROM payments
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IPaymentActionTypes.DISABLE_PAYMENT,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE payments
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default payments;