import { callable } from "@steambrew/webkit";
import { getCdn, getLoopbackCdn, Logger, MANIFEST, VERSION } from "./shared";

// In this file we emulate the extension browser api for the steamdb extension

window.chrome = {};
const augmentedBrowser = window.chrome;

// #region Defaults

// augmentedBrowser.storage.sync.onChanged = {};
augmentedBrowser.runtime = {};
augmentedBrowser.runtime.getManifest = () => MANIFEST;
augmentedBrowser.runtime.id = 'kdbmhfkmnlmbkgbabkdealhhbfhlmmon'; // Chrome

export const SYNC_STORAGE_KEY = 'augmented-options-sync';
const LOCAL_STORAGE_KEY = 'augmented-options-local';

augmentedBrowser.runtime.onInstalled = {};
augmentedBrowser.runtime.onInstalled.addListener = () => {};

augmentedBrowser.runtime.onStartup = {};
augmentedBrowser.runtime.onStartup.addListener = () => {};

augmentedBrowser.contextMenus = {};
augmentedBrowser.contextMenus.onClicked = {};
augmentedBrowser.contextMenus.onClicked.addListener = () => {};
augmentedBrowser.contextMenus.onClicked.hasListener = () => {};

//#endregion

// #region Storage

augmentedBrowser.storage = {};
augmentedBrowser.storage.sync = {};

async function StorageGet(storageKey: string, items?: string[] | {[key: string]: any}, callback?: Function): Promise<any> {
    let storedData = localStorage.getItem(storageKey);
    let result: { [key: string]: any } = {};
    let parsedData: { [key: string]: any } = {};

    try {
        parsedData = storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        Logger.Error('failed to parse JSON for steamdb-options');
    }

    if (Array.isArray(items)) {
        items.forEach(key => {
            if (key in parsedData) {
                result[key] = parsedData[key];
            }
        });
    } else if (typeof items === 'object') {
            for (let key in items) {
                let foundItem = key in parsedData ? parsedData[key] : items[key];
                // if (typeof foundItem === 'boolean') {
                    result[key] = foundItem
                // }
            }
    }

    if (callback) {
        callback(result);
    }

    return result;
}

async function StorageSet(storageKey: string, item: { [key: string]: any }, callback?: Function) {
    let storedData = localStorage.getItem(storageKey);
    let parsedData: { [key: string]: any } = {};

    try {
        parsedData = storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        Logger.Error('failed to parse JSON for steamdb-options');
    }

    // let key = Object.keys(item)[0];
    // storageListeners.forEach(callback => {
    //     callback({
    //         [key]: {
    //             oldValue: parsedData[key],
    //             newValue: item[key]
    //         }
    //     });
    // });

    Object.assign(parsedData, item);
    localStorage.setItem(storageKey, JSON.stringify(parsedData));

    if (callback) {
        callback();
    }
}

async function StorageRemove(storageKey: string, key: string | string[], callback?: Function) {
    let storedData = localStorage.getItem(storageKey);
    let parsedData: { [key: string]: any } = {};

    try {
        parsedData = storedData ? JSON.parse(storedData) : {};
    } catch (e) {    
        Logger.Error('failed to parse JSON for steamdb-options');
    }

    if (!Array.isArray(key)) {
        key = [key];
    }
    
    key.forEach(k => {
        delete parsedData[k];
    });

    localStorage.setItem(storageKey, JSON.stringify(parsedData));

    if (callback) {
        callback();
    }
}

augmentedBrowser.storage.sync.get = (items?: any, callback?: Function) => StorageGet(SYNC_STORAGE_KEY, items, callback);
augmentedBrowser.storage.sync.set = (item: any, callback?: Function) => StorageSet(SYNC_STORAGE_KEY, item, callback);
augmentedBrowser.storage.sync.remove = (key: any, callback?: Function) => StorageRemove(SYNC_STORAGE_KEY, key, callback);
augmentedBrowser.storage.local = {};
augmentedBrowser.storage.local.get = (items?: any, callback?: Function) => StorageGet(LOCAL_STORAGE_KEY, items, callback);
augmentedBrowser.storage.local.set = (item: any, callback?: Function) => StorageSet(LOCAL_STORAGE_KEY, item, callback);
augmentedBrowser.storage.local.remove = (key: any, callback?: Function) => StorageRemove(LOCAL_STORAGE_KEY, key, callback);

//TODO: hook into fetch to send some requests to backend
const oldFetch = window.fetch;

const interceptedUrls: RegExp[] = [
    /https:\/\/steamcommunity\.com\/id/,
    /https:\/\/steamcommunity\.com\/profiles\/\d+\/ajaxgetbadgeinfo/,
];

const backendFetch = callable<[{url: string}], string>('BackendFetch');

type BackendResponse = {
    'ok': boolean,
    'status': number,
    'url': string,
    'headers': Record<string, string>,
    'body': string
};

window.fetch = async (url: string | URL | Request, params?: RequestInit): Promise<Response> => {
    console.log(url, params);

    for (const intercept of interceptedUrls) {
        if (url.toString().match(intercept)) {
            Logger.Log(`intercepting ${url}`);
            const response = JSON.parse(await backendFetch({url: url.toString()})) as BackendResponse;
            
            return new Response(response.body, {status: response.status, headers: response.headers});
        }
    }

    return oldFetch(url, params);
}

// augmentedBrowser.storage.sync.set = async function (item: { [key: string]: any }) {
//     let storedData = localStorage.getItem(STORAGE_KEY);
//     let parsedData: { [key: string]: any } = {};

//     try {
//         parsedData = storedData ? JSON.parse(storedData) : {};
//     } catch (e) {
//         Logger.Error('failed to parse JSON for steamdb-options');
//     }

//     let key = Object.keys(item)[0];
//     storageListeners.forEach(callback => {
//         callback({
//             [key]: {
//                 oldValue: parsedData[key],
//                 newValue: item[key]
//             }
//         });
//     });

//     Object.assign(parsedData, item);
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
// }

// augmentedBrowser.storage.sync.onChanged = {};
// let storageListeners: ((changes: { [key: string]: { oldValue: any; newValue: any; } }) => void)[] = [];
// augmentedBrowser.storage.sync.onChanged.addListener = function (callback: (changes: { [key: string]: { oldValue: any; newValue: any; } }) => void) {
//     storageListeners.push(callback);
// }
//#endregion

// //#region fake permissions
// augmentedBrowser.permissions = {};
// augmentedBrowser.permissions.request = function () {};
// augmentedBrowser.permissions.onAdded = {};
// augmentedBrowser.permissions.onAdded.addListener = function () {};
// augmentedBrowser.permissions.onRemoved = {};
// augmentedBrowser.permissions.onRemoved.addListener = function () {};
// augmentedBrowser.permissions.contains = function (_: any, callback: (result: boolean) => void) {
//     callback(true);
// };
// //#endregion

// // #region i18n Translation
// augmentedBrowser.i18n = {};
// const langPrefix = "steamDB_";
// let langKey = "";
// export async function getLang() {
//     let language = navigator.language.toLowerCase().split("-")[0];
//     const longLanguage = navigator.language.replaceAll('-', "_");
//     langKey = langPrefix + language;

//     // Make an exception for es-419
//     if (navigator.language === "es-419") {
//         language = 'es_419';
//         langKey = langPrefix + language;
//     }

//     if (localStorage.getItem(langKey + VERSION) === null) {
//         if (localStorage.getItem(langPrefix + longLanguage + VERSION) !== null) {
//             Logger.Log(`using "${longLanguage}" lang`);
//             langKey = langPrefix + longLanguage;
//             return;
//         }
//         Logger.Log(`getting "${language}" lang`);

//         let response = await fetch(CDN + `/_locales/${language}/messages.json`);

//         if (!response.ok) {
//             // Try full language key
//             Logger.Warn(`failed to fetch SteamDB lang file for "${language}". Trying "${longLanguage}"`);
//             langKey = langPrefix + longLanguage;

//             response = await fetch(CDN + `/_locales/${longLanguage}/messages.json`);

//             if (!response.ok) {
//                 Logger.Warn(`failed to fetch SteamDB lang file for "${language}". Falling back to EN.`);
//                 langKey = langPrefix + "en";
//                 response = await fetch(CDN + "/_locales/en/messages.json");
            
//             }
//         }
//         localStorage.setItem(langKey + VERSION, JSON.stringify(await response.json()));
//     } 

//     Logger.Log(`using "${language}" lang`);
// }

// /* example record
// {
//     "message": "$positive$ of the $total$ reviews are positive (all purchase types)",
//     "placeholders": {
//         "positive": {
//             "content": "$1",
//             "example": "123,456"
//         },
//         "total": {
//             "content": "$2",
//             "example": "456,789"
//         }
//     }
// }
// */
// augmentedBrowser.i18n.getMessage = function (messageKey: string, substitutions: string|string[]) {
//     // Ignore invalid message key
//     if (messageKey === '@@bidi_dir') {
//         return messageKey;
//     }

//     if (!Array.isArray(substitutions)) {
//         substitutions = [substitutions];
//     }
//     type LangType = Record<string, { message: string; placeholders?: Record<string, { content: string; }> }>|null;
//     let lang: LangType = JSON.parse(localStorage.getItem(langKey + VERSION) ?? '{}');
//     if (lang === null || Object.keys(lang).length === 0) {
//         Logger.Error('SteamDB lang file not loaded in.');
//         return messageKey;
//     }

//     const langObject = lang[messageKey];
//     if (langObject === undefined) {
//         Logger.Error(`Unknown message key: ${messageKey}`);
//         return messageKey;
//     }

//     let messageTemplate = langObject.message;
//     if (langObject.placeholders) {
//         Object.entries(langObject.placeholders).forEach(([key, value], index) => {
//             const regex = new RegExp(`\\$${key}\\$`, 'g');
//             messageTemplate = messageTemplate.replace(regex, substitutions[index] || value.content);
//         });
//     }

//     return messageTemplate;
// }
// augmentedBrowser.i18n.getUILanguage = function () {
//     return 'en-US';
// }
// // #endregion

// //#region getResourceUrl
augmentedBrowser.runtime.getURL = function (res: string) {
    if (res.endsWith('.png')) {
        return getLoopbackCdn(res);
    }
    return getCdn(res);
}
// //#endregion
type MessageCallback = (message: any, sender: any, sendResponse: (response: any) => void) => any;

let messageListener: MessageCallback|null = null;

augmentedBrowser.runtime.onMessage = {};
augmentedBrowser.runtime.onMessage.addListener = (callback: MessageCallback) => {
    if (messageListener !== null) {
        Logger.Error('Only one message listener is allowed');
        return;
    }

    messageListener = callback;
};

augmentedBrowser.runtime.sendMessage = function (message: any, callback?: (response: any) => void): void {
    // const method = callable<[any]>(message.contentScriptQuery);
    // let response = await method(message) as string;
    // return JSON.parse(response);
    Logger.Log('Sending message', message);
    messageListener(message, {tab: {}}, (response: any) => {
        if (callback) {
            callback(response);
        }
    });    
}

// //#region add external to newly created a tags
// let oldCreateElement = document.createElement.bind(document);

// document.createElement = function (tagName: string, options?: ElementCreationOptions) {
//     let tag: HTMLAnchorElement = oldCreateElement(tagName, options);

//     if (tagName.toLowerCase() === "a") {
//         var callback = function(mutationsList: MutationRecord[], observer: MutationObserver) {
//             for(let mutation of mutationsList) {
//                 if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
//                     // if (!tag.href.includes('steampowered.com') && !tag.href.includes('steamcommunity.com')) {
//                     //     tag.href = "steam://openurl_external/" + tag.href;
//                     // }
//                     if (tag.href.includes('steamdb.info') || tag.href.includes('pcgamingwiki.com')) {
//                         tag.addEventListener('click', (e) => {
//                             e.preventDefault();

//                             // TODO: find better way of opening popups
//                             window.open(tag.href, 'BrowserViewPopup', `width=${window.screen.width*0.8},height=${window.screen.height*0.8},resizeable,status=0,toolbar=0,menubar=0,location=0`);
//                         });
//                     }

//                     observer.disconnect();
//                 }
//             }
//         };

//         var observer = new MutationObserver(callback);

//         observer.observe(tag, { attributes: true });
//     }

//     return tag;
// }
//#endregion