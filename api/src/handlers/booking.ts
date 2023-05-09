import { ApiHandlers, utcNowString, buildUpdate, IBooking } from 'awayto/core';

export default {
  postBooking: async props => {
    const { bookings } = props.event.body;

    const newBookings: IBooking[] = [];
    for (const bookingTempId in bookings) {
      const booking = bookings[bookingTempId];
      const { quoteId, slotDate, scheduleBracketSlotId } = booking;

      const { id: bookingId } = await props.tx.one<IBooking>(`
        INSERT INTO dbtable_schema.bookings (quote_id, slot_date, schedule_bracket_slot_id, created_sub)
        VALUES ($1::uuid, $2::date, $3::uuid, $4::uuid)
        RETURNING id
      `, [quoteId, slotDate, scheduleBracketSlotId, props.event.userSub]);

      booking.id = bookingId;
      newBookings.push(booking);
    }

    await props.redis.del(`${props.event.userSub}profile/details`);
    return newBookings;
  },
  putBooking: async props => {
    const { id, serviceTierId } = props.event.body;
    const updateProps = buildUpdate({
      id,
      service_tier_id: serviceTierId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });
    const booking = await props.tx.one<IBooking>(`
      UPDATE dbtable_schema.bookings
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, serviceTierId, paymentId, agreement, description
    `, updateProps.array);
    return booking;
  },
  getBookings: async props => {
    const response = await props.db.manyOrNone<IBooking>(`
      SELECT eb.*
      FROM dbview_schema.enabled_bookings eb
      JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = eb."scheduleBracketSlotId"
      WHERE eb."createdSub" = $1 OR sbs.created_sub = $1
    `, [props.event.userSub]);
    return response;
  },
  getBookingById: async props => {
    const { id } = props.event.pathParameters;
    const booking = await props.db.one<IBooking>(`
      SELECT * FROM dbview_schema.enabled_bookings_ext
      WHERE id = $1
    `, [id]);
    return booking;
  },
  deleteBooking: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
      DELETE FROM dbtable_schema.bookings
      WHERE id = $1
    `, [id]);
    return { id };
  },
  disableBooking: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
      UPDATE dbtable_schema.bookings
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);
    return { id };
  },
} as Pick<
  ApiHandlers,
  'postBooking' |
  'putBooking' |
  'getBookings' |
  'getBookingById' |
  'deleteBooking' |
  'disableBooking'
>;