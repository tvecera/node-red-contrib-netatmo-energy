/**
 * Licensed under the Apache License, Version 2.0 (the "License")
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
const netatmoLogger = require("./netatmo-logger")

module.exports = function (RED) {
    "use strict"

    function _preparePayload(config, inputMessage) {
        let data = inputMessage && inputMessage.payload ? inputMessage.payload : config

        return {
            home_id: data.home_id ? data.home_id : config.home_id,
            schedule_id: data.schedule_id ? data.schedule_id : config.schedule_id,
        }
    }

    function NetatmoSwitchHomeSchedule(config) {
        RED.nodes.createNode(this, config)
        this.auth = RED.nodes.getNode(config.auth)
        const node = this
        const logger = new netatmoLogger()

        this.on('input', function (msg) {
            const api = this.auth.api
            const payload = _preparePayload(config, msg)

            api.switchHomeSchedule(payload, (err, result) => {
                if (err) {
                    msg.payload = {
                        status: "error",
                        code: err.name,
                        message: err.message,
                    }
                } else {
                    msg.payload = result
                }
                node.send(msg)
            })

            api.on("error", function (error) {
                logger.error(error.name, `[switchHomeSchedule] - ${error}`)
            })

            api.on("warning", function (warning) {
                logger.warn(`[switchHomeSchedule] - ${warning}`)
            })
        })
    }

    RED.nodes.registerType("switchhomeschedule", NetatmoSwitchHomeSchedule)
}
