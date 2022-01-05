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

  function NetatmoSetRoomThermPoint(config) {

    RED.nodes.createNode(this, config);
    this.auth = RED.nodes.getNode(config.auth);
    const node = this;

    this.on('input', function (msg) {
      const api = this.auth.api

      let payload = {
        home_id: config.home_id,
        room_id: config.room_id,
        mode: config.mode,
        temp: config.temp,
        endtime: config.endtime,
      };

      if (msg && msg.payload) {
        // use home id from msg payload
        if (msg.payload.home_id) {
          payload.home_id = msg.payload.home_id;
        }
        // use room id from msg payload
        if (msg.payload.room_id) {
          payload.room_id = msg.payload.room_id;
        }
        // use temp from msg payload
        if (msg.payload.temp) {
          payload.temp = msg.payload.temp;
        }
        // use mode from msg payload
        if (msg.payload.mode) {
          payload.mode = msg.payload.mode;
        }
        // use endtime from msg payload
        if (msg.payload.endtime) {
          payload.endtime = msg.payload.endtime;
        }
      }

      api.setRoomThermPoint(payload, (err, result) => {
        msg.payload = result;
        node.send(msg);
      });

      api.on("error", function (error) {
        console.error('setRoomThermPoint - ' + error);
      });

      api.on("warning", function (warning) {
        console.error('setRoomThermPoint - ' + warning);
      });
    });
  }

  RED.nodes.registerType("setroomthermpoint", NetatmoSetRoomThermPoint);
};