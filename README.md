[img-homesdata]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/master/doc/node-homesdata.png "Node Homesdata"
[img-homestatus]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/master/doc/node-homestatus.png "Node Homestatus"
[img-setthermmode]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/master/doc/node-setthermmode.png "Node Setthermmode"
[img-setroomthermpoint]: https://github.com/tvecera/node-red-contrib-netatmo-energy/raw/master/doc/node-setroomthermpoint.png "Node Setroomthermpoint"


# Node-RED nodes to talk to the Netatmo thermostat

Library using forked netatmo library - https://github.com/karbassi/netatmo.

Tested with:
* Node 8 LTS
* macOS High Sierra
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

## Node SETTHERMMODE

This node set the home heating system to use schedule/ away/ frost guard mode.

Documentation: https://dev.netatmo.com/resources/technical/reference/energy/setthermmode

![Setthermmode node config][img-setthermmode]

### Node config
* **home_id** - (required) Id of the home
* **mode** - (required) Heating mode, schedule or away or hg ...
* **endtime** - (Optional) End time in seconds, eg. 180

Node config can be overwritten by message payload.

## Node SETTHERMMODE

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

## License

The Apache License, Version 2.0