[img-homesdata]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-homesdata.png "Node Homesdata"

[img-homestatus]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-homestatus.png "Node Homestatus"

[img-setthermmode]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-setthermmode.png "Node Setthermmode"

[img-setroomthermpoint]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-setroomthermpoint.png "Node Setroomthermpoint"

[img-getroommeasure]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-getroommeasure.png "Node Getroommeasure"

[img-switchhomeschedule]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/main/doc/node-switchhomeschedule.png "Node Switchhomeschedule"

# Node-RED nodes to talk to the Netatmo thermostat

[![npm version](https://img.shields.io/npm/v/node-red-contrib-netatmo-energy.svg?maxAge=2592000)](https://www.npmjs.com/package/node-red-contrib-netatmo-energy) [![Downloads](https://img.shields.io/npm/dm/node-red-contrib-netatmo-energy.svg?maxAge=2592000)](https://www.npmjs.com/package/node-red-contrib-netatmo-energy)
[![Build Status](https://travis-ci.org/tvecera/node-red-contrib-netatmo-energy.svg?branch=main)](https://travis-ci.org/tvecera/node-red-contrib-netatmo-energy)

Library using forked netatmo library - https://github.com/karbassi/netatmo.

Tested with:

* Node 16 LTS
* macOS Monterey
* Armbian

## Install

Run command on Node-RED installation directory:

    cd ~/.node-red
    npm install node-red-contrib-netatmo-energy 

for global installation:

    npm install -g node-red-contrib-netatmo-energy 

## Node HOMESDATA

This node returns the user's homes and their topology associated with this netatmo account.

Documentation: https://dev.netatmo.com/resources/technical/reference/energy/homesdata

![Homesdata node config][img-homesdata]

### Node config

* **home_id** - (Optional) Id of the home
* **gateway_types** - (Optional) Array of desired gateway. For Energy app, use NAPlug

Node config can be overwritten by message payload.

## Node HOMESTATUS

This node returns current status and data measured for all home devices.

Documentation: https://dev.netatmo.com/resources/technical/reference/energy/homestatus

![Homestatus node config][img-homestatus]

### Node config

* **home_id** - (required) Id of the home
* **device_types** - (Optional) Array of device type, eg. NAPlug

Node config can be overwritten by message payload.

## Node GETROOMMEASURE

This node returns the history of data associated to a room.

Documentation: https://dev.netatmo.com/apidocumentation/energy#getroommeasure

![Getroommeasure node config][img-getroommeasure]

### Node config

* **home_id** - (required) Id of the home
* **room_id** - (required) Id of the room
* **scale** - (required) Timeframe between two measurements {30min, 1hour, 3hours, 1day, 1week, 1month}
* **type** - (required) Type of data to be returned {temperature, sp_temperature (temperature setpoint)), min_temp,
  max_temp, date_min_temp, date_max_temp}, date_min_temp & date_max_temp are only available for large scales ({1day,
  1week, 1month}).
* **device_types** - (Optional) Array of device type, eg. NAPlug

Node config can be overwritten by message payload.

## Node SETTHERMMODE

This node set the home heating system to use schedule/ away/ frost guard mode.

Documentation: https://dev.netatmo.com/resources/technical/reference/energy/setthermmode

![Setthermmode node config][img-setthermmode]

### Node config

* **home_id** - (required) Id of the home
* **mode** - (required) Heating mode, schedule or away or hg ...
* **endtime** - (Optional) End time in seconds, eg. 180

Node config can be overwritten by message payload.

## Node SETROOMTHERMPOINT

This node set a manual temperature to a room.

Documentation: https://dev.netatmo.com/resources/technical/reference/energy/setroomthermpoint

![Setroomthermpoint node config][img-setroomthermpoint]

### Node config

* **home_id** - (required) Id of the home
* **room_id** - (required) Id of the room
* **mode** - (required) The mode you are applying to this room - manual OR home
* **temp** - (Optional) Manual temperature to apply
* **endtime** - (Optional) End time in second, eg. 180

Node config can be overwritten by message payload.

## Node GETROOMMEASURE

This node returns data from a Room.

Documentation: https://dev.netatmo.com/apidocumentation/energy#getroommeasure

![Getroommeasure node config][img-getroommeasure]

### Node config

* **home_id** - (required) Id of the home
* **room_id** - (required) Id of the room
* **scale** - (required) Step between measurements. Values: 30min, 1hour, 3hours, 1day, 1week, 1month, max
* **type** - (required) Type of requested measurements. Values: temperature, sp_temperature, min_temp, max_temp, date_min_temp
* **date_begin** - (Optional) Timestamp of the first measure to retrieve. Default is null.
* **date_end** - (Optional) Timestamp of the last measure to retrieve (default and max are 1024). Default is null.
* **limit** - (Optional) Maximum number of measurements (default and max Are 1024)
* **optimize** - (Optional) Determines the format of the answer. Default is true. For mobile apps we recommend True and False if bandwidth isn't an issue as it is easier to parse.
* **real_time** - (Optional) If scale different than max, timestamps are by default offset + scale/2. To get exact timestamps, use true. Default is false

## Node SWITCHHOMESCHEDULE

This node switches the home schedule to the given schedule.

Documentation: https://dev.netatmo.com/apidocumentation/energy#switchhomeschedule

![Setthermmode node config][img-setthermmode]

### Node config

* **home_id** - (required) Id of the home
* **schedule_id** - (required) Id of the schedule to switch on

Node config can be overwritten by message payload.

## License

The Apache License, Version 2.0