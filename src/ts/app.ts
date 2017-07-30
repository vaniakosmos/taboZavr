import themer from './theme'
import {applyTheme, setUpNavUrls} from './ui'
import {setUpSearch} from './search'
import {setUpTabs} from './tabs'
import {Logger} from './utils'


const logger = new Logger('app');
logger.log('inside');

themer.load()
    // .then(() => themer.save())
    // .then(() => themer.load())
    .then(function (theme) {
        logger.log(theme);
        // applyTheme(theme)
    });

setUpNavUrls();

setUpSearch({
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
    ],
    labelIsUrl: false,
});

setUpTabs({
    def: 'fav',
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
        {
            name: 'ner',
            src: 'bookmark:Other Bookmarks/ner',
        },
    ],
});
