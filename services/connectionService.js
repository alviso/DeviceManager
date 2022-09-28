const dns = require('dns')
const {exec} = require("child_process");
const Tail = require('tail').Tail;

class connectionService {

    constructor() {
        this.online = false
        this.lastRestart = 0
        this.checkOnline()
        this.bridgeWatch()
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

    async exec(command) {
        return new Promise((resolve, reject)=>{
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return resolve('');
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return resolve('');
                }
                console.log(`stdout: ${stdout}`);
                return resolve(stdout);
            });
        })
    }

    async bridgeWatch() {
        try {
            const tail = new Tail(`/var/log/syslog`);
            tail.watch();
            tail.on("line", text => {
                let now = Date.now();
                if (text.includes('chirpstack'))
                {
                    if ((text.includes('not Connected') || text.includes('failed to connect to broker'))
                        && (now - this.lastRestart > 60 * 1000)) {
                        console.log("Restarting gateway bridge...");
                        this.lastRestart = now;
                        this.exec('sudo service lora-gateway-bridge restart');
                    } else console.log(text);
                }
            });
        } catch (err) {
            console.log(err);
        }
    }



}

module.exports = connectionService