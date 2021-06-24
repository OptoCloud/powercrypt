const { Plugin } = require('powercord/entities');
const { getModule, messages } = require('powercord/webpack');
const { getChannelId } = getModule(["getChannelId", "getLastSelectedChannelId"], false);

const fs = require('fs')
const PNG = require('pngjs').PNG;
const sodium = require('libsodium-wrappers');

const Settings = require('./components/Settings.jsx');

const imgWidthPixels = 1024;
const imgWidthBytes = imgWidthPixels * 4;

module.exports = class PowerCrypt extends Plugin {
    async startPlugin() {
        powercord.api.settings.registerSettings('powercrypt', {
            category: this.entityID,
            label: 'PowerCrypt',
            render: Settings
        });

        powercord.api.commands.registerCommand({
            command: 'enc',
            aliases: [],
            description: 'Encrypt a string',
            executor: (args) => this.encString(args)
        });
        powercord.api.commands.registerCommand({
            command: 'encf',
            aliases: [],
            description: 'Encrypt a file',
            executor: (args) => this.encFile(args)
        });
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings('powercrypt');
        powercord.api.commands.unregisterCommand('enc');
        powercord.api.commands.unregisterCommand('encf');
    }

    async sendEncrypted(data) {
        if (!sodium.ready) {
            return false;
        }

        let datab = Buffer.from(data);

        let key = sodium.crypto_secretbox_keygen();
        let nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        let encrypted = sodium.crypto_secretbox_easy(data, nonce, key);

        let binsize = key.length + nonce.length + encrypted.length + (4 * 3);

        let img = new PNG({
            width: imgWidthPixels,
            height: (datab.length / imgWidthBytes) + 1,
            colorType: 6
        });

        let sizeWritten = 0;

        // Write own key
        img.data.writeUInt32BE(key.length, sizeWritten);
        sizeWritten += 4;
        img.data.set(key, sizeWritten);
        sizeWritten += key.length;

        /*
        // Write all recepients
        img.data.writeUInt32BE(recepients.length);
        sizeWritten += 4;

        recepients.forEach(recepient => {
            img.data.set(recepient, sizeWritten)
            sizeWritten += recepient.length;
        });
        */

        // Write nonce
        img.data.writeUInt32BE(nonce.length, sizeWritten);
        sizeWritten += 4;
        img.data.set(nonce, sodium.crypto_secretbox_KEYBYTES);
        sizeWritten += nonce.length;

        // Write encrypted data
        img.data.writeUInt32BE(encrypted.length, sizeWritten);
        sizeWritten += 4;
        img.data.set(encrypted, sizeWritten);
        sizeWritten += encrypted.length;

        // Encode data
        let rawpng = new Blob([PNG.sync.write(img, { colorType: 6 })], { type: 'image/png' });
        let file = new File([ rawpng ], 'pc__enc__.png');

        // SEND ITTTTT
        const { upload } = await getModule(['cancel', 'upload']);
        upload(getChannelId(), file)

        return true
    }

    async encString(args) {
        if (args.length == 0) {
            return {
                send: false,
                result: 'Cannot encrypt nothing'
            }
        }

        if (await this.sendEncrypted(Buffer.from(args.join(''), 'utf8'))) {
            return {
                send: false,
                result: 'Sent!'
            }
        }
        else {
            return {
                send: false,
                result: 'not initialized!'
            }
        }
    }

    async encFile(args) {
        if (args.length == 0) {
            return {
                send: false,
                result: 'Cannot encrypt nothing'
            }
        }

        try {
            let data = fs.readFileSync(args.join(' '), null);
            if (await this.sendEncrypted(data)) {
                return {
                    send: false,
                    result: 'Sent!'
                }
            }
            else {
                return {
                    send: false,
                    result: 'Failed to send!'
                }
            }
        }
        catch(ex) {
            return {
                send: false,
                result: ex.toString()
            }
        }

        
    }
};