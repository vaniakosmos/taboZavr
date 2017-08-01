export class Logger {
    private name: string;

    constructor(name: string) {
        this.name = name.toUpperCase();
    }
    log(...message: any[]): void {
        console.log(this.name + ':', ...message);
    }
    error(...message: any[]): void {
        console.error(this.name + ':', ...message);
    }
}

export function openLinkFunc(url: string) {
    return function (event) {
        if (event.ctrlKey ||
            event.shiftKey ||
            event.metaKey ||  // cmd
            (event.button && event.button === 1)
        ) {
            chrome.tabs.create({url: url, active: false});
        }
        else {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, {url: url});
            })
        }
    }
}

export let chunkedStorage = {
    set(items: Object, callback?) {
        const storageObj = {};
        for (let key in items) {
            if (!items.hasOwnProperty(key)) continue;
            const objectToStore = items[key];
            let jsonstr = JSON.stringify(objectToStore);
            let i = 0;

            // split jsonstr into chunks and store them in an object indexed by `key_i`
            while (jsonstr.length > 0) {
                const index = key + "_" + i++;

                // since the key uses up some per-item quota, see how much is left for the value
                // also trim off 2 for quotes added by storage-time `stringify`
                // let valueLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - index.length - 2;
                let valueLength = chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2;
                // let valueLength = 100;

                // trim down segment so it will be small enough even when run through `JSON.stringify` again at storage time
                let segment = jsonstr.substr(0, valueLength);
                // while (JSON.stringify(segment).length > valueLength)
                //     segment = jsonstr.substr(0, --valueLength);

                storageObj[index] = segment;
                jsonstr = jsonstr.substr(valueLength);
            }

            storageObj[key + '_ size'] = i;
        }
        // store all the chunks
        chrome.storage.sync.set(storageObj, callback);
    },

    get(key: string, callback: (result: any) => any) {
        const sizeKey = key + '_ size';

        chrome.storage.sync.get(sizeKey, function (result) {
            if (result[sizeKey]) {
                console.log('chunks:', result[sizeKey]);
                const keys = [];
                for (let i = 0; i < result[sizeKey]; i++) {
                    keys.push(key + '_' + i);
                }
                chrome.storage.sync.get(keys, function (result) {
                    // assume that keys are present
                    let jsonStr = keys.reduce(function (prev, curr) {
                        return prev + result[curr];
                    }, '');
                    callback({[key]: JSON.parse(jsonStr)});
                })
            }
            else {
                callback({});
            }
        });
    },
    remove(key, callback) {
        // todo
    }
};

