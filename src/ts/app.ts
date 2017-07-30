import themer from './theme'
import {applyTheme, setUpNavUrls} from './ui'
import {setUpSearch} from './search'
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
            name: 'trakt',
            url: 'http://trakt.tv/search?q=',
        },
        {
            name: 'images',
            url: 'https://www.google.com/images?q=',
        },
    ],
    labelIsUrl: false,
});
