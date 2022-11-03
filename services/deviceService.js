const os = require('os');
const fs = require('fs');
const axios = require('axios');
const {exec} = require("child_process");

class deviceService {

    constructor() {
        const intfs = os.networkInterfaces()
        const intf = intfs['eth0'] || intfs['en0']
        const mac = intf[0].mac
        console.log(mac)
        const bytesArr = mac.split(':')
        bytesArr.splice(3,0, 'ff', 'fe')
        let gatewayId = ''
        for (let i in bytesArr) {
            gatewayId += bytesArr[i]
        }
        gatewayId = gatewayId.toUpperCase()
        console.log(gatewayId)

        const homedir = os.homedir()
        const oldFname = homedir + '/sx1302_hal/packet_forwarder/global_conf.json'
        const newFname = homedir + '/sx1302_hal/packet_forwarder/global_conf.json.old'
        // let exists = false
        // try {
        //     if (fs.existsSync(newFname)) {
        //         exists = true
        //     }
        // } catch(e) {
        //     console.error(e)
        // }

        // if (!exists) {
        try {
            fs.renameSync(oldFname, newFname)
        } catch (e) {
            console.log(e)
        }

        const oldFname1 = homedir + '/sx1302_hal/packet_forwarder/global_conf.json.sx1250.EU868'
        const newFname1 = homedir + '/sx1302_hal/packet_forwarder/global_conf.json'
        try {
            fs.copyFileSync(oldFname1, newFname1)
        } catch (e) {
            console.log(e)
        }
        // }

        this.replaceInGlobalFile(oldFname, gatewayId)

        const oldFname2 = homedir + '/sx1302_hal/packet_forwarder/local_conf.json'
        try {
            if (fs.existsSync(oldFname2)) {
                fs.unlinkSync(oldFname2)
            }
        } catch(e) {
            console.error(e)
        }

        this.manageKey(gatewayId)
    }

    async manageKey(gatewayId) {
        const oldFname3 = '/etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge.toml'
        const newFname3 = '/etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge.toml.old'
        const newFname4 = 'data/apiParams.json'

        // try {
        //     if (!fs.existsSync(newFname3)) {
        try {
            fs.copyFileSync(oldFname3, newFname3)
        } catch (e) {
            console.log(e)
        }
        //     }
        // } catch(e) {
        //     console.error(e)
        // }

        const url = `https://reporter.crankk.io/createApiKey?gwId=${gatewayId.toLowerCase()}`

        let apiParams = {}
        try {
            apiParams = await axios.get(url)
        } catch (e) {
            console.log(e)
        }

        const apiData = apiParams?.data
        console.log(apiData)

        if (apiData && apiData?.length > 20) {
            fs.writeFileSync(newFname4, apiData)
        }

        try {
            if (fs.existsSync(newFname4)) {
                const jwt = fs.readFileSync(newFname4, 'utf8')
                this.replaceInTomlFile(oldFname3, gatewayId.toLowerCase(), jwt)
            }
        } catch(e) {
            console.error(e)
        }

    }

    replaceInGlobalFile(fname, gatewayId) {
        fs.readFile(fname, 'utf8', (err,data) => {
            if (err) return console.log(err)

            let result = data.replace('"serv_port_up": 1730,', '"serv_port_up": 1700,')
            result = result.replace('"serv_port_down": 1730,', '"serv_port_down": 1700,')
            result = result.replace('AA555A0000000000', gatewayId)

            fs.writeFile(fname, result, 'utf8', (err) => {
                if (err) return console.log(err);
                this.exec('sudo service lora_pkt_fwd restart');
            });
        });
    }

    replaceInTomlFile(fname, username, password) {
        fs.readFile(fname, 'utf8', (err,data) => {
            if (err) return console.log(err)

            // let result = data.replace('username_change_me', username)
            // result = result.replace('password_change_me', password)
            let result = data.replace(/username=".*/gm, `username="${username}"`)
            result = result.replace(/password=".*/gm, `password="${password}"`)

            fs.writeFile(fname, result, 'utf8', (err) => {
                if (err) return console.log(err);
                this.exec('sudo service lora-gateway-bridge restart');
            });
        });
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

}


module.exports = deviceService