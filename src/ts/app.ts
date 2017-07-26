import themer from './theme'
import ui from './ui'
import {Logger} from './utils'


const logger = new Logger('app');
logger.log('inside');

themer.load()
    // .then(() => themer.save())
    // .then(() => themer.load())
    .then(function (theme) {
        logger.log(theme);
        ui.applyTheme(theme)
    });

