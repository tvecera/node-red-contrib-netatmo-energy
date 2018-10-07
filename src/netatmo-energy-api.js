/**
 * Fork npm netatmo node module - https://github.com/karbassi/netatmo
 * MIT, Ali Karbassi
 *
 * <h2>NETATMO Energy API</h2>
 *
 * https://dev.netatmo.com/resources/technical/reference/energy
 * &nbsp;
 * <b>Data available:</b> Temperature, Temperature setpoint and information, Heating schedules details,
 * Device information (radio status, battery status)
 * &nbsp;
 * <b>ThermModes</b>:
 * <ul>
 *   <li><b>schedule</b> - Currently following a weekly schedule</li>
 *   <li><b>away</b> - Currently applying the "away" temperature as defined by the user</li>
 *   <li><b>hg</b> - Frost-guard</li>
 * </ul>
 *
 * &nbsp;
 * <b>Netatmo specific time zones</b>:
 * <ul>
 *   <li><b>0</b> - day</li>
 *   <li><b>1</b> - night</li>
 *   <li><b>2</b> - away</li>
 *   <li><b>3</b> - frost guard</li>
 *   <li><b>4</b> - custom</li>
 *   <li><b>5</b> - comfort</li>
 *   <li><b>5</b> - eco</li>
 * </ul>
 *
 * @author Tomas Vecera
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const util = require('util');
const EventEmitter = require("events").EventEmitter;
const request = require('request');
const moment = require('moment');

const BASE_URL = 'https://api.netatmo.net';

let client_id, client_secret,
  scope, access_token, username, password;

/**
 * @constructor
 * @param args
 */
const netatmo = function (args) {
  EventEmitter.call(this);
  this.authenticate(args);
};

util.inherits(netatmo, EventEmitter);

/**
 * https://dev.netatmo.com/dev/resources/technical/guides/authentication
 * @param args
 * @param callback
 * @returns {netatmo}
 */
netatmo.prototype.authenticate = function (args, callback) {
  const url = util.format('%s/oauth2/token', BASE_URL);

  if (!args) {
    this.emit("error", new Error("Authenticate 'args' not set."));
    return this;
  }

  const { access_token, client_id, client_secret, username, password, scope } = args;

  // client_id and client_id are mandatory configuration fields
  if (!client_id || !client_id) {
    this.emit("error", new Error("Authenticate 'client_id' or 'client_secret' not set."));
    return this;
  }

  // user name and password are mandatory configuration fields
  if (!username || !password) {
    this.emit("error", new Error("Authenticate 'username' od 'password' not set."));
    return this;
  }

  // access token from msg payload
  if (access_token) {
    this.access_token = access_token;
    return this;
  }

  this.client_id = client_id;
  this.client_secret = client_secret;
  this.username = username;
  this.password = password;
  this.scope = scope || 'read_thermostat write_thermostat';

  const form = {
    client_id: this.client_id,
    client_secret: this.client_secret,
    username: this.username,
    password: this.password,
    scope: this.scope,
    grant_type: 'password',
  };

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "Authenticate error", true);
    }

    this.bindRefreshToken(body);
    this.emit('authenticated');
    if (callback) {
      return callback();
    }

    return this;
  }.bind(this));

  return this;
};

/**
 * https://dev.netatmo.com/dev/resources/technical/guides/authentication/refreshingatoken
 * @param refresh_token
 * @returns {netatmo}
 */
netatmo.prototype.refreshToken = function (refresh_token) {
  const url = util.format('%s/oauth2/token', BASE_URL);

  const form = {
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    client_id: this.client_id,
    client_secret: this.client_secret,
  };

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "Authenticate refresh error");
    }

    this.bindRefreshToken(body);

    return this;
  }.bind(this));

  return this;
};

/**
 *
 * @param resultBody
 */
netatmo.prototype.bindRefreshToken = function (resultBody) {
  let body = JSON.parse(resultBody);
  const { access_token, expires_in, refresh_token } = body;
  this.access_token = access_token;

  if (expires_in) {
    setTimeout(this.refreshToken.bind(this), expires_in * 1000, refresh_token);
  }
};

/**
 * handleRequestError
 * @param err
 * @param response
 * @param body
 * @param message
 * @param critical
 * @returns {Error}
 */
netatmo.prototype.handleRequestError = function (err, response, body, message, critical) {
  let errorMessage = "";

  if (body && response.headers["content-type"].trim().toLowerCase().indexOf("application/json") !== -1) {
    errorMessage = JSON.parse(body);
    errorMessage = errorMessage && (errorMessage.error.message || errorMessage.error);
  } else if (typeof response !== 'undefined') {
    errorMessage = "Status code" + response.statusCode;
  }
  else {
    errorMessage = "No response";
  }

  let error = new Error(message + ": " + errorMessage);

  if (critical) {
    this.emit("error", error);
  } else {
    this.emit("warning", error);
  }

  return error;
};

/**
 * <b>Homesdata</b> - Retrieve user's homes and their topology.
 * Documentation: <a href="https://dev.netatmo.com/resources/technical/reference/energy/homesdata">https://dev.netatmo.com/resources/technical/reference/energy/homesdata</a>
 *
 * @param options
 * <ul>
 *   <li><b>home_id</b> - (Optional) Id of the home</li>
 *   <li><b>gateway_types</b> - (Optional) Array of desired gateway. For Energy app, use NAPlug</li>
 * </ul>
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homesData = function (options, callback) {
  let url = util.format('%s/api/homesdata', BASE_URL);

  // Wait until authenticated.
  if (!this.access_token) {
    return this.on('authenticated', function () {
      this.homesData(options, callback);
    });
  }

  if (options != null && callback == null) {
    callback = options;
    options = null;
  }

  let form = {
    access_token: this.access_token,
  };
  if (options) {
    Object.assign(form, {
      home_id: options.home_id,
      gateway_types: options.gateway_types
    });
  }

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "ERROR - Netatmo API - homesData()");
    }

    body = JSON.parse(body);
    let homes = body.body.homes;
    this.emit('homesdata', err, homes);

    if (callback) {
      return callback(err, homes);
    }
    return this;
  }.bind(this));

  return this;
};

/**
 * <b>Homestatus</b> - Get the current status and data measured for all home devices.
 * Documentation: <a href="https://dev.netatmo.com/resources/technical/reference/energy/homestatus">https://dev.netatmo.com/resources/technical/reference/energy/homestatus</a>
 *
 * @param options
 * <ul>
 *   <li><b>home_id</b> - (required) Id of the home</li>
 *   <li><b>device_types</b> - (Optional) Array of device type, eg. NAPlug</li>
 * </ul>
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homeStatus = function (options, callback) {
  let url = util.format('%s/api/homestatus', BASE_URL);

  // Wait until authenticated.
  if (!this.access_token) {
    return this.on('authenticated', function () {
      this.homeStatus(options, callback);
    });
  }
  if (!options) {
    this.emit("error", new Error("homeStatus 'options' not set."));
    return this;
  }
  if (!options.home_id) {
    this.emit("error", new Error("homeStatus 'home_id' not set."));
    return this;
  }
  let form = {
    access_token: this.access_token,
    home_id: options.home_id,
  };
  if (options.device_types) {
    Object.assign(form, {
      device_types: options.device_types
    });
  }

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "ERROR - Netatmo API - homeStatus()");
    }
    body = JSON.parse(body);
    let home = body.body.home;
    this.emit('homestatus', err, home);

    if (callback) {
      return callback(err, home);
    }
    return this;
  }.bind(this));

  return this;
};

/**
 * <b>Setthermmode</b> - Set the home heating system to use schedule/ away/ frost guard mode.
 * Documentation: <a href="https://dev.netatmo.com/resources/technical/reference/energy/setthermmode">https://dev.netatmo.com/resources/technical/reference/energy/setthermmode</a>
 *
 * @param options
 * <ul>
 *   <li><b>home_id</b> - (required) Id of the home</li>
 *   <li><b>mode</b> - (required) Heating mode, schedule or away or hg ...</li>
 *   <li><b>endtime</b> - (Optional) End time, eg. 180</li>
 * </ul>
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setThermMode = function (options, callback) {
  let url = util.format('%s/api/setthermmode', BASE_URL);

  // Wait until authenticated.
  if (!this.access_token) {
    return this.on('authenticated', function () {
      this.setThermMode(options, callback);
    });
  }
  if (!options) {
    this.emit("error", new Error("setThermMode 'options' not set."));
    return this;
  }
  if (!options.home_id) {
    this.emit("error", new Error("setThermMode 'home_id' not set."));
    return this;
  }
  if (!options.mode) {
    this.emit("error", new Error("setThermMode 'mode' not set."));
    return this;
  }
  let form = {
    access_token: this.access_token,
    home_id: options.home_id,
    mode: options.mode,
  };
  if (options.endtime) {
    Object.assign(form, {
      endtime: this.getTime(options.endtime)
    });
  }

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "ERROR - Netatmo API - setThermMode()");
    }
    body = JSON.parse(body);
    this.emit('setthermmode', err, body);

    if (callback) {
      return callback(err, body);
    }
    return this;
  }.bind(this));

  return this;
};

/**
 * <b>Setroomthermpoint</b> - Set a manual temperature to a room. or switch back to home mode.
 * Documentation: <a href="https://dev.netatmo.com/resources/technical/reference/energy/setthermmode">https://dev.netatmo.com/resources/technical/reference/energy/setthermmode</a>
 *
 * @param options
 * <ul>
 *   <li><b>home_id</b> - (required) Id of the home</li>
 *   <li><b>room_id</b> - (required) Id of the room</li>
 *   <li><b>mode</b> - (required) The mode you are applying to this room - manual OR home</li>
 *   <li><b>temp</b> - (Optional) Manual temperature to apply</li>
 *   <li><b>endtime</b> - (Optional) End time in second, eg. 180</li>
 * </ul>
 * @param callback
 * @returns {*}
 */
netatmo.prototype.setRoomThermPoint = function (options, callback) {
  let url = util.format('%s/api/setroomthermpoint', BASE_URL);

  // Wait until authenticated.
  if (!this.access_token) {
    return this.on('authenticated', function () {
      this.setRoomThermPoint(options, callback);
    });
  }
  if (!options) {
    this.emit("error", new Error("setRoomThermPoint 'options' not set."));
    return this;
  }
  if (!options.home_id) {
    this.emit("error", new Error("setRoomThermPoint 'home_id' not set."));
    return this;
  }
  if (!options.room_id) {
    this.emit("error", new Error("setRoomThermPoint 'room_id' not set."));
    return this;
  }
  if (!options.mode || (options.mode !== 'manual' && options.mode !== 'home')) {
    this.emit("error", new Error("setRoomThermPoint 'mode' not set or has invalid value."));
    return this;
  }

  if (options.mode === 'manual' && !options.temp) {
    this.emit("error", new Error("setRoomThermPoint 'temp' not set for manual mode."));
    return this;
  }

  let form = {
    access_token: this.access_token,
    home_id: options.home_id,
    room_id: options.room_id,
    mode: options.mode,
  };
  if (form.mode === 'manual') {
    Object.assign(form, {
      temp: options.temp
    });
    if (options.endtime) {
      Object.assign(form, {
        endtime: this.getTime(options.endtime)
      });
    }
  }

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "ERROR - Netatmo API - setRoomThermPoint()");
    }
    body = JSON.parse(body);
    this.emit('setroomthermpoint', err, body);

    if (callback) {
      return callback(err, body);
    }
    return this;
  }.bind(this));

  return this;
};

/**
 * <b>Getroommeasure</b> - Retrieve data from a Room.
 * Documentation: <a href="https://dev.netatmo.com/resources/technical/reference/energy/getroommeasure">https://dev.netatmo.com/resources/technical/reference/energy/getroommeasure</a>
 *
 * @param options
 * <ul>
 *   <li><b>home_id</b> - (required) Id of the home</li>
 *   <li><b>room_id</b> - (required) Id of the room</li>
 *   <li><b>scale</b> - (required) Step between measurements. Values: 30min, 1hour, 3hours, 1day,
 *   1week, 1month, max</li>
 *   <li><b>type</b> - (required) Type of requested measurements. Values: temperature,
 *   sp_temperature, min_temp, max_temp, date_min_temp</li>
 *
 *   <li><b>date_begin</b> - (Optional) Timestamp of the first measure to retrieve. Default is null.</li>
 *   <li><b>date_end</b> - (Optional) Timestamp of the last measure to retrieve (default and max are 1024).
 *   Default is null.</li>
 *   <li><b>limit</b> - (Optional) Maximum number of measurements (default and max Are 1024)</li>
 *   <li><b>optimize</b> - (Optional) Determines the format of the answer. Default is true. For
 *   mobile apps we recommend True and False if bandwidth isn't an issue as it is easier to parse.</li>
 *   <li><b>real_time</b> - (Optional) If scale different than max, timestamps are by default
 *   offset + scale/2. To get exact timestamps, use true. Default is false</li>
 * </ul>
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getRoomMeasure = function (options, callback) {
  let url = util.format('%s/api/getroommeasure', BASE_URL);

  // Wait until authenticated.
  if (!this.access_token) {
    return this.on('authenticated', function () {
      this.getRoomMeasure(options, callback);
    });
  }
  if (!options) {
    this.emit("error", new Error("getRoomMeasure 'options' not set."));
    return this;
  }
  if (!options.home_id) {
    this.emit("error", new Error("getRoomMeasure 'home_id' not set."));
    return this;
  }
  if (!options.room_id) {
    this.emit("error", new Error("getRoomMeasure 'room_id' not set."));
    return this;
  }
  if (!options.scale) {
    this.emit("error", new Error("getRoomMeasure 'scale' not set."));
    return this;
  }
  if (!options.type) {
    this.emit("error", new Error("getRoomMeasure 'type' not set."));
    return this;
  }
  let form = {
    access_token: this.access_token,
    home_id: options.home_id,
    room_id: options.room_id,
    scale: options.scale,
    type: options.type,
  };
  if (options.date_begin) {
    form.date_begin = options.date_begin;
  }
  if (options.date_end) {
    form.date_end = options.date_end;
  }
  if (options.limit) {
    form.limit = options.limit;
  }
  if (options.optimize) {
    form.optimize = options.optimize;
  }
  if (options.real_time) {
    form.real_time = options.real_time;
  }

  request({
    url: url,
    method: "POST",
    form: form,
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "ERROR - Netatmo API - getRoomMeasure()");
    }
    body = JSON.parse(body);
    this.emit('getroommeasure', err, body.body);

    if (callback) {
      return callback(err, body.body);
    }
    return this;
  }.bind(this));

  return this;
};

netatmo.prototype.getTime = function (timeInSec) {
  return Math.floor(Date.now() / 1000) + (timeInSec * 60)
};

module.exports = netatmo;