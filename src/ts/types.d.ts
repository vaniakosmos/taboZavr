export interface Options {
    theme: Theme,
    // search: Search,
    // tabs: any,
}

export interface Theme {
    isImage: boolean,
    title: string,
    header: {
        value: string,
        size: number,
        hide: boolean,
    },
    accent: string,
    background: string,
    // image: {
    //     url: string,
    //     vendors: {}
    //     period: number,
    // }
}


export interface Search {
    def: string,
    engines: [{ name: string, url: string, icon?: any }],
    hide: boolean,
}

export interface Tabs {
    def: string,
    chosen: [{}],
    hide: boolean,
}
