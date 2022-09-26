const dns = require('dns')

class connectionService {

    constructor() {
        this.online = false
        this.checkOnline()
    }

    checkOnline = async () => {
        setTimeout(this.checkOnline, 10 * 1000)
        dns.resolve('google.com', (err) => {
            if (err) {
                this.online = false
                // console.log('offline')
            } else {
                this.online = true
                // console.log('online')
            }
        });
    }

    isOnline() {
        return this.online
    }
}

module.exports = connectionService