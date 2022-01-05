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

  function NetatmoSetThermMode(config) {

    RED.nodes.createNode(this, config);
    this.auth = RED.nodes.getNode(config.auth);
    const node = this;

    this.on('input', function (msg) {
      const api = this.auth.api

      let payload = {
        home_id: config.home_id,
        mode: config.mode,
        endtime: config.endtime,
      };

      if (msg && msg.payload) {
        // use home id from msg payload
        if (msg.payload.home_id) {
          payload.home_id = msg.payload.home_id;
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

      api.setThermMode(payload, (err, result) => {
        msg.payload = result;
        node.send(msg);
      });

      api.on("error", function (error) {
        console.error('setThermMode - ' + error);
      });

      api.on("warning", function (warning) {
        console.error('setThermMode - ' + warning);
      });
    });
  }

  RED.nodes.registerType("setthermmode", NetatmoSetThermMode);
};