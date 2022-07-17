const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec']

class NetatmoLogger {
    timestamp() {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0')
        const month = months[d.getMonth()]
        const hour = String(d.getHours()).padStart(2, '0')
        const min = String(d.getMinutes()).padStart(2, '0')
        const sec = String(d.getSeconds()).padStart(2, '0')
        
        return `${day} ${month} ${hour}:${min}:${sec}`
    }

    info(msg) {
        console.log('%s - [info] %s', this.timestamp(), msg);
    }

    warn(msg) {
        console.warn('%s - [warn] %s', this.timestamp(), msg);
    }

    error(code, msg) {
        console.error('%s - [error] - [%s] - %s', this.timestamp(), code, msg);
    }
}

module.exports = NetatmoLogger
