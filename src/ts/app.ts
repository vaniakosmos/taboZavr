import {Options} from "./types";
import {setUpNavbar} from './navbar'
import {setUpOptions} from "./options";
import {setUpSearch} from './search'
import {setUpTabs} from './tabs'

import {Logger} from './utils'


const logger = new Logger('app');
logger.log('inside');

// default theme
let defaultOptions: Options = {
    theme: {
        title: 'New tab',
        header: 'hello ma dude',
        background: {
            color: '',
            image: '',
        },
        visibility: {
            opacity: 100,
            revealOnHover: true,
        }
    },
    search: {
        def: 'google',
        engines: [
            {
                name: 'google',
                url: 'http://google.com/search?q=',
            },
            {
                name: 'images',
                url: 'https://www.google.com/images?q=',
            },
            {
                name: 'trakt',
                url: 'http://trakt.tv/search?q=',
            },
            {
                name: 'wiki',
                url: 'https://en.wikipedia.org/w/index.php?search=',
            },
        ],
        labelIsUrl: false,
    },
    tabs: {
        def: 'recent',
        grid: {
            cols: 5,
            rows: 5,
        },
        entities: [
            {
                name: 'Fav',
                src: 'bookmark:Bookmarks Bar',

            },
            {
                name: 'Top',
                src: 'top',
            },
            {
                name: 'Recent',
                src: 'recent',
            },
        ],
    }
};

function promiseOptions(): Promise<Options> {
    return new Promise(function (resolve) {
        chrome.storage.sync.get('options', function (result) {
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
                chrome.storage.sync.set({'options': options}, function () {
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
