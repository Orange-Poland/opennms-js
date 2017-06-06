import {OnmsEnum} from '../internal/OnmsEnum';

/**
 * Represents an OpenNMS trouble ticket state.
 * @module OnmsTroubleTicketState
 */ /** */
export class OnmsTroubleTicketState extends OnmsEnum {
}

/* tslint:disable:object-literal-sort-keys */
/** @hidden */
export const TROUBLE_TICKET_STATES = Object.freeze({
  OPEN: new OnmsTroubleTicketState(0, 'OPEN'),
  CREATE_PENDING: new OnmsTroubleTicketState(1, 'CREATE_PENDING'),
  CREATE_FAILED: new OnmsTroubleTicketState(2, 'CREATE_FAILED'),
  UPDATE_PENDING: new OnmsTroubleTicketState(3, 'UPDATE_PENDING'),
  UPDATE_FAILED: new OnmsTroubleTicketState(4, 'UPDATE_FAILED'),
  CLOSED: new OnmsTroubleTicketState(5, 'CLOSED'),
  CLOSE_PENDING: new OnmsTroubleTicketState(6, 'CLOSE_PENDING'),
  CLOSE_FAILED: new OnmsTroubleTicketState(7, 'CLOSE_FAILED'),
  RESOLVED: new OnmsTroubleTicketState(8, 'RESOLVED'),
  RESOLVE_PENDING: new OnmsTroubleTicketState(9, 'RESOLVE_PENDING'),
  RESOLVE_FAILED: new OnmsTroubleTicketState(10, 'RESOLVE_FAILED'),
  CANCELLED: new OnmsTroubleTicketState(11, 'CANCELLED'),
  CANCEL_PENDING: new OnmsTroubleTicketState(12, 'CANCEL_PENDING'),
  CANCEL_FAILED: new OnmsTroubleTicketState(13, 'CANCEL_FAILED'),
});