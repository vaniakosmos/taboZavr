import {Options} from "./types";


let options: Options = {
    theme: {
        title: 'New tab',
        header: 'hello ma dude',
        background: {
            def: 'color',
            color: '#a8a8a8',
            image: '',
            url: 'http://i.imgur.com/v558H68.png',
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

export default options;
