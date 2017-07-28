import themer from './theme'
import {applyTheme, setUpNavUrls} from './ui'
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

function changeBG() {
    const $body = $('body');
    console.log($body.css('background'));
    let cols = $body.css('background').match(/^rgb\((\d+),\s*(\d+),\s*(\d+).*/);
    let color = {
        r: parseInt(cols[1]),
        g: parseInt(cols[2]),
        b: parseInt(cols[3]),
    };
    let isLight = (color.r + color.g + color.b) > (255*3/2);
    console.log(isLight);
    if (isLight) {
        $body.css('color', 'black');
    }
    else {
        $body.css('color', 'white');
    }
}
// changeBG();
