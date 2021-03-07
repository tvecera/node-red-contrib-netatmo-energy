/**
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
module.exports = function (RED) {
  "use strict";

  function NetatmoGetRoomMeasure(config) {

    RED.nodes.createNode(this, config);
    this.auth = RED.nodes.getNode(config.auth);
    const node = this;

    this.on('input', function (msg) {
      const netatmo = require('./netatmo-energy-api.js');
      const api = new netatmo(this.auth);

      let payload = {
        home_id: config.home_id,
        room_id: config.room_id,
        scale: config.scale,
        type: config.measure_type,
        date_begin: config.date_begin,
        date_end: config.date_end,
        limit: config.limit,
        optimize: config.optimize,
        real_time: config.real_time,
      };

      if (msg && msg.payload) {
        // use home id from msg payload
        if (msg.payload.home_id) {
          payload.home_id = msg.payload.home_id;
        }
        // use room_id from msg payload
        if (msg.payload.room_id) {
          payload.room_id = msg.payload.room_id;
        }
        // use scale from msg payload
        if (msg.payload.scale) {
          payload.scale = msg.payload.scale;
        }
        // use measure_type from msg payload
        if (msg.payload.measure_type) {
          payload.type = msg.payload.measure_type;
        }
        // use date_begin from msg payload
        if (msg.payload.date_begin) {
          payload.date_begin = msg.payload.date_begin;
        }
        // use date_end from msg payload
        if (msg.payload.date_end) {
          payload.date_end = msg.payload.date_end;
        }
        // use limit from msg payload
        if (msg.payload.limit) {
          payload.limit = msg.payload.limit;
        }
        // use optimize from msg payload
        if (msg.payload.optimize) {
          payload.optimize = msg.payload.optimize;
        }
        // use real_time from msg payload
        if (msg.payload.real_time) {
          payload.real_time = msg.payload.real_time;
        }
      }

      api.getRoomMeasure(payload, (err, body) => {
        msg.payload = { body: body };
        node.send(msg);
      });

      api.on("error", function (error) {
        console.error('getroommeasure - ' + error);
      });

      api.on("warning", function (warning) {
        console.error('getroommeasure - ' + warning);
      });
    });
  }

  RED.nodes.registerType("getroommeasure", NetatmoGetRoomMeasure);
};