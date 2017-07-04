declare const await, describe, beforeEach, it, xit, expect, jest;

import {log,catRoot,setLogLevel} from '../../src/api/Log';
import {LogLevel} from 'typescript-logging';

setLogLevel(LogLevel.Debug, catRoot);

import {Client} from '../../src/Client';

import {OnmsAuthConfig} from '../../src/api/OnmsAuthConfig';
import {OnmsServer} from '../../src/api/OnmsServer';

import {Comparators} from '../../src/api/Comparator';
import {Filter} from '../../src/api/Filter';
import {Restriction} from '../../src/api/Restriction';

import {AlarmDAO} from '../../src/dao/AlarmDAO';

import {MockHTTP19} from '../rest/MockHTTP19';
import {MockHTTP21} from '../rest/MockHTTP21';

const SERVER_NAME='Demo';
const SERVER_URL='http://demo.opennms.org/opennms/';
const SERVER_USER='demo';
const SERVER_PASSWORD='demo';

let opennms : Client, server, auth, mockHTTP, dao : AlarmDAO;

describe('AlarmDAO with v1 API', () => {
  beforeEach((done) => {
    auth = new OnmsAuthConfig(SERVER_USER, SERVER_PASSWORD);
    server = new OnmsServer(SERVER_NAME, SERVER_URL, auth);
    mockHTTP = new MockHTTP19(server);
    opennms = new Client(mockHTTP);
    dao = new AlarmDAO(mockHTTP);
    Client.getMetadata(server, mockHTTP).then((metadata) => {
      server.metadata = metadata;
      done();
    });
  });
  it('AlarmDAO.get(404725)', () => {
    return dao.get(404725).then((alarm) => {
      expect(alarm.id).toEqual(404725);
    });
  });
  it('AlarmDAO.find(id=404725)', () => {
    const filter = new Filter();
    filter.withOrRestriction(new Restriction('id', Comparators.EQ, 404725));
    return dao.find(filter).then((alarms) => {
      expect(alarms.length).toEqual(1);
    });
  });
});

describe('AlarmDAO with v2 API', () => {
  beforeEach((done) => {
    auth = new OnmsAuthConfig(SERVER_USER, SERVER_PASSWORD);
    server = new OnmsServer(SERVER_NAME, SERVER_URL, auth);
    mockHTTP = new MockHTTP21(server);
    opennms = new Client(mockHTTP);
    dao = new AlarmDAO(mockHTTP);
    Client.getMetadata(server, mockHTTP).then((metadata) => {
      server.metadata = metadata;
      done();
    });
  });
  it('AlarmDAO.get(6806)', () => {
    return dao.get(6806).then((alarm) => {
      expect(alarm.id).toEqual(6806);
    });
  });
  it('AlarmDAO.find(id=6806)', () => {
    const filter = new Filter();
    filter.withOrRestriction(new Restriction('alarm.id', Comparators.EQ, 6806));
    return dao.find(filter).then((alarms) => {
      expect(alarms.length).toEqual(1);
      expect(alarms[0].id).toEqual(6806);
    });
  });
  it('AlarmDAO.find(uei=should-not-exist)', () => {
    const filter = new Filter();
    filter.withOrRestriction(new Restriction('alarm.uei', Comparators.EQ, 'should-not-exist'));
    return dao.find(filter).then((alarms) => {
      expect(alarms.length).toEqual(0);
    });
  });
});
