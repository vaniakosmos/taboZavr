import {Theme} from './types'
import {Logger} from './utils'

const logger = new Logger('theme');

let theme: Theme = {
    isImage: false,
    title: 'New Tab',
    header: {
        value: 'Search',
        size: 60,
        hide: false,
    },
    accent: 'rgb(255, 66, 66)',
    background: 'rgb(222, 222, 222)',
};

export default {
    get() {
        return theme;
    },
    remove() {
        return new Promise((resolve) => {
            chrome.storage.sync.remove('theme', function () {
                logger.log('removed from storage');
                resolve(theme);
            });
        })
    },
    load(): Promise<Theme> {
        return new Promise((resolve) => {
            chrome.storage.sync.get('theme', function (result: {theme: object}) {
                if (result.theme) {
                    logger.log('using loaded from storage');
                    theme = result.theme as Theme;
                    resolve(theme);
                }
                else {
                    chrome.storage.sync.set({'theme': theme}, function () {
                        logger.log(`using default and save into storage`);
                        resolve(theme);
                    });
                }
            });
        })
    },
    save(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.set({'theme': theme}, function () {
                logger.log('saved');
                resolve();
            });
        })
    }
}