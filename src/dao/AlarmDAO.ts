import {AbstractDAO} from './AbstractDAO';
import {EventDAO} from './EventDAO';

import {Filter} from '../api/Filter';
import {IHasHTTP} from '../api/IHasHTTP';
import {IHash} from '../internal/IHash';
import {IOnmsHTTP} from '../api/IOnmsHTTP';
import {OnmsError} from '../api/OnmsError';
import {OnmsHTTPOptions} from '../api/OnmsHTTPOptions';
import {OnmsResult} from '../api/OnmsResult';

import {OnmsAlarm} from '../model/OnmsAlarm';
import {AlarmTypes} from '../model/OnmsAlarmType';
import {OnmsParm} from '../model/OnmsParm';
import {OnmsServiceType} from '../model/OnmsServiceType';
import {Severities} from '../model/OnmsSeverity';
import {OnmsTroubleTicketState, TroubleTicketStates} from '../model/OnmsTroubleTicketState';
import {OnmsMemo} from '../model/OnmsMemo';

import {log, catDao} from '../api/Log';
import {Category} from 'typescript-logging';

/** @hidden */
const cat = new Category('alarms', catDao);

/**
 * Data access for [[OnmsAlarm]] objects
 * @module AlarmDAO
 */ /** */
export class AlarmDAO extends AbstractDAO<number, OnmsAlarm> {
  /** an event DAO to be used for creating events attached to alarms from API/JSON data */
  private eventDao: EventDAO;

  constructor(impl: IHasHTTP | IOnmsHTTP) {
    super(impl);
    this.eventDao = new EventDAO(impl);
  }

  /**
   * create an alarm object from a JSON object
   * @hidden
   */
  public fromData(data: any) {
    const alarm = new OnmsAlarm();

    alarm.id = this.toNumber(data.id);
    alarm.count = data.count;
    alarm.ackUser = data.ackUser;
    alarm.uei = data.uei;
    alarm.description = data.description;
    alarm.firstEventTime = this.toDate(data.firstEventTime);
    alarm.lastEvent = this.eventDao.fromData(data.lastEvent);
    alarm.logMessage = data.logMessage;
    alarm.reductionKey = data.reductionKey;
    alarm.troubleTicket = data.troubleTicket;
    alarm.nodeId = this.toNumber(data.nodeId);
    alarm.nodeLabel = data.nodeLabel;
    alarm.suppressedBy = data.suppressedBy;

    if (data.ackTime) {
      alarm.ackTime = this.toDate(data.ackTime);
    }

    if (data.severity) {
      alarm.severity = Severities[data.severity];
    }

    if (data.type) {
      const type = this.toNumber(data.type);
      alarm.type = AlarmTypes[type];
    }

    if (data.troubleTicketState) {
      alarm.troubleTicketState = TroubleTicketStates[data.troubleTicketState];
    }

    if (data.serviceType) {
      const st = data.serviceType;
      alarm.service = OnmsServiceType.for(st.id, st.name);
    }

    if (data.suppressedTime) {
      alarm.suppressedTime = this.toDate(data.suppressedTime);
    }

    if (data.suppressedUntil) {
      alarm.suppressedUntil = this.toDate(data.suppressedUntil);
    }

    if (data.parameters) {
      let parms = data.parameters;
      if (parms.parameter) {
        parms = parms.parameter;
      }
      if (!Array.isArray(parms)) {
        parms = [parms];
      }
      alarm.parameters = [];

      for (let parm of parms) {
        parm = new OnmsParm(
          parm.name,
          parm.type,
          parm.value,
        );
        alarm.parameters.push(parm);
      }
    }

    alarm.sticky = this.toMemo(data.stickyMemo);
    alarm.journal = this.toMemo(data.reductionKeyMemo);

    return alarm;
  }

  /**
   * Fetch an alarm.
   *
   * @version ReST v1+
   * @param {number} id - the alarm's ID
   * @return an [[OnmsAlarm]]
   */
  public async get(id: number): Promise<OnmsAlarm> {
    const opts = this.getOptions();
    return this.http.get(this.pathToAlarmsEndpoint() + '/' + id, opts).then((result) => {
      return this.fromData(result.data);
    });
  }

  /**
   * Find matching alarms.
   *
   * @version ReST v1+
   * @param {Filter} filter - the filter to use when querying
   * @return an array of [[OnmsAlarm]] objects
   */
  public async find(filter?: Filter): Promise<OnmsAlarm[]> {
    const opts = this.getOptions(filter);
    return this.http.get(this.pathToAlarmsEndpoint(), opts).then((result) => {
      let data = result.data;

      if (this.getCount(data) > 0 && data.alarm) {
        data = data.alarm;
      } else {
        data = [];
      }

      if (!Array.isArray(data)) {
        if (data.nodeId) {
          data = [data];
        } else {
          throw new OnmsError('Expected an array of alarms but got "' + (typeof data) + '" instead.');
        }
      }
      return data.map((alarmData) => {
        return this.fromData(alarmData);
      });
    });
  }

  /**
   * Acknowledge an alarm.
   *
   * @version ReST v1+
   * @param {number|OnmsAlarm} id - the [[OnmsAlarm]] or alarm ID
   * @param {string=} user - the user to ack the alarm as (only administrators have the right to do this)
   */
  public async acknowledge(alarm: number|OnmsAlarm, user?: string): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.ack = 'true';
    if (user !== undefined) {
      parameters.ackUser = user;
    }
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /**
   * Un-acknowledge an alarm.
   *
   * @version ReST v1+
   * @param {number|OnmsAlarm} alarm - the [[OnmsAlarm]] or alarm ID
   */
  public async unacknowledge(alarm: number|OnmsAlarm): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.ack = 'false';
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /**
   * Escalate an alarm.
   *
   * @version ReST v1+
   * @param {number|OnsmAlarm} alarm - the [[OnmsAlarm]] or alarm ID
   */
  public async escalate(alarm: number|OnmsAlarm): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.escalate = 'true';
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /**
   * Clear an alarm.
   *
   * @version ReST v1+
   * @param {number|OnmsAlarm} alarm - the [[OnmsAlarm]] or alarm ID
   */
  public async clear(alarm: number|OnmsAlarm): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.clear = 'true';
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /**
   * Associate a ticket ID with the alarm.
   *
   * @version ReST v1+
   * @param {number|OnmsAlarm} alarm - the [[OnmsAlarm]] or alarm ID
   * @param {string} ticketId - the ticket ID
   */
  public async setTTicketId(alarm: number|OnmsAlarm, ticketId: string): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.ticketId = ticketId;
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /**
   * Update the state of the ticket associated with the alarm.
   *
   * @version ReST v1+
   * @param {number|OnmsAlarm} alarm - the [[OnmsAlarm]] or alarm ID
   * @param {string} state - the ticket state
   */
  public async setTTicketState(alarm: number|OnmsAlarm, state: OnmsTroubleTicketState): Promise<void> {
    const alarmId = (typeof(alarm) === 'number' ? alarm : alarm.id);
    const parameters = {} as IHash<string>;
    parameters.ticketState = state.label;
    return this.put(this.pathToAlarmsEndpoint() + '/' + alarmId, parameters);
  }

  /** given an optional filter, generate an [[OnmsHTTPOptions]] object for DAO calls */
  protected getOptions(filter?: Filter): OnmsHTTPOptions {
    const options = super.getOptions(filter);
    // always use application/json for v2 calls
    if (this.getApiVersion() === 2) {
      options.headers.accept = 'application/json';
    }
    return options;
  }

  /** call a PUT request in the format the alarm ack API expects */
  private async put(url: string, parameters = {} as IHash<string>): Promise<void> {
    const opts = this.getOptions();
    opts.headers['content-type'] = 'application/x-www-form-urlencoded';
    opts.headers.accept = null;
    opts.parameters = parameters;
    return this.http.put(url, opts).then((result) => {
      if (!result.isSuccess) {
        throw result;
      }
      return;
    });
  }

  /** get the path to the alarms endpoint for the appropriate API version */
  private pathToAlarmsEndpoint() {
    return this.getApiVersion() === 2 ? 'api/v2/alarms' : 'rest/alarms';
  }

  /** generate a memo from the given dictionary */
  private toMemo(data: any): OnmsMemo {
    if (!data) {
      return null;
    }

    const memo = new OnmsMemo();
    memo.id = data.id;
    memo.author = data.author;
    memo.body = data.body;
    memo.created = this.toDate(data.created);
    memo.updated = this.toDate(data.updated);
    return memo;
  }

}
