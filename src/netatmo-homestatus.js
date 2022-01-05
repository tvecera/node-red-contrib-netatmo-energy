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

  function NetatmoHomeStatus(config) {

    RED.nodes.createNode(this, config);
    this.auth = RED.nodes.getNode(config.auth);
    const node = this;

    this.on('input', function (msg) {
      const api = this.auth.api

      let payload = {
        home_id: config.home_id,
        device_types: config.device_types
      };

      if (msg && msg.payload) {
        // use home id from msg payload
        if (msg.payload.home_id) {
          payload.home_id = msg.payload.home_id;
        }
        // use device_types from msg payload
        if (msg.payload.device_types) {
          payload.device_types = msg.payload.device_types;
        }
      }

      api.homeStatus(payload, (err, home) => {
        msg.payload = { home: home };
        node.send(msg);
      });

      api.on("error", function (error) {
        console.error('homeStatus - ' + error);
      });

      api.on("warning", function (warning) {
        console.error('homeStatus - ' + warning);
      });
    });
  }

  RED.nodes.registerType("homestatus", NetatmoHomeStatus);
};