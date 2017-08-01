import {Options} from "./types";
import {setUpNavbar} from './navbar'
import {setUpOptions} from "./options";
import {setUpSearch} from './search'
import {setUpTabs} from './tabs'

import defaultOptions from './defaultOptions'
import {Logger} from './utils'


const logger = new Logger('app');
logger.log('inside');

function promiseOptions(): Promise<Options> {
    return new Promise(function (resolve) {
        chrome.storage.local.get('options', function (result) {
            let options: Options;
            if (result['options']) {
                options = result['options'] as Options;
                logger.log('using options loaded from storage');
                logger.log('options:', options);
                resolve(options)
            }
            else {
                options = JSON.parse(JSON.stringify(defaultOptions));  // deep copy
                logger.log('using default options and save them into storage');
                logger.log('options:', options);
                chrome.storage.local.set({'options': options}, function () {
                    resolve(options)
                });
            }
        })
    });
}

promiseOptions().then(function (options: Options) {
    setTimeout(setUpNavbar, 0);
    setTimeout(setUpOptions, 0, options);
    setTimeout(setUpSearch, 0, options.search);
    setTimeout(setUpTabs, 0, options.tabs);
});
