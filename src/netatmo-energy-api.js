/**
 * Fork npm netatmo node module - https://github.com/karbassi/netatmo
 * MIT, Ali Karbassi
 *
 * <h2>NETATMO Energy API</h2>
 *
 * https://dev.netatmo.com/resources/technical/reference/energy
 * &nbsp
 * <b>Data available:</b> Temperature, Temperature setpoint and information, Heating schedules details,
 * Device information (radio status, battery status)
 * &nbsp
 * <b>ThermModes</b>:
 * <ul>
 *   <li><b>schedule</b> - Currently following a weekly schedule</li>
 *   <li><b>away</b> - Currently applying the "away" temperature as defined by the user</li>
 *   <li><b>hg</b> - Frost-guard</li>
 * </ul>
 *
 * &nbsp
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
const util = require('util')
const EventEmitter = require("events").EventEmitter
const request = require('request')
const netatmoLogger = require("./netatmo-logger");

const BASE_URL = 'https://api.netatmo.net'
const logger = new netatmoLogger()

class Netatmo extends EventEmitter {
    constructor(args) {
        super();
        EventEmitter.call(this)
        this.authenticate(args)
    }

    /**
     * Documentation: https://dev.netatmo.com/apidocumentation/oauth
     * @param args
     * @param callback
     * @returns {Netatmo}
     */
    authenticate(args, callback = undefined) {
        if (!args) {
            this.emit("error", new Error("Authenticate 'args' not set."))
            return this
        }

        const {client_id, client_secret, refresh_token} = args

        // client_id and client_secret are mandatory configuration fields
        if (!client_id || !client_secret) {
            this.emit("error", new Error("Authenticate 'client_id' or 'client_secret' not set."))
            return this
        }

        // refresh_token are mandatory configuration field
        if (!refresh_token) {
            this.emit("error", new Error("Refresh token not set."))
            return this
        }

        this.client_id = client_id
        this.client_secret = client_secret
        this.refresh_token = refresh_token

        this.refreshToken(refresh_token)

        if (callback) {
            return callback()
        }

        return this
    }

    /**
     * Documentation: https://dev.netatmo.com/apidocumentation/oauth#refreshing-a-token
     * @param refresh_token
     * @returns {Netatmo}
     */
    refreshToken(refresh_token) {
        const url = util.format('%s/oauth2/token', BASE_URL)

        const form = {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: this.client_id,
            client_secret: this.client_secret,
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return this.handleRequestError(response, body, "Authenticate refresh error")
            }

            this.bindRefreshToken(body)
            this.emit('authenticated')

            return this
        }.bind(this))

        return this
    }

    /**
     *
     * @param resultBody
     */
    bindRefreshToken(resultBody) {
        let body = JSON.parse(resultBody)
        const {access_token, expires_in, refresh_token} = body
        this.access_token = access_token
        this.refresh_token = refresh_token

        if (expires_in) {
            setTimeout(this.refreshToken.bind(this), expires_in * 1000, refresh_token)
        }
    }

    /**
     * HandleRequestError
     *
     * @param response
     * @param body
     * @param message
     * @param critical
     * @returns {Error}
     */
    handleRequestError(response, body, message, critical = true) {
        let errorMessage
        let errorCode = "-1"

        if (body && response.headers["content-type"].trim().toLowerCase().indexOf("application/json") !== -1) {
            errorMessage = JSON.parse(body)
            errorCode = errorMessage && (errorMessage.error.code || "-1")
            errorMessage = errorMessage && (errorMessage.error.message || errorMessage.error)
        } else if (typeof response !== 'undefined') {
            errorMessage = "Status code: " + response.statusMessage
            errorCode = response.statusCode
        } else {
            errorMessage = "No response"
        }

        let error = new Error(message + ": " + errorMessage)
        error.name = errorCode

        if (critical) {
            logger.error(error.name, error.message)
        } else {
            logger.warn(error.message)
        }

        if (response.statusCode === 403 && errorCode === "3") {
            this.refreshToken(this.refresh_token);
        }

        return error
    }

    /**
     * <b>Homesdata</b> - Retrieve user's homes and their topology.
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#homesdata">https://dev.netatmo.com/apidocumentation/energy#homesdata</a>
     *
     * @param options
     * <ul>
     *   <li><b>home_id</b> - (Optional) Id of the home</li>
     *   <li><b>gateway_types</b> - (Optional) Array of desired gateway. For Energy app, use NAPlug</li>
     * </ul>
     * @param callback
     * @returns {*}
     */
    homesData(options, callback) {
        let url = util.format('%s/api/homesdata', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.homesData(options, callback)
            })
        }

        let form = {
            access_token: this.access_token,
        }

        if (options) {
            Object.assign(form, {
                home_id: options.home_id,
                gateway_types: options.gateway_types
            })
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            let homes
            if (err || response.statusCode !== 200) {
                err = this.handleRequestError(response, body, "Netatmo API - homesData()")
            } else {
                body = JSON.parse(body)
                homes = body.body.homes
            }
            this.emit('homesdata', err, homes)

            if (callback) {
                return callback(err, homes)
            }
            return this
        }.bind(this))

        return this
    }

    /**
     * <b>Homestatus</b> - Get the current status and data measured for all home devices.
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#homestatus">https://dev.netatmo.com/apidocumentation/energy#homestatus</a>
     *
     * @param options
     * <ul>
     *   <li><b>home_id</b> - (required) Id of the home</li>
     *   <li><b>device_types</b> - (Optional) Array of device type, eg. NAPlug</li>
     * </ul>
     * @param callback
     * @returns {*}
     */
    homeStatus(options, callback) {
        let url = util.format('%s/api/homestatus', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.homeStatus(options, callback)
            })
        }
        if (!options) {
            this.emit("error", new Error("homeStatus 'options' not set."))
            return this
        }
        if (!options.home_id) {
            this.emit("error", new Error("homeStatus 'home_id' not set."))
            return this
        }
        let form = {
            access_token: this.access_token,
            home_id: options.home_id,
        }
        if (options.device_types) {
            Object.assign(form, {
                device_types: options.device_types
            })
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            let home
            if (err || response.statusCode !== 200) {
                err = this.handleRequestError(response, body, "Netatmo API - homeStatus()")
            } else {
                body = JSON.parse(body)
                home = body.body.home
            }
            this.emit('homestatus', err, home)

            if (callback) {
                return callback(err, home)
            }
            return this
        }.bind(this))

        return this
    }

    /**
     * <b>Setthermmode</b> - Set the home heating system to use schedule/ away/ frost guard mode.
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#setthermmode">https://dev.netatmo.com/apidocumentation/energy#setthermmode</a>
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
    setThermMode(options, callback) {
        let url = util.format('%s/api/setthermmode', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.setThermMode(options, callback)
            })
        }
        if (!options) {
            this.emit("error", new Error("setThermMode 'options' not set."))
            return this
        }
        if (!options.home_id) {
            this.emit("error", new Error("setThermMode 'home_id' not set."))
            return this
        }
        if (!options.mode) {
            this.emit("error", new Error("setThermMode 'mode' not set."))
            return this
        }
        let form = {
            access_token: this.access_token,
            home_id: options.home_id,
            mode: options.mode,
        }
        if (options.endtime) {
            Object.assign(form, {
                endtime: this.getTime(options.endtime)
            })
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                body = this.handleRequestError(response, body, "Netatmo API - setThermMode()")
                err = body
            } else {
                body = JSON.parse(body)
            }
            this.emit('setthermmode', err, body)

            if (callback) {
                return callback(err, body)
            }
            return this
        }.bind(this))

        return this
    }

    /**
     * <b>Setroomthermpoint</b> - Set a manual temperature to a room. or switch back to home mode.
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#setroomthermpoint">https://dev.netatmo.com/apidocumentation/energy#setroomthermpoint</a>
     *
     * @param options
     * <ul>
     *   <li><b>home_id</b> - (required) Id of the home</li>
     *   <li><b>room_id</b> - (required) Id of the room</li>
     *   <li><b>mode</b> - (required) The mode you are applying to this room - manual, home, max</li>
     *   <li><b>temp</b> - (Optional) Manual temperature to apply</li>
     *   <li><b>endtime</b> - (Optional) End time in second, eg. 180</li>
     * </ul>
     * @param callback
     * @returns {*}
     */
    setRoomThermPoint(options, callback) {
        let url = util.format('%s/api/setroomthermpoint', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.setRoomThermPoint(options, callback)
            })
        }
        if (!options) {
            this.emit("error", new Error("setRoomThermPoint 'options' not set."))
            return this
        }
        if (!options.home_id) {
            this.emit("error", new Error("setRoomThermPoint 'home_id' not set."))
            return this
        }
        if (!options.room_id) {
            this.emit("error", new Error("setRoomThermPoint 'room_id' not set."))
            return this
        }
        if (!options.mode || (options.mode !== 'manual' && options.mode !== 'home' && options.mode !== 'max')) {
            this.emit("error", new Error("setRoomThermPoint 'mode' not set or has invalid value."))
            return this
        }

        if (options.mode === 'manual' && !options.temp) {
            this.emit("error", new Error("setRoomThermPoint 'temp' not set for manual mode."))
            return this
        }

        let form = {
            access_token: this.access_token,
            home_id: options.home_id,
            room_id: options.room_id,
            mode: options.mode,
        }
        if (form.mode === 'manual') {
            Object.assign(form, {
                temp: options.temp
            })
            if (options.endtime) {
                Object.assign(form, {
                    endtime: this.getTime(options.endtime)
                })
            }
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                body = this.handleRequestError(response, body, "Netatmo API - setRoomThermPoint()")
                err = body
            } else {
                body = JSON.parse(body)
            }
            this.emit('setroomthermpoint', err, body)

            if (callback) {
                return callback(err, body)
            }
            return this
        }.bind(this))

        return this
    }

    /**
     * <b>Getroommeasure</b> - Retrieve data from a Room.
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#getroommeasure">https://dev.netatmo.com/apidocumentation/energy#getroommeasure</a>
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
    getRoomMeasure(options, callback) {
        let url = util.format('%s/api/getroommeasure', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.getRoomMeasure(options, callback)
            })
        }
        if (!options) {
            this.emit("error", new Error("getRoomMeasure 'options' not set."))
            return this
        }
        if (!options.home_id) {
            this.emit("error", new Error("getRoomMeasure 'home_id' not set."))
            return this
        }
        if (!options.room_id) {
            this.emit("error", new Error("getRoomMeasure 'room_id' not set."))
            return this
        }
        if (!options.scale) {
            this.emit("error", new Error("getRoomMeasure 'scale' not set."))
            return this
        }
        if (!options.type) {
            this.emit("error", new Error("getRoomMeasure 'type' not set."))
            return this
        }
        let form = {
            access_token: this.access_token,
            home_id: options.home_id,
            room_id: options.room_id,
            scale: options.scale,
            type: options.type,
        }
        if (options.date_begin) {
            form.date_begin = options.date_begin
        }
        if (options.date_end) {
            form.date_end = options.date_end
        }
        if (options.limit) {
            form.limit = options.limit
        }
        if (options.optimize) {
            form.optimize = options.optimize
        }
        if (options.real_time) {
            form.real_time = options.real_time
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                body = this.handleRequestError(response, body, "Netatmo API - getRoomMeasure()")
                err = body
            } else {
                body = JSON.parse(body)
            }
            this.emit('getroommeasure', err, body.body)

            if (callback) {
                return callback(err, body.body)
            }
            return this
        }.bind(this))

        return this
    }

    /**
     * <b>SwitchHomeSchedule</b> - Set the specific home schedule. Schedule id you can get from HomesData node
     * Documentation: <a href="https://dev.netatmo.com/apidocumentation/energy#switchhomeschedule">https://dev.netatmo.com/apidocumentation/energy#setroomthermpoint</a>
     *
     * @param options
     * <ul>
     *   <li><b>home_id</b> - (required) Id of the home</li>
     *   <li><b>schedule_id</b> - (required) Id of the schedule to switch on</li>
     * </ul>
     * @param callback
     * @returns {*}
     */
    switchHomeSchedule(options, callback) {
        let url = util.format('%s/api/switchhomeschedule', BASE_URL)

        // Wait until authenticated.
        if (!this.access_token) {
            return this.on('authenticated', function () {
                this.setThermMode(options, callback)
            })
        }
        if (!options) {
            this.emit("error", new Error("switchHomeSchedule 'options' not set."))
            return this
        }
        if (!options.home_id) {
            this.emit("error", new Error("switchHomeSchedule 'home_id' not set."))
            return this
        }
        if (!options.schedule_id) {
            this.emit("error", new Error("switchHomeSchedule 'schedule_id' not set."))
            return this
        }
        let form = {
            access_token: this.access_token,
            home_id: options.home_id,
            schedule_id: options.schedule_id,
        }

        request({
            url: url,
            method: "POST",
            form: form,
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                body = this.handleRequestError(response, body, "Netatmo API - switchHomeSchedule()")
                err = body
            } else {
                body = JSON.parse(body)
            }
            this.emit('switchhomeschedule', err, body)

            if (callback) {
                return callback(err, body)
            }
            return this
        }.bind(this))

        return this
    }

    getTime = function (timeInSec) {
        return Math.floor(Date.now() / 1000) + (timeInSec * 60)
    }
}

module.exports = Netatmo
